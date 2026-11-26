/**
 * Students: the admission register, one student's record, leaving and coming
 * back, the Trash, a spreadsheet import and the parent login.
 *
 * Who may do what:
 *  - the office (admin, staff) sees and changes every student;
 *  - a teacher sees, read-only, the students of their own sections this year;
 *  - only an admin moves a student to the Trash.
 *
 * A student's class is not on the student: it is the enrolment of the year
 * (section and roll number), one row per student per year.
 */
import { and, asc, desc, eq, ilike, inArray, isNull, max, ne, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import {
  CATEGORIES,
  GENDERS,
  STUDENT_STATUSES,
  academicYears,
  certificates,
  enrolments,
  sections,
  studentBenefits,
  students,
  users,
  type Student,
  type StudentStatus,
} from '@/db/schema';
import { SCHOOL, hasStreams } from '@/config/school';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { hashPassword } from '@/lib/auth';
import { sheetDate } from '@/lib/csv';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day, optionalDay, optionalEmail, optionalPhone, password, requiredText, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, getSetting, pageOf, putSetting } from '../admin/shared';
import { runImport, type ImportResult } from '../import';
import { assertOffice, assertSchool, currentYear, isOffice, teacherScope } from '../school/access';
import { BLOOD_GROUPS, formatAdmissionNo } from './constants';
import { bySection, isUniqueViolation, nextNumber, sectionsOfYear } from './shared';

/** A student in the Trash is left out of every list, count and screen. */
export const studentNotTrashed = isNull(students.deletedAt);

const isStatus = (value: unknown): value is StudentStatus => (STUDENT_STATUSES as readonly string[]).includes(value as string);

/* ───────────── list ───────────── */

export type StudentFilters = { q?: string; grade?: string; section?: string; status?: string; phone?: string; page?: string | number };

const listColumns = {
  id: students.id,
  admissionNo: students.admissionNo,
  name: students.name,
  nameBn: students.nameBn,
  photo: students.photo,
  gender: students.gender,
  dob: students.dob,
  fatherName: students.fatherName,
  motherName: students.motherName,
  guardianName: students.guardianName,
  phone: students.phone,
  altPhone: students.altPhone,
  address: students.address,
  category: students.category,
  religion: students.religion,
  bloodGroup: students.bloodGroup,
  portalId: students.portalId,
  admittedOn: students.admittedOn,
  status: students.status,
  leftOn: students.leftOn,
  sectionId: enrolments.sectionId,
  rollNo: enrolments.rollNo,
  grade: sections.grade,
  sectionName: sections.name,
  stream: sections.stream,
  shift: sections.shift,
};

/** The conditions of the list and the export; null when a teacher has no section at all. */
async function listWhere(session: Session, db: DbOrTx, yearId: string, filters: StudentFilters): Promise<SQL | null> {
  const conds: (SQL | undefined)[] = [studentNotTrashed];
  // No status chosen shows the students on roll; 'all' shows everyone.
  if (filters.status !== 'all') conds.push(eq(students.status, isStatus(filters.status) ? filters.status : 'active'));
  const term = filters.q?.trim();
  if (term) {
    const pattern = `%${term}%`;
    conds.push(
      or(
        ilike(students.name, pattern),
        ilike(students.nameBn, pattern),
        ilike(students.admissionNo, pattern),
        ilike(students.phone, pattern),
        ilike(students.altPhone, pattern),
        ilike(students.fatherName, pattern),
        ilike(students.portalId, pattern),
      ),
    );
  }
  if (filters.section && uuid.safeParse(filters.section).success) conds.push(eq(enrolments.sectionId, filters.section));
  const grade = Number(filters.grade);
  if (filters.grade && Number.isInteger(grade)) conds.push(eq(sections.grade, grade));
  if (filters.phone === 'none') conds.push(eq(students.phone, ''));
  const scope = await teacherScope(session, yearId, db);
  if (scope) {
    if (!scope.sectionIds.length) return null;
    conds.push(inArray(enrolments.sectionId, scope.sectionIds));
  }
  return and(...conds) as SQL;
}

