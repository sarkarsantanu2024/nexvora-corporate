/** Classes (batches) of one centre, and the academic years they belong to. */
import { and, asc, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { academicYears, batches, programmes, staff, students } from '@/db/schema';
import { fail } from '@/lib/api';
import { audit } from '@/lib/audit';
import { addDays } from '@/lib/date';
import { optionalUuid, requiredText, text, uuid } from '@/lib/validators';
import { isUuid, loadBatch, requireManager, type Ctx } from './shared';

/** Stands for "the year after the latest one", which is created when first used. */
export const NEXT_YEAR = 'next';

export const batchInput = z.object({
  programmeId: uuid,
  academicYearId: z.union([z.literal(NEXT_YEAR), uuid]),
  name: requiredText('Class name', 60),
  capacity: z.coerce.number().int('Whole number only').min(1, 'At least 1 seat').max(60, 'At most 60 seats'),
  timing: text(60),
  teacherId: optionalUuid,
});
export type BatchInput = z.input<typeof batchInput>;

export async function listProgrammes() {
  const db = await getDb();
  return db
    .select({
      id: programmes.id,
      name: programmes.name,
      ageLabel: programmes.ageLabel,
      ageFromMonths: programmes.ageFromMonths,
      ageToMonths: programmes.ageToMonths,
      seatsPerClass: programmes.seatsPerClass,
      timing: programmes.timing,
    })
    .from(programmes)
    .where(eq(programmes.active, true))
    .orderBy(asc(programmes.sort));
}

export async function listYears() {
  const db = await getDb();
  return db.select().from(academicYears).orderBy(asc(academicYears.startDate));
}

export async function currentYear(db?: DbOrTx) {
  const conn = db ?? (await getDb());
  const [current] = await conn.select().from(academicYears).where(eq(academicYears.isCurrent, true)).limit(1);
  if (current) return current;
  const [latest] = await conn.select().from(academicYears).orderBy(desc(academicYears.startDate)).limit(1);
  return latest ?? null;
}

/** What the year after the latest one would be called: 2026-27 → 2027-28. */
function followingYear(latest: { endDate: string }) {
  const startDate = addDays(latest.endDate, 1);
  const startYear = Number(startDate.slice(0, 4));
  const endDate = addDays(`${startYear + 1}${startDate.slice(4)}`, -1);
  const endYear = Number(endDate.slice(0, 4));
  return { name: endYear === startYear ? String(startYear) : `${startYear}-${String(endYear).slice(2)}`, startDate, endDate };
}

/**
 * Years a class can be made for. A centre plans next year's classes before
 * head office has opened that year, so the year after the latest one is
 * offered too and is created the first time a class is saved in it.
 */
export async function yearChoices() {
  const years = await listYears();
  const current = years.find((y) => y.isCurrent) ?? years[years.length - 1] ?? null;
  const choices = years.map((y) => ({ id: y.id, name: y.name, isCurrent: y.id === current?.id }));
  const latest = years[years.length - 1];
  if (latest && latest.id === current?.id) choices.push({ id: NEXT_YEAR, name: followingYear(latest).name, isCurrent: false });
  return { choices, currentId: current?.id ?? '' };
}

async function resolveYearId(db: DbOrTx, value: string) {
  if (value !== NEXT_YEAR) {
    const [year] = await db.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.id, value)).limit(1);
    if (!year) fail('Choose the academic year');
    return year.id;
  }
  const [latest] = await db.select().from(academicYears).orderBy(desc(academicYears.startDate)).limit(1);
  if (!latest) fail('Head office has not set up an academic year yet');
  const next = followingYear(latest);
  await db.insert(academicYears).values({ ...next, isCurrent: false }).onConflictDoNothing({ target: academicYears.name });
  const [year] = await db.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.name, next.name)).limit(1);
  return year.id;
}

/** Cards for the Classes screen: each class with its teacher, seats and children. */
export async function listBatches(ctx: Ctx, filters: { yearId?: string } = {}) {
  const db = await getDb();
  const yearId = isUuid(filters.yearId) ? filters.yearId : (await currentYear(db))?.id;
  const rows = await db
    .select({
      id: batches.id,
      name: batches.name,
      capacity: batches.capacity,
      timing: batches.timing,
      active: batches.active,
      programmeId: batches.programmeId,
      academicYearId: batches.academicYearId,
      teacherId: batches.teacherId,
      programmeName: programmes.name,
      teacherName: staff.name,
      yearName: academicYears.name,
      // Everyone ever placed here, including those who left: a class with records cannot be deleted.
      records: sql<number>`(select count(*)::int from students s where s.batch_id = ${batches.id} and s.deleted_at is null)`,
    })
    .from(batches)
    .innerJoin(programmes, eq(programmes.id, batches.programmeId))
    .innerJoin(academicYears, eq(academicYears.id, batches.academicYearId))
    .leftJoin(staff, eq(staff.id, batches.teacherId))
    .where(and(eq(batches.centreId, ctx.centre.id), yearId ? eq(batches.academicYearId, yearId) : undefined))
    .orderBy(desc(batches.active), asc(programmes.sort), asc(batches.name));

  const ids = rows.map((r) => r.id);
  const children = ids.length
    ? await db
        .select({ id: students.id, name: students.name, photo: students.photo, batchId: students.batchId })
        .from(students)
        .where(and(eq(students.centreId, ctx.centre.id), inArray(students.batchId, ids), eq(students.status, 'active'), isNull(students.deletedAt)))
        .orderBy(asc(students.name))
    : [];
  return {
    yearId: yearId ?? '',
    batches: rows.map((row) => {
      const list = children.filter((c) => c.batchId === row.id);
      return { ...row, children: list, filled: list.length };
    }),
  };
}

