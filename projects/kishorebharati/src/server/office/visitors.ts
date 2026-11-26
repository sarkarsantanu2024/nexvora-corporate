/**
 * The gate: the visitor book (who came, to meet whom, why, in and out) and
 * the early-leave gate pass of a student, printed as a slip with a serial
 * number. Office only.
 */
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { enrolments, gatePasses, sections, students, visitors } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day as dayField, optionalPhone, requiredText, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, pageOf } from '../admin/shared';
import { isDay } from '../daily/shared';
import { assertOffice, currentYear } from '../school/access';
import { clock, enrolledIn, liveStudent, nextNumber, optionalClock } from './shared';

export type GateFilters = { day?: string; q?: string; page?: string | number };

export async function listVisitors(session: Session, filters: GateFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const parts: (SQL | undefined)[] = [];
  if (isDay(filters.day)) parts.push(eq(visitors.day, filters.day));
  const term = filters.q?.trim();
  if (term) parts.push(or(ilike(visitors.name, `%${term}%`), ilike(visitors.phone, `%${term}%`), ilike(visitors.whomToMeet, `%${term}%`), ilike(visitors.purpose, `%${term}%`)));
  const where = and(...parts);
  const [rows, [{ n }], [{ inside }]] = await Promise.all([
    db.select().from(visitors).where(where).orderBy(desc(visitors.day), desc(visitors.inTime), desc(visitors.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(visitors).where(where),
    db.select({ inside: countInt() }).from(visitors).where(and(eq(visitors.day, todayIST()), eq(visitors.outTime, ''))),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE, inside };
}

export const visitorInput = z
  .object({
    day: dayField,
    name: requiredText('Name', 80),
    phone: optionalPhone,
    whomToMeet: text(80),
    purpose: text(200),
    inTime: clock,
    outTime: optionalClock,
  })
  .superRefine((value, ctx) => {
    if (value.outTime && value.outTime < value.inTime) ctx.addIssue({ code: 'custom', path: ['outTime'], message: 'Out time cannot be before in time' });
  });
export type VisitorInput = z.input<typeof visitorInput>;

export async function addVisitor(session: Session, raw: VisitorInput) {
  assertOffice(session);
  const input = visitorInput.parse(raw);
  if (input.day > todayIST()) throw new ApiError(400, 'Pick today or an earlier day');
  const db = await getDb();
  const [row] = await db.insert(visitors).values({ ...input, createdBy: session.uid }).returning();
  await audit(session, 'visitor.add', { entity: 'visitor', entityId: row.id, summary: `Visitor ${row.name} at ${row.inTime}` });
  return row;
}

/** The visitor leaves: out time is now (or the time given), never before the in time. */
export async function markVisitorOut(session: Session, id: string, outTime: string) {
  assertOffice(session);
  const time = clock.parse(outTime);
  const db = await getDb();
  const [row] = await db.select().from(visitors).where(eq(visitors.id, uuid.parse(id))).limit(1);
  if (!row) throw new ApiError(404, 'Visitor not found');
  if (time < row.inTime) throw new ApiError(400, 'Out time cannot be before in time');
  await db.update(visitors).set({ outTime: time }).where(eq(visitors.id, row.id));
  await audit(session, 'visitor.out', { entity: 'visitor', entityId: row.id, summary: `Visitor ${row.name} left at ${time}` });
}

/** A wrong line, removed. Only the head of school. */
export async function deleteVisitor(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const [row] = await db.delete(visitors).where(eq(visitors.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Visitor not found');
  await audit(session, 'visitor.delete', { entity: 'visitor', entityId: row.id, summary: `Removed the visitor line of ${row.name}` });
}

/* ───────────── gate passes ───────────── */

const passColumns = {
  pass: gatePasses,
  studentName: students.name,
  admissionNo: students.admissionNo,
  photo: students.photo,
  grade: sections.grade,
  sectionName: sections.name,
  stream: sections.stream,
  shift: sections.shift,
  rollNo: enrolments.rollNo,
};

export async function listGatePasses(session: Session, filters: GateFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const page = pageOf(filters.page);
  const parts: (SQL | undefined)[] = [];
  if (isDay(filters.day)) parts.push(eq(gatePasses.day, filters.day));
  const term = filters.q?.trim();
  if (term) parts.push(or(ilike(students.name, `%${term}%`), ilike(students.admissionNo, `%${term}%`), ilike(gatePasses.guardianName, `%${term}%`), ilike(gatePasses.serialNo, `%${term}%`)));
  const where = and(...parts);
  const [rows, [{ n }]] = await Promise.all([
    db
      .select(passColumns)
      .from(gatePasses)
      .innerJoin(students, eq(students.id, gatePasses.studentId))
      .leftJoin(enrolments, enrolledIn(year.id))
      .leftJoin(sections, eq(sections.id, enrolments.sectionId))
      .where(where)
      .orderBy(desc(gatePasses.day), desc(gatePasses.time), desc(gatePasses.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(gatePasses).innerJoin(students, eq(students.id, gatePasses.studentId)).where(where),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE };
}

export async function getGatePass(session: Session, id: string) {
  assertOffice(session);
  if (!uuid.safeParse(id).success) return null;
  const db = await getDb();
  const year = await currentYear(db);
  const [row] = await db
    .select(passColumns)
    .from(gatePasses)
    .innerJoin(students, eq(students.id, gatePasses.studentId))
    .leftJoin(enrolments, enrolledIn(year.id))
    .leftJoin(sections, eq(sections.id, enrolments.sectionId))
    .where(eq(gatePasses.id, id))
    .limit(1);
  return row ?? null;
}

export const gatePassInput = z.object({
  studentId: uuid,
  day: dayField,
  time: clock,
  guardianName: requiredText('Who is taking him', 80),
  guardianRelation: text(40),
  guardianPhone: optionalPhone,
  reason: requiredText('Reason', 200),
  approvedBy: requiredText('Allowed by', 80),
});
export type GatePassInput = z.input<typeof gatePassInput>;

export async function createGatePass(session: Session, raw: GatePassInput) {
  assertOffice(session);
  const input = gatePassInput.parse(raw);
  const db = await getDb();
  const student = await liveStudent(input.studentId, db);
  if (!student) throw new ApiError(404, 'Student not found');
  const year = input.day.slice(0, 4);
  const row = await db.transaction(async (tx) => {
    const n = await nextNumber(tx, `gatepass:${year}`);
    const [created] = await tx
      .insert(gatePasses)
      .values({ ...input, serialNo: `GP/${n}/${year}`, createdBy: session.uid })
      .returning();
    return created;
  });
  await audit(session, 'gatepass.create', { entity: 'gate_pass', entityId: row.id, summary: `Gate pass ${row.serialNo} for ${student.name}` });
  return row;
}
