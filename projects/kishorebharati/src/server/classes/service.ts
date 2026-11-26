/**
 * Classes and subjects: the school years, the sections of a year, the
 * subjects, and who teaches which subject in which section. Office only;
 * teachers see the result through their own screens.
 */
import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { SHIFTS, STREAMS, academicYears, enrolments, sections, staff, students, subjects, teachingAssignments, type Section, type Subject } from '@/db/schema';
import { SCHOOL, hasStreams } from '@/config/school';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { day, optionalUuid, requiredText, text, uuid } from '@/lib/validators';
import { countInt } from '../admin/shared';
import { assertOffice, currentYear } from '../school/access';
import { isUniqueViolation, sectionsOfYear } from '../students/shared';

/* ───────────── school years ───────────── */

export async function listYears(session: Session) {
  assertOffice(session);
  const db = await getDb();
  const rows = await db.select().from(academicYears).orderBy(asc(academicYears.startsOn));
  const counts = await db.select({ yearId: sections.yearId, n: countInt() }).from(sections).groupBy(sections.yearId);
  const byYear = new Map(counts.map((row) => [row.yearId, row.n]));
  return rows.map((row) => ({ ...row, sections: byYear.get(row.id) ?? 0 }));
}

const yearInput = z
  .object({
    name: requiredText('Name', 20),
    startsOn: day,
    endsOn: day,
    /** Copy the sections, class teachers and subject teachers of the current year. */
    copySections: z.boolean().default(true),
  })
  .refine((value) => value.endsOn > value.startsOn, { message: 'The year must end after it starts', path: ['endsOn'] });

export async function createYear(session: Session, input: z.input<typeof yearInput>) {
  assertOffice(session);
  const data = yearInput.parse(input);
  const db = await getDb();
  const row = await db.transaction(async (tx) => {
    const [taken] = await tx.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.name, data.name)).limit(1);
    if (taken) throw new ApiError(400, 'A year with this name is already there', { name: 'Already there' });
    const source = data.copySections ? await currentYear(tx).catch(() => null) : null;
    const [year] = await tx.insert(academicYears).values({ name: data.name, startsOn: data.startsOn, endsOn: data.endsOn, isCurrent: false }).returning();
    if (source) {
      const old = await tx.select().from(sections).where(eq(sections.yearId, source.id));
      for (const section of old) {
        const [copy] = await tx
          .insert(sections)
          .values({ yearId: year.id, grade: section.grade, name: section.name, shift: section.shift, stream: section.stream, classTeacherId: section.classTeacherId, room: section.room, capacity: section.capacity })
          .returning({ id: sections.id });
        const taught = await tx.select().from(teachingAssignments).where(eq(teachingAssignments.sectionId, section.id));
        if (taught.length) await tx.insert(teachingAssignments).values(taught.map((row) => ({ sectionId: copy.id, subjectId: row.subjectId, staffId: row.staffId })));
      }
    }
    return year;
  });
  await audit(session, 'year.create', { entity: 'year', entityId: row.id, summary: `Added the school year ${row.name}` });
  return row;
}

/** The year every screen works in. Set it once the year-end promotion is done. */
export async function setCurrentYear(session: Session, id: string) {
  assertOffice(session);
  const db = await getDb();
  const [year] = await db.select().from(academicYears).where(eq(academicYears.id, uuid.parse(id))).limit(1);
  if (!year) throw new ApiError(404, 'Year not found');
  await db.transaction(async (tx) => {
    await tx.update(academicYears).set({ isCurrent: false }).where(ne(academicYears.id, year.id));
    await tx.update(academicYears).set({ isCurrent: true }).where(eq(academicYears.id, year.id));
  });
  await audit(session, 'year.current', { entity: 'year', entityId: year.id, summary: `Made ${year.name} the current school year` });
}

/* ───────────── sections ───────────── */

/** Sections of a year with the class teacher's name and the number of students on roll. */
export async function listSections(session: Session, yearId: string) {
  assertOffice(session);
  const db = await getDb();
  const rows = await sectionsOfYear(db, yearId);
  const counts = rows.length
    ? await db
        .select({ sectionId: enrolments.sectionId, n: countInt() })
        .from(enrolments)
        .innerJoin(students, eq(students.id, enrolments.studentId))
        .where(and(inArray(enrolments.sectionId, rows.map((row) => row.id)), eq(students.status, 'active'), isNull(students.deletedAt)))
        .groupBy(enrolments.sectionId)
    : [];
  const bySection = new Map(counts.map((row) => [row.sectionId, row.n]));
  const teachers = await teachingStaff(db);
  const teacherName = new Map(teachers.map((row) => [row.id, row.name]));
  return rows.map((row) => ({ ...row, students: bySection.get(row.id) ?? 0, classTeacher: row.classTeacherId ? (teacherName.get(row.classTeacherId) ?? '') : '' }));
}