function listQuery(db: DbOrTx, yearId: string) {
  return db
    .select(listColumns)
    .from(students)
    .leftJoin(enrolments, and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, yearId)))
    .leftJoin(sections, eq(sections.id, enrolments.sectionId));
}

export type StudentListRow = Awaited<ReturnType<typeof listStudents>>['rows'][number];

export async function listStudents(session: Session, filters: StudentFilters = {}) {
  assertSchool(session);
  const db = await getDb();
  const year = await currentYear(db);
  const page = pageOf(filters.page);
  const where = await listWhere(session, db, year.id, filters);
  if (!where) return { rows: [], total: 0, page, pageSize: PAGE_SIZE, year };
  const [rows, [{ n }]] = await Promise.all([
    listQuery(db, year.id)
      .where(where)
      .orderBy(asc(sections.grade), asc(sections.stream), asc(sections.name), asc(enrolments.rollNo), asc(students.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: countInt() })
      .from(students)
      .leftJoin(enrolments, and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, year.id)))
      .leftJoin(sections, eq(sections.id, enrolments.sectionId))
      .where(where),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE, year };
}

/** Every matching student, for the CSV file. Office only. */
export async function exportStudents(session: Session, filters: StudentFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const where = await listWhere(session, db, year.id, filters);
  if (!where) return [];
  return listQuery(db, year.id)
    .where(where)
    .orderBy(asc(sections.grade), asc(sections.stream), asc(sections.name), asc(enrolments.rollNo), asc(students.name))
    .limit(10_000);
}

/** For the pickers of Certificates and Schemes: up to 12 students by name, admission number or mobile. */
export async function findStudents(session: Session, q: string) {
  assertOffice(session);
  const term = q.trim();
  if (term.length < 2) return [];
  const db = await getDb();
  const year = await currentYear(db);
  const pattern = `%${term}%`;
  return listQuery(db, year.id)
    .where(and(studentNotTrashed, or(ilike(students.name, pattern), ilike(students.nameBn, pattern), ilike(students.admissionNo, pattern), ilike(students.phone, pattern))))
    .orderBy(asc(students.name))
    .limit(12);
}

/** Who is in a section, by roll number (ID cards, bulk scheme entry). A teacher only for their own sections. */
export async function sectionRoster(session: Session, sectionId: string) {
  assertSchool(session);
  const db = await getDb();
  const [section] = await db.select().from(sections).where(eq(sections.id, uuid.parse(sectionId))).limit(1);
  if (!section) throw new ApiError(404, 'Class not found');
  if (!isOffice(session)) {
    const scope = await teacherScope(session, section.yearId, db);
    if (!scope?.sectionIds.includes(section.id)) throw new ApiError(403, 'This is not one of your classes');
  }
  const rows = await db
    .select(listColumns)
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .innerJoin(sections, eq(sections.id, enrolments.sectionId))
    .where(and(eq(enrolments.sectionId, section.id), studentNotTrashed))
    .orderBy(asc(enrolments.rollNo));
  return { section, rows };
}

/** Students by id (ID cards of chosen students), with this year's class. Office only. */
export async function studentsByIds(session: Session, ids: string[]) {
  assertOffice(session);
  const clean = ids.filter((id) => uuid.safeParse(id).success).slice(0, 200);
  if (!clean.length) return [];
  const db = await getDb();
  const year = await currentYear(db);
  return listQuery(db, year.id).where(and(studentNotTrashed, inArray(students.id, clean))).orderBy(asc(sections.grade), asc(sections.name), asc(enrolments.rollNo));
}

/* ───────────── one student ───────────── */

async function loadStudent(db: DbOrTx, id: string): Promise<Student> {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ApiError(404, 'Student not found');
  const [row] = await db.select().from(students).where(and(eq(students.id, parsed.data), studentNotTrashed)).limit(1);
  if (!row) throw new ApiError(404, 'Student not found');
  return row;
}

