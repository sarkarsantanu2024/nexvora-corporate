/**
 * Government schemes a student gets through the school: Sabooj Sathi
 * bicycles, Taruner Swapna, Aikyashree and other scholarships. One row per
 * student, scheme and year, moving from applied to sanctioned to received
 * (or rejected). Office only.
 */
import { and, asc, desc, eq, ilike, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { BENEFIT_STATUSES, enrolments, sections, studentBenefits, students, type BenefitStatus } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { optionalDay, requiredText, rupees, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, countInt, pageOf } from '../admin/shared';
import { assertOffice, currentYear } from '../school/access';
import { isUniqueViolation } from '../students/shared';

const isStatus = (value: unknown): value is BenefitStatus => (BENEFIT_STATUSES as readonly string[]).includes(value as string);

export type SchemeFilters = { scheme?: string; year?: string; status?: string; section?: string; q?: string; page?: string | number };

export async function listBenefits(session: Session, filters: SchemeFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const page = pageOf(filters.page);
  // The school year is the default, so the counts are for one year at a time.
  const schoolYear = filters.year?.trim() || year.name;
  const base: (SQL | undefined)[] = [eq(studentBenefits.year, schoolYear), isNull(students.deletedAt)];
  if (filters.section && uuid.safeParse(filters.section).success) base.push(eq(enrolments.sectionId, filters.section));
  const term = filters.q?.trim();
  if (term) base.push(or(ilike(students.name, `%${term}%`), ilike(students.admissionNo, `%${term}%`)));
  const listConds = [...base];
  if (filters.scheme) listConds.push(eq(studentBenefits.scheme, filters.scheme));
  if (isStatus(filters.status)) listConds.push(eq(studentBenefits.status, filters.status));

  const from = () =>
    db
      .select({
        id: studentBenefits.id,
        scheme: studentBenefits.scheme,
        year: studentBenefits.year,
        status: studentBenefits.status,
        amount: studentBenefits.amount,
        receivedOn: studentBenefits.receivedOn,
        note: studentBenefits.note,
        studentId: students.id,
        name: students.name,
        admissionNo: students.admissionNo,
        grade: sections.grade,
        sectionName: sections.name,
        stream: sections.stream,
        shift: sections.shift,
        rollNo: enrolments.rollNo,
      })
      .from(studentBenefits)
      .innerJoin(students, eq(students.id, studentBenefits.studentId))
      .leftJoin(enrolments, and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, year.id)))
      .leftJoin(sections, eq(sections.id, enrolments.sectionId));

  const [rows, [{ n }], summary, schemes] = await Promise.all([
    from()
      .where(and(...listConds))
      .orderBy(asc(studentBenefits.scheme), asc(sections.grade), asc(sections.name), asc(enrolments.rollNo))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: countInt() })
      .from(studentBenefits)
      .innerJoin(students, eq(students.id, studentBenefits.studentId))
      .leftJoin(enrolments, and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, year.id)))
      .where(and(...listConds)),
    // Counts per scheme and status follow the year, class and search, not the chosen scheme or status.
    db
      .select({ scheme: studentBenefits.scheme, status: studentBenefits.status, n: countInt() })
      .from(studentBenefits)
      .innerJoin(students, eq(students.id, studentBenefits.studentId))
      .leftJoin(enrolments, and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, year.id)))
      .where(and(...base))
      .groupBy(studentBenefits.scheme, studentBenefits.status),
    db.selectDistinct({ scheme: studentBenefits.scheme }).from(studentBenefits).orderBy(asc(studentBenefits.scheme)),
  ]);
  const byScheme = new Map<string, Record<BenefitStatus, number>>();
  for (const row of summary) {
    const counts = byScheme.get(row.scheme) ?? (Object.fromEntries(BENEFIT_STATUSES.map((s) => [s, 0])) as Record<BenefitStatus, number>);
    counts[row.status] = row.n;
    byScheme.set(row.scheme, counts);
  }
  const years = await db.selectDistinct({ year: studentBenefits.year }).from(studentBenefits).orderBy(desc(studentBenefits.year));
  return {
    rows,
    total: n,
    page,
    pageSize: PAGE_SIZE,
    schoolYear,
    currentYearName: year.name,
    summary: [...byScheme.entries()].map(([scheme, counts]) => ({ scheme, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) })),
    schemes: schemes.map((row) => row.scheme),
    years: [...new Set([year.name, ...years.map((row) => row.year)])],
  };
}

