/**
 * What the school spends from its own funds: electricity, repairs,
 * stationery and the like. An expense is never removed for good: deleting it
 * moves it to the Trash (deletedAt), and it drops out of every total.
 */
import { and, desc, eq, gte, isNotNull, isNull, lte } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DB } from '@/db';
import { PAYMENT_METHODS, expenses } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { currentPeriod, periodRange, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import type { Session } from '@/lib/session-token';
import { day, optionalUuid, period as monthSchema, rupees, text, uuid } from '@/lib/validators';
import { countInt, getSetting } from '../admin/shared';
import { assertOffice } from '../school/access';
import type { TrashSource } from '../trash/service';
import { notFound, sumInt } from './shared';

export const liveExpense = isNull(expenses.deletedAt);

/** The categories the office picks from (Settings). Never empty: "Other" is always there. */
export async function expenseCategories(): Promise<string[]> {
  const { categories } = await getSetting('expenses');
  const list = Array.isArray(categories) ? categories.filter((c): c is string => typeof c === 'string' && c.trim() !== '') : [];
  return list.length ? list : ['Other'];
}

export async function listExpenses(session: Session, filter: { month?: string; category?: string } = {}) {
  assertOffice(session);
  const db = await getDb();
  const month = filter.month && monthSchema.safeParse(filter.month).success ? filter.month : currentPeriod();
  const { from, to } = periodRange(month);
  const inMonth = and(liveExpense, gte(expenses.spentOn, from), lte(expenses.spentOn, to));
  const category = (filter.category ?? '').trim();

  const [rows, byCategory] = await Promise.all([
    db
      .select()
      .from(expenses)
      .where(and(inMonth, category ? eq(expenses.category, category) : undefined))
      .orderBy(desc(expenses.spentOn), desc(expenses.createdAt)),
    db
      .select({ category: expenses.category, amount: sumInt(expenses.amount), count: countInt() })
      .from(expenses)
      .where(inMonth)
      .groupBy(expenses.category)
      .orderBy(desc(sumInt(expenses.amount))),
  ]);
  return {
    month,
    category,
    rows,
    byCategory,
    total: byCategory.reduce((sum, c) => sum + c.amount, 0),
    shownTotal: rows.reduce((sum, r) => sum + r.amount, 0),
  };
}

const expenseInput = z.object({
  id: optionalUuid,
  category: z.string().trim().min(1, 'Choose a category').max(60),
  description: text(200),
  amount: rupees.refine((v) => v > 0, 'Enter the amount'),
  spentOn: day,
  paidTo: text(120),
  method: z.enum(PAYMENT_METHODS),
});
export type ExpenseInput = z.input<typeof expenseInput>;

export async function saveExpense(session: Session, input: ExpenseInput) {
  assertOffice(session);
  const data = expenseInput.parse(input);
  if (data.spentOn > todayIST()) throw new ApiError(400, 'The date cannot be in the future', { spentOn: 'Pick today or an earlier date' });
  const db = await getDb();
  const values = { category: data.category, description: data.description, amount: data.amount, spentOn: data.spentOn, paidTo: data.paidTo, method: data.method };
  let row;
  if (data.id) {
    [row] = await db.update(expenses).set(values).where(and(eq(expenses.id, data.id), liveExpense)).returning();
    if (!row) return notFound('Expense');
  } else {
    [row] = await db.insert(expenses).values({ ...values, createdBy: session.uid }).returning();
  }
  await audit(session, data.id ? 'expense.update' : 'expense.create', {
    entity: 'expense',
    entityId: row.id,
    summary: `${row.category}: ${inr(row.amount)}${row.paidTo ? ` to ${row.paidTo}` : ''}`,
  });
  return row;
}

/** Moves an expense to the Trash. It leaves every total at once; an admin can bring it back. */
export async function deleteExpense(session: Session, id: string) {
  assertOffice(session);
  const db = await getDb();
  const [row] = await db
    .update(expenses)
    .set({ deletedAt: new Date() })
    .where(and(eq(expenses.id, uuid.parse(id)), liveExpense))
    .returning();
  if (!row) return notFound('Expense');
  await audit(session, 'expense.delete', { entity: 'expense', entityId: row.id, summary: `Moved to the Trash: ${row.category}, ${inr(row.amount)}${row.paidTo ? ` to ${row.paidTo}` : ''}` });
  return { id: row.id };
}

const label = (row: { category: string; amount: number }) => `${row.category}, ${inr(row.amount)}`;

/** The Trash entry for expenses. Money records are never removed for good, so purge refuses. */
export const expenseTrashSource: TrashSource = {
  kind: 'expense',
  label: 'Expense',
  async list(db: DB) {
    const rows = await db.select().from(expenses).where(isNotNull(expenses.deletedAt)).orderBy(desc(expenses.deletedAt)).limit(200);
    return rows.map((row) => ({ kind: 'expense', id: row.id, title: label(row), detail: [row.spentOn, row.paidTo, row.description].filter(Boolean).join(' · '), deletedAt: row.deletedAt as Date }));
  },
  async restore(db: DB, id: string) {
    const [row] = await db.update(expenses).set({ deletedAt: null }).where(and(eq(expenses.id, id), isNotNull(expenses.deletedAt))).returning();
    return row ? label(row) : null;
  },
  async purge() {
    throw new ApiError(400, 'Money records are never removed for good. The expense stays in the Trash, out of every total.');
  },
};
