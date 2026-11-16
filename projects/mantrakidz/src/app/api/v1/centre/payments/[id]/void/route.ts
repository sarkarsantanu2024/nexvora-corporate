/** POST { reason }: void a receipt. Managers only (checked in the service). */
import { z } from 'zod';
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { voidPayment } from '@/server/centre/money/payments';

export const POST = handle(async (req, { params }) => {
  const ctx = await apiCentre();
  const { id } = await params;
  const { reason } = z.object({ reason: z.string() }).parse(await req.json());
  return ok(await voidPayment(ctx, id, reason));
});
