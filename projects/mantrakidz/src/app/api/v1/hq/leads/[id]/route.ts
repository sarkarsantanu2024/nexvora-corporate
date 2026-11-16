import { handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { updateLead } from '@/server/hq/leads';

/** PATCH any of the lead's fields, and/or { stage, lostReason }. Only the keys sent are changed. */
export const PATCH = handle(async (req, ctx) => {
  const session = await apiSession(HQ_ROLES);
  const { id } = await ctx.params;
  return ok(await updateLead(session, id, await req.json()));
});
