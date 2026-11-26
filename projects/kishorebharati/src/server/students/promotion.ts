/**
 * The end of the school year, one section at a time: each student is marked
 * promoted, detained, passed or left, and gets a place (section and a new
 * roll number) in next year's class.
 *
 *  - promoted: to the next class;
 *  - detained: the same class again;
 *  - passed: after a board exam class (10, 12). Passed with a class chosen
 *    (Class 10 into 11 Science or Arts) continues here; without one he has
 *    passed out;
 *  - left: no place next year.
 *
 * Safe to run again for the same section: a student who already has a place
 * next year keeps it (and his roll number) when the section is the same, and
 * is moved when it changed. Everything is written in one transaction.
 */
import { and, asc, eq, gt, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { academicYears, enrolments, sections, students, type AcademicYear, type Section } from '@/db/schema';
import { SCHOOL } from '@/config/school';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { uuid } from '@/lib/validators';
import { assertOffice } from '../school/access';
import { sectionsOfYear } from './shared';
import { studentNotTrashed } from './service';

export const PROMOTION_RESULTS = ['promoted', 'detained', 'passed', 'left'] as const;
export type PromotionResult = (typeof PROMOTION_RESULTS)[number];

/** The class after this one in the school, or null after the last. */
export const nextGrade = (grade: number) => SCHOOL.grades[SCHOOL.grades.indexOf(grade) + 1] ?? null;
export const isBoardGrade = (grade: number) => SCHOOL.boardExamGrades.includes(grade);

async function loadSection(sectionId: string) {
  const db = await getDb();
  const parsed = uuid.safeParse(sectionId);
  if (!parsed.success) throw new ApiError(404, 'Class not found');
  const [section] = await db.select().from(sections).where(eq(sections.id, parsed.data)).limit(1);
  if (!section) throw new ApiError(404, 'Class not found');
  const [year] = await db.select().from(academicYears).where(eq(academicYears.id, section.yearId)).limit(1);
  const [next] = await db.select().from(academicYears).where(gt(academicYears.startsOn, year.startsOn)).orderBy(asc(academicYears.startsOn)).limit(1);
  return { db, section, year, next: next ?? null };
}

/** What the promotion screen needs for one section. `next` is null until next year is added. */
export async function loadPromotion(session: Session, sectionId: string) {
  assertOffice(session);
  const { db, section, year, next } = await loadSection(sectionId);
  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      admissionNo: students.admissionNo,
      status: students.status,
      rollNo: enrolments.rollNo,
      result: enrolments.result,
    })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .where(and(eq(enrolments.sectionId, section.id), studentNotTrashed))
    .orderBy(asc(enrolments.rollNo));
  const nextSections = next ? await sectionsOfYear(db, next.id) : [];
  const placed = next && rows.length
    ? await db
        .select({ studentId: enrolments.studentId, sectionId: enrolments.sectionId, rollNo: enrolments.rollNo })
        .from(enrolments)
        .where(and(eq(enrolments.yearId, next.id), inArray(enrolments.studentId, rows.map((row) => row.studentId))))
    : [];
  return { section, year, next, nextSections, rows, placed };
}

const promotionInput = z.object({
  rows: z
    .array(
      z.object({
        studentId: uuid,
        result: z.enum(PROMOTION_RESULTS, { errorMap: () => ({ message: 'Choose what happened to each student' }) }),
        targetSectionId: z.union([z.literal(''), uuid, z.null()]).transform((value) => value || null),
      }),
    )
    .min(1, 'No students in this class')
    .max(300),
});

function checkTarget(section: Section, result: PromotionResult, target: Section | null, nextYear: AcademicYear) {
  if (target && target.yearId !== nextYear.id) throw new ApiError(400, 'Choose a class of next year');
  const after = nextGrade(section.grade);
  if (result === 'promoted') {
    if (!target) throw new ApiError(400, "Choose next year's class for each promoted student");
    if (after === null || target.grade !== after) throw new ApiError(400, 'A promoted student goes to the next class');
  }
  if (result === 'detained') {
    if (!target) throw new ApiError(400, "Choose next year's class for each detained student");
    if (target.grade !== section.grade) throw new ApiError(400, 'A detained student stays in the same class');
  }
  if (result === 'passed') {
    if (!isBoardGrade(section.grade)) throw new ApiError(400, 'Passed is only for a board exam class');
    if (target && target.grade <= section.grade) throw new ApiError(400, 'A student who passed can only go to a higher class');
  }
  if (result === 'left' && target) throw new ApiError(400, 'A student who left has no class next year');
}

