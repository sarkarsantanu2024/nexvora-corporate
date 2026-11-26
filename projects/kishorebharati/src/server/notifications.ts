/**
 * What the bell in the top bar shows: the things that need this person today.
 *
 * Nothing is stored. Each notification is worked out from what is already in
 * the database (an enquiry nobody has answered, website changes not yet
 * published, a new notice), so it appears when the thing happens and goes
 * away by itself when the thing is dealt with. Which ones a person has
 * already looked at is kept on their own device (see
 * components/dash/notifications.tsx).
 *
 * What the starter shows:
 *   enquiries waiting more than two days (red), other new enquiries (amber),
 *   website changes saved but not published (amber),
 *   notices that went up on the website in the last seven days (blue).
 *
 * ADDING YOUR OWN (a business module)
 *   1. Write a function like the three below: it takes the session and `t`
 *      and returns a list of Notification. Count with a query; do not load
 *      rows to add them up. Leave out what this person's role may not open.
 *   2. Add it to SOURCES at the bottom of this file. That is all: the bell,
 *      the count and the notifications screen pick it up.
 *   3. If it needs a new kind (say 'order'), add the word to NotificationKind
 *      and give it an icon in components/dash/notifications.tsx.
 *   4. Add its sentences to src/i18n/ui-hi.ts and ui-bn.ts.
 * Make the id change when the thing changes (a count, the newest row's id),
 * so a person who has seen "3 new orders" is told again when it becomes 4.
 */