/** The student with every year, the parent login and brothers on it, and what other modules hold. Null when not found or not this teacher's. */
export async function getStudent(session: Session, id: string) {
  assertSchool(session);
  const db = await getDb();
  let student: Student;
  try {
    student = await loadStudent(db, id);
  } catch {
    return null;
  }
  const year = await currentYear(db);
  const history = await db
    .select({
      enrolmentId: enrolments.id,
      yearId: academicYears.id,
      yearName: academicYears.name,
      yearStarts: academicYears.startsOn,
      sectionId: sections.id,
      grade: sections.grade,
      sectionName: sections.name,
      stream: sections.stream,
      shift: sections.shift,
      rollNo: enrolments.rollNo,
      result: enrolments.result,
    })
    .from(enrolments)
    .innerJoin(academicYears, eq(academicYears.id, enrolments.yearId))
    .innerJoin(sections, eq(sections.id, enrolments.sectionId))
    .where(eq(enrolments.studentId, student.id))
    .orderBy(desc(academicYears.startsOn));
  const current = history.find((row) => row.yearId === year.id) ?? null;

  if (!isOffice(session)) {
    const scope = await teacherScope(session, year.id, db);
    if (!current || !scope?.sectionIds.includes(current.sectionId)) return null;
    return { student, history, current, year, parent: null, siblings: [], certificates: [], benefits: [] };
  }

  const [parent] = student.parentUserId
    ? await db
        .select({ id: users.id, username: users.username, name: users.name, active: users.active, mustChangePassword: users.mustChangePassword, lastLoginAt: users.lastLoginAt })
        .from(users)
        .where(eq(users.id, student.parentUserId))
        .limit(1)
    : [];
  const siblings = student.parentUserId
    ? await db
        .select({ id: students.id, name: students.name, admissionNo: students.admissionNo })
        .from(students)
        .where(and(eq(students.parentUserId, student.parentUserId), ne(students.id, student.id), studentNotTrashed))
    : [];
  const [certs, benefits] = await Promise.all([
    db.select().from(certificates).where(eq(certificates.studentId, student.id)).orderBy(desc(certificates.issuedOn)),
    db.select().from(studentBenefits).where(eq(studentBenefits.studentId, student.id)).orderBy(desc(studentBenefits.year)),
  ]);
  return { student, history, current, year, parent: parent ?? null, siblings, certificates: certs, benefits };
}

/* ───────────── admission and edit ───────────── */

const choose = (message: string) => ({ errorMap: () => ({ message }) });

