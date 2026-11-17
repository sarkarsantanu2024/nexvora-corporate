/**
 * What the bell in the top bar shows: the things that need this person today.
 *
 * Nothing is stored. Each notification is worked out from what is already in
 * the database (a bill past its date, an enquiry nobody has called, a new
 * notice), so it appears when the thing happens and goes away by itself when
 * the thing is dealt with. Which ones a person has already looked at is kept
 * on their own device (see components/dash/notifications.tsx).
 *
 *   head office:  enquiries waiting, new franchise leads, follow-ups due,
 *                 and every centre that needs attention (royalty overdue,
 *                 agreement ending, no fees collected, attendance not marked)
 *   a centre:     attendance not marked, enquiry follow-ups, children not yet
 *                 billed, bills past the due date, circulars from head office
 *   a parent:     fees due for each child, notices from the school
 */
import type { Translate } from '@/i18n/ui';
import type { Session } from '@/lib/auth';
import { formatDate, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import { centreOverview } from './centre/money/overview';
import { listCirculars } from './centre/money/notices';
import type { Ctx } from './centre/money/shared';
import { getOverview } from './hq/overview';
import { listChildren, listNotices } from './parent/service';

export type NotificationKind = 'money' | 'attendance' | 'enquiry' | 'lead' | 'notice' | 'centre';
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

export async function hqNotifications(t: Translate): Promise<Notification[]> {
  const data = await getOverview();
  const out: Notification[] = [];
  if (data.tiles.enquiriesWaiting > 0) {
    out.push({
      id: `hq-enquiries-${data.tiles.enquiriesWaiting}`,
      kind: 'enquiry',
      tone: 'amber',
      title: t('{n} admission enquiries waiting', { n: data.tiles.enquiriesWaiting }),
      text: t('Not yet contacted by a centre'),
      href: '/hq/enquiries',
    });
  }
  if (data.followUps.length > 0) {
    out.push({
      id: `hq-followups-${data.followUps.length}`,
      kind: 'lead',
      tone: 'amber',
      title: t('{n} franchise follow-ups due', { n: data.followUps.length }),
      text: t('Leads you planned to call by today'),
      href: '/hq/leads',
    });
  }
  if (data.tiles.leadsThisWeek > 0) {
    out.push({
      id: `hq-leads-${data.tiles.leadsThisWeek}`,
      kind: 'lead',
      tone: 'blue',
      title: t('{n} new franchise leads', { n: data.tiles.leadsThisWeek }),
      text: t('In the last 7 days'),
      href: '/hq/leads',
    });
  }
  for (const item of data.attention) {
    item.reasons.forEach((reason, index) => {
      out.push({
        id: `hq-centre-${item.centreId}-${index}-${reason.text}`,
        kind: /royalty|fee/i.test(reason.text) ? 'money' : /attendance/i.test(reason.text) ? 'attendance' : 'centre',
        tone: reason.tone,
        title: item.centreName,
        text: t(reason.text),
        href: `/hq/centres/${item.centreId}`,
      });
    });
  }
  return bySeverity(out);
}

export async function centreNotifications(ctx: Ctx, t: Translate): Promise<Notification[]> {
  const [data, circulars] = await Promise.all([centreOverview(ctx), listCirculars(ctx)]);
  const out: Notification[] = [];
  const { todo } = data;
  if (todo.attendancePending.length > 0) {
    out.push({
      id: `centre-attendance-${data.today}-${todo.attendancePending.length}`,
      kind: 'attendance',
      tone: 'amber',
      title: t('Attendance not marked today'),
      text: todo.attendancePending.map((c) => c.name).join(', '),
      href: '/centre/attendance',
    });
  }
  if (todo.overdue > 0) {
    out.push({
      id: `centre-overdue-${todo.overdue}`,
      kind: 'money',
      tone: 'red',
      title: t('{n} bills past the due date', { n: todo.overdue }),
      text: t('{amount} to collect from {n} children', { amount: inr(data.tiles.dues), n: data.tiles.childrenWithDues }),
      href: '/centre/fees?tab=dues',
    });
  }
  if (todo.followUps > 0) {
    out.push({
      id: `centre-followups-${data.today}-${todo.followUps}`,
      kind: 'enquiry',
      tone: 'amber',
      title: t('{n} enquiry follow-ups due', { n: todo.followUps }),
      text: t('Parents you planned to call by today'),
      href: '/centre/enquiries',
    });
  }
  if (todo.unbilled > 0) {
    out.push({
      id: `centre-unbilled-${data.month}-${todo.unbilled}`,
      kind: 'money',
      tone: 'amber',
      title: t('{n} children not billed for {month}', { n: todo.unbilled, month: periodLabel(data.month) }),
      href: '/centre/fees/run',
    });
  }
  for (const circular of circulars.slice(0, 5)) {
    out.push({
      id: `centre-circular-${circular.id}`,
      kind: 'notice',
      tone: 'blue',
      title: circular.title,
      text: t('Circular from head office, {date}', { date: formatDate(circular.publishOn) }),
      href: '/centre/notices',
    });
  }
  return bySeverity(out);
}

export async function parentNotifications(session: Session, t: Translate): Promise<Notification[]> {
  const [children, notices] = await Promise.all([listChildren(session), listNotices(session, 5)]);
  const out: Notification[] = [];
  for (const child of children) {
    if (child.due > 0) {
      out.push({
        id: `parent-due-${child.id}-${child.due}`,
        kind: 'money',
        tone: 'red',
        title: t('{amount} fee due for {child}', { amount: inr(child.due), child: child.name }),
        text: t('{n} unpaid bills', { n: child.dueBills }),
        href: '/parent/fees',
      });
    }
  }
  for (const notice of notices) {
    out.push({
      id: `parent-notice-${notice.id}`,
      kind: 'notice',
      tone: 'blue',
      title: notice.title,
      text: notice.eventDate ? t('On {date}', { date: formatDate(notice.eventDate) }) : formatDate(notice.publishOn),
      href: '/parent/notices',
    });
  }
  return bySeverity(out);
}

const RANK = { red: 0, amber: 1, blue: 2 } as const;
/** Act-today first; the order inside a colour is kept. */
const bySeverity = (items: Notification[]) => items.map((item, index) => ({ item, index })).sort((a, b) => RANK[a.item.tone] - RANK[b.item.tone] || a.index - b.index).map(({ item }) => item);
