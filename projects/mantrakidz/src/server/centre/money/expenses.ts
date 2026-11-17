/**
 * What the centre spends, and salaries. Managers only. An expense is never
 * hard deleted: it gets a deletedAt and drops out of every total.
 */
import { and, asc, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { PAYMENT_METHODS, expenses, staff } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { currentPeriod, periodLabel, periodRange, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { day, optionalUuid, period as periodSchema, rupees, text, uuid } from '@/lib/validators';
import { EXPENSE_CATEGORIES, SALARY_CATEGORY } from './labels';
import { assertManager, notFound, sumInt, countInt, type Ctx } from './shared';

const liveExpense = isNull(expenses.deletedAt);
const monthOr = (value: string | undefined) => (value && periodSchema.safeParse(value).success ? value : currentPeriod());

/* ───────────── list ───────────── */

export async function listExpenses(ctx: Ctx, filter: { month?: string; category?: string } = {}) {
  assertManager(ctx);
  const db = await getDb();
  const month = monthOr(filter.month);
  const { from, to } = periodRange(month);
  const inMonth = and(eq(expenses.centreId, ctx.centre.id), liveExpense, gte(expenses.spentOn, from), lte(expenses.spentOn, to));
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

/* ───────────── add, change, remove ───────────── */

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

export async function saveExpense(ctx: Ctx, input: ExpenseInput) {
  assertManager(ctx);
  const data = expenseInput.parse(input);
  if (data.spentOn > todayIST()) throw new ApiError(400, 'The date cannot be in the future', { spentOn: 'Pick today or an earlier date' });
  const db = await getDb();
  const values = { description: data.description, amount: data.amount, spentOn: data.spentOn, paidTo: data.paidTo, method: data.method };

  let row;
  if (data.id) {
    const [existing] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, data.id), eq(expenses.centreId, ctx.centre.id), liveExpense))
      .limit(1);
    if (!existing) return notFound('Expense');
    // A salary entry stays a salary entry: its category ties it to the staff member and the month.
    const category = existing.staffId ? SALARY_CATEGORY : data.category;
    if (!existing.staffId && category === SALARY_CATEGORY) throw new ApiError(400, 'Use "Pay salaries" for a salary, so it is recorded against the staff member', { category: 'Use Pay salaries' });
    [row] = await db.update(expenses).set({ ...values, category }).where(eq(expenses.id, existing.id)).returning();
  } else {
    if (data.category === SALARY_CATEGORY) throw new ApiError(400, 'Use "Pay salaries" for a salary, so it is recorded against the staff member', { category: 'Use Pay salaries' });
    [row] = await db.insert(expenses).values({ ...values, category: data.category, centreId: ctx.centre.id, createdBy: ctx.session.uid }).returning();
  }
  await audit(ctx.session, data.id ? 'expense.update' : 'expense.create', {
    entity: 'expense',
    entityId: row.id,
    centreId: ctx.centre.id,
    summary: `${row.category}: ${inr(row.amount)}${row.paidTo ? ` to ${row.paidTo}` : ''}`,
  });
  return row;
}

export async function deleteExpense(ctx: Ctx, id: string) {
  assertManager(ctx);
  const expenseId = uuid.parse(id);
  const db = await getDb();
  const [row] = await db
    .update(expenses)
    .set({ deletedAt: new Date() })
    .where(and(eq(expenses.id, expenseId), eq(expenses.centreId, ctx.centre.id), liveExpense))
    .returning();
  if (!row) return notFound('Expense');
  await audit(ctx.session, 'expense.delete', {
    entity: 'expense',
    entityId: row.id,
    centreId: ctx.centre.id,
    summary: `Removed ${row.category}: ${inr(row.amount)}${row.paidTo ? ` to ${row.paidTo}` : ''}`,
  });
  return { id: row.id };
}

/* ───────────── salaries ───────────── */

