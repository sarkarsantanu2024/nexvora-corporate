/** One library photo: PATCH { alt } to describe it, DELETE to remove it and its file. Head office only. */
import { ApiError, handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { deleteMedia, updateMediaAlt } from '@/server/cms/media';

const idOrFail = (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ApiError(404, 'That photo was not found');
  return id;
};

export const PATCH = handle(async (req, ctx) => {
  const session = await apiSession(HQ_ROLES);
  const { id } = await ctx.params;
  return ok(await updateMediaAlt(session, idOrFail(id), await req.json().catch(() => ({}))));
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await apiSession(HQ_ROLES);
  const { id } = await ctx.params;
  await deleteMedia(session, idOrFail(id));
  return ok({ id });
});
