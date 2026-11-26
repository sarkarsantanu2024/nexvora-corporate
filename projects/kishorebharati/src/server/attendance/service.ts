/**
 * The daily register of a section, the office's board of every section, the
 * monthly register, and a student's attendance over a stretch of days.
 *
 * Who may do what:
 *  - the office (admin, staff) marks and reads every section;
 *  - a teacher marks only the sections they are class teacher of, and may
 *    read the registers of every section they teach.
 * Sundays and holidays in the school calendar are shut: nothing is marked.
 * Saving the same day again corrects it (one row per student per day).
 */
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { ATTENDANCE_STATUSES, attendance, enrolments, sections, students, users, type AttendanceStatus, type Section } from '@/db/schema';
import { sectionLabel } from '@/config/school';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { addDays, formatDate, periodOf, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day as dayField, uuid } from '@/lib/validators';
import { countInt } from '../admin/shared';
import { assertOffice, assertSchool, assertSectionAccess, currentYear, isOffice, teacherScope } from '../school/access';
import { closedOn, daysOf, holidaysBetween, sectionById, type Closed } from '../daily/shared';

/** Late still counts as at school; leave and absent do not. */
export const COUNTS_PRESENT: AttendanceStatus[] = ['present', 'late'];

export const percentOf = (part: number, whole: number) => (whole > 0 ? Math.round((part * 100) / whole) : null);

/** May this login mark the register of this section? (Reading is assertSectionAccess.) */
export async function canMark(session: Session, section: Section, db?: DbOrTx): Promise<boolean> {
  if (isOffice(session)) return true;
  if (session.role !== 'teacher') return false;
  const scope = await teacherScope(session, section.yearId, db);
  return Boolean(scope?.classTeacherOf.includes(section.id));
}

async function loadSection(id: string, db: DbOrTx): Promise<Section> {
  const parsed = uuid.safeParse(id);
  const section = parsed.success ? await sectionById(parsed.data, db) : null;
  if (!section) throw new ApiError(404, 'Class not found');
  return section;
}

/** The students on a section's list: active ones, plus anyone already marked that day. */
async function rollOf(sectionId: string, db: DbOrTx) {
  return db
    .select({ studentId: students.id, name: students.name, nameBn: students.nameBn, photo: students.photo, phone: students.phone, status: students.status, rollNo: enrolments.rollNo })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .where(and(eq(enrolments.sectionId, sectionId), isNull(students.deletedAt)))
    .orderBy(asc(enrolments.rollNo));
}

export type RegisterRow = {
  studentId: string;
  name: string;
  nameBn: string;
  photo: string;
  rollNo: number;
  status: AttendanceStatus | null;
  /** Absent on the last day this register was taken before this one. */
  absentBefore: boolean;
};

export type Register = {
  section: Section;
  day: string;
  rows: RegisterRow[];
  closed: Closed;
  canMark: boolean;
  markedAt: Date | null;
  markedBy: string;
  /** The last day before this one the register was taken, or null. */
  previousDay: string | null;
};

/** One section's register for one day, for the marking screen. */
export async function loadRegister(session: Session, input: { sectionId: string; day: string }): Promise<Register> {
  assertSchool(session);
  const db = await getDb();
  const day = dayField.parse(input.day);
  const section = await loadSection(input.sectionId, db);
  await assertSectionAccess(session, section.id, db);

  const [roll, marks, closed, mayMark, [prev]] = await Promise.all([
    rollOf(section.id, db),
    db
      .select({ studentId: attendance.studentId, status: attendance.status, createdAt: attendance.createdAt, markedBy: users.name })
      .from(attendance)
      .leftJoin(users, eq(users.id, attendance.markedBy))
      .where(and(eq(attendance.sectionId, section.id), eq(attendance.day, day))),
    closedOn(day, db),
    canMark(session, section, db),
    db
      .select({ day: attendance.day })
      .from(attendance)
      .where(and(eq(attendance.sectionId, section.id), lt(attendance.day, day), gte(attendance.day, addDays(day, -10))))
      .orderBy(desc(attendance.day))
      .limit(1),
  ]);
  const previousDay = prev?.day ?? null;
  const before = previousDay
    ? await db
        .select({ studentId: attendance.studentId })
        .from(attendance)
        .where(and(eq(attendance.sectionId, section.id), eq(attendance.day, previousDay), eq(attendance.status, 'absent')))
    : [];
  const absentBefore = new Set(before.map((row) => row.studentId));
  const statusOf = new Map(marks.map((row) => [row.studentId, row.status]));
  const latest = marks.reduce<(typeof marks)[number] | null>((best, row) => (!best || row.createdAt > best.createdAt ? row : best), null);

  return {
    section,
    day,
    rows: roll
      .filter((row) => row.status === 'active' || statusOf.has(row.studentId))
      .map((row) => ({
        studentId: row.studentId,
        name: row.name,
        nameBn: row.nameBn,
        photo: row.photo,
        rollNo: row.rollNo,
        status: statusOf.get(row.studentId) ?? null,
        absentBefore: absentBefore.has(row.studentId),
      })),
    closed,
    canMark: mayMark,
    markedAt: latest?.createdAt ?? null,
    markedBy: latest?.markedBy ?? '',
    previousDay,
  };
}

