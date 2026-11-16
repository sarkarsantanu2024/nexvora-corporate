import { handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { period as periodSchema } from '@/lib/validators';
import { lastFinishedPeriod, listRoyalty } from '@/server/hq/royalty';

/** GET ?period=YYYY-MM (the last finished month when left out) */
export const GET = handle(async (req) => {
  await apiSession(HQ_ROLES);
  const raw = new URL(req.url).searchParams.get('period');
  return ok(await listRoyalty(raw ? periodSchema.parse(raw) : lastFinishedPeriod()));
});
