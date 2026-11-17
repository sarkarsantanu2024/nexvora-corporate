/**
 * The bell's list for the person who is logged in. GET /api/notifications?area=admin
 *
 * `area` is the dashboard the bell sits in. The starter has one. A project
 * with a second area (say /shop) answers for it here with its own role check.
 */
import { cookies } from 'next/headers';
import { UI_LANG_COOKIE, makeT, readUiLang, uiDict } from '@/i18n/ui';
import { fail, handle, ok } from '@/lib/api';
import { TEAM_ROLES, apiSession } from '@/lib/auth';
import { listNotifications } from '@/server/notifications';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req) => {
  // API addresses do not pass through the language step, so read the cookie here.
  const t = makeT(uiDict(readUiLang((await cookies()).get(UI_LANG_COOKIE)?.value)));
  const area = new URL(req.url).searchParams.get('area');
  if (area === 'admin') return ok(await listNotifications(await apiSession(TEAM_ROLES), t));
  return fail('Unknown area');
});
