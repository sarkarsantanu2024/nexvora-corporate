/**
 * Reports for the centre head. Collection here is worked out exactly the way
 * head office works out royalty: receipts that are not void, by the day the
 * money was received (paidOn).
 */
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { PAYMENT_METHODS, attendance, batches, expenses, feeHeads, invoiceItems, invoices, payments, students, type FeeKind } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { currentPeriod, periodRange, todayIST } from '@/lib/date';
import { percent } from '@/lib/money';
import { day, period as periodSchema } from '@/lib/validators';
import { FEE_TYPE_LABELS } from './labels';
import { assertManager, countInt, livePayment, liveStudent, sumInt, type Ctx } from './shared';

export type Range = { from: string; to: string };

/** A range from the URL: ?from= and ?to= where given, the rest from ?month= or this month. */
export function rangeFrom(params: { from?: string; to?: string; month?: string }): Range {
  const month = periodSchema.safeParse(params.month).success ? params.month! : currentPeriod();
  const base = periodRange(month);
  const from = day.safeParse(params.from).success ? params.from! : base.from;
  const to = day.safeParse(params.to).success ? params.to! : base.to;
  // An end before the start would silently show nothing; one day is a better answer.
  return { from, to: to < from ? from : to };
}

const inRange = (ctx: Ctx, range: Range) =>
  and(eq(payments.centreId, ctx.centre.id), livePayment, gte(payments.paidOn, range.from), lte(payments.paidOn, range.to));

/** The one collection figure: what head office's royalty is worked out on. */
export async function collectionTotal(ctx: Ctx, range: Range): Promise<number> {
  const db = await getDb();
  const [row] = await db.select({ amount: sumInt(payments.amount) }).from(payments).where(inRange(ctx, range));
  return row.amount;
}

export async function collectionByMethod(ctx: Ctx, range: Range) {
  assertManager(ctx);
  const db = await getDb();
  const rows = await db
    .select({ method: payments.method, amount: sumInt(payments.amount), count: countInt() })
    .from(payments)
    .where(inRange(ctx, range))
    .groupBy(payments.method);
  const methods = PAYMENT_METHODS.map((method) => {
    const found = rows.find((r) => r.method === method);
    return { method, amount: found?.amount ?? 0, count: found?.count ?? 0 };
  });
  return { methods, total: methods.reduce((sum, m) => sum + m.amount, 0), count: methods.reduce((sum, m) => sum + m.count, 0) };
}

/**
 * Splits each receipt over the lines of its bill in proportion to their
 * amounts, so a part payment of an admission bill is shared fairly between
 * the admission fee and the kit. Largest remainders keep every rupee, so the
 * parts always add up to the receipt.
 */
function splitByLines(amount: number, lines: { key: string; amount: number }[]): Map<string, number> {
  const out = new Map<string, number>();
  const base = lines.reduce((sum, l) => sum + l.amount, 0);
  if (base <= 0) {
    out.set(lines[0]?.key ?? 'other', amount);
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

/** Money in by fee type, money out by category, and what is left. */
export async function incomeStatement(ctx: Ctx, range: Range) {
  assertManager(ctx);
  const db = await getDb();
  const [lines, spent] = await Promise.all([
    // One row per (receipt, bill line): a single query, split in memory below.
    db
      .select({
        paymentId: payments.id,
        amount: payments.amount,
        itemId: invoiceItems.id,
        itemAmount: invoiceItems.amount,
        kind: feeHeads.kind,
      })
      .from(payments)
      .leftJoin(invoiceItems, eq(invoiceItems.invoiceId, payments.invoiceId))
      .leftJoin(feeHeads, eq(feeHeads.id, invoiceItems.feeHeadId))
      .where(inRange(ctx, range)),
    db
      .select({ category: expenses.category, amount: sumInt(expenses.amount), count: countInt() })
      .from(expenses)
      .where(and(eq(expenses.centreId, ctx.centre.id), isNull(expenses.deletedAt), gte(expenses.spentOn, range.from), lte(expenses.spentOn, range.to)))
      .groupBy(expenses.category)
      .orderBy(desc(sumInt(expenses.amount))),
  ]);

  const byPayment = new Map<string, { amount: number; lines: { key: string; amount: number }[] }>();
  for (const row of lines) {
    const entry = byPayment.get(row.paymentId) ?? { amount: row.amount, lines: [] };
    if (row.itemId) entry.lines.push({ key: row.kind ?? 'other', amount: row.itemAmount ?? 0 });
    byPayment.set(row.paymentId, entry);
  }
  const totals: Record<FeeKind | 'other', number> = { monthly: 0, one_time: 0, annual: 0, other: 0 };
  for (const entry of byPayment.values()) {
    for (const [key, value] of splitByLines(entry.amount, entry.lines)) totals[key as FeeKind | 'other'] += value;
  }

  const income = (Object.keys(totals) as (FeeKind | 'other')[])
    .map((key) => ({ key, label: FEE_TYPE_LABELS[key], amount: totals[key] }))
    .filter((row) => row.amount > 0 || row.key === 'monthly');
  const collection = income.reduce((sum, row) => sum + row.amount, 0);
  const expenseTotal = spent.reduce((sum, row) => sum + row.amount, 0);
  return { income, collection, expenses: spent, expenseTotal, surplus: collection - expenseTotal };
}

/** Unpaid balances by how long they have been past the due date, as of today. */
export async function duesAgeing(ctx: Ctx) {
  assertManager(ctx);
  const db = await getDb();
  const today = todayIST();
  const bal = sql`(${invoices.total} - ${invoices.paid})`;
  const late = sql`(${today}::date - ${invoices.dueDate})`;
  const bucket = (cond: ReturnType<typeof sql>) => sql<number>`coalesce(sum(${bal}) filter (where ${cond}), 0)::int`;
  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      admissionNo: students.admissionNo,
      batchName: batches.name,
      guardianPhone: students.guardianPhone,
      notDue: bucket(sql`${late} < 0`),
      d0: bucket(sql`${late} between 0 and 30`),
      d31: bucket(sql`${late} between 31 and 60`),
      d61: bucket(sql`${late} > 60`),
      total: sumInt(bal),
    })
    .from(invoices)
    .innerJoin(students, eq(students.id, invoices.studentId))
    .leftJoin(batches, eq(batches.id, students.batchId))
    .where(and(eq(invoices.centreId, ctx.centre.id), inArray(invoices.status, ['unpaid', 'partial'])))
    .groupBy(students.id, batches.name)
    .orderBy(sql`sum(${bal}) desc`);
  const sum = (key: 'notDue' | 'd0' | 'd31' | 'd61' | 'total') => rows.reduce((acc, row) => acc + row[key], 0);
  return { asOf: today, rows, totals: { notDue: sum('notDue'), d0: sum('d0'), d31: sum('d31'), d61: sum('d61'), total: sum('total') } };
}

