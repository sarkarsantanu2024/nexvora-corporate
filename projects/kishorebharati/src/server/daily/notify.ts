/**
 * Bell lines of the daily work (listed in SOURCES of ../notifications.ts):
 *  - a teacher: "Register not taken for Class 7 A", for each section they
 *    are class teacher of, once it is 11:30 on a school day;
 *  - the office: "N sections have no register today", from the same time.
 */
import { sectionLabel } from '@/config/school';
import { getDb } from '@/db';
import type { Translate } from '@/i18n/ui';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import type { Notification } from '../notifications';
import { sectionsNotTaken } from '../attendance/service';
import { currentYear, isOffice, teacherScope } from '../school/access';
import { closedOn, istMinutes } from './shared';

/** 11:30 in the morning: the register should be taken in the first period. */
const REGISTER_DUE_AT = 11 * 60 + 30;

export async function registerItems(session: Session, t: Translate, now: Date = new Date()): Promise<Notification[]> {
  if (session.role !== 'teacher' && !isOffice(session)) return [];
  if (istMinutes(now) < REGISTER_DUE_AT) return [];
  const today = todayIST(now);
  const db = await getDb();
  if (await closedOn(today, db)) return [];
  let yearId: string;
  try {
    yearId = (await currentYear(db)).id;
  } catch {
    return [];
  }

  if (isOffice(session)) {
    const missing = await sectionsNotTaken(today);
    if (!missing.length) return [];
    return [
      {
        id: `registers-${today}-${missing.length}`,
        kind: 'task',
        tone: 'amber',
        title: missing.length === 1 ? t('1 section has no register today') : t('{n} sections have no register today', { n: missing.length }),
        text: t('See which on the Attendance screen'),
        href: '/admin/attendance',
      },
    ];
  }

  const scope = await teacherScope(session, yearId, db);
  if (!scope?.classTeacherOf.length) return [];
  const missing = await sectionsNotTaken(today, scope.classTeacherOf);
  return missing.map((section) => ({
    id: `register-${section.id}-${today}`,
    kind: 'task' as const,
    tone: 'red' as const,
    title: t('Register not taken for {section}', { section: sectionLabel(section, t('Class') === 'Class' ? 'en' : 'bn') }),
    text: t('Take it now from Attendance'),
    href: `/admin/attendance?section=${section.id}&day=${today}`,
  }));
}
