/** GET: bills of this centre (?q=&status=&month=&batch=&student=&page=). POST: a one-off bill. */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { createBill, listBills } from '@/server/centre/money/bills';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  const q = new URL(req.url).searchParams;
  return ok(
    await listBills(ctx, {
      q: q.get('q') ?? '',
      status: q.get('status') ?? '',
      month: q.get('month') ?? '',
      batch: q.get('batch') ?? '',
      student: q.get('student') ?? '',
      page: q.get('page') ?? '',
    }),
  );
});

export const POST = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await createBill(ctx, await req.json()), { status: 201 });
});