const saveInput = z.object({
  sectionId: uuid,
  day: dayField,
  marks: z
    .array(z.object({ studentId: uuid, status: z.enum(ATTENDANCE_STATUSES) }))
    .min(1, 'Mark at least one student')
    .max(400),
});

/**
 * Saves a whole register in one go (one request, so it survives a weak
 * connection: either all of it is saved or none). Saving again corrects it.
 */
export async function saveRegister(session: Session, raw: z.input<typeof saveInput>) {
  assertSchool(session);
  const input = saveInput.parse(raw);
  const db = await getDb();
  const section = await loadSection(input.sectionId, db);
  if (!(await canMark(session, section, db))) throw new ApiError(403, 'Only the class teacher or the office can take this register');

  const today = todayIST();
  if (input.day > today) throw new ApiError(400, 'You cannot mark a day that has not come yet');
  const year = await currentYear(db);
  if (section.yearId !== year.id) throw new ApiError(400, 'This class is not in the current school year');
  if (input.day < year.startsOn || input.day > year.endsOn) throw new ApiError(400, 'Pick a date in this school year');
  const closed = await closedOn(input.day, db);
  if (closed) throw new ApiError(400, closed.reason === 'sunday' ? 'It is a Sunday. The register is not taken.' : 'It is a holiday. The register is not taken.');

  const onList = new Set((await rollOf(section.id, db)).map((row) => row.studentId));
  const byStudent = new Map<string, AttendanceStatus>();
  for (const mark of input.marks) {
    if (!onList.has(mark.studentId)) throw new ApiError(400, 'A student on the list is not in this class');
    byStudent.set(mark.studentId, mark.status);
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .insert(attendance)
      .values([...byStudent].map(([studentId, status]) => ({ day: input.day, sectionId: section.id, studentId, status, markedBy: session.uid, createdAt: now })))
      .onConflictDoUpdate({
        target: [attendance.studentId, attendance.day],
        // created_at doubles as "last marked at" for the screen.
        set: { status: sql`excluded.status`, sectionId: sql`excluded.section_id`, markedBy: sql`excluded.marked_by`, createdAt: sql`excluded.created_at` },
      });
  });

  const counts = { present: 0, absent: 0, late: 0, leave: 0 };
  for (const status of byStudent.values()) counts[status]++;
  await audit(session, 'attendance.save', {
    entity: 'section',
    entityId: section.id,
    summary: `Register of ${sectionLabel(section)} for ${formatDate(input.day)}: ${counts.present + counts.late} present, ${counts.absent} absent, ${counts.leave} on leave`,
  });
  return counts;
}

export type BoardRow = { section: Section; students: number; marked: number; present: number; percent: number | null };

/** Every section of the current year on one day: taken or not, and how many came. Office only. */
export async function dayBoard(session: Session, day: string): Promise<BoardRow[]> {
  assertOffice(session);
  const db = await getDb();
  const date = dayField.parse(day);
  const year = await currentYear(db);
  const [list, roll, marks] = await Promise.all([
    db.select().from(sections).where(eq(sections.yearId, year.id)),
    db
      .select({ sectionId: enrolments.sectionId, n: countInt() })
      .from(enrolments)
      .innerJoin(students, eq(students.id, enrolments.studentId))
      .where(and(eq(enrolments.yearId, year.id), eq(students.status, 'active'), isNull(students.deletedAt)))
      .groupBy(enrolments.sectionId),
    db.select({ sectionId: attendance.sectionId, status: attendance.status, n: countInt() }).from(attendance).where(eq(attendance.day, date)).groupBy(attendance.sectionId, attendance.status),
  ]);
  const size = new Map(roll.map((row) => [row.sectionId, row.n]));
  return list
    .sort((a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream) || a.name.localeCompare(b.name))
    .map((section) => {
      const mine = marks.filter((row) => row.sectionId === section.id);
      const marked = mine.reduce((sum, row) => sum + row.n, 0);
      const present = mine.filter((row) => COUNTS_PRESENT.includes(row.status)).reduce((sum, row) => sum + row.n, 0);
      return { section, students: size.get(section.id) ?? 0, marked, present, percent: percentOf(present, marked) };
    });
}

