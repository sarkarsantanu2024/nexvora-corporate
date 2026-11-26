/**
 * "My day", a teacher's home: today's periods, the registers still to take,
 * and the latest notices for staff.
 */
import { and, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { announcements, attendance, sections, type Section } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { todayIST, weekday } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { currentYear, staffOf, teacherScope } from '../school/access';
import { closedOn } from '../daily/shared';
import { periodsFor } from '../timetable/defaults';
import { getTimetableSettings, teacherTimetable } from '../timetable/service';

export async function myDay(session: Session) {
  if (session.role !== 'teacher') throw new ApiError(403, 'You do not have access to this');
  const db = await getDb();
  const today = todayIST();
  const dow = weekday(today);
  const [me, year, closed, settings] = await Promise.all([staffOf(session, db), currentYear(db), closedOn(today, db), getTimetableSettings()]);
  const scope = await teacherScope(session, year.id, db);

  // Today's periods, in time order.
  let periods: { period: number; start: string; end: string; section: Section; subject: string; subjectBn: string; room: string }[] = [];
  if (me && dow >= 1 && dow <= 6 && !closed) {
    const week = await teacherTimetable(session);
    periods = week.slots
      .filter((slot) => slot.day === dow && slot.section)
      .flatMap((slot) => {
        const time = periodsFor(settings, slot.section.grade, dow)[slot.period - 1];
        return time ? [{ period: slot.period, start: time.start, end: time.end, section: slot.section, subject: slot.subject, subjectBn: slot.subjectBn, room: slot.room }] : [];
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  // Registers of the sections this teacher is class teacher of.
  const own = scope?.classTeacherOf ?? [];
  const ownSections = own.length ? await db.select().from(sections).where(inArray(sections.id, own)) : [];
  const taken = own.length ? await db.selectDistinct({ sectionId: attendance.sectionId }).from(attendance).where(and(inArray(attendance.sectionId, own), eq(attendance.day, today))) : [];
  const done = new Set(taken.map((row) => row.sectionId));
  const registers = ownSections.map((section) => ({ section, taken: done.has(section.id) }));

  const notices = await db
    .select({ id: announcements.id, title: announcements.title, body: announcements.body, attachment: announcements.attachment, publishOn: announcements.publishOn, audience: announcements.audience })
    .from(announcements)
    .where(and(inArray(announcements.audience, ['staff', 'public']), lte(announcements.publishOn, today), or(isNull(announcements.expiresOn), gte(announcements.expiresOn, today))))
    .orderBy(desc(announcements.pinned), desc(announcements.publishOn))
    .limit(5);

  return { today, closed, linked: Boolean(me), periods, registers, notices };
}
