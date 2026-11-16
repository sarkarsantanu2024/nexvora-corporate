import { handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { runRoyalty } from '@/server/hq/royalty';

/** POST { period: 'YYYY-MM', recalculate?: boolean }. Safe to repeat. */
export const POST = handle(async (req) => {
  const session = await apiSession(HQ_ROLES);
  return ok(await runRoyalty(session, await req.json()));
});
