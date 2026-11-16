/** POST { month: 'YYYY-MM' }: raise the month's bills. Safe to repeat. Managers only (checked in the service). */
import { z } from 'zod';
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { period } from '@/lib/validators';
import { runMonthly } from '@/server/centre/money/bills';

export const POST = handle(async (req) => {
  const ctx = await apiCentre();
  const { month } = z.object({ month: period }).parse(await req.json());
  return ok(await runMonthly(ctx, month));
});
