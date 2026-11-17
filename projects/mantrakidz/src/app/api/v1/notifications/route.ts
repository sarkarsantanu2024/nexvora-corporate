/** The bell's list for the person who is logged in. GET /api/v1/notifications?area=hq|centre|parent */
import { cookies } from 'next/headers';
import { UI_LANG_COOKIE, makeT, readUiLang, uiDict } from '@/i18n/ui';
import { fail, handle, ok } from '@/lib/api';
import { HQ_ROLES, apiCentre, apiSession } from '@/lib/auth';
import { centreNotifications, hqNotifications, parentNotifications } from '@/server/notifications';

export const GET = handle(async (req) => {
  // API addresses do not pass through the language step, so read the cookie here.
  const t = makeT(uiDict(readUiLang((await cookies()).get(UI_LANG_COOKIE)?.value)));
  const area = new URL(req.url).searchParams.get('area');
  if (area === 'hq') {
    await apiSession(HQ_ROLES);
    return ok(await hqNotifications(t));
  }
  if (area === 'centre') return ok(await centreNotifications(await apiCentre(), t));
  if (area === 'parent') return ok(await parentNotifications(await apiSession(['parent']), t));
  return fail('Unknown area');
});
