/** GET: this centre's fee heads. POST: add or change one (managers only, checked in the service). */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { listFeeHeads, saveFeeHead } from '@/server/centre/money/bills';

export const GET = handle(async () => ok(await listFeeHeads(await apiCentre())));

export const POST = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await saveFeeHead(ctx, await req.json()), { status: 201 });
});
