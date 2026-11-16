import { handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { getOverview } from '@/server/hq/overview';

export const GET = handle(async () => {
  await apiSession(HQ_ROLES);
  return ok(await getOverview());
});