const sectionInput = z.object({
  yearId: uuid,
  grade: z.coerce.number().int(),
  name: requiredText('Section', 10).transform((value) => value.toUpperCase()),
  stream: z.enum(STREAMS).default(''),
  shift: z.enum(SHIFTS).default(SCHOOL.shifts[0]),
  classTeacherId: optionalUuid,
  room: text(40),
  capacity: z.coerce.number({ invalid_type_error: 'Enter a number' }).int().min(1, 'Enter a number').max(200),
});

export async function saveSection(session: Session, id: string | null, input: z.input<typeof sectionInput>) {
  assertOffice(session);
  const data = sectionInput.parse(input);
  if (!SCHOOL.grades.includes(data.grade)) throw new ApiError(400, 'Choose the class', { grade: 'Choose the class' });
  if (hasStreams(data.grade) && !data.stream) throw new ApiError(400, 'Choose the stream', { stream: 'Choose the stream' });
  if (!hasStreams(data.grade)) data.stream = '';
  if (!SCHOOL.shifts.includes(data.shift)) data.shift = SCHOOL.shifts[0];
  const db = await getDb();
  const [year] = await db.select().from(academicYears).where(eq(academicYears.id, data.yearId)).limit(1);
  if (!year) throw new ApiError(404, 'Year not found');
  if (data.classTeacherId) {
    const [teacher] = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, data.classTeacherId), eq(staff.kind, 'teaching'), isNull(staff.deletedAt))).limit(1);
    if (!teacher) throw new ApiError(400, 'Choose a teacher', { classTeacherId: 'Choose a teacher' });
  }
  let row: Section;
  try {
    if (id) {
      const [found] = await db.select().from(sections).where(eq(sections.id, uuid.parse(id))).limit(1);
      if (!found) throw new ApiError(404, 'Class not found');
      // A section keeps its year; its students stay with it.
      [row] = await db.update(sections).set({ ...data, yearId: found.yearId }).where(eq(sections.id, found.id)).returning();
    } else {
      [row] = await db.insert(sections).values(data).returning();
    }
  } catch (error) {
    if (isUniqueViolation(error)) throw new ApiError(400, 'This section is already there for this year', { name: 'Already there' });
    throw error;
  }
  await audit(session, id ? 'section.update' : 'section.create', { entity: 'section', entityId: row.id, summary: `${id ? 'Changed' : 'Added'} Class ${row.grade} ${row.stream} ${row.name} for ${year.name}`.replace(/\s+/g, ' ') });
  return row;
}

/** Only an empty section can go; one with students is kept for their records. */
export async function deleteSection(session: Session, id: string) {
  assertOffice(session);
  const db = await getDb();
  const [section] = await db.select().from(sections).where(eq(sections.id, uuid.parse(id))).limit(1);
  if (!section) throw new ApiError(404, 'Class not found');
  const [{ n }] = await db.select({ n: countInt() }).from(enrolments).where(eq(enrolments.sectionId, section.id));
  if (n > 0) throw new ApiError(400, 'This section has students. Move them first.');
  await db.delete(sections).where(eq(sections.id, section.id));
  await audit(session, 'section.delete', { entity: 'section', entityId: section.id, summary: `Removed the empty section Class ${section.grade} ${section.name}` });
}

/* ───────────── subjects ───────────── */

export async function listSubjects(session: Session) {
  assertOffice(session);
  const db = await getDb();
  return db.select().from(subjects).orderBy(asc(subjects.sort), asc(subjects.name));
}

const subjectInput = z
  .object({
    name: requiredText('Name', 80),
    nameBn: text(80),
    code: text(20),
    fromGrade: z.coerce.number().int(),
    toGrade: z.coerce.number().int(),
    stream: z.enum(STREAMS).default(''),
    optional: z.boolean().default(false),
    sort: z.coerce.number().int().min(0).max(999).default(0),
  })
  .refine((value) => value.toGrade >= value.fromGrade, { message: 'The last class cannot be below the first', path: ['toGrade'] });

