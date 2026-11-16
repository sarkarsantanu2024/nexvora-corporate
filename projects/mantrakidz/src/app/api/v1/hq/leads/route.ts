import { handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { createLead, leadStageCounts, listLeads } from '@/server/hq/leads';

/** GET ?q=&stage=&source=&page= */
export const GET = handle(async (req) => {
  await apiSession(HQ_ROLES);
  const params = new URL(req.url).searchParams;
  const filters = { q: params.get('q') ?? undefined, stage: params.get('stage') ?? undefined, source: params.get('source') ?? undefined, page: params.get('page') ?? undefined };
  const [list, stages] = await Promise.all([listLeads(filters), leadStageCounts(filters)]);
  return ok({ ...list, stages });
});

export const POST = handle(async (req) => {
  const session = await apiSession(HQ_ROLES);
  return ok(await createLead(session, await req.json()), { status: 201 });
});
