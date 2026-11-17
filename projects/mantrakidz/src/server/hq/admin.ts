/**
 * The smaller head office screens: circulars, enquiries, programmes,
 * settings, academic years, the activity log and removing the sample data.
 */
import { and, asc, desc, eq, gte, ilike, inArray, isNull, like, lt, ne, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import {
  ENQUIRY_STAGES,
  academicYears,
  activityNotes,
  admissionEnquiries,
  announcements,
  auditLog,
  batches,
  centres,
  contactMessages,
  counters,
  feeHeads,
  franchiseLeads,
  programmes,
  students,
  type EnquiryStage,
  type ProgrammeI18n,
  type ProgrammeWords,
} from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { addDays, todayIST } from '@/lib/date';
import { day, optionalDay, optionalEmail, optionalPhone, optionalUuid, requiredText, rupees, slugify, text, uuid } from '@/lib/validators';
import { PROGRAMME_COLOURS, SAMPLE_CONFIRM_WORD } from './constants';
import { PAGE_SIZE, assertAdmin, assertHq, countInt, getSetting, liveCentre, pageOf, putSetting } from './shared';

/* ───────────── circulars to centres ───────────── */

const circularInput = z.object({
  title: requiredText('Title', 160),
  body: text(5000),
  centreId: optionalUuid,
  pinned: z.boolean().default(false),
  publishOn: day,
  expiresOn: optionalDay,
});
export type CircularInput = z.input<typeof circularInput>;

export async function listCirculars() {
  const db = await getDb();
  return db
    .select({ row: announcements, centreName: centres.name })
    .from(announcements)
    .leftJoin(centres, eq(centres.id, announcements.centreId))
    .where(eq(announcements.audience, 'centres'))
    .orderBy(desc(announcements.pinned), desc(announcements.publishOn), desc(announcements.createdAt))
    .limit(200);
}

export async function saveCircular(session: Session, id: string | null, input: CircularInput) {
  assertHq(session);
  const data = circularInput.parse(input);
  if (data.expiresOn && data.expiresOn < data.publishOn) throw new ApiError(400, 'The last day is before the first day', { expiresOn: 'Pick a later date' });
  const db = await getDb();
  if (id) {
    const [row] = await db
      .update(announcements)
      .set(data)
      .where(and(eq(announcements.id, uuid.parse(id)), eq(announcements.audience, 'centres')))
      .returning();
    if (!row) throw new ApiError(404, 'Circular not found');
    await audit(session, 'circular.update', { entity: 'announcement', entityId: row.id, centreId: row.centreId, summary: `Updated circular "${row.title}"` });
    return row;
  }
  const [row] = await db.insert(announcements).values({ ...data, audience: 'centres', createdBy: session.uid }).returning();
  await audit(session, 'circular.create', { entity: 'announcement', entityId: row.id, centreId: row.centreId, summary: `Sent circular "${row.title}"` });
  return row;
}

export async function pinCircular(session: Session, id: string, pinned: boolean) {
  assertHq(session);
  const db = await getDb();
  await db.update(announcements).set({ pinned }).where(and(eq(announcements.id, uuid.parse(id)), eq(announcements.audience, 'centres')));
}

export async function deleteCircular(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const [row] = await db
    .delete(announcements)
    .where(and(eq(announcements.id, uuid.parse(id)), eq(announcements.audience, 'centres')))
    .returning();
  if (!row) throw new ApiError(404, 'Circular not found');
  await audit(session, 'circular.delete', { entity: 'announcement', entityId: row.id, summary: `Deleted circular "${row.title}"` });
}

/* ───────────── admission enquiries, all centres ───────────── */

export type EnquiryFilters = { q?: string; centre?: string; stage?: string; page?: string | number };

function enquiryWhere(filters: EnquiryFilters, withStage = true): SQL | undefined {
  const where: (SQL | undefined)[] = [];
  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${q}%`;
    where.push(or(ilike(admissionEnquiries.childName, pattern), ilike(admissionEnquiries.parentName, pattern), ilike(admissionEnquiries.phone, pattern)));
  }
  if (filters.centre === 'none') where.push(isNull(admissionEnquiries.centreId));
  else if (filters.centre && uuid.safeParse(filters.centre).success) where.push(eq(admissionEnquiries.centreId, filters.centre));
  if (withStage && filters.stage && (ENQUIRY_STAGES as readonly string[]).includes(filters.stage)) {
    where.push(eq(admissionEnquiries.stage, filters.stage as EnquiryStage));
  }
  return where.length ? and(...where) : undefined;
}

export async function listEnquiries(filters: EnquiryFilters = {}) {
  const db = await getDb();
  const page = pageOf(filters.page);
  const where = enquiryWhere(filters);
  const [rows, [{ n }], stageRows, [{ n: unassigned }]] = await Promise.all([
    db
      .select({ row: admissionEnquiries, centreName: centres.name, programmeName: programmes.name })
      .from(admissionEnquiries)
      .leftJoin(centres, eq(centres.id, admissionEnquiries.centreId))
      .leftJoin(programmes, eq(programmes.id, admissionEnquiries.programmeId))
      .where(where)
      .orderBy(desc(admissionEnquiries.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(admissionEnquiries).where(where),
    db.select({ stage: admissionEnquiries.stage, n: countInt() }).from(admissionEnquiries).where(enquiryWhere(filters, false)).groupBy(admissionEnquiries.stage),
    db.select({ n: countInt() }).from(admissionEnquiries).where(isNull(admissionEnquiries.centreId)),
  ]);
  const stages = Object.fromEntries(ENQUIRY_STAGES.map((stage) => [stage, 0])) as Record<EnquiryStage, number>;
  for (const row of stageRows) stages[row.stage] = row.n;
  return { rows, total: n, page, pageSize: PAGE_SIZE, stages, unassigned };
}

/** Hands an enquiry that came with no centre to the centre that should call the parent. */
export async function assignEnquiry(session: Session, enquiryId: string, centreId: string) {
  assertHq(session);
  const db = await getDb();
  const [centre] = await db.select({ id: centres.id, name: centres.name }).from(centres).where(and(eq(centres.id, uuid.parse(centreId)), liveCentre)).limit(1);
  if (!centre) throw new ApiError(404, 'School not found');
  const [row] = await db
    .update(admissionEnquiries)
    .set({ centreId: centre.id, updatedAt: new Date() })
    // Only an enquiry nobody owns yet: head office does not take one away from a centre.
    .where(and(eq(admissionEnquiries.id, uuid.parse(enquiryId)), isNull(admissionEnquiries.centreId)))
    .returning();
  if (!row) throw new ApiError(400, 'This enquiry already belongs to a school');
  await audit(session, 'enquiry.assign', { entity: 'admission_enquiry', entityId: row.id, centreId: centre.id, summary: `Enquiry for ${row.childName} given to ${centre.name}` });
  return row;
}

/* ───────────── contact messages from the website ───────────── */

export async function listMessages(filters: { show?: string; page?: string | number } = {}) {
  const db = await getDb();
  const page = pageOf(filters.page);
  const where = filters.show === 'all' ? undefined : filters.show === 'handled' ? eq(contactMessages.handled, true) : eq(contactMessages.handled, false);
  const [rows, [{ n }], [{ n: open }]] = await Promise.all([
    db
      .select({ row: contactMessages, centreName: centres.name })
      .from(contactMessages)
      .leftJoin(centres, eq(centres.id, contactMessages.centreId))
      .where(where)
      .orderBy(desc(contactMessages.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(contactMessages).where(where),
    db.select({ n: countInt() }).from(contactMessages).where(eq(contactMessages.handled, false)),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE, open };
}

export async function setMessageHandled(session: Session, id: string, handled: boolean) {
  assertHq(session);
  const db = await getDb();
  await db.update(contactMessages).set({ handled }).where(eq(contactMessages.id, uuid.parse(id)));
}

/* ───────────── programmes ───────────── */

/** One language's wording. Same length limits as the English columns; empty means "show the English". */
const programmeWords = z
  .object({
    name: text(60),
    ageLabel: text(60),
    tagline: text(120),
    description: text(2000),
    highlights: z.array(z.string().trim().max(160)).max(12).default([]),
    timing: text(80),
  })
  .default({});

/** Drops what was left empty, so the website's fallback to English is decided by absence alone. */
function compactWords(words: z.output<typeof programmeWords>): ProgrammeWords | undefined {
  const out: ProgrammeWords = {};
  if (words.name) out.name = words.name;
  if (words.ageLabel) out.ageLabel = words.ageLabel;
  if (words.tagline) out.tagline = words.tagline;
  if (words.description) out.description = words.description;
  if (words.timing) out.timing = words.timing;
  const points = words.highlights.filter(Boolean);
  if (points.length) out.highlights = points;
  return Object.keys(out).length ? out : undefined;
}

const LANGUAGE_NAMES = { bn: 'Bengali', hi: 'Hindi' } as const;

const programmeInput = z
  .object({
    name: requiredText('Name', 60),
    slug: z.string().trim().max(60).default(''),
    ageLabel: text(60),
    ageFromMonths: z.coerce.number().int('Whole months only').min(0).max(120).default(0),
    ageToMonths: z.coerce.number().int('Whole months only').min(0).max(120).default(0),
    tagline: text(120),
    description: text(2000),
    highlights: z.array(z.string().trim().max(160)).max(12).default([]),
    image: text(500),
    color: z.enum(PROGRAMME_COLOURS).default('indigo'),
    seatsPerClass: z.coerce.number().int().min(1, 'At least 1 seat').max(100).default(12),
    timing: text(80),
    suggestedMonthlyFee: rupees.default(0),
    sort: z.coerce.number().int().min(0).max(999).default(0),
    active: z.boolean().default(true),
    i18n: z.object({ bn: programmeWords, hi: programmeWords }).default({}),
  })
  .superRefine((value, ctx) => {
    if (value.ageToMonths < value.ageFromMonths) ctx.addIssue({ code: 'custom', path: ['ageToMonths'], message: 'Must not be less than the starting age' });
  });
export type ProgrammeInput = z.input<typeof programmeInput>;

/** Programmes with how many children are on roll in each, in one query. */
export async function listProgrammes() {
  const db = await getDb();
  return db
    .select({ row: programmes, children: sql<number>`count(${students.id})::int` })
    .from(programmes)
    .leftJoin(students, and(eq(students.programmeId, programmes.id), eq(students.status, 'active'), isNull(students.deletedAt)))
    .groupBy(programmes.id)
    .orderBy(asc(programmes.sort), asc(programmes.name));
}

export async function getProgramme(id: string) {
  const db = await getDb();
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ApiError(404, 'Programme not found');
  const [row] = await db.select().from(programmes).where(eq(programmes.id, parsed.data)).limit(1);
  if (!row) throw new ApiError(404, 'Programme not found');
  return row;
}

export async function saveProgramme(session: Session, id: string | null, input: ProgrammeInput) {
  assertHq(session);
  const parsed = programmeInput.parse(input);
  const i18n: ProgrammeI18n = {};
  const bn = compactWords(parsed.i18n.bn);
  const hi = compactWords(parsed.i18n.hi);
  if (bn) i18n.bn = bn;
  if (hi) i18n.hi = hi;
  const data = { ...parsed, slug: slugify(parsed.slug || parsed.name), highlights: parsed.highlights.filter(Boolean), i18n };
  if (!data.slug) throw new ApiError(400, 'Enter a web address name', { slug: 'Use letters and numbers' });
  const db = await getDb();
  const [clash] = await db
    .select({ id: programmes.id })
    .from(programmes)
    .where(id ? and(eq(programmes.slug, data.slug), ne(programmes.id, id)) : eq(programmes.slug, data.slug))
    .limit(1);
  if (clash) throw new ApiError(400, 'Another programme already uses this web address name', { slug: 'Already in use' });

  if (id) {
    const before = await getProgramme(id);
    const [row] = await db.update(programmes).set(data).where(eq(programmes.id, before.id)).returning();
    // Says which language's wording changed, so a translation edit can be told apart in the activity log.
    const changed = (['bn', 'hi'] as const).filter((lang) => JSON.stringify(before.i18n?.[lang] ?? {}) !== JSON.stringify(i18n[lang] ?? {})).map((lang) => LANGUAGE_NAMES[lang]);
    await audit(session, 'programme.update', {
      entity: 'programme',
      entityId: row.id,
      summary: `Updated programme ${row.name}${changed.length ? `, including the ${changed.join(' and ')} wording` : ''}`,
      meta: changed.length ? { translations: changed } : {},
    });
    return row;
  }
  const [row] = await db.insert(programmes).values(data).returning();
  await audit(session, 'programme.create', { entity: 'programme', entityId: row.id, summary: `Added programme ${row.name}` });
  return row;
}

/** A programme that anything points to is kept; it can be switched off instead. */
export async function deleteProgramme(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const programme = await getProgramme(id);
  const [[kids], [classes], [fees], [asked]] = await Promise.all([
    db.select({ n: countInt() }).from(students).where(eq(students.programmeId, programme.id)),
    db.select({ n: countInt() }).from(batches).where(eq(batches.programmeId, programme.id)),
    db.select({ n: countInt() }).from(feeHeads).where(eq(feeHeads.programmeId, programme.id)),
    db.select({ n: countInt() }).from(admissionEnquiries).where(eq(admissionEnquiries.programmeId, programme.id)),
  ]);
  const used = [
    kids.n ? `${kids.n} ${kids.n === 1 ? 'child' : 'children'}` : '',
    classes.n ? `${classes.n} ${classes.n === 1 ? 'class' : 'classes'}` : '',
    fees.n ? `${fees.n} fee ${fees.n === 1 ? 'head' : 'heads'}` : '',
    asked.n ? `${asked.n} ${asked.n === 1 ? 'enquiry' : 'enquiries'}` : '',
  ].filter(Boolean);
  if (used.length) {
    throw new ApiError(400, `${programme.name} is used by ${used.join(', ')}, so it cannot be deleted. Make it inactive instead.`);
  }
  await db.delete(programmes).where(eq(programmes.id, programme.id));
  await audit(session, 'programme.delete', { entity: 'programme', entityId: programme.id, summary: `Deleted programme ${programme.name}` });
}

/* ───────────── settings ───────────── */

const orgInput = z.object({ name: requiredText('Name', 80), legalName: text(160), phone: optionalPhone, email: optionalEmail, address: text(300) });
const dueDay = z.coerce.number().int('Enter a day from 1 to 28').min(1, 'Enter a day from 1 to 28').max(28, 'Enter a day from 1 to 28');
const royaltyInput = z.object({ dueDay });
const feesInput = z.object({ dueDay, reminderTemplate: requiredText('Reminder message', 600), receiptFooter: text(300) });

export async function loadSettings() {
  const db = await getDb();
  const [org, royalty, fees, years, [demoCentres], [demoLeads]] = await Promise.all([
    getSetting('org', db),
    getSetting('royalty', db),
    getSetting('fees', db),
    db.select().from(academicYears).orderBy(desc(academicYears.startDate)),
    db.select({ n: countInt() }).from(centres).where(eq(centres.isDemo, true)),
    db.select({ n: countInt() }).from(franchiseLeads).where(eq(franchiseLeads.isDemo, true)),
  ]);
  return { org, royalty, fees, years, sample: { centres: demoCentres.n, leads: demoLeads.n } };
}

export async function saveOrgSettings(session: Session, input: z.input<typeof orgInput>) {
  assertAdmin(session);
  await putSetting('org', orgInput.parse(input));
  await audit(session, 'settings.org', { entity: 'settings', entityId: 'org', summary: 'Updated the organisation details' });
}

export async function saveRoyaltySettings(session: Session, input: z.input<typeof royaltyInput>) {
  assertAdmin(session);
  const data = royaltyInput.parse(input);
  await putSetting('royalty', data);
  await audit(session, 'settings.royalty', { entity: 'settings', entityId: 'royalty', summary: `Royalty is now due on day ${data.dueDay} of the next month` });
}

export async function saveFeeSettings(session: Session, input: z.input<typeof feesInput>) {
  assertAdmin(session);
  await putSetting('fees', feesInput.parse(input));
  await audit(session, 'settings.fees', { entity: 'settings', entityId: 'fees', summary: 'Updated the default fee settings' });
}

const yearInput = z
  .object({ name: requiredText('Name', 20), startDate: day, endDate: day })
  .refine((value) => value.endDate > value.startDate, { path: ['endDate'], message: 'The end date must be after the start date' });

export async function addAcademicYear(session: Session, input: z.input<typeof yearInput>) {
  assertAdmin(session);
  const data = yearInput.parse(input);
  const db = await getDb();
  const [clash] = await db.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.name, data.name)).limit(1);
  if (clash) throw new ApiError(400, 'That academic year already exists', { name: 'Already added' });
  const [row] = await db.insert(academicYears).values(data).returning();
  await audit(session, 'year.create', { entity: 'academic_year', entityId: row.id, summary: `Added academic year ${row.name}` });
  return row;
}

/** Exactly one year is current: the old one is switched off in the same transaction. */
export async function setCurrentYear(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const row = await db.transaction(async (tx) => {
    const [year] = await tx.select().from(academicYears).where(eq(academicYears.id, uuid.parse(id))).limit(1);
    if (!year) throw new ApiError(404, 'Academic year not found');
    await tx.update(academicYears).set({ isCurrent: false }).where(ne(academicYears.id, year.id));
    await tx.update(academicYears).set({ isCurrent: true }).where(eq(academicYears.id, year.id));
    return year;
  });
  await audit(session, 'year.current', { entity: 'academic_year', entityId: row.id, summary: `${row.name} is now the current academic year` });
}

/**
 * Deletes the sample centres (their children, bills, receipts, attendance,
 * expenses, royalty and logins go with them) and the sample franchise leads.
 * Real centres, real leads and head office logins are not touched.
 */
export async function removeSampleData(session: Session, confirmation: string) {
  assertAdmin(session);
  if (confirmation.trim() !== SAMPLE_CONFIRM_WORD) throw new ApiError(400, `Type ${SAMPLE_CONFIRM_WORD} to confirm`, { confirmation: `Type ${SAMPLE_CONFIRM_WORD}` });
  const db = await getDb();
  const removed = await db.transaction(async (tx) => {
    const demoCentres = await tx.select({ id: centres.id }).from(centres).where(eq(centres.isDemo, true));
    const demoLeads = await tx.select({ id: franchiseLeads.id }).from(franchiseLeads).where(eq(franchiseLeads.isDemo, true));
    const centreIds = demoCentres.map((row) => row.id);
    const leadIds = demoLeads.map((row) => row.id);

    // Notes and running numbers are tied by id, not by a foreign key, so they are cleared by hand.
    if (leadIds.length) {
      await tx.delete(activityNotes).where(and(eq(activityNotes.entityType, 'franchise_lead'), inArray(activityNotes.entityId, leadIds)));
      await tx.delete(franchiseLeads).where(inArray(franchiseLeads.id, leadIds));
    }
    if (centreIds.length) {
      await tx.delete(activityNotes).where(and(eq(activityNotes.entityType, 'centre'), inArray(activityNotes.entityId, centreIds)));
      for (const id of centreIds) await tx.delete(counters).where(like(counters.key, `${id}:%`));
      await tx.delete(centres).where(inArray(centres.id, centreIds));
    }
    const result = { centres: centreIds.length, leads: leadIds.length };
    await audit(session, 'sample.remove', { entity: 'settings', summary: `Removed sample data: ${result.centres} centres, ${result.leads} franchise leads` }, tx);
    return result;
  });
  return removed;
}

/* ───────────── activity log ───────────── */

export type AuditFilters = { centre?: string; user?: string; action?: string; from?: string; to?: string; page?: string | number };

export async function listAudit(session: Session, filters: AuditFilters = {}) {
  assertAdmin(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const where: (SQL | undefined)[] = [];
  if (filters.centre === 'hq') where.push(isNull(auditLog.centreId));
  else if (filters.centre && uuid.safeParse(filters.centre).success) where.push(eq(auditLog.centreId, filters.centre));
  if (filters.user && uuid.safeParse(filters.user).success) where.push(eq(auditLog.userId, filters.user));
  // "payment" finds payment.create, payment.void and so on. Wildcards typed by the person are taken literally.
  const prefix = filters.action?.trim().replace(/[%_\\]/g, '');
  if (prefix) where.push(like(auditLog.action, `${prefix}%`));
  const isDay = (value?: string) => Boolean(value && day.safeParse(value).success);
  // The log is kept in UTC; a day picked on screen is an India day.
  if (isDay(filters.from)) where.push(gte(auditLog.createdAt, new Date(`${filters.from}T00:00:00+05:30`)));
  if (isDay(filters.to)) where.push(lt(auditLog.createdAt, new Date(`${addDays(filters.to as string, 1)}T00:00:00+05:30`)));
  const cond = where.length ? and(...where) : undefined;

  const [rows, [{ n }], people, kinds] = await Promise.all([
    db
      .select({ row: auditLog, centreName: centres.name })
      .from(auditLog)
      .leftJoin(centres, eq(centres.id, auditLog.centreId))
      .where(cond)
      .orderBy(desc(auditLog.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(auditLog).where(cond),
    db
      .select({ id: auditLog.userId, name: sql<string>`max(${auditLog.userName})` })
      .from(auditLog)
      .where(sql`${auditLog.userId} is not null`)
      .groupBy(auditLog.userId)
      .orderBy(sql`max(${auditLog.userName})`),
    // The first word of each action ("payment", "centre"), for the filter list.
    db
      .select({ kind: sql<string>`split_part(${auditLog.action}, '.', 1)` })
      .from(auditLog)
      .groupBy(sql`split_part(${auditLog.action}, '.', 1)`)
      .orderBy(sql`split_part(${auditLog.action}, '.', 1)`),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE, people, kinds: kinds.map((row) => row.kind), today: todayIST() };
}
