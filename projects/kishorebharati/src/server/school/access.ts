/**
 * Who may see which part of the school. Every school service uses these, so
 * the rule lives in one place:
 *
 *  - the office (admin, staff) sees every section;
 *  - a teacher sees the sections they are class teacher of, plus the sections
 *    where they teach a subject (teaching_assignments). For marks and the
 *    diary, a teacher may write only for the subjects they teach there;
 *    class teachers may also take the register of their own section.
 *  - a parent sees only the students linked to their login.
 *
 * The section a teacher asks for always comes from the browser, so it is
 * checked here on the server every time.
 */
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { getDb, type DbOrTx } from '@/db';
import { academicYears, sections, staff, students, teachingAssignments, type AcademicYear, type StaffMember } from '@/db/schema';
import { ApiError } from '@/lib/api';
import type { Session } from '@/lib/session-token';

export const isOffice = (session: Session) => session.role === 'admin' || session.role === 'staff';

export function assertOffice(session: Session) {
  if (!isOffice(session)) throw new ApiError(403, 'You do not have access to this');
}

/** Office or teacher: anyone who works in the school. */
export function assertSchool(session: Session) {
  if (!isOffice(session) && session.role !== 'teacher') throw new ApiError(403, 'You do not have access to this');
}

/** The school year marked current (or the latest one). Throws if none exists. */
export async function currentYear(db?: DbOrTx): Promise<AcademicYear> {
  const conn = db ?? (await getDb());
  const [current] = await conn.select().from(academicYears).where(eq(academicYears.isCurrent, true)).limit(1);
  if (current) return current;
  const all = await conn.select().from(academicYears);
  const latest = all.sort((a, b) => b.startsOn.localeCompare(a.startsOn))[0];
  if (!latest) throw new ApiError(400, 'Add a school year first');
  return latest;
}

/** The staff row of a teacher's login, or null. */
export async function staffOf(session: Session, db?: DbOrTx): Promise<StaffMember | null> {
  const conn = db ?? (await getDb());
  const [row] = await conn
    .select()
    .from(staff)
    .where(and(eq(staff.userId, session.uid), isNull(staff.deletedAt)))
    .limit(1);
  return row ?? null;
}

export type TeacherScope = {
  staffId: string;
  /** Sections where this teacher is class teacher. */
  classTeacherOf: string[];
  /** sectionId → subjectIds this teacher teaches there. */
  subjectsBySection: Map<string, string[]>;
  /** Every section the teacher may open. */
  sectionIds: string[];
};

/** What a teacher may see in a year. Office logins get null (no limit). */
export async function teacherScope(session: Session, yearId: string, db?: DbOrTx): Promise<TeacherScope | null> {
  if (isOffice(session)) return null;
  if (session.role !== 'teacher') throw new ApiError(403, 'You do not have access to this');
  const conn = db ?? (await getDb());
  const me = await staffOf(session, conn);
  if (!me) return { staffId: '', classTeacherOf: [], subjectsBySection: new Map(), sectionIds: [] };

  const yearSections = await conn.select({ id: sections.id, classTeacherId: sections.classTeacherId }).from(sections).where(eq(sections.yearId, yearId));
  const yearIds = yearSections.map((row) => row.id);
  const classTeacherOf = yearSections.filter((row) => row.classTeacherId === me.id).map((row) => row.id);
  const taught = yearIds.length
    ? await conn
        .select({ sectionId: teachingAssignments.sectionId, subjectId: teachingAssignments.subjectId })
        .from(teachingAssignments)
        .where(and(eq(teachingAssignments.staffId, me.id), inArray(teachingAssignments.sectionId, yearIds)))
    : [];
  const subjectsBySection = new Map<string, string[]>();
  for (const row of taught) subjectsBySection.set(row.sectionId, [...(subjectsBySection.get(row.sectionId) ?? []), row.subjectId]);
  const sectionIds = [...new Set([...classTeacherOf, ...subjectsBySection.keys()])];
  return { staffId: me.id, classTeacherOf, subjectsBySection, sectionIds };
}

/** Refuse unless this login may open this section. */
export async function assertSectionAccess(session: Session, sectionId: string, db?: DbOrTx) {
  assertSchool(session);
  if (isOffice(session)) return;
  const conn = db ?? (await getDb());
  const [section] = await conn.select({ yearId: sections.yearId }).from(sections).where(eq(sections.id, sectionId)).limit(1);
  if (!section) throw new ApiError(404, 'Class not found');
  const scope = await teacherScope(session, section.yearId, conn);
  if (!scope?.sectionIds.includes(sectionId)) throw new ApiError(403, 'This is not one of your classes');
}

/** May a teacher write marks or diary entries for this subject in this section? Office always may. */
export async function assertSubjectAccess(session: Session, sectionId: string, subjectId: string, db?: DbOrTx) {
  assertSchool(session);
  if (isOffice(session)) return;
  const conn = db ?? (await getDb());
  const [section] = await conn.select({ yearId: sections.yearId }).from(sections).where(eq(sections.id, sectionId)).limit(1);
  if (!section) throw new ApiError(404, 'Class not found');
  const scope = await teacherScope(session, section.yearId, conn);
  if (!scope?.subjectsBySection.get(sectionId)?.includes(subjectId)) throw new ApiError(403, 'You do not teach this subject in this class');
}

/** The students a parent login may see (not deleted). */
export async function parentStudentIds(session: Session, db?: DbOrTx): Promise<string[]> {
  if (session.role !== 'parent') throw new ApiError(403, 'You do not have access to this');
  const conn = db ?? (await getDb());
  const rows = await conn
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.parentUserId, session.uid), isNull(students.deletedAt)));
  return rows.map((row) => row.id);
}