export async function runPromotion(session: Session, sectionId: string, input: z.input<typeof promotionInput>) {
  assertOffice(session);
  const data = promotionInput.parse(input);
  const { db, section, year, next } = await loadSection(sectionId);
  if (!next) throw new ApiError(400, 'Add next year first, from Classes and subjects');

  const summary = await db.transaction(async (tx) => {
    const members = await tx.select().from(enrolments).where(eq(enrolments.sectionId, section.id));
    const memberOf = new Map(members.map((row) => [row.studentId, row]));
    const nextSections = await tx.select().from(sections).where(eq(sections.yearId, next.id));
    const sectionById = new Map(nextSections.map((row) => [row.id, row]));
    const ids = data.rows.map((row) => row.studentId);
    for (const id of ids) if (!memberOf.has(id)) throw new ApiError(400, 'A student is not in this class');
    const existing = await tx.select().from(enrolments).where(and(eq(enrolments.yearId, next.id), inArray(enrolments.studentId, ids)));
    const placedNow = new Map(existing.map((row) => [row.studentId, row]));

    // Check everything before writing anything.
    for (const row of data.rows) {
      const target = row.targetSectionId ? sectionById.get(row.targetSectionId) ?? null : null;
      if (row.targetSectionId && !target) throw new ApiError(400, 'Choose a class of next year');
      checkTarget(section, row.result, target, next);
    }

    // Places that no longer fit are taken away first, so their roll numbers are free again.
    for (const row of data.rows) {
      const old = placedNow.get(row.studentId);
      if (old && old.sectionId !== row.targetSectionId) {
        await tx.delete(enrolments).where(eq(enrolments.id, old.id));
        placedNow.delete(row.studentId);
      }
    }

    // New roll numbers follow the old ones, after those already given in that class.
    const ordered = [...data.rows].sort((a, b) => memberOf.get(a.studentId)!.rollNo - memberOf.get(b.studentId)!.rollNo);
    const usedRolls = new Map<string, Set<number>>();
    const rollsOf = async (targetId: string) => {
      if (!usedRolls.has(targetId)) {
        const taken = await tx.select({ rollNo: enrolments.rollNo }).from(enrolments).where(eq(enrolments.sectionId, targetId));
        usedRolls.set(targetId, new Set(taken.map((r) => r.rollNo)));
      }
      return usedRolls.get(targetId)!;
    };
    const counts = { promoted: 0, detained: 0, passed: 0, left: 0, placed: 0 };
    for (const row of ordered) {
      counts[row.result]++;
      await tx.update(enrolments).set({ result: row.result }).where(eq(enrolments.id, memberOf.get(row.studentId)!.id));
      if (row.targetSectionId && !placedNow.has(row.studentId)) {
        const used = await rollsOf(row.targetSectionId);
        let roll = 1;
        while (used.has(roll)) roll++;
        used.add(roll);
        await tx.insert(enrolments).values({ yearId: next.id, studentId: row.studentId, sectionId: row.targetSectionId, rollNo: roll });
        counts.placed++;
      }
      const [student] = await tx.select({ status: students.status, leftOn: students.leftOn, leftReason: students.leftReason }).from(students).where(eq(students.id, row.studentId));
      if (row.targetSectionId) {
        // Continuing next year: back on roll if an earlier run had marked him otherwise.
        if (student.status !== 'active') await tx.update(students).set({ status: 'active', leftOn: null, leftReason: '', updatedAt: new Date() }).where(eq(students.id, row.studentId));
      } else {
        const status = row.result === 'passed' ? 'passed_out' : 'left';
        await tx
          .update(students)
          .set({
            status,
            leftOn: student.leftOn ?? year.endsOn,
            leftReason: student.leftReason || (status === 'passed_out' ? `Passed out, ${year.name}` : `Left at the end of ${year.name}`),
            updatedAt: new Date(),
          })
          .where(eq(students.id, row.studentId));
      }
    }
    return counts;
  });

  await audit(session, 'student.promote', {
    entity: 'section',
    entityId: section.id,
    summary: `Year end for Class ${section.grade} ${section.name} (${year.name}): ${summary.promoted} promoted, ${summary.detained} detained, ${summary.passed} passed, ${summary.left} left`,
  });
  return summary;
}