const studentFields = z.object({
  name: requiredText('Name', 100),
  nameBn: text(100),
  gender: z.enum(GENDERS, choose('Choose')),
  dob: optionalDay,
  photo: text(500),
  fatherName: text(100),
  motherName: text(100),
  guardianName: text(100),
  guardianRelation: text(40),
  phone: optionalPhone,
  altPhone: optionalPhone,
  email: optionalEmail,
  address: text(300),
  category: z.enum(CATEGORIES, choose('Choose')),
  religion: text(40),
  bloodGroup: z.union([z.literal(''), z.enum(BLOOD_GROUPS)]).default(''),
  portalId: text(40),
  admittedOn: optionalDay,
  admissionNo: text(30),
  /** Required at admission; when editing, blank leaves this year's class as it is (a student who passed out has none). */
  sectionId: z.union([z.literal(''), z.string().uuid('Choose the class')]).default(''),
  rollNo: z.union([z.literal(''), z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Enter a number').min(1, 'Enter a number').max(999)]).default(''),
});
export type StudentInput = z.input<typeof studentFields>;

/** A section of the current year, or a field error. */
async function sectionOfCurrentYear(db: DbOrTx, sectionId: string) {
  const year = await currentYear(db);
  const [section] = await db.select().from(sections).where(and(eq(sections.id, sectionId), eq(sections.yearId, year.id))).limit(1);
  if (!section) throw new ApiError(400, 'Choose the class', { sectionId: 'Choose the class' });
  return { year, section };
}

/** The roll number asked for, if free, or the next free one when left blank. */
async function rollFor(db: DbOrTx, sectionId: string, asked: number | '', exceptStudentId?: string): Promise<number> {
  if (asked !== '') {
    const [taken] = await db
      .select({ studentId: enrolments.studentId })
      .from(enrolments)
      .where(and(eq(enrolments.sectionId, sectionId), eq(enrolments.rollNo, asked)))
      .limit(1);
    if (taken && taken.studentId !== exceptStudentId) throw new ApiError(400, 'This roll number is taken in this class', { rollNo: 'Taken in this class' });
    return asked;
  }
  const [row] = await db.select({ top: max(enrolments.rollNo) }).from(enrolments).where(eq(enrolments.sectionId, sectionId));
  return (row?.top ?? 0) + 1;
}

async function assertAdmissionNoFree(db: DbOrTx, admissionNo: string, exceptId?: string) {
  const [taken] = await db.select({ id: students.id }).from(students).where(eq(students.admissionNo, admissionNo)).limit(1);
  if (taken && taken.id !== exceptId) throw new ApiError(400, 'This admission number is already used', { admissionNo: 'Already used' });
}

/** The next admission number in the school's format, skipping any already used. */
async function nextAdmissionNo(db: DbOrTx, yearName: string): Promise<string> {
  const { admissionFormat } = await getSetting('students', db);
  for (let tries = 0; tries < 50; tries++) {
    const candidate = formatAdmissionNo(admissionFormat, await nextNumber(db, 'admission'), yearName);
    const [taken] = await db.select({ id: students.id }).from(students).where(eq(students.admissionNo, candidate)).limit(1);
    if (!taken) return candidate;
  }
  throw new ApiError(400, 'Type the admission number', { admissionNo: 'Type the admission number' });
}

function studentValues(data: z.output<typeof studentFields>) {
  const { admissionNo: _no, sectionId: _section, rollNo: _roll, ...rest } = data;
  return rest;
}

/** A new admission: the student and this year's place in a class, in one go. */
export async function admitStudent(session: Session, input: StudentInput) {
  assertOffice(session);
  const data = studentFields.parse(input);
  const db = await getDb();
  const row = await db.transaction(async (tx) => {
    if (!data.sectionId) throw new ApiError(400, 'Choose the class', { sectionId: 'Choose the class' });
    const { year, section } = await sectionOfCurrentYear(tx, data.sectionId);
    const admissionNo = data.admissionNo || (await nextAdmissionNo(tx, year.name));
    await assertAdmissionNoFree(tx, admissionNo);
    const rollNo = await rollFor(tx, section.id, data.rollNo);
    const [student] = await tx
      .insert(students)
      .values({ ...studentValues(data), admissionNo, admittedOn: data.admittedOn ?? todayIST(), admittedGrade: section.grade })
      .returning();
    await tx.insert(enrolments).values({ yearId: year.id, studentId: student.id, sectionId: section.id, rollNo });
    return student;
  });
  await audit(session, 'student.admit', { entity: 'student', entityId: row.id, summary: `Admitted ${row.name} (${row.admissionNo})` });
  return { id: row.id, admissionNo: row.admissionNo };
}

/** Changes the details, and this year's class and roll number when they change. */
export async function updateStudent(session: Session, id: string, input: StudentInput) {
  assertOffice(session);
  const data = studentFields.parse(input);
  const db = await getDb();
  const row = await db.transaction(async (tx) => {
    const student = await loadStudent(tx, id);
    const admissionNo = data.admissionNo || student.admissionNo;
    await assertAdmissionNoFree(tx, admissionNo, student.id);
    if (data.sectionId) {
      const { year, section } = await sectionOfCurrentYear(tx, data.sectionId);
      const [place] = await tx.select().from(enrolments).where(and(eq(enrolments.studentId, student.id), eq(enrolments.yearId, year.id))).limit(1);
      if (!place || place.sectionId !== section.id || (data.rollNo !== '' && data.rollNo !== place.rollNo)) {
        const rollNo = await rollFor(tx, section.id, data.rollNo === '' && place?.sectionId === section.id ? place.rollNo : data.rollNo, student.id);
        if (place) await tx.update(enrolments).set({ sectionId: section.id, rollNo }).where(eq(enrolments.id, place.id));
        else await tx.insert(enrolments).values({ yearId: year.id, studentId: student.id, sectionId: section.id, rollNo });
      }
    }
    const [saved] = await tx
      .update(students)
      .set({ ...studentValues(data), admissionNo, updatedAt: new Date() })
      .where(eq(students.id, student.id))
      .returning();
    return saved;
  });
  await audit(session, 'student.update', { entity: 'student', entityId: row.id, summary: `Updated the record of ${row.name}` });
  return { id: row.id };
}

export async function setStudentPhoto(session: Session, id: string, photo: string) {
  assertOffice(session);
  const url = text(500).parse(photo);
  const db = await getDb();
  const student = await loadStudent(db, id);
  await db.update(students).set({ photo: url, updatedAt: new Date() }).where(eq(students.id, student.id));
  await audit(session, 'student.photo', { entity: 'student', entityId: student.id, summary: `Changed the photo of ${student.name}` });
}

const leftInput = z.object({ leftOn: day, reason: requiredText('Reason', 200) });

/** A student who leaves keeps every record; the list shows them under "Left". */
export async function markStudentLeft(session: Session, id: string, input: z.input<typeof leftInput>) {
  assertOffice(session);
  const data = leftInput.parse(input);
  const db = await getDb();
  const student = await loadStudent(db, id);
  if (student.status === 'left') throw new ApiError(400, 'Already marked as left');
  await db.update(students).set({ status: 'left', leftOn: data.leftOn, leftReason: data.reason, updatedAt: new Date() }).where(eq(students.id, student.id));
  await audit(session, 'student.left', { entity: 'student', entityId: student.id, summary: `Marked ${student.name} as left: ${data.reason}` });
}

/** Back on roll, after being marked left or passed out by mistake (or coming back). */
export async function markStudentBack(session: Session, id: string) {
  assertOffice(session);
  const db = await getDb();
  const student = await loadStudent(db, id);
  if (student.status === 'active') throw new ApiError(400, 'Already on roll');
  await db.update(students).set({ status: 'active', leftOn: null, leftReason: '', updatedAt: new Date() }).where(eq(students.id, student.id));
  await audit(session, 'student.back', { entity: 'student', entityId: student.id, summary: `Brought ${student.name} back on roll` });
}

/** Only for a wrong entry: a real student who leaves is marked left. An admin can bring it back from the Trash. */
export async function trashStudent(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const student = await loadStudent(db, id);
  await db.update(students).set({ deletedAt: new Date() }).where(eq(students.id, student.id));
  await audit(session, 'student.delete', { entity: 'student', entityId: student.id, summary: `Moved the record of ${student.name} to the Trash` });
}

/* ───────────── parent login ───────────── */

const parentInput = z.object({ password });

/**
 * The parents' corner login of a student. The username is the guardian's
 * mobile number. If a parent login with that number exists (a brother is
 * already in the school), this student is added to it and its password is
 * set again. Other students with the same mobile number and no login yet
 * are added too, so brothers share one login.
 */
export async function setParentLogin(session: Session, studentId: string, input: z.input<typeof parentInput>) {
  assertOffice(session);
  const data = parentInput.parse(input);
  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const student = await loadStudent(tx, studentId);
    if (!student.phone) throw new ApiError(400, 'Add the guardian mobile number first');
    const hash = await hashPassword(data.password);
    const [existing] = await tx.select().from(users).where(eq(users.username, student.phone)).limit(1);
    let userId: string;
    if (existing) {
      if (existing.role !== 'parent') throw new ApiError(400, 'This mobile number is the username of a staff login. Change the guardian mobile number or that login.');
      await tx.update(users).set({ passwordHash: hash, mustChangePassword: true, active: true, failedLogins: 0, lockedUntil: null }).where(eq(users.id, existing.id));
      userId = existing.id;
    } else {
      const [created] = await tx
        .insert(users)
        .values({ name: student.guardianName || student.fatherName || student.motherName || student.name, username: student.phone, phone: student.phone, passwordHash: hash, role: 'parent', mustChangePassword: true })
        .returning({ id: users.id });
      userId = created.id;
    }
    await tx.update(students).set({ parentUserId: userId, updatedAt: new Date() }).where(eq(students.id, student.id));
    const brothers = await tx
      .update(students)
      .set({ parentUserId: userId, updatedAt: new Date() })
      .where(and(eq(students.phone, student.phone), isNull(students.parentUserId), studentNotTrashed, ne(students.id, student.id)))
      .returning({ id: students.id });
    return { student, username: student.phone, created: !existing, linked: brothers.length };
  });
  await audit(session, result.created ? 'student.parent.create' : 'student.parent.reset', {
    entity: 'student',
    entityId: result.student.id,
    summary: `${result.created ? 'Gave a parent login' : 'Set the parent login password'} (${result.username}) for ${result.student.name}`,
  });
  return { username: result.username, created: result.created, linked: result.linked };
}

