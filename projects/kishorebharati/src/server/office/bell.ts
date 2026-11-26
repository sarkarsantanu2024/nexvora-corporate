/**
 * Bell lines of the office registers (listed in SOURCES of ../notifications.ts):
 *  - the office: "Mid-day meal register not filled today", from 1 pm on a school day;
 *  - the head of school: "N leave requests waiting";
 *  - a teacher (or anyone with a staff row): "Your leave was approved/rejected", for three days;
 *  - everyone in the dashboard: staff circulars not read yet.
 */
import { formatDate, todayIST } from '@/lib/date';
import { planAllows } from '@/lib/plans';
import type { Translate } from '@/i18n/ui';
import type { Session } from '@/lib/session-token';
import { isAdmin } from '../admin/shared';
import { closedOn, istMinutes } from '../daily/shared';
import { decidedSince, pendingLeaveCount } from '../leave/service';
import type { Notification } from '../notifications';
import { getPlatform } from '../platform';
import { isOffice } from '../school/access';
import { unreadCirculars } from './circulars';
import { mdmFilled } from './mdm';
import { mdmGradesOf, officeSettings } from './shared';

/** 1 pm: the meal is served by then. */
const MDM_DUE_AT = 13 * 60;
const DECISION_DAYS = 3;

export async function officeItems(session: Session, t: Translate, now: Date = new Date()): Promise<Notification[]> {
  if (session.role === 'parent' || !planAllows((await getPlatform()).plan, 'platinum')) return [];
  const out: Notification[] = [];
  const today = todayIST(now);

  if (isOffice(session) && istMinutes(now) >= MDM_DUE_AT && mdmGradesOf(await officeSettings()).length && !(await closedOn(today)) && !(await mdmFilled(today))) {
    out.push({
      id: `mdm-${today}`,
      kind: 'task',
      tone: 'amber',
      title: t('Mid-day meal register not filled today'),
      text: t('Fill in who ate and the rice used'),
      href: '/admin/mdm',
    });
  }

  if (isAdmin(session)) {
    const n = await pendingLeaveCount();
    if (n) {
      out.push({
        id: `leave-waiting-${n}`,
        kind: 'task',
        tone: 'amber',
        title: n === 1 ? t('1 leave request waiting') : t('{n} leave requests waiting', { n }),
        text: t('Approve or reject from Staff leave'),
        href: '/admin/leave?status=pending',
      });
    }
  }

  const decided = await decidedSince(session, new Date(now.getTime() - DECISION_DAYS * 24 * 60 * 60 * 1000));
  for (const leave of decided) {
    out.push({
      id: `leave-${leave.id}-${leave.status}`,
      kind: 'task',
      tone: leave.status === 'approved' ? 'blue' : 'red',
      title: leave.status === 'approved' ? t('Your leave was approved') : t('Your leave was rejected'),
      text: leave.fromDate === leave.toDate ? formatDate(leave.fromDate) : t('{from} to {to}', { from: formatDate(leave.fromDate), to: formatDate(leave.toDate) }),
      href: '/admin/leave',
    });
  }

  const unread = await unreadCirculars(session);
  if (unread.length) {
    out.push({
      id: `circulars-${unread.map((row) => row.id).join(',')}`,
      kind: 'notice',
      tone: 'blue',
      title: unread.length === 1 ? t('1 staff circular to read') : t('{n} staff circulars to read', { n: unread.length }),
      text: unread[0].title,
      href: unread.length === 1 ? `/admin/circulars/${unread[0].id}` : '/admin/circulars',
    });
  }
  return out;
}
