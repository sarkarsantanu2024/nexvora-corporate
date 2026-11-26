/** Pieces the office registers share: their settings, running numbers, and a student's class this year. */
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { SCHOOL } from '@/config/school';
import { getDb, type DbOrTx } from '@/db';
import { counters, enrolments, sections, students } from '@/db/schema';
import { getSetting } from '../admin/shared';
import type { OfficeSettings } from './defaults';

export async function officeSettings(db?: DbOrTx): Promise<OfficeSettings> {
  return getSetting('office', db);
}

/** Classes that get the mid-day meal, as the school teaches them. */
export const mdmGradesOf = (settings: OfficeSettings) => SCHOOL.grades.filter((grade) => settings.mdmGrades.includes(grade));

/** 'HH:MM', 24-hour. */
export const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter the time');
export const optionalClock = z.union([z.literal(''), clock]).default('');

/** The next running number for a key, taken inside the caller's transaction. */
export async function nextNumber(db: DbOrTx, key: string): Promise<number> {
  const [row] = await db
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return row.value;
}

/** The columns a register needs about a student, with his section this school year (null when not enrolled). */
export const studentColumns = {
  studentId: students.id,
  studentName: students.name,
  admissionNo: students.admissionNo,
  grade: sections.grade,
  sectionName: sections.name,
  stream: sections.stream,
  shift: sections.shift,
  sectionId: sections.id,
  rollNo: enrolments.rollNo,
};

/** Join condition: a student's enrolment in this year (use with leftJoin, then leftJoin sections on enrolments.sectionId). */
export const enrolledIn = (yearId: string) => and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, yearId));

/** A student who exists and is not in the Trash, or null. */
export async function liveStudent(id: string, db?: DbOrTx) {
  const conn = db ?? (await getDb());
  const [row] = await conn.select({ id: students.id, name: students.name, deletedAt: students.deletedAt }).from(students).where(eq(students.id, id)).limit(1);
  return row && !row.deletedAt ? row : null;
}