/** Takes this student off the parent login (the login stays for the brothers). */
export async function unlinkParent(session: Session, studentId: string) {
  assertOffice(session);
  const db = await getDb();
  const student = await loadStudent(db, studentId);
  if (!student.parentUserId) throw new ApiError(400, 'No parent login yet');
  await db.update(students).set({ parentUserId: null, updatedAt: new Date() }).where(eq(students.id, student.id));
  await audit(session, 'student.parent.unlink', { entity: 'student', entityId: student.id, summary: `Took ${student.name} off the parent login` });
}

/* ───────────── import ───────────── */

const sheetDay = (label: string) =>
  z
    .string()
    .default('')
    .transform((value, ctx) => {
      const parsed = sheetDate(value);
      if (parsed === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label}: not a date` });
        return z.NEVER;
      }
      return parsed || null;
    });

const importRow = z.object({
  admissionNo: text(30),
  name: requiredText('Name', 100),
  nameBn: text(100),
  gender: z
    .string()
    .default('')
    .transform((value) => {
      const v = value.trim().toLowerCase();
      if (['f', 'female', 'girl'].includes(v)) return 'female' as const;
      if (['o', 'other'].includes(v)) return 'other' as const;
      if (['m', 'male', 'boy'].includes(v)) return 'male' as const;
      return SCHOOL.students === 'girls' ? ('female' as const) : ('male' as const);
    }),
  dob: sheetDay('Date of birth'),
  fatherName: text(100),
  motherName: text(100),
  guardianName: text(100),
  phone: optionalPhone,
  altPhone: optionalPhone,
  address: text(300),
  category: z
    .string()
    .default('')
    .transform((value, ctx) => {
      const v = value.trim().toUpperCase().replace(/\s+/g, '');
      if (!v || v === 'GENERAL') return 'GEN' as const;
      const found = CATEGORIES.find((c) => c.replace('-', '') === v.replace('-', ''));
      if (!found) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category must be GEN, SC, ST, OBC-A or OBC-B' });
        return z.NEVER;
      }
      return found;
    }),
  religion: text(40),
  bloodGroup: z
    .string()
    .default('')
    .transform((value) => {
      const v = value.trim().toUpperCase().replace(/\s+/g, '').replace('VE', '').replace('POSITIVE', '+').replace('NEGATIVE', '-');
      return (BLOOD_GROUPS as readonly string[]).includes(v) ? v : '';
    }),
  portalId: text(40),
  admittedOn: sheetDay('Admission date'),
  grade: z.coerce.number({ invalid_type_error: 'Class must be a number' }).int('Class must be a number'),
  section: text(10),
  stream: text(20),
  rollNo: z.union([z.literal(''), z.coerce.number({ invalid_type_error: 'Roll number must be a number' }).int().min(1).max(999)]).default(''),
});

/**
 * Students from a spreadsheet, each placed in a class of the current year by
 * its class number, section letter (A when blank) and, in 11 and 12, stream.
 * A row whose admission number is already used is left out.
 */
export async function importStudents(session: Session, rows: unknown): Promise<ImportResult> {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const yearSections = await sectionsOfYear(db, year.id);
  const result = await runImport(rows, importRow, async (row) => {
    if (!SCHOOL.grades.includes(row.grade)) throw new ApiError(400, `Class ${row.grade} is not taught here`);
    const name = (row.section || 'A').toUpperCase();
    const stream = row.stream.toLowerCase().startsWith('sci') ? 'science' : row.stream.toLowerCase().startsWith('art') ? 'arts' : '';
    const fits = yearSections.filter((s) => s.grade === row.grade && s.name.toUpperCase() === name && (!hasStreams(row.grade) || !stream || s.stream === stream));
    if (fits.length !== 1) throw new ApiError(400, fits.length ? 'Give the stream (Science or Arts)' : `No section ${name} in Class ${row.grade} this year`);
    const section = fits[0];
    await db.transaction(async (tx) => {
      const admissionNo = row.admissionNo || (await nextAdmissionNo(tx, year.name));
      await assertAdmissionNoFree(tx, admissionNo);
      const rollNo = await rollFor(tx, section.id, row.rollNo);
      const { grade: _g, section: _s, stream: _st, rollNo: _r, admissionNo: _a, ...fields } = row;
      const [student] = await tx
        .insert(students)
        .values({ ...fields, admissionNo, admittedGrade: section.grade })
        .returning({ id: students.id });
      await tx.insert(enrolments).values({ yearId: year.id, studentId: student.id, sectionId: section.id, rollNo });
    });
  });
  await audit(session, 'student.import', { entity: 'student', summary: `Imported ${result.added} students from a spreadsheet` });
  return result;
}

/* ───────────── settings and counts ───────────── */

const formatInput = z.object({
  admissionFormat: z
    .string()
    .trim()
    .max(40)
    .refine((value) => value.includes('{n}'), 'Keep {n} in the format'),
});

export async function saveStudentSettings(session: Session, input: z.input<typeof formatInput>) {
  assertAdmin(session);
  const data = formatInput.parse(input);
  await putSetting('students', data);
  await audit(session, 'settings.students', { entity: 'settings', entityId: 'students', summary: 'Changed the admission number format' });
}

/** Students on roll now, for the overview. */
export async function countOnRoll(db?: DbOrTx): Promise<number> {
  const conn = db ?? (await getDb());
  const [row] = await conn.select({ n: countInt() }).from(students).where(and(eq(students.status, 'active'), studentNotTrashed));
  return row.n;
}

/** Sections of the current year with labels' parts, for filters and forms. A teacher gets only their own. */
export async function sectionChoices(session: Session) {
  assertSchool(session);
  const db = await getDb();
  const year = await currentYear(db);
  const all = await sectionsOfYear(db, year.id);
  const scope = await teacherScope(session, year.id, db);
  const rows = scope ? all.filter((s) => scope.sectionIds.includes(s.id)) : all;
  const counts = await db
    .select({ sectionId: enrolments.sectionId, n: countInt(), top: sql<number>`coalesce(max(${enrolments.rollNo}), 0)::int` })
    .from(enrolments)
    .where(eq(enrolments.yearId, year.id))
    .groupBy(enrolments.sectionId);
  const bySectionId = new Map(counts.map((row) => [row.sectionId, row]));
  return {
    year,
    sections: rows.sort(bySection).map((s) => ({ ...s, students: bySectionId.get(s.id)?.n ?? 0, lastRoll: bySectionId.get(s.id)?.top ?? 0 })),
  };
}
