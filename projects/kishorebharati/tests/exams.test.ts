/**
 * Exams, marks and results against a fresh in-memory database: who may enter
 * which marks, what is refused, how results and ranks come out, and what the
 * head of school alone may do.
 */
import { and, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { makeT } from '@/i18n/ui';
import type { Session } from '@/lib/session-token';
import { createUser } from '@/server/admin/users';
import { computeResults, gradeFor, rankWithTies } from '@/server/exams/grading';
import {
  createExam,
  deleteExam,
  examNotifications,
  getMarksSheet,
  getSectionResults,
  listExams,
  listPublishedResults,
  marksChoices,
  saveGradeScale,
  saveMarks,
  saveRemark,
  setExamStatus,
  setupPapers,
  updatePaper,
  getReportCards,
} from '@/server/exams/service';

let db: DB;
let admin: Session;
let office: Session;
let mathsTeacher: Session;
let classTeacher: Session;
let sectionA: s.Section;
let sectionB: s.Section;
let maths: s.Subject;
let bengali: s.Subject;
let boys: string[] = [];
let examId = '';

const t = makeT(null);

async function teacherLogin(username: string, staffName: string): Promise<{ session: Session; staffId: string }> {
  const user = await createUser(admin, { name: staffName, username, password: 'start123', role: 'teacher' });
  const [row] = await db.update(s.staff).set({ userId: user.id }).where(eq(s.staff.name, staffName)).returning();
  return { session: { uid: user.id, name: user.name, username: user.username, role: 'teacher' }, staffId: row.id };
}

const paperOf = async (subjectId: string) => {
  const [paper] = await db.select().from(s.examPapers).where(and(eq(s.examPapers.examId, examId), eq(s.examPapers.subjectId, subjectId), eq(s.examPapers.grade, 7)));
  return paper;
};

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = { uid: row.id, name: row.name, username: row.username, role: row.role };
  const desk = await createUser(admin, { name: 'Office Desk', username: 'desk', password: 'start123', role: 'staff' });
  office = { uid: desk.id, name: desk.name, username: desk.username, role: desk.role };

  const [year] = await db.select().from(s.academicYears).where(eq(s.academicYears.isCurrent, true));
  const sevens = (await db.select().from(s.sections).where(and(eq(s.sections.yearId, year.id), eq(s.sections.grade, 7)))).sort((a, b) => a.name.localeCompare(b.name));
  [sectionA, sectionB] = sevens;
  const subjectRows = await db.select().from(s.subjects);
  maths = subjectRows.find((row) => row.name === 'Mathematics' && row.toGrade === 10)!;
  bengali = subjectRows.find((row) => row.name === 'Bengali')!;

  const one = await teacherLogin('maths', 'Rinku Pal');
  const two = await teacherLogin('classteacher', 'Amrita Pal');
  mathsTeacher = one.session;
  classTeacher = two.session;
  // Rinku Pal teaches Mathematics in 7 A; Amrita Pal is the class teacher of 7 A and teaches Bengali there.
  await db.insert(s.teachingAssignments).values([
    { sectionId: sectionA.id, subjectId: maths.id, staffId: one.staffId },
    { sectionId: sectionA.id, subjectId: bengali.id, staffId: two.staffId },
  ]);
  await db.update(s.sections).set({ classTeacherId: two.staffId }).where(eq(s.sections.id, sectionA.id));

  const inserted = await db
    .insert(s.students)
    .values(['Arnab Das', 'Soham Ghosh', 'Ritam Mondal', 'Sayan Sarkar'].map((name, i) => ({ name, admissionNo: `T-${i + 1}`, fatherName: 'Father' })))
    .returning();
  boys = inserted.map((row) => row.id);
  await db.insert(s.enrolments).values(inserted.map((student, i) => ({ yearId: year.id, studentId: student.id, sectionId: sectionA.id, rollNo: i + 1 })));
}, 120_000);

describe('grading rules', () => {
  it('gives equal scores the same rank and skips the next (1, 2, 2, 4)', () => {
    const ranks = rankWithTies([
      { id: 'a', score: 90 },
      { id: 'b', score: 80 },
      { id: 'c', score: 80 },
      { id: 'd', score: 70 },
      { id: 'e', score: null },
    ]);
    expect(['a', 'b', 'c', 'd'].map((id) => ranks.get(id))).toEqual([1, 2, 2, 4]);
    expect(ranks.has('e')).toBe(false);
  });

  it('uses the WBBSE letters by default', () => {
    expect([95, 90, 85, 60, 59.9, 45, 35, 25, 24].map((p) => gradeFor(p))).toEqual(['AA', 'AA', 'A+', 'A', 'B+', 'B+', 'B', 'C', 'D']);
  });

  it('counts absent as 0 and a fail, and leaves out a paper the boy has no entry for', () => {
    const papers = [
      { id: 'p1', subjectId: 's1', fullMarks: 100, passMarks: 25 },
      { id: 'p2', subjectId: 's2', fullMarks: 100, passMarks: 25 },
    ];
    const { results } = computeResults(papers, ['x', 'y'], [
      { paperId: 'p1', studentId: 'x', marks: 80, absent: false },
      { paperId: 'p2', studentId: 'x', marks: null, absent: true },
      { paperId: 'p1', studentId: 'y', marks: 60, absent: false },
    ]);
    expect(results[0]).toMatchObject({ total: 80, full: 200, percent: 40, passed: false, failedIn: ['p2'] });
    expect(results[1]).toMatchObject({ total: 60, full: 100, percent: 60, passed: true, grade: 'A' });
  });
});