/** Every class a child could be placed in, with seats taken, for dropdowns. */
export async function batchOptions(ctx: Ctx, opts: { includeInactive?: boolean } = {}) {
  const db = await getDb();
  return db
    .select({
      id: batches.id,
      name: batches.name,
      capacity: batches.capacity,
      programmeId: batches.programmeId,
      programmeName: programmes.name,
      academicYearId: batches.academicYearId,
      yearName: academicYears.name,
      isCurrentYear: academicYears.isCurrent,
      active: batches.active,
      filled: sql<number>`(select count(*)::int from students s where s.batch_id = ${batches.id} and s.status = 'active' and s.deleted_at is null)`,
    })
    .from(batches)
    .innerJoin(programmes, eq(programmes.id, batches.programmeId))
    .innerJoin(academicYears, eq(academicYears.id, batches.academicYearId))
    .where(and(eq(batches.centreId, ctx.centre.id), opts.includeInactive ? undefined : eq(batches.active, true)))
    .orderBy(asc(academicYears.startDate), asc(programmes.sort), asc(batches.name));
}
export type BatchOption = Awaited<ReturnType<typeof batchOptions>>[number];

async function checkBatchRefs(db: DbOrTx, centreId: string, data: z.output<typeof batchInput>) {
  const [programme] = await db.select({ id: programmes.id }).from(programmes).where(eq(programmes.id, data.programmeId)).limit(1);
  if (!programme) fail('Choose a programme');
  if (data.teacherId) {
    const [teacher] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, data.teacherId), eq(staff.centreId, centreId), isNull(staff.deletedAt)))
      .limit(1);
    if (!teacher) fail('That teacher is not on your staff list');
  }
}

export async function createBatch(ctx: Ctx, raw: BatchInput) {
  requireManager(ctx);
  const data = batchInput.parse(raw);
  const db = await getDb();
  await checkBatchRefs(db, ctx.centre.id, data);
  const academicYearId = await resolveYearId(db, data.academicYearId);
  const [row] = await db
    .insert(batches)
    .values({ ...data, academicYearId, centreId: ctx.centre.id })
    .returning();
  await audit(ctx.session, 'batch.create', { entity: 'batch', entityId: row.id, centreId: ctx.centre.id, summary: `Class ${row.name} added` });
  return row;
}

export async function updateBatch(ctx: Ctx, id: string, raw: BatchInput) {
  requireManager(ctx);
  const data = batchInput.parse(raw);
  const db = await getDb();
  const current = await loadBatch(db, ctx.centre.id, id);
  await checkBatchRefs(db, ctx.centre.id, data);
  const academicYearId = await resolveYearId(db, data.academicYearId);
  if (current.programmeId !== data.programmeId || current.academicYearId !== academicYearId) {
    const [{ n }] = await db.select({ n: count() }).from(students).where(and(eq(students.batchId, id), isNull(students.deletedAt)));
    if (n > 0) fail('This class has children in it, so its programme and year cannot change. Add a new class instead.');
  }
  const [row] = await db
    .update(batches)
    .set({ ...data, academicYearId })
    .where(and(eq(batches.id, id), eq(batches.centreId, ctx.centre.id)))
    .returning();
  await audit(ctx.session, 'batch.update', { entity: 'batch', entityId: id, centreId: ctx.centre.id, summary: `Class ${row.name} edited` });
  return row;
}

/** A closed class keeps its history but is no longer offered for new children or attendance. */
export async function setBatchActive(ctx: Ctx, id: string, active: boolean) {
  requireManager(ctx);
  const db = await getDb();
  const current = await loadBatch(db, ctx.centre.id, id);
  await db.update(batches).set({ active }).where(and(eq(batches.id, id), eq(batches.centreId, ctx.centre.id)));
  await audit(ctx.session, active ? 'batch.reopen' : 'batch.close', { entity: 'batch', entityId: id, centreId: ctx.centre.id, summary: `Class ${current.name} ${active ? 'reopened' : 'closed'}` });
}

export async function deleteBatch(ctx: Ctx, id: string) {
  requireManager(ctx);
  const db = await getDb();
  const current = await loadBatch(db, ctx.centre.id, id);
  const [{ n }] = await db.select({ n: count() }).from(students).where(and(eq(students.batchId, id), isNull(students.deletedAt)));
  if (n > 0) fail('This class has children in its records. Move them to another class first, or close the class instead.');
  await db.delete(batches).where(and(eq(batches.id, id), eq(batches.centreId, ctx.centre.id)));
  await audit(ctx.session, 'batch.delete', { entity: 'batch', entityId: id, centreId: ctx.centre.id, summary: `Class ${current.name} deleted` });
}