/** Sections with students whose register is not taken on this day. */
export async function sectionsNotTaken(day: string, sectionIds?: string[]): Promise<Section[]> {
  const db = await getDb();
  const year = await currentYear(db);
  const list = (await db.select().from(sections).where(eq(sections.yearId, year.id))).filter((row) => !sectionIds || sectionIds.includes(row.id));
  if (!list.length) return [];
  const ids = list.map((row) => row.id);
  const [withStudents, taken] = await Promise.all([
    db
      .selectDistinct({ sectionId: enrolments.sectionId })
      .from(enrolments)
      .innerJoin(students, eq(students.id, enrolments.studentId))
      .where(and(inArray(enrolments.sectionId, ids), eq(students.status, 'active'), isNull(students.deletedAt))),
    db.selectDistinct({ sectionId: attendance.sectionId }).from(attendance).where(and(inArray(attendance.sectionId, ids), eq(attendance.day, day))),
  ]);
  const has = new Set(withStudents.map((row) => row.sectionId));
  const done = new Set(taken.map((row) => row.sectionId));
  return list.filter((row) => has.has(row.id) && !done.has(row.id));
}

/** For the overview tile: % present today across the sections already marked. */
export async function presentToday(today = todayIST()) {
  const db = await getDb();
  const rows = await db.select({ status: attendance.status, n: countInt() }).from(attendance).where(eq(attendance.day, today)).groupBy(attendance.status);
  const marked = rows.reduce((sum, row) => sum + row.n, 0);
  const present = rows.filter((row) => COUNTS_PRESENT.includes(row.status)).reduce((sum, row) => sum + row.n, 0);
  const [{ n: sectionsMarked }] = await db.select({ n: sql<number>`count(distinct ${attendance.sectionId})::int` }).from(attendance).where(eq(attendance.day, today));
  return { marked, present, absent: marked - present, percent: percentOf(present, marked), sectionsMarked };
}

export const LETTER: Record<AttendanceStatus, string> = { present: 'P', absent: 'A', late: 'L', leave: 'LV' };

/** A section's month: students down the side, days across, with totals. */
export async function monthlyRegister(session: Session, input: { sectionId: string; month: string }) {
  assertSchool(session);
  const db = await getDb();
  const section = await loadSection(input.sectionId, db);
  await assertSectionAccess(session, section.id, db);
  const today = todayIST();
  const month = input.month <= periodOf(today) ? input.month : periodOf(today);
  const days = daysOf(month, today);
  const from = `${month}-01`;
  const to = days[days.length - 1] ?? from;
  const [roll, marks, holidays] = await Promise.all([
    rollOf(section.id, db),
    days.length
      ? db
          .select({ studentId: attendance.studentId, day: attendance.day, status: attendance.status })
          .from(attendance)
          .where(and(eq(attendance.sectionId, section.id), gte(attendance.day, from), lte(attendance.day, to)))
      : Promise.resolve([] as { studentId: string; day: string; status: AttendanceStatus }[]),
    holidaysBetween(from, to, db),
  ]);
  const key = (studentId: string, day: string) => `${studentId}:${day}`;
  const status = new Map(marks.map((row) => [key(row.studentId, row.day), row.status]));
  const marked = new Set(marks.map((row) => row.studentId));
  const openDays = new Set(marks.map((row) => row.day));
  const rows = roll
    .filter((row) => row.status === 'active' || marked.has(row.studentId))
    .map((row) => {
      const cells = days.map((day) => status.get(key(row.studentId, day)) ?? null);
      const total = { present: 0, absent: 0, late: 0, leave: 0 };
      for (const cell of cells) if (cell) total[cell]++;
      const counted = total.present + total.absent + total.late + total.leave;
      return { studentId: row.studentId, name: row.name, nameBn: row.nameBn, rollNo: row.rollNo, active: row.status === 'active', cells, ...total, percent: percentOf(total.present + total.late, counted) };
    });
  return { section, month, days, rows, holidays, openDays: openDays.size };
}

export type AttendanceSummary = { present: number; absent: number; late: number; leave: number; days: number; percent: number | null };

/**
 * A student's attendance between two days (both included): for the parents'
 * corner and the report card. It checks nothing about who asks, so the
 * caller must first make sure this login may see this student.
 */
export async function getAttendanceSummary(studentId: string, from: string, to: string, db?: DbOrTx): Promise<AttendanceSummary> {
  const conn = db ?? (await getDb());
  const rows = await conn
    .select({ status: attendance.status, n: countInt() })
    .from(attendance)
    .where(and(eq(attendance.studentId, uuid.parse(studentId)), gte(attendance.day, dayField.parse(from)), lte(attendance.day, dayField.parse(to))))
    .groupBy(attendance.status);
  const out = { present: 0, absent: 0, late: 0, leave: 0 };
  for (const row of rows) out[row.status] = row.n;
  const days = out.present + out.absent + out.late + out.leave;
  return { ...out, days, percent: percentOf(out.present + out.late, days) };
}
