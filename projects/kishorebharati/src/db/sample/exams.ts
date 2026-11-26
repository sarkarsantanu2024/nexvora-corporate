/**
 * Sample exams, papers and marks: the First Summative with its results
 * published, and the Second Summative open with marks partly entered (the
 * sample teacher still has one paper to finish, so the bell has something to
 * say). Made-up marks, steady per boy so a report card reads like a real one.
 */
import { eq } from 'drizzle-orm';
import { SCHOOL, hasStreams } from '@/config/school';
import type { DB } from '../index';
import * as s from '../schema';
import type { SampleContext } from './index';

/** A number from 0 to 1 that is always the same for the same inputs. */
const noise = (...parts: number[]) => {
  let h = 2166136261;
  for (const part of parts) h = Math.imul(h ^ (part + 0x9e3779b9), 16777619) >>> 0;
  return (h % 10000) / 10000;
};

export async function seedExamsSample(db: DB, context: SampleContext): Promise<void> {
  const [year] = await db.select().from(s.academicYears).where(eq(s.academicYears.id, context.yearId)).limit(1);
  if (!year) return;
  const y = year.startsOn.slice(0, 4);
  const from = SCHOOL.grades[0];
  const to = SCHOOL.grades[SCHOOL.grades.length - 1];

  const [first, second] = await db
    .insert(s.exams)
    .values([
      { yearId: year.id, name: 'First Summative', fromGrade: from, toGrade: to, startsOn: `${y}-04-20`, endsOn: `${y}-04-29`, status: 'published', sort: 1 },
      { yearId: year.id, name: 'Second Summative', fromGrade: from, toGrade: to, startsOn: `${y}-08-24`, endsOn: `${y}-09-02`, status: 'open', sort: 2 },
    ])
    .returning();

  const subjectRows = await db.select().from(s.subjects).where(eq(s.subjects.active, true));
  const paperValues: (typeof s.examPapers.$inferInsert)[] = [];
  for (const exam of [first, second]) {
    for (const grade of SCHOOL.grades) {
      const hs = hasStreams(grade);
      subjectRows.forEach((subject, index) => {
        if (grade < subject.fromGrade || grade > subject.toGrade || (subject.stream && !hs)) return;
        paperValues.push({
          examId: exam.id,
          grade,
          subjectId: subject.id,
          fullMarks: hs ? 100 : exam.id === first.id ? 50 : 100,
          passMarks: hs ? 30 : exam.id === first.id ? 13 : 25,
          examDate: exam.id === first.id ? `${y}-04-${String(20 + (index % 9)).padStart(2, '0')}` : `${y}-08-${String(24 + (index % 7)).padStart(2, '0')}`,
        });
      });
    }
  }
  const papers = await db.insert(s.examPapers).values(paperValues).returning();
  const subjectById = new Map(subjectRows.map((row) => [row.id, row]));

  const sectionRows = await db.select().from(s.sections).where(eq(s.sections.yearId, year.id));
  const roll = await db
    .select({ studentId: s.enrolments.studentId, sectionId: s.enrolments.sectionId, rollNo: s.enrolments.rollNo })
    .from(s.enrolments)
    .where(eq(s.enrolments.yearId, year.id));

  // The sample teacher teaches one subject in his own class, so the marks screen has a paper for him.
  const own = sectionRows.filter((row) => row.classTeacherId === context.teacherStaffId)[0];
  const bengali = subjectRows.find((row) => row.name === 'Bengali');
  if (own && bengali && context.teacherStaffId) {
    await db.insert(s.teachingAssignments).values({ sectionId: own.id, subjectId: bengali.id, staffId: context.teacherStaffId }).onConflictDoNothing();
  }
  const teacherPapers = context.teacherStaffId
    ? await db.select().from(s.teachingAssignments).where(eq(s.teachingAssignments.staffId, context.teacherStaffId))
    : [];
  const teacherKeys = new Set(teacherPapers.map((row) => `${row.sectionId}:${row.subjectId}`));

  const markValues: (typeof s.marks.$inferInsert)[] = [];
  const remarks: Record<string, string> = {};
  for (const section of sectionRows) {
    const boys = roll.filter((row) => row.sectionId === section.id);
    const sectionPapers = papers.filter((paper) => {
      const subject = subjectById.get(paper.subjectId);
      return paper.grade === section.grade && subject && (!subject.stream || subject.stream === section.stream);
    });
    for (const [paperIndex, paper] of sectionPapers.entries()) {
      const subject = subjectById.get(paper.subjectId)!;
      const isSecond = paper.examId === second.id;
      // Second Summative: about two thirds of the papers are done; the teacher's own paper is half done.
      const teacherOwn = teacherKeys.has(`${section.id}:${paper.subjectId}`);
      if (isSecond && !teacherOwn && noise(section.grade, paperIndex, section.name.charCodeAt(0)) > 0.65) continue;
      for (const boy of boys) {
        if (isSecond && teacherOwn && boy.rollNo > boys.length / 2) continue;
        // An optional subject is taken by every other boy.
        if (subject.optional && boy.rollNo % 2 === 0) continue;
        const absent = noise(boy.rollNo, section.grade, paperIndex, isSecond ? 2 : 1) > 0.985;
        // Each boy has his own level (35% to 92%), and each paper moves it a little.
        const level = 0.35 + 0.57 * noise(boy.rollNo, section.grade, section.name.charCodeAt(0));
        const swing = (noise(boy.rollNo, paperIndex, section.grade, isSecond ? 7 : 3) - 0.5) * 0.24;
        const got = Math.max(0, Math.min(paper.fullMarks, Math.round((level + swing) * paper.fullMarks)));
        markValues.push({ paperId: paper.id, studentId: boy.studentId, marks: absent ? null : got, absent, enteredBy: context.teacherUserId });
      }
    }
    const top = boys.find((boy) => boy.rollNo === 1);
    const runnerUp = boys.find((boy) => boy.rollNo === 2);
    if (top) remarks[top.studentId] = 'Steady and attentive. Keep reading every day.';
    if (runnerUp) remarks[runnerUp.studentId] = 'Good in Mathematics. Needs more practice in English writing.';
  }
  for (let i = 0; i < markValues.length; i += 500) await db.insert(s.marks).values(markValues.slice(i, i + 500));
  await db.insert(s.settings).values({ key: `remarks:${first.id}`, value: remarks }).onConflictDoNothing();
}