describe('setting up an exam', () => {
  it('lets the office add an exam and set up papers for every subject of the class', async () => {
    const exam = await createExam(office, { name: 'First Summative', fromGrade: 7, toGrade: 7, startsOn: '2026-04-20', endsOn: '2026-04-29', sort: 1 });
    examId = exam.id;
    const { added } = await setupPapers(office, examId, { fullMarks: 100, passMarks: 25, hsFullMarks: 100, hsPassMarks: 30 });
    // Class 7: Bengali, English, Mathematics, Hindi, Physical Science, Life Science, History, Geography.
    expect(added).toBe(8);
    expect((await setupPapers(office, examId, {})).added).toBe(0);
    await expect(createExam(office, { name: 'Bad', fromGrade: 9, toGrade: 7 })).rejects.toThrow();
    await expect(createExam(mathsTeacher, { name: 'Unit test', fromGrade: 7, toGrade: 7 })).rejects.toMatchObject({ status: 403 });
  });

  it('keeps marks out until the exam is open, and hides the draft from teachers', async () => {
    const paper = await paperOf(maths.id);
    await expect(saveMarks(office, paper.id, sectionA.id, [{ studentId: boys[0], marks: 50, absent: false }])).rejects.toMatchObject({ status: 400 });
    expect((await listExams(mathsTeacher)).exams).toHaveLength(0);
    await setExamStatus(office, examId, 'open');
    expect((await listExams(mathsTeacher)).exams.map((row) => row.name)).toEqual(['First Summative']);
  });
});

describe('entering marks', () => {
  it('lets a teacher enter marks only for the subject he teaches in his section', async () => {
    const mathsPaper = await paperOf(maths.id);
    const bengaliPaper = await paperOf(bengali.id);
    await saveMarks(mathsTeacher, mathsPaper.id, sectionA.id, [{ studentId: boys[0], marks: 90, absent: false }]);
    await expect(saveMarks(mathsTeacher, bengaliPaper.id, sectionA.id, [{ studentId: boys[0], marks: 50, absent: false }])).rejects.toMatchObject({ status: 403 });
    await expect(saveMarks(mathsTeacher, mathsPaper.id, sectionB.id, [])).rejects.toMatchObject({ status: 403 });
    await expect(getMarksSheet(mathsTeacher, bengaliPaper.id, sectionA.id)).rejects.toMatchObject({ status: 403 });
    // The marks screen offers him only his own paper.
    const choices = await marksChoices(mathsTeacher, { exam: examId });
    expect(choices.sections.map((row) => row.id)).toEqual([sectionA.id]);
    expect(choices.papers.map((row) => row.subjectId)).toEqual([maths.id]);
    // The office may enter any paper.
    await saveMarks(office, bengaliPaper.id, sectionA.id, [{ studentId: boys[0], marks: 40, absent: false }]);
  });

  it('refuses marks above the full marks and saves nothing of that batch', async () => {
    const paper = await paperOf(maths.id);
    await expect(
      saveMarks(mathsTeacher, paper.id, sectionA.id, [
        { studentId: boys[1], marks: 70, absent: false },
        { studentId: boys[2], marks: 101, absent: false },
      ]),
    ).rejects.toMatchObject({ status: 400, fields: { [boys[2]]: 'More than the full marks' } });
    const sheet = await getMarksSheet(mathsTeacher, paper.id, sectionA.id);
    expect(sheet.students.find((row) => row.id === boys[1])?.marks).toBeNull();
    // A boy from another class is refused too.
    await expect(saveMarks(office, paper.id, sectionB.id, [{ studentId: boys[0], marks: 10, absent: false }])).rejects.toMatchObject({ status: 400 });
  });

  it('will not lower the full marks below a mark already given', async () => {
    const paper = await paperOf(maths.id);
    await expect(updatePaper(office, paper.id, { fullMarks: 80, passMarks: 25 })).rejects.toMatchObject({ status: 400 });
  });

  it('works out totals, grades and ranks with ties sharing a rank', async () => {
    const mathsPaper = await paperOf(maths.id);
    const bengaliPaper = await paperOf(bengali.id);
    // Bengali only for the first boy was a test; clear it so every boy has one paper.
    await saveMarks(office, bengaliPaper.id, sectionA.id, [{ studentId: boys[0], marks: null, absent: false }]);
    await saveMarks(mathsTeacher, mathsPaper.id, sectionA.id, [
      { studentId: boys[1], marks: 80, absent: false },
      { studentId: boys[2], marks: 80, absent: false },
      { studentId: boys[3], marks: 70, absent: false },
    ]);
    const results = await getSectionResults(office, examId, sectionA.id);
    expect(results.rows.map((row) => row.result.rank)).toEqual([1, 2, 2, 4]);
    expect(results.rows.map((row) => row.result.grade)).toEqual(['AA', 'A+', 'A+', 'A']);
    expect(results.highest.get(mathsPaper.id)).toBe(90);
  });

  it('lets only the class teacher and the office see the whole class', async () => {
    await expect(getSectionResults(mathsTeacher, examId, sectionA.id)).rejects.toMatchObject({ status: 403 });
    expect((await getSectionResults(classTeacher, examId, sectionA.id)).rows).toHaveLength(4);
    await saveRemark(classTeacher, examId, boys[0], 'Very good');
    await expect(saveRemark(mathsTeacher, examId, boys[0], 'x')).rejects.toMatchObject({ status: 403 });
    expect((await getSectionResults(office, examId, sectionA.id)).rows[0].remark).toBe('Very good');
  });

  it('rings the bell for papers still short of marks', async () => {
    const teacherLines = await examNotifications(mathsTeacher, t);
    expect(teacherLines).toEqual([]);
    const officeLines = await examNotifications(office, t);
    // Seven of the eight Class 7 A papers have no marks; Hindi is optional but has none either.
    expect(officeLines[0].title).toBe('Exam First Summative: 7 papers without marks');
    const classTeacherLines = await examNotifications(classTeacher, t);
    expect(classTeacherLines.map((line) => line.title)).toEqual(['Marks to enter: First Summative Class 7 A Bengali']);
  });
});

