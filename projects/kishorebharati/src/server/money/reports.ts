/**
 * Reports for the head of school. Collection is receipts that are not void,
 * by the day the money was received (paidOn); expenses are those not in the
 * Trash, by the day they were spent.
 */
import { and, asc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { PAYMENT_METHODS, enrolments, expenses, feeHeads, invoiceItems, invoices, payments, sections } from '@/db/schema';
import { currentPeriod, lastPeriods, periodRange, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { period as monthSchema } from '@/lib/validators';
import { assertAdmin, countInt } from '../admin/shared';
import { currentYear } from '../school/access';
import { livePayment, monthOf, sumInt } from './shared';

export type Range = { from: string; to: string; label: string; kind: 'month' | 'year' };

/** ?year=2026 gives the whole year, ?month=2026-04 one month; this month otherwise. */
export function rangeFrom(params: { month?: string; year?: string }): Range {
  if (params.year && /^\d{4}$/.test(params.year)) return { from: `${params.year}-01-01`, to: `${params.year}-12-31`, label: params.year, kind: 'year' };
  const month = params.month && monthSchema.safeParse(params.month).success ? params.month : currentPeriod();
  return { ...periodRange(month), label: month, kind: 'month' };
}

const paidIn = (range: { from: string; to: string }) => and(livePayment, gte(payments.paidOn, range.from), lte(payments.paidOn, range.to));
const spentIn = (range: { from: string; to: string }) => and(isNull(expenses.deletedAt), gte(expenses.spentOn, range.from), lte(expenses.spentOn, range.to));

/** Money in and money out for each of the last `months` months, oldest first. */
export async function incomeVsExpense(session: Session, months = 12, end = currentPeriod()) {
  assertAdmin(session);
  const periods = lastPeriods(months, end);
  const range = { from: periodRange(periods[0]).from, to: periodRange(periods[periods.length - 1]).to };
  const db = await getDb();
  const [inRows, outRows] = await Promise.all([
    db.select({ period: monthOf(payments.paidOn), amount: sumInt(payments.amount) }).from(payments).where(paidIn(range)).groupBy(monthOf(payments.paidOn)),
    db.select({ period: monthOf(expenses.spentOn), amount: sumInt(expenses.amount) }).from(expenses).where(spentIn(range)).groupBy(monthOf(expenses.spentOn)),
  ]);
  return periods.map((period) => ({
    period,
    collected: inRows.find((row) => row.period === period)?.amount ?? 0,
    spent: outRows.find((row) => row.period === period)?.amount ?? 0,
  }));
}

/**
 * Splits each receipt over the lines of its bill in proportion to their
 * amounts, so a part payment is shared fairly between the fee heads. Largest
 * remainders keep every rupee, so the parts always add up to the receipt.
 */
export function splitByLines(amount: number, lines: { key: string; amount: number }[]): Map<string, number> {
  const out = new Map<string, number>();
  const base = lines.reduce((sum, l) => sum + l.amount, 0);
  if (base <= 0) {
    out.set(lines[0]?.key ?? '', amount);
    return out;
  }
  const shares = lines.map((l) => {
    const exact = (amount * l.amount) / base;
    return { key: l.key, whole: Math.floor(exact), rest: exact - Math.floor(exact) };
  });
  let left = amount - shares.reduce((sum, s) => sum + s.whole, 0);
  for (const share of [...shares].sort((a, b) => b.rest - a.rest)) {
    if (left <= 0) break;
    share.whole += 1;
    left -= 1;
  }
  for (const share of shares) out.set(share.key, (out.get(share.key) ?? 0) + share.whole);
  return out;
}

/** Money received in a range, by fee head (a one-off line without a head goes by its own words). */
export async function collectionByHead(session: Session, range: { from: string; to: string }) {
  assertAdmin(session);
  const db = await getDb();
  // One row per (receipt, bill line): a single query, split in memory below.
  const rows = await db
    .select({ paymentId: payments.id, amount: payments.amount, itemId: invoiceItems.id, itemAmount: invoiceItems.amount, description: invoiceItems.description, headName: feeHeads.name })
    .from(payments)
    .leftJoin(invoiceItems, eq(invoiceItems.invoiceId, payments.invoiceId))
    .leftJoin(feeHeads, eq(feeHeads.id, invoiceItems.feeHeadId))
    .where(paidIn(range));
  const byPayment = new Map<string, { amount: number; lines: { key: string; amount: number }[] }>();
  for (const row of rows) {
    const entry = byPayment.get(row.paymentId) ?? { amount: row.amount, lines: [] };
    if (row.itemId) entry.lines.push({ key: row.headName ?? row.description ?? '', amount: row.itemAmount ?? 0 });
    byPayment.set(row.paymentId, entry);
  }
  const totals = new Map<string, number>();
  for (const entry of byPayment.values()) {
    for (const [key, value] of splitByLines(entry.amount, entry.lines)) totals.set(key, (totals.get(key) ?? 0) + value);
  }
  const heads = [...totals.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  return { heads, total: heads.reduce((sum, h) => sum + h.amount, 0) };
}

export async function collectionByMethod(session: Session, range: { from: string; to: string }) {
  assertAdmin(session);
  const db = await getDb();
  const rows = await db.select({ method: payments.method, amount: sumInt(payments.amount), count: countInt() }).from(payments).where(paidIn(range)).groupBy(payments.method);
  return PAYMENT_METHODS.map((method) => {
    const found = rows.find((r) => r.method === method);
    return { method, amount: found?.amount ?? 0, count: found?.count ?? 0 };
  });
}

/** What each section still owes today: students with dues, and the amount. */
export async function duesByClass(session: Session) {
  assertAdmin(session);
  const db = await getDb();
  const year = await currentYear(db);
  const bal = sql`(${invoices.total} - ${invoices.paid})`;
  const today = todayIST();
  const rows = await db
    .select({
      sectionId: sections.id,
      grade: sections.grade,
      sectionName: sections.name,
      stream: sections.stream,
      shift: sections.shift,
      students: sql<number>`count(distinct ${invoices.studentId})::int`,
      due: sumInt(bal),
      overdue: sql<number>`coalesce(sum(${bal}) filter (where ${invoices.dueDate} < ${today}), 0)::int`,
    })
    .from(invoices)
    .leftJoin(enrolments, and(eq(enrolments.studentId, invoices.studentId), eq(enrolments.yearId, year.id)))
    .leftJoin(sections, eq(sections.id, enrolments.sectionId))
    .where(inArray(invoices.status, ['unpaid', 'partial']))
    .groupBy(sections.id)
    .orderBy(asc(sections.grade), asc(sections.stream), asc(sections.name));
  return { rows, total: rows.reduce((sum, r) => sum + r.due, 0), overdue: rows.reduce((sum, r) => sum + r.overdue, 0), students: rows.reduce((sum, r) => sum + r.students, 0) };
}

/** The income and expense statement of a month or a year. */
export async function statement(session: Session, range: { from: string; to: string }) {
  assertAdmin(session);
  const db = await getDb();
  const [income, methods, spent] = await Promise.all([
    collectionByHead(session, range),
    collectionByMethod(session, range),
    db
      .select({ category: expenses.category, amount: sumInt(expenses.amount), count: countInt() })
      .from(expenses)
      .where(spentIn(range))
      .groupBy(expenses.category)
      .orderBy(sql`sum(${expenses.amount}) desc`),
  ]);
  const expenseTotal = spent.reduce((sum, row) => sum + row.amount, 0);
  return { income: income.heads, collection: income.total, methods, expenses: spent, expenseTotal, balance: income.total - expenseTotal };
}

/* ───────────── small figures for the overview, the bell and the suggestion cards ───────────── */

/** Collected this month and what is owed today. No role check: callers show it to the office only. */
export async function moneyTiles() {
  const db = await getDb();
  const month = periodRange(currentPeriod());
  const [[collected], [dues]] = await Promise.all([
    db.select({ amount: sumInt(payments.amount) }).from(payments).where(paidIn(month)),
    db
      .select({ amount: sumInt(sql`${invoices.total} - ${invoices.paid}`), students: sql<number>`count(distinct ${invoices.studentId})::int` })
      .from(invoices)
      .where(inArray(invoices.status, ['unpaid', 'partial'])),
  ]);
  return { collectedThisMonth: collected.amount, dues: dues.amount, studentsWithDues: dues.students };
}

/** This month's collection and spending, for the "costs higher than takings" card. */
export async function monthInOut(period = currentPeriod()) {
  const db = await getDb();
  const range = periodRange(period);
  const [[collected], [spent]] = await Promise.all([
    db.select({ amount: sumInt(payments.amount) }).from(payments).where(paidIn(range)),
    db.select({ amount: sumInt(expenses.amount) }).from(expenses).where(spentIn(range)),
  ]);
  return { collected: collected.amount, spent: spent.amount };
}
