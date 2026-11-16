/** GET: receipts (?from=&to=&student=&page=). POST: take a payment, spread over the child's unpaid bills oldest first. */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { listPayments, takePayment } from '@/server/centre/money/payments';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  const q = new URL(req.url).searchParams;
  return ok(await listPayments(ctx, { from: q.get('from') ?? '', to: q.get('to') ?? '', student: q.get('student') ?? '', page: q.get('page') ?? '' }));
});

export const POST = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await takePayment(ctx, await req.json()), { status: 201 });
});
