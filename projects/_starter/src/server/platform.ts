/**
 * The plan this client bought and whether the account is running.
 *
 * Every client gets the whole app; the plan decides which parts open (the
 * plans are listed in src/lib/plans.ts). Nexvora changes the plan or pauses
 * the account through /api/platform (src/app/api/platform/route.ts), never
 * the client: nothing on the client's own screens can change it.
 *
 * A paused (suspended) account keeps its website up, but every dashboard
 * screen shows the /suspended page until Nexvora switches it back on.
 */
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { PLANS, PLAN_LABELS, PLATFORM_CONTACT, isPlan, planAllows, type Plan } from '@/lib/plans';
import { getSetting, putSetting, type PlatformSettings } from './admin/shared';

export const ACCOUNT_STATUSES = ['active', 'suspended'] as const;

/** Read once per request, however many screens and menus ask. */
export const getPlatform = cache(async (): Promise<PlatformSettings> => {
  const stored = await getSetting('platform');
  return {
    ...stored,
    // A value that is not a plan opens everything, as it was before plans existed.
    plan: isPlan(stored.plan) ? stored.plan : 'platinum',
    status: stored.status === 'suspended' ? 'suspended' : 'active',
  };
});

/** For pages: sends the person to the "not in your plan" screen. */
export async function requirePlan(need: Plan, upgradeHref = '/admin/upgrade') {
  const { plan } = await getPlatform();
  if (!planAllows(plan, need)) redirect(`${upgradeHref}?need=${need}`);
}

/** For services and route handlers. */
export async function assertPlan(need: Plan) {
  const { plan } = await getPlatform();
  if (!planAllows(plan, need)) throw new ApiError(403, 'This is not part of your plan');
}

export const platformInput = z.object({
  plan: z.enum(PLANS).optional(),
  status: z.enum(ACCOUNT_STATUSES).optional(),
  note: z.string().trim().max(300).optional(),
});

/** Only called from /api/platform, after the Nexvora key was checked. */
export async function updatePlatform(input: z.input<typeof platformInput>) {
  const change = platformInput.parse(input);
  if (change.plan === undefined && change.status === undefined && change.note === undefined) throw new ApiError(400, 'Nothing to change');
  const before = await getSetting('platform');
  const next: PlatformSettings = { ...before, ...change, changedAt: new Date().toISOString() };
  await putSetting('platform', next);
  const parts = [
    change.plan && change.plan !== before.plan ? `plan ${PLAN_LABELS[change.plan]}` : '',
    change.status && change.status !== before.status ? (change.status === 'suspended' ? 'account paused' : 'account switched on') : '',
  ].filter(Boolean);
  await audit({ uid: null, name: PLATFORM_CONTACT.name }, 'platform.update', {
    entity: 'platform',
    entityId: 'platform',
    summary: parts.length ? `${PLATFORM_CONTACT.name}: ${parts.join(', ')}` : `${PLATFORM_CONTACT.name} updated the account note`,
  });
  return next;
}