export async function saveSubject(session: Session, id: string | null, input: z.input<typeof subjectInput>) {
  assertOffice(session);
  const data = subjectInput.parse(input);
  if (!SCHOOL.grades.includes(data.fromGrade) || !SCHOOL.grades.includes(data.toGrade)) throw new ApiError(400, 'Choose the class');
  // A stream only makes sense where the classes have streams.
  if (data.stream && !(hasStreams(data.fromGrade) && hasStreams(data.toGrade))) throw new ApiError(400, 'A stream subject must be in classes with streams', { stream: 'Only for classes with streams' });
  const db = await getDb();
  let row: Subject;
  if (id) {
    [row] = await db.update(subjects).set(data).where(eq(subjects.id, uuid.parse(id))).returning();
    if (!row) throw new ApiError(404, 'Subject not found');
  } else {
    [row] = await db.insert(subjects).values(data).returning();
  }
  await audit(session, id ? 'subject.update' : 'subject.create', { entity: 'subject', entityId: row.id, summary: `${id ? 'Changed' : 'Added'} the subject ${row.name}` });
  return row;
}

/** A subject no longer taught is switched off, not deleted: old marks still point to it. */
export async function setSubjectActive(session: Session, id: string, active: boolean) {
  assertOffice(session);
  const db = await getDb();
  const [row] = await db.update(subjects).set({ active }).where(eq(subjects.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Subject not found');
  await audit(session, active ? 'subject.activate' : 'subject.deactivate', { entity: 'subject', entityId: row.id, summary: `${active ? 'Switched on' : 'Switched off'} the subject ${row.name}` });
}

/** The subjects taught in a section: its class is in range and the stream fits. */
export const subjectsFor = (all: Subject[], section: Pick<Section, 'grade' | 'stream'>) =>
  all.filter((subject) => subject.active && subject.fromGrade <= section.grade && subject.toGrade >= section.grade && (!subject.stream || subject.stream === section.stream));

/* ───────────── who teaches what ───────────── */

/** Teachers on the staff list who are still with the school, for pickers. */
export async function teachingStaff(db?: DbOrTx) {
  const conn = db ?? (await getDb());
  return conn
    .select({ id: staff.id, name: staff.name, nameBn: staff.nameBn, subjects: staff.subjects })
    .from(staff)
    .where(and(eq(staff.kind, 'teaching'), eq(staff.active, true), isNull(staff.deletedAt)))
    .orderBy(asc(staff.sort), asc(staff.name));
}

export async function listAssignments(session: Session, sectionId: string) {
  assertOffice(session);
  const db = await getDb();
  const [section] = await db.select().from(sections).where(eq(sections.id, uuid.parse(sectionId))).limit(1);
  if (!section) throw new ApiError(404, 'Class not found');
  const [all, rows] = await Promise.all([
    db.select().from(subjects).orderBy(asc(subjects.sort), asc(subjects.name)),
    db.select().from(teachingAssignments).where(eq(teachingAssignments.sectionId, section.id)),
  ]);
  const teacherOf = new Map(rows.map((row) => [row.subjectId, row.staffId]));
  return { section, rows: subjectsFor(all, section).map((subject) => ({ subject, staffId: teacherOf.get(subject.id) ?? '' })) };
}

const assignmentInput = z.object({ sectionId: uuid, subjectId: uuid, staffId: optionalUuid });

/** Sets (or clears, with no teacher) who teaches a subject in a section. */
export async function setAssignment(session: Session, input: z.input<typeof assignmentInput>) {
  assertOffice(session);
  const data = assignmentInput.parse(input);
  const db = await getDb();
  const [section] = await db.select().from(sections).where(eq(sections.id, data.sectionId)).limit(1);
  const [subject] = await db.select().from(subjects).where(eq(subjects.id, data.subjectId)).limit(1);
  if (!section) throw new ApiError(404, 'Class not found');
  if (!subject || !subjectsFor([subject], section).length) throw new ApiError(400, 'This subject is not taught in this class');
  if (data.staffId) {
    const teachers = await teachingStaff(db);
    if (!teachers.some((row) => row.id === data.staffId)) throw new ApiError(400, 'Choose a teacher');
    await db
      .insert(teachingAssignments)
      .values({ sectionId: section.id, subjectId: subject.id, staffId: data.staffId })
      .onConflictDoUpdate({ target: [teachingAssignments.sectionId, teachingAssignments.subjectId], set: { staffId: data.staffId } });
  } else {
    await db.delete(teachingAssignments).where(and(eq(teachingAssignments.sectionId, section.id), eq(teachingAssignments.subjectId, subject.id)));
  }
  await audit(session, 'teaching.set', { entity: 'section', entityId: section.id, summary: `${data.staffId ? 'Set' : 'Cleared'} the teacher of ${subject.name} in Class ${section.grade} ${section.name}` });
}