import { and, desc, eq, gte, isNull, lt, lte, ne, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { announcements, enquiries, messageOutbox } from '@/db/schema';
import type { Translate } from '@/i18n/ui';
import { addDays, formatDate, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { countInt } from './admin/shared';
import { planAllows } from '@/lib/plans';
import { keysWithDraft } from './cms/service';
import { getPlatform } from './platform';
import { examNotifications } from './exams/service';
import { registerItems } from './daily/notify';
import { billsDueThisWeek } from './money/bell';
import { booksOverdue } from './library/bell';
import { officeItems } from './office/bell';

export type NotificationKind = 'enquiry' | 'website' | 'notice' | 'money' | 'task';
export type Notification = {
  /** Stable while the thing is unchanged, so "already seen" can be remembered. */
  id: string;
  kind: NotificationKind;
  /** red: act today. amber: act soon. blue: for your information. */
  tone: 'red' | 'amber' | 'blue';
  title: string;
  text?: string;
  /** The screen where it is dealt with. */
  href: string;
};

/** One part of the list. A business module writes one of these and adds it to SOURCES. */
export type NotificationSource = (session: Session, t: Translate) => Promise<Notification[]>;

/** An enquiry still marked New after this many days is shown in red. */
const LATE_AFTER_DAYS = 2;
/** A notice is "new" on the bell for this many days after it goes up. */
const NOTICE_DAYS = 7;

const enquiryItems: NotificationSource = async (_session, t) => {
  const db = await getDb();
  const lateBefore = new Date(Date.now() - LATE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const isNew = and(eq(enquiries.status, 'new'), isNull(enquiries.deletedAt));
  const [[late], [recent], [newest]] = await Promise.all([
    db.select({ n: countInt() }).from(enquiries).where(and(isNew, lt(enquiries.createdAt, lateBefore))),
    db.select({ n: countInt() }).from(enquiries).where(and(isNew, gte(enquiries.createdAt, lateBefore))),
    db.select({ id: enquiries.id }).from(enquiries).where(isNew).orderBy(desc(enquiries.createdAt)).limit(1),
  ]);
  const out: Notification[] = [];
  if (late.n > 0) {
    out.push({
      id: `enquiries-late-${late.n}`,
      kind: 'enquiry',
      tone: 'red',
      title: late.n === 1 ? t('1 enquiry waiting for more than {days} days', { days: LATE_AFTER_DAYS }) : t('{n} enquiries waiting for more than {days} days', { n: late.n, days: LATE_AFTER_DAYS }),
      text: t('Nobody has replied yet'),
      href: '/admin/enquiries?status=new',
    });
  }
  if (recent.n > 0) {
    out.push({
      // The newest one is part of the id, so a fresh enquiry rings the bell again.
      id: `enquiries-new-${recent.n}-${newest?.id ?? ''}`,
      kind: 'enquiry',
      tone: 'amber',
      title: recent.n === 1 ? t('1 new enquiry') : t('{n} new enquiries', { n: recent.n }),
      text: t('Reply by call, WhatsApp or email'),
      href: '/admin/enquiries?status=new',
    });
  }
  return out;
};

const websiteItems: NotificationSource = async (_session, t) => {
  const drafts = await keysWithDraft();
  if (!drafts.length) return [];
  return [
    {
      id: `website-drafts-${[...drafts].sort().join(',')}`,
      kind: 'website',
      tone: 'amber',
      title: drafts.length === 1 ? t('1 website change is not published') : t('{n} website changes are not published', { n: drafts.length }),
      text: t('Visitors do not see them until you publish'),
      href: '/admin/website',
    },
  ];
};

const noticeItems: NotificationSource = async (_session, t) => {
  const db = await getDb();
  const today = todayIST();
  const rows = await db
    .select({ id: announcements.id, title: announcements.title, publishOn: announcements.publishOn, eventDate: announcements.eventDate })
    .from(announcements)
    // Staff circulars have their own bell line (unread circulars), so they are left out here.
    .where(and(ne(announcements.audience, 'staff'), lte(announcements.publishOn, today), gte(announcements.publishOn, addDays(today, -NOTICE_DAYS)), or(isNull(announcements.expiresOn), gte(announcements.expiresOn, today))))
    .orderBy(desc(announcements.publishOn), desc(announcements.createdAt))
    .limit(5);
  return rows.map((notice) => ({
    id: `notice-${notice.id}`,
    kind: 'notice' as const,
    tone: 'blue' as const,
    title: notice.title,
    text: notice.eventDate ? t('On {date}', { date: formatDate(notice.eventDate) }) : t('On the website since {date}', { date: formatDate(notice.publishOn) }),
    href: '/admin/website/notices',
  }));
};

/** WhatsApp reminders that are due and nobody has sent yet (src/server/reminders). */
const reminderItems: NotificationSource = async (_session, t) => {
  if (!planAllows((await getPlatform()).plan, 'panel')) return [];
  const db = await getDb();
  const [[waiting], [newest]] = await Promise.all([
    db.select({ n: countInt() }).from(messageOutbox).where(eq(messageOutbox.status, 'waiting')),
    db.select({ id: messageOutbox.id }).from(messageOutbox).where(eq(messageOutbox.status, 'waiting')).orderBy(desc(messageOutbox.createdAt)).limit(1),
  ]);
  if (!waiting.n) return [];
  return [
    {
      id: `reminders-${waiting.n}-${newest?.id ?? ''}`,
      kind: 'task',
      tone: 'amber',
      title: waiting.n === 1 ? t('1 WhatsApp reminder to send') : t('{n} WhatsApp reminders to send', { n: waiting.n }),
      text: t('They wait on the Reminders screen'),
      href: '/admin/reminders',
    },
  ];
};

/** Every part of the list, in the order it is asked. A business module adds its own here. */
const SOURCES: NotificationSource[] = [enquiryItems, reminderItems, websiteItems, noticeItems, examNotifications, registerItems, billsDueThisWeek, booksOverdue, officeItems];

/** The bell's list for one person, most urgent first. */
export async function listNotifications(session: Session, t: Translate): Promise<Notification[]> {
  const parts = await Promise.all(SOURCES.map((source) => source(session, t)));
  return bySeverity(parts.flat());
}

const RANK = { red: 0, amber: 1, blue: 2 } as const;
/** Act-today first; the order inside a colour is kept. */
const bySeverity = (items: Notification[]) => items.map((item, index) => ({ item, index })).sort((a, b) => RANK[a.item.tone] - RANK[b.item.tone] || a.index - b.index).map(({ item }) => item);