/** Active staff with what each is paid a month and whether that month's salary has gone out. */
export async function salarySheet(ctx: Ctx, forMonth?: string) {
  assertManager(ctx);
  const db = await getDb();
  const month = monthOr(forMonth);
  const [members, paid] = await Promise.all([
    db
      .select({ id: staff.id, name: staff.name, roleTitle: staff.roleTitle, monthlySalary: staff.monthlySalary })
      .from(staff)
      .where(and(eq(staff.centreId, ctx.centre.id), eq(staff.active, true), isNull(staff.deletedAt)))
      .orderBy(desc(staff.monthlySalary), asc(staff.name)),
    db
      .select({ id: expenses.id, staffId: expenses.staffId, amount: expenses.amount, spentOn: expenses.spentOn, method: expenses.method })
      .from(expenses)
      .where(and(eq(expenses.centreId, ctx.centre.id), eq(expenses.salaryPeriod, month), liveExpense)),
  ]);
  const rows = members.map((member) => ({ ...member, paid: paid.find((p) => p.staffId === member.id) ?? null }));
  return {
    month,
    rows,
    paidTotal: rows.reduce((sum, r) => sum + (r.paid?.amount ?? 0), 0),
    pendingTotal: rows.reduce((sum, r) => sum + (r.paid ? 0 : r.monthlySalary), 0),
  };
}

const salaryInput = z.object({
  month: periodSchema,
  paidOn: day,
  method: z.enum(PAYMENT_METHODS),
  items: z.array(z.object({ staffId: uuid, amount: rupees.refine((v) => v > 0, 'Enter the amount') })).min(1, 'Tick at least one staff member').max(100),
});
export type SalaryInput = z.input<typeof salaryInput>;

/** Pays the month's salary to the chosen staff. Nobody can be paid twice for one month. */
export async function paySalaries(ctx: Ctx, input: SalaryInput) {
  assertManager(ctx);
  const data = salaryInput.parse(input);
  if (data.paidOn > todayIST()) throw new ApiError(400, 'The date cannot be in the future', { paidOn: 'Pick today or an earlier date' });
  if (data.month > currentPeriod()) throw new ApiError(400, 'Salary cannot be paid for a month that has not begun');
  const ids = data.items.map((item) => item.staffId);
  if (new Set(ids).size !== ids.length) throw new ApiError(400, 'A staff member is listed twice');
  const db = await getDb();
  const label = periodLabel(data.month);

  const created = await db.transaction(async (tx) => {
    // Locking the staff rows makes two "pay" clicks wait for each other, so the check below holds.
    const members = await tx
      .select({ id: staff.id, name: staff.name })
      .from(staff)
      .where(and(inArray(staff.id, ids), eq(staff.centreId, ctx.centre.id), isNull(staff.deletedAt)))
      .for('update');
    if (members.length !== ids.length) throw new ApiError(404, 'A staff member was not found in this school');
    const already = await tx
      .select({ staffId: expenses.staffId })
      .from(expenses)
      .where(and(eq(expenses.centreId, ctx.centre.id), eq(expenses.salaryPeriod, data.month), inArray(expenses.staffId, ids), liveExpense));
    if (already.length) {
      const names = members.filter((m) => already.some((a) => a.staffId === m.id)).map((m) => m.name);
      throw new ApiError(400, `Salary for ${label} is already paid to ${names.join(', ')}`);
    }
    return tx
      .insert(expenses)
      .values(
        data.items.map((item) => {
          const member = members.find((m) => m.id === item.staffId)!;
          return {
            centreId: ctx.centre.id,
            category: SALARY_CATEGORY,
            description: `Salary for ${label}, ${member.name}`,
            amount: item.amount,
            spentOn: data.paidOn,
            paidTo: member.name,
            method: data.method,
            staffId: member.id,
            salaryPeriod: data.month,
            createdBy: ctx.session.uid,
          };
        }),
      )
      .returning();
  });

  const total = created.reduce((sum, row) => sum + row.amount, 0);
  await audit(ctx.session, 'salary.pay', {
    entity: 'expense',
    entityId: created[0].id,
    centreId: ctx.centre.id,
    summary: `Salary for ${label} paid to ${created.length} staff, ${inr(total)}`,
    meta: { month: data.month, staff: created.map((row) => row.paidTo), total },
  });
  return { count: created.length, total };
}

export { EXPENSE_CATEGORIES };