const benefitFields = z.object({
  scheme: requiredText('Scheme', 80),
  year: requiredText('Year', 20),
  status: z.enum(BENEFIT_STATUSES),
  amount: rupees.default(0),
  receivedOn: optionalDay,
  note: text(300),
});

const benefitInput = benefitFields.extend({ studentId: uuid });

async function assertStudent(studentId: string) {
  const db = await getDb();
  const [row] = await db.select({ id: students.id, name: students.name }).from(students).where(and(eq(students.id, studentId), isNull(students.deletedAt))).limit(1);
  if (!row) throw new ApiError(404, 'Student not found');
  return row;
}

const duplicate = () => new ApiError(400, 'This student already has this scheme for this year', { scheme: 'Already entered for this year' });

export async function addBenefit(session: Session, input: z.input<typeof benefitInput>) {
  assertOffice(session);
  const data = benefitInput.parse(input);
  const student = await assertStudent(data.studentId);
  const db = await getDb();
  try {
    const [row] = await db.insert(studentBenefits).values(data).returning();
    await audit(session, 'scheme.add', { entity: 'student', entityId: student.id, summary: `${data.scheme} ${data.year} for ${student.name}: ${data.status}` });
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicate();
    throw error;
  }
}

export async function updateBenefit(session: Session, id: string, input: z.input<typeof benefitFields>) {
  assertOffice(session);
  const data = benefitFields.parse(input);
  const db = await getDb();
  try {
    const [row] = await db.update(studentBenefits).set(data).where(eq(studentBenefits.id, uuid.parse(id))).returning();
    if (!row) throw new ApiError(404, 'Entry not found');
    await audit(session, 'scheme.update', { entity: 'student', entityId: row.studentId, summary: `${row.scheme} ${row.year}: ${row.status}` });
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) throw duplicate();
    throw error;
  }
}

/** For a wrong entry. A scheme that was refused is marked rejected instead. */
export async function deleteBenefit(session: Session, id: string) {
  assertOffice(session);
  const db = await getDb();
  const [row] = await db.delete(studentBenefits).where(eq(studentBenefits.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Entry not found');
  await audit(session, 'scheme.delete', { entity: 'student', entityId: row.studentId, summary: `Removed ${row.scheme} ${row.year}` });
}

const bulkInput = benefitFields.extend({ sectionId: uuid, studentIds: z.array(uuid).min(1, 'Tick at least one student').max(300) });

/** One scheme for the ticked students of a section. Students who already have it for that year are left as they are. */
export async function addBenefitsForSection(session: Session, input: z.input<typeof bulkInput>) {
  assertOffice(session);
  const { sectionId, studentIds, ...fields } = bulkInput.parse(input);
  const db = await getDb();
  const members = await db
    .select({ studentId: enrolments.studentId })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .where(and(eq(enrolments.sectionId, sectionId), inArray(enrolments.studentId, studentIds), isNull(students.deletedAt)));
  if (members.length !== new Set(studentIds).size) throw new ApiError(400, 'A student is not in this class');
  const added = await db
    .insert(studentBenefits)
    .values(members.map((row) => ({ ...fields, studentId: row.studentId })))
    .onConflictDoNothing()
    .returning({ id: studentBenefits.id });
  await audit(session, 'scheme.bulk', { entity: 'section', entityId: sectionId, summary: `${fields.scheme} ${fields.year} entered for ${added.length} students` });
  return { added: added.length, skipped: members.length - added.length };
}
