import { handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { createCentre, listCentres } from '@/server/hq/centres';

/** GET ?q=&status=&type=franchise|company */
export const GET = handle(async (req) => {
  await apiSession(HQ_ROLES);
  const params = new URL(req.url).searchParams;
  return ok(await listCentres({ q: params.get('q') ?? undefined, status: params.get('status') ?? undefined, type: params.get('type') ?? undefined }));
});

export const POST = handle(async (req) => {
  const session = await apiSession(HQ_ROLES);
  return ok(await createCentre(session, await req.json()), { status: 201 });
});
