/**
 * Sample attendance, staff attendance, timetable, class diary and calendar,
 * so the daily screens have something to show on a computer. Made up, kept
 * small. Calendar entries whose date we do not know for this school carry
 * "(sample)" in their details. Today's register is left untaken, so the
 * sample teacher has one to take.
 */
import { and, eq, inArray } from 'drizzle-orm';
import * as s from '../schema';
import type { DB } from '../index';
import type { SampleContext } from './index';
import { addDays, todayIST, weekday } from '@/lib/date';
import { TIMETABLE_DEFAULTS, periodsFor } from '@/server/timetable/defaults';

/** The same "random" every time, so the sample does not change between starts. */
const roll = (seed: string) => {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

export async function seedDailySample(db: DB, context: SampleContext): Promise<void> {
  const today = todayIST();
  const [year] = await db.select().from(s.academicYears).where(eq(s.academicYears.id, context.yearId));
  if (!year) return;
  const y = Number(year.startsOn.slice(0, 4));

  /* calendar: fixed national days, then school events with dates still to be set */
  const holidays = [
    { title: 'Netaji Jayanti', startsOn: `${y}-01-23`, details: '' },
    { title: 'Republic Day', startsOn: `${y}-01-26`, details: '' },
    { title: 'Independence Day', startsOn: `${y}-08-15`, details: '' },
    { title: 'Netaji Jayanti', startsOn: `${y + 1}-01-23`, details: '' },
    { title: 'Republic Day', startsOn: `${y + 1}-01-26`, details: '' },
    { title: 'Saraswati Puja', startsOn: `${y + 1}-02-11`, details: 'Date to be confirmed by the school (sample).' },
  ];
  const events: { title: string; kind: s.CalendarKind; inDays: number; length?: number; venue: string }[] = [
    { title: 'Foundation Day', kind: 'event', inDays: 9, venue: 'School hall' },
    { title: 'Football Tournament', kind: 'event', inDays: 16, length: 3, venue: 'School ground' },
    { title: 'Blood Donation Camp', kind: 'event', inDays: 23, venue: 'School hall' },
    { title: 'Annual Sports', kind: 'event', inDays: 37, venue: 'School ground' },
    { title: 'Seminar for Class 10 and 12', kind: 'event', inDays: 44, venue: 'School hall' },
    { title: 'Trekking trip', kind: 'event', inDays: 58, length: 3, venue: '' },
    { title: 'Drama by the students', kind: 'event', inDays: 65, venue: 'School hall' },
    { title: 'Prize Distribution', kind: 'event', inDays: 72, venue: 'School hall' },
    { title: 'Staff meeting', kind: 'meeting', inDays: 5, venue: "Headmaster's room" },
  ];
  await db.insert(s.calendarEvents).values([
    ...holidays.map((row) => ({ ...row, kind: 'holiday' as const, createdBy: context.officeUserId })),
    ...events.map((row) => ({
      title: row.title,
      kind: row.kind,
      startsOn: addDays(today, row.inDays),
      endsOn: row.length ? addDays(today, row.inDays + row.length - 1) : null,
      venue: row.venue,
      details: 'Date to be set by the school (sample).',
      showOnWebsite: row.kind !== 'meeting',
      createdBy: context.officeUserId,
    })),
  ]);
  const holidayDays = new Set(holidays.map((row) => row.startsOn));

  const sectionRows = (await db.select().from(s.sections).where(eq(s.sections.yearId, year.id))).sort(
    (a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream) || a.name.localeCompare(b.name),
  );
  const subjectRows = await db.select().from(s.subjects);
  const subjectsFor = (section: s.Section) =>
    subjectRows.filter((row) => !row.optional && row.fromGrade <= section.grade && row.toGrade >= section.grade && (!row.stream || row.stream === section.stream)).sort((a, b) => a.sort - b.sort);

  /* the sample teacher teaches Bengali in both Class 7 sections and History in Class 8 A */
  const class7 = sectionRows.filter((row) => row.grade === 7);
  const class8a = sectionRows.find((row) => row.grade === 8);
  const bengali = subjectRows.find((row) => row.name === 'Bengali');
  const history = subjectRows.find((row) => row.name === 'History');
  const teacherId = context.teacherStaffId;
  const assignments: { sectionId: string; subjectId: string; staffId: string }[] = [];
  if (teacherId && bengali) for (const section of class7) assignments.push({ sectionId: section.id, subjectId: bengali.id, staffId: teacherId });
  if (teacherId && history && class8a) assignments.push({ sectionId: class8a.id, subjectId: history.id, staffId: teacherId });
  if (assignments.length) await db.insert(s.teachingAssignments).values(assignments).onConflictDoNothing();

  /* timetable for Class 7 A, 7 B and 8 A; no teacher is put in two places at once */
  const teachers = (await db.select().from(s.staff).where(eq(s.staff.designation, 'Assistant teacher'))).sort((a, b) => a.sort - b.sort).filter((row) => row.id !== teacherId);
  const timetabled = [...class7, ...(class8a ? [class8a] : [])];
  const slots: (typeof s.timetableSlots.$inferInsert)[] = [];
  timetabled.forEach((section, k) => {
    const list = subjectsFor(section);
    if (!list.length) return;
    for (let day = 1; day <= 6; day++) {
      periodsFor(TIMETABLE_DEFAULTS, section.grade, day).forEach((_, i) => {
        const subject = list[(i + day + k) % list.length];
        const own = assignments.find((row) => row.sectionId === section.id && row.subjectId === subject.id);
        // Each section gets its own band of teachers, so two sections never share one at the same time.
        const staffId = own?.staffId ?? teachers[(k * 7 + list.indexOf(subject)) % teachers.length]?.id ?? null;
        slots.push({ sectionId: section.id, day, period: i + 1, subjectId: subject.id, staffId });
      });
    }
  });
  if (slots.length) await db.insert(s.timetableSlots).values(slots).onConflictDoNothing();

  /* the last ten school days of attendance, not today */
  const days: string[] = [];
  for (let back = 1; days.length < 10 && back < 40; back++) {
    const day = addDays(today, -back);
    if (day < year.startsOn) break;
    if (weekday(day) === 0 || holidayDays.has(day)) continue;
    days.push(day);
  }
  const enrolled = sectionRows.length
    ? await db
        .select({ studentId: s.enrolments.studentId, sectionId: s.enrolments.sectionId })
        .from(s.enrolments)
        .where(and(eq(s.enrolments.yearId, year.id), inArray(s.enrolments.sectionId, sectionRows.map((row) => row.id))))
    : [];
  const marks: (typeof s.attendance.$inferInsert)[] = [];
  for (const day of days) {
    for (const row of enrolled) {
      const r = roll(`${row.studentId}:${day}`);
      const status: s.AttendanceStatus = r < 0.88 ? 'present' : r < 0.95 ? 'absent' : r < 0.98 ? 'late' : 'leave';
      const markedBy = class7[0] && row.sectionId === class7[0].id ? context.teacherUserId : context.officeUserId;
      marks.push({ day, sectionId: row.sectionId, studentId: row.studentId, status, markedBy });
    }
  }
  for (let i = 0; i < marks.length; i += 500) await db.insert(s.attendance).values(marks.slice(i, i + 500)).onConflictDoNothing();

  const everyone = await db.select({ id: s.staff.id }).from(s.staff).where(eq(s.staff.active, true));
  const staffMarks: (typeof s.staffAttendance.$inferInsert)[] = [];
  for (const day of days) {
    for (const person of everyone) {
      const r = roll(`staff:${person.id}:${day}`);
      const status: s.StaffAttendanceStatus = r < 0.9 ? 'present' : r < 0.94 ? 'leave' : r < 0.97 ? 'duty' : r < 0.99 ? 'half_day' : 'absent';
      staffMarks.push({ day, staffId: person.id, status, markedBy: context.officeUserId });
    }
  }
  if (staffMarks.length) await db.insert(s.staffAttendance).values(staffMarks).onConflictDoNothing();

  /* a few diary entries by the sample teacher */
  const diary: (typeof s.homework.$inferInsert)[] = [];
  const by = { staffId: teacherId, createdBy: context.teacherUserId };
  if (class7[0] && bengali) {
    diary.push({ ...by, sectionId: class7[0].id, subjectId: bengali.id, givenOn: days[0] ?? today, dueOn: addDays(days[0] ?? today, 2), title: 'Write a paragraph on "My village"', details: 'In the class work copy, about 150 words.' });
    diary.push({ ...by, sectionId: class7[0].id, subjectId: bengali.id, givenOn: days[2] ?? today, title: 'Learn the poem on page 34', details: 'Recite in the next class.' });
    diary.push({ ...by, sectionId: class7[0].id, subjectId: null, givenOn: days[1] ?? today, title: 'Bring the signed progress report', details: 'Guardians please sign and send it back by Friday.' });
  }
  if (class7[1] && bengali) diary.push({ ...by, sectionId: class7[1].id, subjectId: bengali.id, givenOn: days[0] ?? today, dueOn: addDays(days[0] ?? today, 3), title: 'Exercise 3, questions 1 to 5', details: '' });
  if (class8a && history) diary.push({ ...by, sectionId: class8a.id, subjectId: history.id, givenOn: days[1] ?? today, dueOn: addDays(days[1] ?? today, 4), title: 'Make a time line of the freedom movement', details: 'On a chart paper, 1857 to 1947.' });
  if (diary.length) await db.insert(s.homework).values(diary);

  /* one notice for the staff room */
  await db.insert(s.announcements).values({
    title: 'Staff meeting after school (sample)',
    body: 'All teachers please stay back for a short meeting about the coming exams.',
    audience: 'staff',
    publishOn: addDays(today, -1),
    expiresOn: addDays(today, 6),
    createdBy: context.officeUserId,
  });
}