export async function admissionsAndWithdrawals(ctx: Ctx, range: Range) {
  assertManager(ctx);
  const db = await getDb();
  const columns = {
    id: students.id,
    name: students.name,
    admissionNo: students.admissionNo,
    batchName: batches.name,
    admissionDate: students.admissionDate,
    leftOn: students.leftOn,
    leftReason: students.leftReason,
  };
  const base = and(eq(students.centreId, ctx.centre.id), liveStudent);
  const [admitted, left] = await Promise.all([
    db
      .select(columns)
      .from(students)
      .leftJoin(batches, eq(batches.id, students.batchId))
      .where(and(base, gte(students.admissionDate, range.from), lte(students.admissionDate, range.to)))
      .orderBy(asc(students.admissionDate), asc(students.name)),
    db
      .select(columns)
      .from(students)
      .leftJoin(batches, eq(batches.id, students.batchId))
      .where(and(base, gte(students.leftOn, range.from), lte(students.leftOn, range.to)))
      .orderBy(asc(students.leftOn), asc(students.name)),
  ]);
  return { admitted, left };
}

/** Present days out of the days a child was expected (holidays do not count either way). */
export async function attendanceByClass(ctx: Ctx, range: Range) {
  assertManager(ctx);
  const db = await getDb();
  const n = (status: string) => sql<number>`(count(*) filter (where ${attendance.status} = ${status}))::int`;
  const rows = await db
    .select({
      batchId: batches.id,
      batchName: batches.name,
      present: n('present'),
      absent: n('absent'),
      leave: n('leave'),
      days: sql<number>`count(distinct ${attendance.day})::int`,
    })
    .from(attendance)
    .leftJoin(batches, eq(batches.id, attendance.batchId))
    .where(and(eq(attendance.centreId, ctx.centre.id), gte(attendance.day, range.from), lte(attendance.day, range.to)))
    .groupBy(batches.id, batches.name)
    .orderBy(asc(batches.name));
  const withPercent = rows.map((row) => ({ ...row, percent: percent(row.present, row.present + row.absent + row.leave) }));
  const present = rows.reduce((sum, r) => sum + r.present, 0);
  const marked = rows.reduce((sum, r) => sum + r.present + r.absent + r.leave, 0);
  return { rows: withPercent, overall: percent(present, marked), present, marked };
}

/** The figures of one month in one call (also what the REST summary returns). */
export async function monthSummary(ctx: Ctx, month: string) {
  assertManager(ctx);
  if (!periodSchema.safeParse(month).success) throw new ApiError(400, 'Pick a month');
  const range = periodRange(month);
  const [statement, byMethod] = await Promise.all([incomeStatement(ctx, range), collectionByMethod(ctx, range)]);
  return {
    period: month,
    ...range,
    collection: statement.collection,
    collectionByType: statement.income,
    collectionByMethod: byMethod.methods,
    expenses: statement.expenseTotal,
    expensesByCategory: statement.expenses,
    surplus: statement.surplus,
  };
}
