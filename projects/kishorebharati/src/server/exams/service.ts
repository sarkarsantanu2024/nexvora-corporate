/**
 * Exams, marks and results.
 *
 *   draft      the office sets the exam up: classes, dates, papers.
 *   open       teachers enter marks for the subjects they teach; the office for any.
 *   published  results are final: parents see them and marks are locked.
 *              The head of school can take the results back (with a reason in
 *              the activity log) to correct a mark.
 *
 * Who does what: the office (admin, staff) sets up exams and papers, opens an
 * exam and enters any marks; only the head of school (admin) publishes,
 * unpublishes, deletes an exam and changes the grading scale. A teacher
 * enters marks only for a subject they teach in that section, and the class
 * teacher also sees the whole section's results and report cards.
 *
 * Remarks of the class teacher live in the settings table under
 * `remarks:<examId>` as { studentId: text }, because exams and enrolments
 * have no column for them.
 */
import { and, asc, eq, gte, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { SCHOOL, hasStreams, sectionLabel } from '@/config/school';
import { getDb, type DbOrTx } from '@/db';
import {
  academicYears,
  auditLog,
  enrolments,
  examPapers,
  exams,
  marks,
  sections,
  settings,
  staff,
  students,
  subjects,
  teachingAssignments,
  type Exam,
  type ExamStatus,
  type Section,
  type Stream,
} from '@/db/schema';
import type { Translate } from '@/i18n/ui';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { planAllows } from '@/lib/plans';
import type { Session } from '@/lib/session-token';
import { optionalDay, requiredText, text, uuid } from '@/lib/validators';
import { assertAdmin, countInt, getSetting, putSetting } from '../admin/shared';
import { getAttendanceSummary, type AttendanceSummary } from '../attendance/service';
import { getPlatform } from '../platform';
import { assertOffice, assertSchool, assertSubjectAccess, currentYear, isOffice, teacherScope } from '../school/access';
import { computeResults, type GradeBand, type StudentResult } from './grading';

/* ───────────── small helpers ───────────── */

export type PaperRow = {
  id: string;
  examId: string;
  grade: number;
  subjectId: string;
  fullMarks: number;
  passMarks: number;
  examDate: string | null;
  subjectName: string;
  subjectNameBn: string;
  subjectStream: Stream;
  subjectOptional: boolean;
  subjectSort: number;
};

export type SectionStudent = { id: string; name: string; nameBn: string; admissionNo: string; fatherName: string; rollNo: number };

const parseId = (id: string, notFound: string) => {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ApiError(404, notFound);
  return parsed.data;
};

async function loadExam(conn: DbOrTx, id: string): Promise<Exam> {
  const [row] = await conn.select().from(exams).where(eq(exams.id, parseId(id, 'Exam not found'))).limit(1);
  if (!row) throw new ApiError(404, 'Exam not found');
  return row;
}

async function loadSection(conn: DbOrTx, id: string): Promise<Section> {
  const [row] = await conn.select().from(sections).where(eq(sections.id, parseId(id, 'Class not found'))).limit(1);
  if (!row) throw new ApiError(404, 'Class not found');
  return row;
}

const paperColumns = {
  id: examPapers.id,
  examId: examPapers.examId,
  grade: examPapers.grade,
  subjectId: examPapers.subjectId,
  fullMarks: examPapers.fullMarks,
  passMarks: examPapers.passMarks,
  examDate: examPapers.examDate,
  subjectName: subjects.name,
  subjectNameBn: subjects.nameBn,
  subjectStream: subjects.stream,
  subjectOptional: subjects.optional,
  subjectSort: subjects.sort,
};

async function papersOf(conn: DbOrTx, examIds: string[]): Promise<PaperRow[]> {
  if (!examIds.length) return [];
  const rows = await conn.select(paperColumns).from(examPapers).innerJoin(subjects, eq(subjects.id, examPapers.subjectId)).where(inArray(examPapers.examId, examIds));
  return rows.sort((a, b) => a.grade - b.grade || a.subjectSort - b.subjectSort || a.subjectName.localeCompare(b.subjectName));
}

async function loadPaper(conn: DbOrTx, id: string): Promise<PaperRow> {
  const [row] = await conn
    .select(paperColumns)
    .from(examPapers)
    .innerJoin(subjects, eq(subjects.id, examPapers.subjectId))
    .where(eq(examPapers.id, parseId(id, 'Paper not found')))
    .limit(1);
  if (!row) throw new ApiError(404, 'Paper not found');
  return row;
}

/** A paper belongs to a section when it is for that class and its subject is for that stream (or every stream). */
export const paperFitsSection = (paper: Pick<PaperRow, 'grade' | 'subjectStream'>, section: Pick<Section, 'grade' | 'stream'>) =>
  paper.grade === section.grade && (paper.subjectStream === '' || paper.subjectStream === section.stream);

const sectionInExam = (section: Section, exam: Exam) => section.yearId === exam.yearId && section.grade >= exam.fromGrade && section.grade <= exam.toGrade;

const sortSections = (rows: Section[]) =>
  rows.sort((a, b) => a.grade - b.grade || a.shift.localeCompare(b.shift) || a.stream.localeCompare(b.stream) || a.name.localeCompare(b.name));

async function sectionsOfExam(conn: DbOrTx, exam: Exam): Promise<Section[]> {
  const rows = await conn
    .select()
    .from(sections)
    .where(and(eq(sections.yearId, exam.yearId), gte(sections.grade, exam.fromGrade), lte(sections.grade, exam.toGrade)));
  return sortSections(rows);
}

/** Students on the roll of a section, by roll number. Students who left or are in the Trash are not counted. */
const onRoll = and(isNull(students.deletedAt), ne(students.status, 'left'));

export async function sectionStudents(conn: DbOrTx, sectionId: string): Promise<SectionStudent[]> {
  return conn
    .select({ id: students.id, name: students.name, nameBn: students.nameBn, admissionNo: students.admissionNo, fatherName: students.fatherName, rollNo: enrolments.rollNo })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .where(and(eq(enrolments.sectionId, sectionId), onRoll))
    .orderBy(asc(enrolments.rollNo));
}

const hasEntry = or(sql`${marks.marks} is not null`, eq(marks.absent, true));

async function assertNotLocked(exam: Exam) {
  if (exam.status === 'published') throw new ApiError(400, 'Results are published. Marks are locked.');
}

/** May this login see the whole section's results and report cards? The office and the class teacher may. */
async function assertSectionResults(session: Session, section: Section, conn: DbOrTx) {
  assertSchool(session);
  if (isOffice(session)) return;
  const scope = await teacherScope(session, section.yearId, conn);
  if (!scope?.classTeacherOf.includes(section.id)) throw new ApiError(403, 'Only the class teacher and the office can see the whole class');
}

/* ───────────── grading scale ───────────── */

export async function getGradeScale(conn?: DbOrTx): Promise<GradeBand[]> {
  return (await getSetting('grading', conn)).scale;
}

const scaleInput = z
  .array(z.object({ grade: requiredText('Grade', 4), min: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole numbers only').min(0).max(100) }))
  .min(2, 'Give at least two grades')
  .max(12)
  .refine((rows) => rows.some((row) => row.min === 0), 'One grade must start at 0')
  .refine((rows) => new Set(rows.map((row) => row.min)).size === rows.length, 'Two grades start at the same percentage')
  .refine((rows) => new Set(rows.map((row) => row.grade.toUpperCase())).size === rows.length, 'Two grades have the same letter');

export async function saveGradeScale(session: Session, input: unknown) {
  assertAdmin(session);
  const scale = scaleInput.parse(input).sort((a, b) => b.min - a.min);
  await putSetting('grading', { scale });
  await audit(session, 'exam.grading', { entity: 'settings', entityId: 'grading', summary: `Grading scale changed: ${scale.map((row) => `${row.grade} ${row.min}+`).join(', ')}` });
  return scale;
}

/* ───────────── remarks ───────────── */

const remarksKey = (examId: string) => `remarks:${examId}`;

async function readRemarks(conn: DbOrTx, examIds: string[]): Promise<Map<string, Record<string, string>>> {
  const out = new Map<string, Record<string, string>>();
  if (!examIds.length) return out;
  const rows = await conn.select().from(settings).where(inArray(settings.key, examIds.map(remarksKey)));
  for (const row of rows) {
    const value = row.value && typeof row.value === 'object' ? (row.value as Record<string, string>) : {};
    out.set(row.key.slice('remarks:'.length), value);
  }
  return out;
}

export async function saveRemark(session: Session, examId: string, studentId: string, remark: string) {
  const db = await getDb();
  const exam = await loadExam(db, examId);
  const body = text(300).parse(remark);
  const [enrolment] = await db
    .select({ sectionId: enrolments.sectionId })
    .from(enrolments)
    .where(and(eq(enrolments.studentId, parseId(studentId, 'Student not found')), eq(enrolments.yearId, exam.yearId)))
    .limit(1);
  if (!enrolment) throw new ApiError(404, 'Student not found');
  await assertSectionResults(session, await loadSection(db, enrolment.sectionId), db);
  await db.transaction(async (tx) => {
    const current = (await readRemarks(tx, [exam.id])).get(exam.id) ?? {};
    const next = { ...current };
    if (body) next[studentId] = body;
    else delete next[studentId];
    await tx
      .insert(settings)
      .values({ key: remarksKey(exam.id), value: next })
      .onConflictDoUpdate({ target: settings.key, set: { value: next, updatedAt: new Date() } });
  });
  await audit(session, 'exam.remark', { entity: 'exam', entityId: exam.id, summary: `Remark for a student in ${exam.name} ${body ? 'saved' : 'removed'}` });
}

/* ───────────── exams ───────────── */

const gradeNo = z.coerce.number({ invalid_type_error: 'Choose a class' }).int().refine((grade) => SCHOOL.grades.includes(grade), 'Choose a class');

export const examInput = z
  .object({
    name: requiredText('Name', 80),
    fromGrade: gradeNo,
    toGrade: gradeNo,
    startsOn: optionalDay,
    endsOn: optionalDay,
    sort: z.coerce.number().int().min(0).max(999).default(0),
  })
  .refine((value) => value.fromGrade <= value.toGrade, { message: 'The last class cannot be below the first', path: ['toGrade'] })
  .refine((value) => !value.startsOn || !value.endsOn || value.startsOn <= value.endsOn, { message: 'The last day cannot be before the first', path: ['endsOn'] });
export type ExamInput = z.input<typeof examInput>;

/** The current year's exams, in order. Teachers do not see exams still being set up. */
export async function listExams(session: Session) {
  assertSchool(session);
  const db = await getDb();
  const year = await currentYear(db);
  const rows = await db.select().from(exams).where(eq(exams.yearId, year.id)).orderBy(asc(exams.sort), asc(exams.startsOn), asc(exams.createdAt));
  const visible = isOffice(session) ? rows : rows.filter((row) => row.status !== 'draft');
  const paperCounts = visible.length
    ? await db.select({ examId: examPapers.examId, n: countInt() }).from(examPapers).where(inArray(examPapers.examId, visible.map((row) => row.id))).groupBy(examPapers.examId)
    : [];
  const countOf = new Map(paperCounts.map((row) => [row.examId, row.n]));
  const progress = new Map<string, { done: number; total: number }>();
  for (const exam of visible.filter((row) => row.status === 'open')) {
    const cells = await examProgress(db, exam);
    progress.set(exam.id, { done: cells.filter((cell) => cell.complete).length, total: cells.length });
  }
  return { year, exams: visible.map((exam) => ({ ...exam, papers: countOf.get(exam.id) ?? 0, progress: progress.get(exam.id) ?? null })) };
}

export async function getExam(session: Session, id: string) {
  assertOffice(session);
  const db = await getDb();
  const exam = await loadExam(db, id);
  const [papers, examSections] = await Promise.all([papersOf(db, [exam.id]), sectionsOfExam(db, exam)]);
  return { exam, papers, sections: examSections };
}

export async function createExam(session: Session, input: ExamInput) {
  assertOffice(session);
  const data = examInput.parse(input);
  const db = await getDb();
  const year = await currentYear(db);
  const [row] = await db.insert(exams).values({ ...data, yearId: year.id }).returning();
  await audit(session, 'exam.create', { entity: 'exam', entityId: row.id, summary: `Added the exam ${row.name} (${year.name})` });
  return row;
}

export async function updateExam(session: Session, id: string, input: ExamInput) {
  assertOffice(session);
  const data = examInput.parse(input);
  const db = await getDb();
  const exam = await loadExam(db, id);
  await db.transaction(async (tx) => {
    if (data.fromGrade !== exam.fromGrade || data.toGrade !== exam.toGrade) {
      await assertNotLocked(exam);
      // Papers of classes taken out of the exam go too, unless marks were entered for them.
      const outside = (await papersOf(tx, [exam.id])).filter((paper) => paper.grade < data.fromGrade || paper.grade > data.toGrade);
      if (outside.length) {
        const [{ n }] = await tx.select({ n: countInt() }).from(marks).where(inArray(marks.paperId, outside.map((paper) => paper.id)));
        if (n > 0) throw new ApiError(400, 'Marks are already entered for a class you are taking out');
        await tx.delete(examPapers).where(inArray(examPapers.id, outside.map((paper) => paper.id)));
      }
    }
    await tx.update(exams).set(data).where(eq(exams.id, exam.id));
  });
  await audit(session, 'exam.update', { entity: 'exam', entityId: exam.id, summary: `Changed the exam ${data.name}` });
}

export async function deleteExam(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const exam = await loadExam(db, id);
  const papers = await papersOf(db, [exam.id]);
  if (papers.length) {
    const [{ n }] = await db.select({ n: countInt() }).from(marks).where(inArray(marks.paperId, papers.map((paper) => paper.id)));
    if (n > 0) throw new ApiError(400, 'This exam has marks. It cannot be deleted.');
  }
  await db.delete(exams).where(eq(exams.id, exam.id));
  await audit(session, 'exam.delete', { entity: 'exam', entityId: exam.id, summary: `Deleted the exam ${exam.name}` });
}

/**
 * Moves an exam along. Opening needs papers; publishing and taking results
 * back are for the head of school only, and taking them back needs a reason.
 */
export async function setExamStatus(session: Session, id: string, status: ExamStatus, reason = '') {
  assertOffice(session);
  const db = await getDb();
  const exam = await loadExam(db, id);
  if (exam.status === status) return exam;
  const why = text(300).parse(reason);
  const move = `${exam.status}>${status}`;
  if (move === 'draft>open') {
    const [{ n }] = await db.select({ n: countInt() }).from(examPapers).where(eq(examPapers.examId, exam.id));
    if (!n) throw new ApiError(400, 'Set up the papers first');
  } else if (move === 'open>published') {
    assertAdmin(session);
  } else if (move === 'published>open') {
    assertAdmin(session);
    if (!why) throw new ApiError(400, 'Write why the results are taken back', { reason: 'Write why the results are taken back' });
  } else if (move !== 'open>draft') {
    throw new ApiError(400, 'This change is not possible');
  }
  const [row] = await db.update(exams).set({ status }).where(eq(exams.id, exam.id)).returning();
  const summary =
    move === 'published>open'
      ? `Took back the results of ${exam.name} for correction. Reason: ${why}`
      : move === 'open>published'
        ? `Published the results of ${exam.name}`
        : move === 'draft>open'
          ? `Opened ${exam.name} for marks`
          : `Closed ${exam.name} for marks (back to draft)`;
  await audit(session, move === 'published>open' ? 'exam.unpublish' : `exam.${status}`, { entity: 'exam', entityId: exam.id, summary, meta: why ? { reason: why } : {} });
  return row;
}

/* ───────────── papers ───────────── */

const marksPair = z
  .object({
    fullMarks: z.coerce.number({ invalid_type_error: 'Enter the full marks' }).int('Whole marks only').min(1, 'Full marks must be at least 1').max(1000),
    passMarks: z.coerce.number({ invalid_type_error: 'Enter the pass marks' }).int('Whole marks only').min(0).max(1000),
  })
  .refine((value) => value.passMarks <= value.fullMarks, { message: 'Pass marks cannot be more than the full marks', path: ['passMarks'] });

export const setupInput = z
  .object({
    fullMarks: z.coerce.number().int().min(1).max(1000).default(100),
    passMarks: z.coerce.number().int().min(0).max(1000).default(25),
    /** Classes with streams (11 and 12) can have their own default. */
    hsFullMarks: z.coerce.number().int().min(1).max(1000).default(100),
    hsPassMarks: z.coerce.number().int().min(0).max(1000).default(30),
  })
  .refine((value) => value.passMarks <= value.fullMarks, { message: 'Pass marks cannot be more than the full marks', path: ['passMarks'] })
  .refine((value) => value.hsPassMarks <= value.hsFullMarks, { message: 'Pass marks cannot be more than the full marks', path: ['hsPassMarks'] });

/**
 * Adds a paper for every subject taught in every class of the exam that does
 * not have one yet. Papers already there (and their marks) are kept, so it
 * is safe to run again after adding a subject.
 */
export async function setupPapers(session: Session, examId: string, input: z.input<typeof setupInput>) {
  assertOffice(session);
  const data = setupInput.parse(input);
  const db = await getDb();
  const exam = await loadExam(db, examId);
  await assertNotLocked(exam);
  const subjectRows = await db.select().from(subjects).where(eq(subjects.active, true));
  const values: (typeof examPapers.$inferInsert)[] = [];
  for (const grade of SCHOOL.grades.filter((g) => g >= exam.fromGrade && g <= exam.toGrade)) {
    const hs = hasStreams(grade);
    for (const subject of subjectRows) {
      if (grade < subject.fromGrade || grade > subject.toGrade) continue;
      // A stream subject only in classes that have streams; an every-stream subject everywhere.
      if (subject.stream && !hs) continue;
      values.push({ examId: exam.id, grade, subjectId: subject.id, fullMarks: hs ? data.hsFullMarks : data.fullMarks, passMarks: hs ? data.hsPassMarks : data.passMarks });
    }
  }
  const added = values.length ? await db.insert(examPapers).values(values).onConflictDoNothing().returning({ id: examPapers.id }) : [];
  await audit(session, 'exam.papers', { entity: 'exam', entityId: exam.id, summary: `Set up ${added.length} papers for ${exam.name}` });
  return { added: added.length };
}

export const paperInput = z.intersection(marksPair, z.object({ examDate: optionalDay }));

export async function updatePaper(session: Session, paperId: string, input: { fullMarks: number | string; passMarks: number | string; examDate?: string | null }) {
  assertOffice(session);
  const data = paperInput.parse(input);
  const db = await getDb();
  const paper = await loadPaper(db, paperId);
  const exam = await loadExam(db, paper.examId);
  await assertNotLocked(exam);
  const [{ top }] = await db.select({ top: sql<number | null>`max(${marks.marks})` }).from(marks).where(eq(marks.paperId, paper.id));
  if (top !== null && top > data.fullMarks) throw new ApiError(400, 'A student already has more marks than this', { fullMarks: 'A student already has more marks than this' });
  await db.update(examPapers).set(data).where(eq(examPapers.id, paper.id));
  await audit(session, 'exam.paper', { entity: 'exam', entityId: exam.id, summary: `${exam.name}: Class ${paper.grade} ${paper.subjectName} set to ${data.fullMarks} full, ${data.passMarks} pass` });
}

export async function deletePaper(session: Session, paperId: string) {
  assertOffice(session);
  const db = await getDb();
  const paper = await loadPaper(db, paperId);
  const exam = await loadExam(db, paper.examId);
  await assertNotLocked(exam);
  const [{ n }] = await db.select({ n: countInt() }).from(marks).where(eq(marks.paperId, paper.id));
  if (n > 0) throw new ApiError(400, 'This paper has marks. It cannot be removed.');
  await db.delete(examPapers).where(eq(examPapers.id, paper.id));
  await audit(session, 'exam.paper.delete', { entity: 'exam', entityId: exam.id, summary: `${exam.name}: removed the Class ${paper.grade} ${paper.subjectName} paper` });
}

/* ───────────── progress ───────────── */

export type ProgressCell = { sectionId: string; paperId: string; subjectId: string; entered: number; total: number; complete: boolean };

/**
 * For every section and paper of an exam: how many students have marks (or
 * are marked absent) out of how many on the roll. A paper of an optional
 * subject counts as done once anyone has marks, since not every boy takes it.
 */
export async function examProgress(conn: DbOrTx, exam: Exam): Promise<ProgressCell[]> {
  const [examSections, papers] = await Promise.all([sectionsOfExam(conn, exam), papersOf(conn, [exam.id])]);
  if (!examSections.length || !papers.length) return [];
  const sectionIds = examSections.map((row) => row.id);
  const [rollCounts, markCounts] = await Promise.all([
    conn
      .select({ sectionId: enrolments.sectionId, n: countInt() })
      .from(enrolments)
      .innerJoin(students, eq(students.id, enrolments.studentId))
      .where(and(inArray(enrolments.sectionId, sectionIds), onRoll))
      .groupBy(enrolments.sectionId),
    conn
      .select({ paperId: marks.paperId, sectionId: enrolments.sectionId, n: countInt() })
      .from(marks)
      .innerJoin(enrolments, and(eq(enrolments.studentId, marks.studentId), eq(enrolments.yearId, exam.yearId)))
      .innerJoin(students, eq(students.id, marks.studentId))
      .where(and(inArray(marks.paperId, papers.map((paper) => paper.id)), inArray(enrolments.sectionId, sectionIds), hasEntry, onRoll))
      .groupBy(marks.paperId, enrolments.sectionId),
  ]);
  const roll = new Map(rollCounts.map((row) => [row.sectionId, row.n]));
  const entered = new Map(markCounts.map((row) => [`${row.paperId}:${row.sectionId}`, row.n]));
  const out: ProgressCell[] = [];
  for (const section of examSections) {
    const total = roll.get(section.id) ?? 0;
    if (!total) continue;
    for (const paper of papers.filter((row) => paperFitsSection(row, section))) {
      const n = entered.get(`${paper.id}:${section.id}`) ?? 0;
      out.push({ sectionId: section.id, paperId: paper.id, subjectId: paper.subjectId, entered: n, total, complete: n >= total || (paper.subjectOptional && n > 0) });
    }
  }
  return out;
}

/** The office's view of an open exam: every section, every paper, how far the marks are and who teaches it. */
export async function getProgress(session: Session, examId: string) {
  assertOffice(session);
  const db = await getDb();
  const exam = await loadExam(db, examId);
  const [cells, examSections, papers] = await Promise.all([examProgress(db, exam), sectionsOfExam(db, exam), papersOf(db, [exam.id])]);
  const sectionIds = examSections.map((row) => row.id);
  const teachers = sectionIds.length
    ? await db
        .select({ sectionId: teachingAssignments.sectionId, subjectId: teachingAssignments.subjectId, name: staff.name })
        .from(teachingAssignments)
        .innerJoin(staff, eq(staff.id, teachingAssignments.staffId))
        .where(inArray(teachingAssignments.sectionId, sectionIds))
    : [];
  const teacherOf = new Map(teachers.map((row) => [`${row.sectionId}:${row.subjectId}`, row.name]));
  const paperById = new Map(papers.map((paper) => [paper.id, paper]));
  return {
    exam,
    sections: examSections
      .map((section) => ({
        section,
        cells: cells
          .filter((cell) => cell.sectionId === section.id)
          .map((cell) => ({ ...cell, paper: paperById.get(cell.paperId)!, teacher: teacherOf.get(`${section.id}:${cell.subjectId}`) ?? '' })),
      }))
      .filter((row) => row.cells.length),
  };
}

/* ───────────── marks entry ───────────── */

/**
 * What the marks screen offers this login: the open exams, the sections of
 * the chosen exam it may enter marks for, and that section's papers.
 */
export async function marksChoices(session: Session, choice: { exam?: string; section?: string }) {
  assertSchool(session);
  const db = await getDb();
  const year = await currentYear(db);
  const open = await db.select().from(exams).where(and(eq(exams.yearId, year.id), eq(exams.status, 'open'))).orderBy(asc(exams.sort), asc(exams.startsOn));
  const exam = open.find((row) => row.id === choice.exam) ?? open[0] ?? null;
  if (!exam) return { exams: open, exam: null, sections: [], section: null, papers: [] };
  const scope = await teacherScope(session, year.id, db);
  const allPapers = await papersOf(db, [exam.id]);
  const mine = (await sectionsOfExam(db, exam)).filter((section) => !scope || (scope.subjectsBySection.get(section.id)?.length ?? 0) > 0);
  const section = mine.find((row) => row.id === choice.section) ?? mine[0] ?? null;
  if (!section) return { exams: open, exam, sections: mine, section: null, papers: [] };
  const cells = new Map((await examProgress(db, exam)).filter((cell) => cell.sectionId === section.id).map((cell) => [cell.paperId, cell]));
  const papers = allPapers
    .filter((paper) => paperFitsSection(paper, section) && (!scope || scope.subjectsBySection.get(section.id)?.includes(paper.subjectId)))
    .map((paper) => ({ ...paper, entered: cells.get(paper.id)?.entered ?? 0, total: cells.get(paper.id)?.total ?? 0 }));
  return { exams: open, exam, sections: mine, section, papers };
}

async function checkPaperSection(conn: DbOrTx, paperId: string, sectionId: string) {
  const paper = await loadPaper(conn, paperId);
  const [exam, section] = await Promise.all([loadExam(conn, paper.examId), loadSection(conn, sectionId)]);
  if (!sectionInExam(section, exam) || !paperFitsSection(paper, section)) throw new ApiError(400, 'This paper is not for this class');
  return { paper, exam, section };
}

/** One paper for one section: the roll with each boy's marks. */
export async function getMarksSheet(session: Session, paperId: string, sectionId: string) {
  assertSchool(session);
  const db = await getDb();
  const { paper, exam, section } = await checkPaperSection(db, paperId, sectionId);
  await assertSubjectAccess(session, section.id, paper.subjectId, db);
  const roll = await sectionStudents(db, section.id);
  const rows = roll.length
    ? await db
        .select({ studentId: marks.studentId, marks: marks.marks, absent: marks.absent })
        .from(marks)
        .where(and(eq(marks.paperId, paper.id), inArray(marks.studentId, roll.map((row) => row.id))))
    : [];
  const byStudent = new Map(rows.map((row) => [row.studentId, row]));
  return {
    exam,
    section,
    paper,
    locked: exam.status !== 'open',
    students: roll.map((student) => ({ ...student, marks: byStudent.get(student.id)?.marks ?? null, absent: byStudent.get(student.id)?.absent ?? false })),
  };
}

const entriesInput = z
  .array(
    z.object({
      studentId: uuid,
      marks: z.number({ invalid_type_error: 'Enter a number' }).int('Whole marks only').min(0, 'Marks cannot be below 0').nullable(),
      absent: z.boolean(),
    }),
  )
  .max(500);
export type MarkEntry = z.infer<typeof entriesInput>[number];

/** An activity log line per person per paper per half hour, not one per autosave. */
const AUDIT_GAP_MS = 30 * 60 * 1000;

/**
 * Saves marks for some or all boys of a section in one paper. A blank,
 * not-absent entry clears the mark. Everything is checked before anything is
 * written, so a refused save changes nothing.
 */
export async function saveMarks(session: Session, paperId: string, sectionId: string, input: MarkEntry[]) {
  assertSchool(session);
  const entries = entriesInput.parse(input);
  const db = await getDb();
  const { paper, exam, section } = await checkPaperSection(db, paperId, sectionId);
  if (exam.status === 'draft') throw new ApiError(400, 'This exam is not open for marks yet');
  await assertNotLocked(exam);
  await assertSubjectAccess(session, section.id, paper.subjectId, db);

  const onSection = new Set((await sectionStudents(db, section.id)).map((row) => row.id));
  const over: Record<string, string> = {};
  for (const entry of entries) {
    if (!onSection.has(entry.studentId)) throw new ApiError(400, 'This student is not in this class');
    if (!entry.absent && entry.marks !== null && entry.marks > paper.fullMarks) over[entry.studentId] = 'More than the full marks';
  }
  if (Object.keys(over).length) throw new ApiError(400, 'Marks cannot be more than the full marks', over);

  await db.transaction(async (tx) => {
    for (const entry of entries) {
      if (!entry.absent && entry.marks === null) {
        await tx.delete(marks).where(and(eq(marks.paperId, paper.id), eq(marks.studentId, entry.studentId)));
        continue;
      }
      const value = { marks: entry.absent ? null : entry.marks, absent: entry.absent, enteredBy: session.uid, updatedAt: new Date() };
      await tx
        .insert(marks)
        .values({ paperId: paper.id, studentId: entry.studentId, ...value })
        .onConflictDoUpdate({ target: [marks.paperId, marks.studentId], set: value });
    }
  });

  const entityId = `${paper.id}:${section.id}`;
  const [recent] = await db
    .select({ id: auditLog.id })
    .from(auditLog)
    .where(and(eq(auditLog.action, 'exam.marks'), eq(auditLog.entityId, entityId), eq(auditLog.userId, session.uid), gte(auditLog.createdAt, new Date(Date.now() - AUDIT_GAP_MS))))
    .limit(1);
  if (!recent) {
    await audit(session, 'exam.marks', { entity: 'marks', entityId, summary: `Entered ${paper.subjectName} marks of ${sectionLabel(section)} in ${exam.name}` });
  }
  return { saved: entries.length };
}

/* ───────────── results ───────────── */

/** One exam's result for one section: the papers of that section and every boy's result. */
async function sectionExamResult(conn: DbOrTx, exam: Exam, section: Section, papers: PaperRow[], roll: SectionStudent[], scale: GradeBand[]) {
  const ownPapers = papers.filter((paper) => paper.examId === exam.id && paperFitsSection(paper, section));
  const markRows =
    ownPapers.length && roll.length
      ? await conn
          .select({ paperId: marks.paperId, studentId: marks.studentId, marks: marks.marks, absent: marks.absent })
          .from(marks)
          .where(and(inArray(marks.paperId, ownPapers.map((paper) => paper.id)), inArray(marks.studentId, roll.map((row) => row.id))))
      : [];
  const { results, highest } = computeResults(ownPapers, roll.map((row) => row.id), markRows, scale);
  return { papers: ownPapers, results, highest, ranked: results.filter((row) => row.rank !== null).length };
}

/** The office and the class teacher: the whole section's results of one exam. */
export async function getSectionResults(session: Session, examId: string, sectionId: string) {
  assertSchool(session);
  const db = await getDb();
  const [exam, section] = await Promise.all([loadExam(db, examId), loadSection(db, sectionId)]);
  if (!sectionInExam(section, exam)) throw new ApiError(400, 'This class does not sit this exam');
  if (exam.status === 'draft' && !isOffice(session)) throw new ApiError(403, 'You do not have access to this');
  await assertSectionResults(session, section, db);
  const [papers, roll, scale, remarks] = await Promise.all([papersOf(db, [exam.id]), sectionStudents(db, section.id), getGradeScale(db), readRemarks(db, [exam.id])]);
  const result = await sectionExamResult(db, exam, section, papers, roll, scale);
  const byStudent = new Map(result.results.map((row) => [row.studentId, row]));
  return {
    exam,
    section,
    papers: result.papers,
    highest: result.highest,
    scale,
    rows: roll.map((student) => ({ student, result: byStudent.get(student.id)!, remark: remarks.get(exam.id)?.[student.id] ?? '' })),
  };
}

/** The sections whose whole results this login may open for an exam: all for the office, own class for a class teacher. */
export async function resultSections(session: Session, examId: string) {
  assertSchool(session);
  const db = await getDb();
  const exam = await loadExam(db, examId);
  const all = await sectionsOfExam(db, exam);
  const scope = await teacherScope(session, exam.yearId, db);
  return { exam, sections: scope ? all.filter((row) => scope.classTeacherOf.includes(row.id)) : all };
}

/* ───────────── report cards ───────────── */

export type ReportCard = {
  student: SectionStudent;
  /** One column per published exam of the year. */
  exams: { id: string; name: string; result: StudentResult; ranked: number }[];
  /** Days present (late counts as present) out of the days the register was taken this year. */
  attendance: AttendanceSummary | null;
  remark: string;
};

/**
 * Report cards for a section (or one boy in it): every published exam of the
 * year side by side, subject by subject.
 */
export async function getReportCards(session: Session, sectionId: string, studentId?: string) {
  assertSchool(session);
  const db = await getDb();
  const section = await loadSection(db, sectionId);
  await assertSectionResults(session, section, db);
  const [year] = await db.select().from(academicYears).where(eq(academicYears.id, section.yearId)).limit(1);
  const yearExams = (
    await db
      .select()
      .from(exams)
      .where(and(eq(exams.yearId, section.yearId), eq(exams.status, 'published'), lte(exams.fromGrade, section.grade), gte(exams.toGrade, section.grade)))
  ).sort((a, b) => a.sort - b.sort || (a.startsOn ?? '').localeCompare(b.startsOn ?? ''));
  let roll = await sectionStudents(db, section.id);
  if (studentId) {
    roll = roll.filter((row) => row.id === studentId);
    if (!roll.length) throw new ApiError(404, 'Student not found');
  }
  const [papers, scale, remarks, presence, school] = await Promise.all([
    papersOf(db, yearExams.map((exam) => exam.id)),
    getGradeScale(db),
    readRemarks(db, yearExams.map((exam) => exam.id)),
    Promise.all(roll.map((row) => getAttendanceSummary(row.id, year.startsOn, year.endsOn, db))),
    getSetting('school', db),
  ]);
  // Ranks are within the whole section, so work each exam out for everyone even when one card is asked for.
  const everyone = studentId ? await sectionStudents(db, section.id) : roll;
  const perExam = await Promise.all(yearExams.map((exam) => sectionExamResult(db, exam, section, papers, everyone, scale)));
  const ownPapers = perExam.flatMap((row) => row.papers);
  const subjectsShown = [...new Map(ownPapers.map((paper) => [paper.subjectId, { id: paper.subjectId, name: paper.subjectName, nameBn: paper.subjectNameBn, sort: paper.subjectSort }])).values()].sort(
    (a, b) => a.sort - b.sort,
  );
  const [teacher] = section.classTeacherId ? await db.select({ name: staff.name }).from(staff).where(eq(staff.id, section.classTeacherId)).limit(1) : [];
  const cards: ReportCard[] = roll.map((student, index) => {
    const latestRemark = [...yearExams].reverse().map((exam) => remarks.get(exam.id)?.[student.id] ?? '').find(Boolean) ?? '';
    return {
      student,
      exams: yearExams.map((exam, i) => ({
        id: exam.id,
        name: exam.name,
        result: perExam[i].results.find((row) => row.studentId === student.id)!,
        ranked: perExam[i].ranked,
      })),
      attendance: presence[index] ?? null,
      remark: latestRemark,
    };
  });
  return { section, year, school, scale, classTeacher: teacher?.name ?? '', exams: yearExams, papers: ownPapers, subjects: subjectsShown, cards };
}

/** Sections whose report cards this login may print: every section of the year for the office, own class for a class teacher. */
export async function reportCardSections(session: Session) {
  assertSchool(session);
  const db = await getDb();
  const year = await currentYear(db);
  const all = sortSections(await db.select().from(sections).where(eq(sections.yearId, year.id)));
  const scope = await teacherScope(session, year.id, db);
  return scope ? all.filter((row) => scope.classTeacherOf.includes(row.id)) : all;
}

/* ───────────── parents' corner ───────────── */

export type PublishedResult = {
  examId: string;
  name: string;
  year: string;
  startsOn: string | null;
  section: Section;
  papers: { subjectId: string; subjectName: string; subjectNameBn: string; fullMarks: number; passMarks: number; marks: number | null; absent: boolean; passed: boolean; grade: string; highest: number | null }[];
  total: number;
  full: number;
  percent: number | null;
  grade: string;
  passed: boolean;
  rank: number | null;
  /** How many boys of the section were ranked. */
  outOf: number;
  remark: string;
};

/**
 * Every published result of one student, newest year first. For the parents'
 * corner: the caller must already have checked that this login may see this
 * student (see getResultsForParent).
 */
export async function listPublishedResults(studentId: string, conn?: DbOrTx): Promise<PublishedResult[]> {
  const db = conn ?? (await getDb());
  const id = parseId(studentId, 'Student not found');
  const places = await db
    .select({ section: sections, yearName: academicYears.name, yearStart: academicYears.startsOn })
    .from(enrolments)
    .innerJoin(sections, eq(sections.id, enrolments.sectionId))
    .innerJoin(academicYears, eq(academicYears.id, enrolments.yearId))
    .where(eq(enrolments.studentId, id));
  places.sort((a, b) => b.yearStart.localeCompare(a.yearStart));
  const scale = await getGradeScale(db);
  const out: PublishedResult[] = [];
  for (const place of places) {
    const section = place.section;
    const yearExams = (
      await db
        .select()
        .from(exams)
        .where(and(eq(exams.yearId, section.yearId), eq(exams.status, 'published'), lte(exams.fromGrade, section.grade), gte(exams.toGrade, section.grade)))
    ).sort((a, b) => a.sort - b.sort || (a.startsOn ?? '').localeCompare(b.startsOn ?? ''));
    if (!yearExams.length) continue;
    const [papers, roll, remarks] = await Promise.all([papersOf(db, yearExams.map((exam) => exam.id)), sectionStudents(db, section.id), readRemarks(db, yearExams.map((exam) => exam.id))]);
    for (const exam of yearExams) {
      const result = await sectionExamResult(db, exam, section, papers, roll, scale);
      const own = result.results.find((row) => row.studentId === id);
      if (!own || own.papers.size === 0) continue;
      out.push({
        examId: exam.id,
        name: exam.name,
        year: place.yearName,
        startsOn: exam.startsOn,
        section,
        papers: result.papers
          .filter((paper) => own.papers.has(paper.id))
          .map((paper) => {
            const entry = own.papers.get(paper.id)!;
            return {
              subjectId: paper.subjectId,
              subjectName: paper.subjectName,
              subjectNameBn: paper.subjectNameBn,
              fullMarks: paper.fullMarks,
              passMarks: paper.passMarks,
              marks: entry.marks,
              absent: entry.absent,
              passed: entry.passed,
              grade: entry.grade,
              highest: result.highest.get(paper.id) ?? null,
            };
          }),
        total: own.total,
        full: own.full,
        percent: own.percent,
        grade: own.grade,
        passed: own.passed,
        rank: own.rank,
        outOf: result.ranked,
        remark: remarks.get(exam.id)?.[id] ?? '',
      });
    }
  }
  return out;
}

/** The parent's own child only. */
export async function getResultsForParent(session: Session, studentId: string) {
  if (session.role !== 'parent') throw new ApiError(403, 'You do not have access to this');
  const db = await getDb();
  const [own] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, parseId(studentId, 'Student not found')), eq(students.parentUserId, session.uid), isNull(students.deletedAt)))
    .limit(1);
  if (!own) throw new ApiError(404, 'Student not found');
  return listPublishedResults(own.id, db);
}

/* ───────────── the bell ───────────── */

/** The language the bell is being worked out in; t() is all a notification source is given. */
const langOf = (t: Translate): 'en' | 'bn' => (t('__lang') === 'bn' ? 'bn' : 'en');

const MAX_TEACHER_LINES = 6;

/**
 * Teachers: one line per paper of theirs still short of marks while an exam
 * is open. Office: one line per open exam with the number of section papers
 * still short of marks.
 */
export async function examNotifications(session: Session, t: Translate) {
  if (session.role !== 'admin' && session.role !== 'staff' && session.role !== 'teacher') return [];
  if (!planAllows((await getPlatform()).plan, 'platinum')) return [];
  const db = await getDb();
  let year;
  try {
    year = await currentYear(db);
  } catch {
    return [];
  }
  const open = await db.select().from(exams).where(and(eq(exams.yearId, year.id), eq(exams.status, 'open'))).orderBy(asc(exams.sort));
  if (!open.length) return [];
  const lang = langOf(t);
  const out: { id: string; kind: 'task'; tone: 'amber'; title: string; text?: string; href: string }[] = [];

  if (isOffice(session)) {
    for (const exam of open) {
      const short = (await examProgress(db, exam)).filter((cell) => !cell.complete).length;
      if (!short) continue;
      out.push({
        id: `exam-papers-${exam.id}-${short}`,
        kind: 'task',
        tone: 'amber',
        title: t('Exam {name}: {n} papers without marks', { name: exam.name, n: short }),
        text: t('See who has not entered them'),
        href: `/admin/exams/${exam.id}`,
      });
    }
    return out;
  }

  const scope = await teacherScope(session, year.id, db);
  if (!scope || !scope.subjectsBySection.size) return [];
  const sectionRows = await db.select().from(sections).where(inArray(sections.id, [...scope.subjectsBySection.keys()]));
  const sectionById = new Map(sectionRows.map((row) => [row.id, row]));
  for (const exam of open) {
    const cells = (await examProgress(db, exam)).filter((cell) => !cell.complete && scope.subjectsBySection.get(cell.sectionId)?.includes(cell.subjectId));
    if (!cells.length) continue;
    const papers = new Map((await papersOf(db, [exam.id])).map((paper) => [paper.id, paper]));
    for (const cell of cells) {
      if (out.length >= MAX_TEACHER_LINES) break;
      const section = sectionById.get(cell.sectionId);
      const paper = papers.get(cell.paperId);
      if (!section || !paper) continue;
      out.push({
        id: `exam-marks-${cell.paperId}-${cell.sectionId}-${cell.entered}`,
        kind: 'task',
        tone: 'amber',
        title: t('Marks to enter: {exam} {section} {subject}', {
          exam: exam.name,
          section: sectionLabel(section, lang),
          subject: lang === 'bn' && paper.subjectNameBn ? paper.subjectNameBn : paper.subjectName,
        }),
        text: t('{entered} of {total} entered', { entered: cell.entered, total: cell.total }),
        href: `/admin/exams/marks?exam=${exam.id}&section=${cell.sectionId}&paper=${cell.paperId}`,
      });
    }
  }
  return out;
}
