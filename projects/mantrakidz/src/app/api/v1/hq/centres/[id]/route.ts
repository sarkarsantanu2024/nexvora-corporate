import { z } from 'zod';
import { CENTRE_STATUSES } from '@/db/schema';
import { handle, ok } from '@/lib/api';
import { HQ_ROLES, apiSession } from '@/lib/auth';
import { centrePerformance, getCentre, setCentreStatus, updateCentreAgreement, updateCentreProfile } from '@/server/hq/centres';

export const GET = handle(async (_req, ctx) => {
  await apiSession(HQ_ROLES);
  const { id } = await ctx.params;
  const centre = await getCentre(id);
  return ok({ centre, performance: await centrePerformance(centre.id) });
});

/**
 * PATCH { profile?, agreement?, status? }. Each part is the full set of fields
 * for that part, exactly as the matching form on the centre page sends it.
 */
const patch = z.object({ profile: z.record(z.unknown()).optional(), agreement: z.record(z.unknown()).optional(), status: z.enum(CENTRE_STATUSES).optional() });

export const PATCH = handle(async (req, ctx) => {
  const session = await apiSession(HQ_ROLES);
  const { id } = await ctx.params;
  const body = patch.parse(await req.json());
  if (body.profile) await updateCentreProfile(session, id, body.profile as Parameters<typeof updateCentreProfile>[2]);
  if (body.agreement) await updateCentreAgreement(session, id, body.agreement as Parameters<typeof updateCentreAgreement>[2]);
  if (body.status) await setCentreStatus(session, id, body.status);
  return ok(await getCentre(id));
});