describe('publishing', () => {
  it('lets only the head of school publish, then locks the marks', async () => {
    await expect(setExamStatus(office, examId, 'published')).rejects.toMatchObject({ status: 403 });
    await setExamStatus(admin, examId, 'published');
    const paper = await paperOf(maths.id);
    await expect(saveMarks(mathsTeacher, paper.id, sectionA.id, [{ studentId: boys[3], marks: 75, absent: false }])).rejects.toMatchObject({ status: 400 });
    await expect(saveMarks(admin, paper.id, sectionA.id, [{ studentId: boys[3], marks: 75, absent: false }])).rejects.toMatchObject({ status: 400 });
    await expect(updatePaper(admin, paper.id, { fullMarks: 100, passMarks: 30 })).rejects.toMatchObject({ status: 400 });
    expect(await examNotifications(office, t)).toEqual([]);
  });

  it('gives the parents corner the published result with rank', async () => {
    const results = await listPublishedResults(boys[1]);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ name: 'First Summative', total: 80, full: 100, percent: 80, grade: 'A+', rank: 2, outOf: 4, passed: true });
    expect(results[0].papers).toHaveLength(1);
    const cards = await getReportCards(office, sectionA.id, boys[0]);
    expect(cards.cards).toHaveLength(1);
    expect(cards.cards[0]).toMatchObject({ remark: 'Very good' });
    expect(cards.cards[0].exams[0].result.rank).toBe(1);
  });

  it('takes results back only for an admin with a reason, written in the activity log', async () => {
    await expect(setExamStatus(office, examId, 'open', 'Wrong mark')).rejects.toMatchObject({ status: 403 });
    await expect(setExamStatus(admin, examId, 'open', '')).rejects.toMatchObject({ status: 400 });
    await setExamStatus(admin, examId, 'open', 'Wrong mark in Mathematics');
    const log = await db.select().from(s.auditLog).where(and(eq(s.auditLog.action, 'exam.unpublish'), eq(s.auditLog.entityId, examId)));
    expect(log).toHaveLength(1);
    expect(log[0].summary).toContain('Wrong mark in Mathematics');
    expect(await listPublishedResults(boys[1])).toEqual([]);
    const paper = await paperOf(maths.id);
    await saveMarks(mathsTeacher, paper.id, sectionA.id, [{ studentId: boys[3], marks: 75, absent: false }]);
  });

  it('keeps deleting and the grading scale for the head of school', async () => {
    await expect(deleteExam(office, examId)).rejects.toMatchObject({ status: 403 });
    await expect(deleteExam(admin, examId)).rejects.toMatchObject({ status: 400 });
    await expect(saveGradeScale(office, [{ grade: 'P', min: 0 }, { grade: 'D', min: 60 }])).rejects.toMatchObject({ status: 403 });
    await expect(saveGradeScale(admin, [{ grade: 'P', min: 10 }, { grade: 'D', min: 60 }])).rejects.toThrow();
    const scale = await saveGradeScale(admin, [{ grade: 'P', min: 0 }, { grade: 'D', min: 60 }]);
    expect(scale.map((row) => row.grade)).toEqual(['D', 'P']);
    const empty = await createExam(office, { name: 'Unit test', fromGrade: 7, toGrade: 7 });
    await deleteExam(admin, empty.id);
    expect((await listExams(office)).exams.map((row) => row.name)).toEqual(['First Summative']);
  });
});
