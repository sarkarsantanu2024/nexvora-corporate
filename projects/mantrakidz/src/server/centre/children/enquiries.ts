/** Admission enquiries of one centre: the list, one enquiry, and every change to it. */
import { and, count, desc, eq, ilike, lte, notInArray, or } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { activityNotes, admissionEnquiries, ENQUIRY_STAGES, programmes, students, type EnquiryStage } from '@/db/schema';
import { ApiError, fail } from '@/lib/api';
import { audit } from '@/lib/audit';
import { formatDate, todayIST } from '@/lib/date';
import { optionalDay, optionalEmail, optionalUuid, phone, requiredText, text } from '@/lib/validators';
import { STAGE_LABELS } from './constants';
import { insertNote, isUuid, likeTerm, listNotes, requireManager, type Ctx } from './shared';

export const PAGE_SIZE = 25;

export const enquiryInput = z.object({
  childName: requiredText("Child's name", 80),
  dob: optionalDay,
  programmeId: optionalUuid,
  parentName: requiredText("Parent's name", 80),
  phone,
  email: optionalEmail,
  area: text(80),
  message: text(1000),
  source: z.string().trim().min(1).max(40).default('walk-in'),
  nextFollowUp: optionalDay,
});
export type EnquiryInput = z.input<typeof enquiryInput>;

export const stageInput = z.object({
  stage: z.enum(ENQUIRY_STAGES),
  visitOn: optionalDay,
  lostReason: text(300),
  nextFollowUp: optionalDay,
});
export type StageInput = z.input<typeof stageInput>;

export type EnquiryFilters = { stage?: string; q?: string; source?: string; due?: boolean; page?: number };

export async function loadEnquiry(db: DbOrTx, centreId: string, id: string) {
  if (!isUuid(id)) throw new ApiError(404, 'Enquiry not found');
  const [row] = await db
    .select()
    .from(admissionEnquiries)
    .where(and(eq(admissionEnquiries.id, id), eq(admissionEnquiries.centreId, centreId)))
    .limit(1);
  if (!row) throw new ApiError(404, 'Enquiry not found');
  return row;
}

export async function listEnquiries(ctx: Ctx, filters: EnquiryFilters = {}) {
  const db = await getDb();
  const e = admissionEnquiries;
  const today = todayIST();
  const q = filters.q?.trim();
  // Everything except the stage, so the tab counts match the other filters.
  const base = and(
    eq(e.centreId, ctx.centre.id),
    q ? or(ilike(e.childName, likeTerm(q)), ilike(e.parentName, likeTerm(q)), ilike(e.phone, likeTerm(q))) : undefined,
    filters.source ? eq(e.source, filters.source) : undefined,
    filters.due ? and(lte(e.nextFollowUp, today), notInArray(e.stage, ['admitted', 'lost'])) : undefined,
  );
  const stage = ENQUIRY_STAGES.find((s) => s === filters.stage);
  const where = stage ? and(base, eq(e.stage, stage)) : base;
  const page = Math.max(1, filters.page ?? 1);

  const [rows, stageRows, [due], sources] = await Promise.all([
    db
      .select({
        id: e.id,
        childName: e.childName,
        dob: e.dob,
        parentName: e.parentName,
        phone: e.phone,
        source: e.source,
        stage: e.stage,
        nextFollowUp: e.nextFollowUp,
        visitOn: e.visitOn,
        createdAt: e.createdAt,
        programmeName: programmes.name,
      })
      .from(e)
      .leftJoin(programmes, eq(programmes.id, e.programmeId))
      .where(where)
      .orderBy(desc(e.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ stage: e.stage, n: count() }).from(e).where(base).groupBy(e.stage),
    db
      .select({ n: count() })
      .from(e)
      .where(and(eq(e.centreId, ctx.centre.id), lte(e.nextFollowUp, today), notInArray(e.stage, ['admitted', 'lost']))),
    db.selectDistinct({ source: e.source }).from(e).where(eq(e.centreId, ctx.centre.id)),
  ]);

  const counts = Object.fromEntries(ENQUIRY_STAGES.map((s) => [s, 0])) as Record<EnquiryStage, number>;
  for (const row of stageRows) counts[row.stage] = row.n;
  const all = stageRows.reduce((sum, row) => sum + row.n, 0);
  return { rows, counts, all, total: stage ? counts[stage] : all, dueCount: due.n, sources: sources.map((s) => s.source), page, pageSize: PAGE_SIZE, today };
}

export async function getEnquiry(ctx: Ctx, id: string) {
  const db = await getDb();
  const enquiry = await loadEnquiry(db, ctx.centre.id, id);
  const [[programme], notes, [child]] = await Promise.all([
    enquiry.programmeId ? db.select({ name: programmes.name }).from(programmes).where(eq(programmes.id, enquiry.programmeId)) : Promise.resolve([]),
    listNotes('admission_enquiry', enquiry.id),
    enquiry.convertedStudentId
      ? db.select({ id: students.id, name: students.name, admissionNo: students.admissionNo }).from(students).where(eq(students.id, enquiry.convertedStudentId))
      : Promise.resolve([]),
  ]);
  return { enquiry, programmeName: programme?.name ?? '', notes, child: child ?? null };
}

