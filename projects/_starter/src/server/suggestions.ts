/**
 * "What to do next" cards on the overview. Each is a plain rule over what is
 * in the database: nothing is guessed and no number is made up. A card goes
 * away by itself once the thing is done.
 *
 * The bell (notifications.ts) says what needs doing today; these are the
 * slower things that keep the business and the website in good shape.
 *
 * ADDING YOUR OWN (a business module: "3 customers have not paid for two
 * months", "this month's costs are higher than the takings")
 *   Write a function like the ones below that returns zero or more
 *   Suggestion and add it to RULES. Count with a query; leave out what this
 *   person's role or the plan cannot open. Add its sentences to
 *   src/i18n/ui-hi.ts and ui-bn.ts.
 */
import { eq, gte } from 'drizzle-orm';
import { getDb, usingNeon } from '@/db';
import { SAMPLE_ALBUM } from '@/db/seed-site';
import { announcements, galleryItems, users } from '@/db/schema';
import type { Translate } from '@/i18n/ui';
import { addDays, formatDate, todayIST } from '@/lib/date';
import { planAllows } from '@/lib/plans';
import type { Session } from '@/lib/session-token';
import { countInt, getSetting, isAdmin } from './admin/shared';
import { getPlatform } from './platform';

export type Suggestion = {
  id: string;
  /** warn: something is wrong or missing. tip: worth doing when there is time. */
  tone: 'warn' | 'tip';
  title: string;
  text: string;
  href: string;
  action: string;
};

type Rule = (session: Session, t: Translate) => Promise<Suggestion[]>;

/** A website with no new notice for this long looks forgotten. */
const QUIET_NOTICE_DAYS = 30;

const businessDetails: Rule = async (session, t) => {
  if (!isAdmin(session)) return [];
  const org = await getSetting('org');
  if (org.phone && org.address) return [];
  return [
    {
      id: 'org-details',
      tone: 'warn',
      title: t('Fill in the business details'),
      text: t('The phone number and address are used on bills, letters and messages.'),
      href: '/admin/settings',
      action: t('Open Settings'),
    },
  ];
};

const samplePhotos: Rule = async (_session, t) => {
  if (!planAllows((await getPlatform()).plan, 'panel')) return [];
  const db = await getDb();
  const [row] = await db.select({ n: countInt() }).from(galleryItems).where(eq(galleryItems.album, SAMPLE_ALBUM));
  if (!row.n) return [];
  return [
    {
      id: 'sample-photos',
      tone: 'warn',
      title: t('The gallery still has sample photos'),
      text: t('Visitors see {n} sample photos. Add your own and delete the album "{album}".', { n: row.n, album: SAMPLE_ALBUM }),
      href: '/admin/website/gallery',
      action: t('Open Gallery'),
    },
  ];
};

const quietNotices: Rule = async (_session, t) => {
  if (!planAllows((await getPlatform()).plan, 'panel')) return [];
  const db = await getDb();
  const since = addDays(todayIST(), -QUIET_NOTICE_DAYS);
  const [row] = await db.select({ n: countInt() }).from(announcements).where(gte(announcements.publishOn, since));
  if (row.n) return [];
  return [
    {
      id: 'quiet-notices',
      tone: 'tip',
      title: t('No new notice for {days} days', { days: QUIET_NOTICE_DAYS }),
      text: t('A fresh notice (an offer, a holiday, an event) shows visitors the business is active.'),
      href: '/admin/website/notices',
      action: t('Add a notice'),
    },
  ];
};

const oneLogin: Rule = async (session, t) => {
  if (!isAdmin(session)) return [];
  const db = await getDb();
  const [row] = await db.select({ n: countInt() }).from(users).where(eq(users.active, true));
  if (row.n > 1) return [];
  return [
    {
      id: 'one-login',
      tone: 'tip',
      title: t('Give each person their own login'),
      text: t('With one shared login, the activity log cannot show who did what.'),
      href: '/admin/users',
      action: t('Add a login'),
    },
  ];
};

/** On the live site the daily check runs every morning; if it stopped, reminders stop too. */
const dailyCheck: Rule = async (session, t) => {
  if (!isAdmin(session) || !usingNeon()) return [];
  const { lastRunAt } = await getSetting('jobs');
  const stale = !lastRunAt || Date.now() - new Date(lastRunAt).getTime() > 2 * 86_400_000;
  if (!stale) return [];
  return [
    {
      id: `daily-check-${lastRunAt}`,
      tone: 'warn',
      title: t('The daily check has not run for two days'),
      text: lastRunAt ? t('It last ran on {date}. Reminders are not being made. Tell Nexvora.', { date: formatDate(lastRunAt.slice(0, 10)) }) : t('It has never run. Reminders are not being made. Tell Nexvora.'),
      href: '/admin/settings',
      action: t('Open Settings'),
    },
  ];
};

/** Every rule, in the order the cards show. A business module adds its own here. */
const RULES: Rule[] = [businessDetails, samplePhotos, dailyCheck, oneLogin, quietNotices];

export async function listSuggestions(session: Session, t: Translate): Promise<Suggestion[]> {
  const parts = await Promise.all(RULES.map((rule) => rule(session, t)));
  const all = parts.flat();
  // Problems first, tips after.
  return [...all.filter((item) => item.tone === 'warn'), ...all.filter((item) => item.tone === 'tip')];
}
