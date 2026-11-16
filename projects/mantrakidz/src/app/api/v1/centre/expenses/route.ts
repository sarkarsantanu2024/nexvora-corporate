/** GET: a month's expenses (?month=&category=). POST: add or change one. Managers only (checked in the service). */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { listExpenses, saveExpense } from '@/server/centre/money/expenses';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  const q = new URL(req.url).searchParams;
  return ok(await listExpenses(ctx, { month: q.get('month') ?? '', category: q.get('category') ?? '' }));
});

export const POST = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await saveExpense(ctx, await req.json()), { status: 201 });
});