export async function createEnquiry(ctx: Ctx, raw: EnquiryInput) {
  const data = enquiryInput.parse(raw);
  const db = await getDb();
  const [row] = await db
    .insert(admissionEnquiries)
    .values({ ...data, centreId: ctx.centre.id })
    .returning();
  await audit(ctx.session, 'enquiry.create', { entity: 'admission_enquiry', entityId: row.id, centreId: ctx.centre.id, summary: `Enquiry for ${row.childName} (${data.source})` });
  return row;
}

export async function updateEnquiry(ctx: Ctx, id: string, raw: EnquiryInput) {
  const data = enquiryInput.parse(raw);
  const db = await getDb();
  await loadEnquiry(db, ctx.centre.id, id);
  const [row] = await db
    .update(admissionEnquiries)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(admissionEnquiries.id, id), eq(admissionEnquiries.centreId, ctx.centre.id)))
    .returning();
  await audit(ctx.session, 'enquiry.update', { entity: 'admission_enquiry', entityId: id, centreId: ctx.centre.id, summary: `Enquiry for ${row.childName} edited` });
  return row;
}

/** Move an enquiry along. A visit needs its date and a lost enquiry its reason. */
export async function setEnquiryStage(ctx: Ctx, id: string, raw: StageInput) {
  const data = stageInput.parse(raw);
  const db = await getDb();
  const current = await loadEnquiry(db, ctx.centre.id, id);
  if (current.stage === 'admitted') fail('This child is already admitted');
  if (data.stage === 'admitted') fail('Use "Admit this child" so the child is added to your records');
  if (data.stage === 'visit_scheduled' && !data.visitOn) throw new ApiError(422, 'Pick the visit date', { visitOn: 'Pick the visit date' });
  if (data.stage === 'lost' && !data.lostReason) throw new ApiError(422, 'Write why the enquiry was lost', { lostReason: 'Write the reason' });

  const visitOn = data.stage === 'visit_scheduled' ? data.visitOn : current.visitOn;
  const [row] = await db
    .update(admissionEnquiries)
    .set({
      stage: data.stage,
      visitOn,
      lostReason: data.stage === 'lost' ? data.lostReason : '',
      // A lost enquiry has nobody left to call.
      nextFollowUp: data.stage === 'lost' ? null : (data.nextFollowUp ?? current.nextFollowUp),
      updatedAt: new Date(),
    })
    .where(and(eq(admissionEnquiries.id, id), eq(admissionEnquiries.centreId, ctx.centre.id)))
    .returning();

  if (current.stage !== data.stage) {
    const extra = data.stage === 'visit_scheduled' ? `, visit on ${formatDate(visitOn)}` : data.stage === 'lost' ? `: ${data.lostReason}` : '';
    await insertNote(db, ctx.session, 'admission_enquiry', id, `Stage changed to ${STAGE_LABELS[data.stage]}${extra}`);
  }
  await audit(ctx.session, 'enquiry.stage', { entity: 'admission_enquiry', entityId: id, centreId: ctx.centre.id, summary: `${row.childName}: ${STAGE_LABELS[data.stage]}` });
  return row;
}

export async function setEnquiryFollowUp(ctx: Ctx, id: string, raw: { nextFollowUp?: string | null }) {
  const nextFollowUp = optionalDay.parse(raw.nextFollowUp);
  const db = await getDb();
  await loadEnquiry(db, ctx.centre.id, id);
  const [row] = await db
    .update(admissionEnquiries)
    .set({ nextFollowUp, updatedAt: new Date() })
    .where(and(eq(admissionEnquiries.id, id), eq(admissionEnquiries.centreId, ctx.centre.id)))
    .returning();
  return row;
}

export async function addEnquiryNote(ctx: Ctx, id: string, raw: { note: string }) {
  const note = requiredText('Note', 1000).parse(raw.note);
  const db = await getDb();
  await loadEnquiry(db, ctx.centre.id, id);
  await insertNote(db, ctx.session, 'admission_enquiry', id, note);
  await db.update(admissionEnquiries).set({ updatedAt: new Date() }).where(eq(admissionEnquiries.id, id));
}

export async function deleteEnquiry(ctx: Ctx, id: string) {
  requireManager(ctx);
  const db = await getDb();
  const row = await loadEnquiry(db, ctx.centre.id, id);
  if (row.convertedStudentId) fail('This enquiry became an admission, so it is kept');
  await db.transaction(async (tx) => {
    await tx.delete(activityNotes).where(and(eq(activityNotes.entityType, 'admission_enquiry'), eq(activityNotes.entityId, id)));
    await tx.delete(admissionEnquiries).where(and(eq(admissionEnquiries.id, id), eq(admissionEnquiries.centreId, ctx.centre.id)));
  });
  await audit(ctx.session, 'enquiry.delete', { entity: 'admission_enquiry', entityId: id, centreId: ctx.centre.id, summary: `Enquiry for ${row.childName} deleted` });
}

/** The enquiry as form values, so a partial REST update can be merged over it. */
export const enquiryAsInput = (row: Awaited<ReturnType<typeof loadEnquiry>>): EnquiryInput => ({
  childName: row.childName,
  dob: row.dob,
  programmeId: row.programmeId,
  parentName: row.parentName,
  phone: row.phone,
  email: row.email,
  area: row.area,
  message: row.message,
  source: row.source,
  nextFollowUp: row.nextFollowUp,
});

