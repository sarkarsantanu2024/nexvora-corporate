/** GET the classes of this centre with their children; ?year= picks an academic year. */
import { handle, ok } from '@/lib/api';
import { apiCentre } from '@/lib/auth';
import { listBatches } from '@/server/centre/children/batches';

export const GET = handle(async (req) => {
  const ctx = await apiCentre();
  return ok(await listBatches(ctx, { yearId: new URL(req.url).searchParams.get('year') ?? undefined }));
});
