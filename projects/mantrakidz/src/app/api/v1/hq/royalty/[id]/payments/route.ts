import { handle, ok } from '@/lib/api';
import { apiSession } from '@/lib/auth';
import { recordRoyaltyPayment } from '@/server/hq/royalty';

/** POST { amount, method, reference, paidOn } against the royalty bill in the path. Admin only. */
export const POST = handle(async (req, ctx) => {
  const session = await apiSession(['hq_admin']);
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;
  const saved = await recordRoyaltyPayment(session, { ...body, invoiceId: id } as Parameters<typeof recordRoyaltyPayment>[1]);
  return ok(saved, { status: 201 });
});
