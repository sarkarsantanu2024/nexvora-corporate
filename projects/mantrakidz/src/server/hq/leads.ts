/**
 * Franchise leads: people who asked about opening a centre. Website enquiries
 * land here with source 'website' and stage 'new'; head office works them
 * through the stages until they become a centre or are lost.
 */
import { and, asc, desc, eq, ilike, inArray, isNull, lte, notInArray, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { FRANCHISE_STAGES, activityNotes, centres, franchiseLeads, users, type FranchiseLead, type FranchiseStage } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { todayIST } from '@/lib/date';
import { optionalDay, optionalEmail, optionalUuid, phone, requiredText, text, uuid } from '@/lib/validators';
import { insertCentre } from './centres';
import { STAGE_LABELS } from './constants';
import { PAGE_SIZE, assertAdmin, assertHq, countInt, insertNote, isAdmin, pageOf } from './shared';
import { insertLogin } from './users';

/** Stages where nobody needs to follow up any more. */
const CLOSED: FranchiseStage[] = ['onboarded', 'lost'];

export type LeadFilters = { q?: string; stage?: string; source?: string; page?: string | number };

function leadWhere(filters: LeadFilters, withStage = true): SQL | undefined {
  const where: (SQL | undefined)[] = [];
  const q = filters.q?.trim();
  if (q) {
    const like = `%${q}%`;
    where.push(or(ilike(franchiseLeads.name, like), ilike(franchiseLeads.phone, like), ilike(franchiseLeads.city, like), ilike(franchiseLeads.email, like)));
  }
  if (withStage && filters.stage && (FRANCHISE_STAGES as readonly string[]).includes(filters.stage)) {
    where.push(eq(franchiseLeads.stage, filters.stage as FranchiseStage));
  }
  if (filters.source) where.push(eq(franchiseLeads.source, filters.source));
  return where.length ? and(...where) : undefined;
}

const listColumns = {
  id: franchiseLeads.id,
  name: franchiseLeads.name,
  phone: franchiseLeads.phone,
  email: franchiseLeads.email,
  city: franchiseLeads.city,
  state: franchiseLeads.state,
  investmentRange: franchiseLeads.investmentRange,
  source: franchiseLeads.source,
  stage: franchiseLeads.stage,
  nextFollowUp: franchiseLeads.nextFollowUp,
  assignedTo: franchiseLeads.assignedTo,
  assignedName: users.name,
  createdAt: franchiseLeads.createdAt,
};
export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  investmentRange: string;
  source: string;
  stage: FranchiseStage;
  nextFollowUp: string | null;
  assignedTo: string | null;
  assignedName: string | null;
  createdAt: Date;
};

/** Count per stage for the current search and source (the stage filter itself is left out, so the tabs stay meaningful). */
export async function leadStageCounts(filters: LeadFilters = {}) {
  const db = await getDb();
  const rows = await db.select({ stage: franchiseLeads.stage, n: countInt() }).from(franchiseLeads).where(leadWhere(filters, false)).groupBy(franchiseLeads.stage);
  const counts = Object.fromEntries(FRANCHISE_STAGES.map((stage) => [stage, 0])) as Record<FranchiseStage, number>;
  for (const row of rows) counts[row.stage] = row.n;
  return counts;
}

/** One page of leads for the table view. */
export async function listLeads(filters: LeadFilters = {}) {
  const db = await getDb();
  const page = pageOf(filters.page);
  const where = leadWhere(filters);
  const [rows, [{ n }]] = await Promise.all([
    db
      .select(listColumns)
      .from(franchiseLeads)
      .leftJoin(users, eq(users.id, franchiseLeads.assignedTo))
      .where(where)
      .orderBy(desc(franchiseLeads.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(franchiseLeads).where(where),
  ]);
  return { rows: rows as LeadRow[], total: n, page, pageSize: PAGE_SIZE };
}

const BOARD_LIMIT = 30;

/** The pipeline board: the newest leads of each stage, in one query. */
export async function leadBoard(filters: LeadFilters = {}) {
  const db = await getDb();
  const ranked = db
    .select({
      id: franchiseLeads.id,
      rank: sql<number>`row_number() over (partition by ${franchiseLeads.stage} order by ${franchiseLeads.createdAt} desc)`.as('rank'),
    })
    .from(franchiseLeads)
    .where(leadWhere(filters, false))
    .as('ranked');
  const rows = await db
    .select(listColumns)
    .from(franchiseLeads)
    .innerJoin(ranked, eq(ranked.id, franchiseLeads.id))
    .leftJoin(users, eq(users.id, franchiseLeads.assignedTo))
    .where(lte(ranked.rank, BOARD_LIMIT))
    .orderBy(desc(franchiseLeads.createdAt));
  return { rows: rows as LeadRow[], limit: BOARD_LIMIT };
}

/** Every lead matching the filters, for the CSV export. */
export async function exportLeads(filters: LeadFilters = {}) {
  const db = await getDb();
  return db
    .select({ lead: franchiseLeads, assignedName: users.name })
    .from(franchiseLeads)
    .leftJoin(users, eq(users.id, franchiseLeads.assignedTo))
    .where(leadWhere(filters))
    .orderBy(desc(franchiseLeads.createdAt))
    .limit(5000);
}

/** Open leads whose follow-up date is today or already past. */
export async function followUpsDue(limit = 8) {
  const db = await getDb();
  const rows = await db
    .select(listColumns)
    .from(franchiseLeads)
    .leftJoin(users, eq(users.id, franchiseLeads.assignedTo))
    .where(and(lte(franchiseLeads.nextFollowUp, todayIST()), notInArray(franchiseLeads.stage, CLOSED)))
    .orderBy(asc(franchiseLeads.nextFollowUp))
    .limit(limit);
  return rows as LeadRow[];
}

export async function getLead(id: string) {
  const db = await getDb();
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ApiError(404, 'Lead not found');
  const [row] = await db
    .select({ lead: franchiseLeads, assignedName: users.name, centreName: centres.name })
    .from(franchiseLeads)
    .leftJoin(users, eq(users.id, franchiseLeads.assignedTo))
    // A centre deleted later is not linked to: the lead page says so instead of leading to a missing page.
    .leftJoin(centres, and(eq(centres.id, franchiseLeads.convertedCentreId), isNull(centres.deletedAt)))
    .where(eq(franchiseLeads.id, parsed.data))
    .limit(1);
  if (!row) throw new ApiError(404, 'Lead not found');
  return row;
}

/** Head office people a lead can be given to. */
export async function hqPeople() {
  const db = await getDb();
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(inArray(users.role, ['hq_admin', 'hq_staff']), eq(users.active, true)))
    .orderBy(asc(users.name));
}

/* ───────────── changes ───────────── */

const leadFields = {
  name: requiredText('Name', 80),
  phone,
  email: optionalEmail,
  city: text(80),
  state: text(80),
  occupation: text(80),
  investmentRange: text(80),
  hasSpace: z.boolean().nullable().default(null),
  spaceSqft: z.union([z.literal(''), z.null(), z.coerce.number().int().min(0).max(1_000_000)]).transform((v) => (v === '' || v === null ? null : v)).default(null),
  message: text(2000),
  // Free text, so a source the website or an import brings in is never rejected on edit.
  source: z.string().trim().min(1).max(40).default('phone'),
  assignedTo: optionalUuid,
  nextFollowUp: optionalDay,
};
const leadInput = z.object(leadFields);
export type LeadInput = z.input<typeof leadInput>;

export async function createLead(session: Session, input: LeadInput): Promise<FranchiseLead> {
  assertHq(session);
  const data = leadInput.parse(input);
  const db = await getDb();
  const [lead] = await db.insert(franchiseLeads).values({ ...data, stage: 'new' }).returning();
  await audit(session, 'lead.create', { entity: 'franchise_lead', entityId: lead.id, summary: `Added franchise lead ${lead.name}, ${lead.city || 'city not given'}` });
  return lead;
}

const stageChange = z.object({ stage: z.enum(FRANCHISE_STAGES), lostReason: text(300) });
const leadPatch = leadInput.partial().merge(stageChange.partial());

/** Edits details, follow-up date and the person it is assigned to; also moves the stage when one is sent. */
export async function updateLead(session: Session, id: string, input: z.input<typeof leadPatch>): Promise<FranchiseLead> {
  assertHq(session);
  // Only the keys that were sent are changed, so a partial PATCH never resets a field to its default.
  const sent = Object.keys(input ?? {});
  const parsed = leadPatch.parse(input);
  const data = Object.fromEntries(Object.entries(parsed).filter(([key]) => sent.includes(key))) as Partial<typeof parsed>;
  const db = await getDb();
  const { lead: before } = await getLead(id);

  const { stage, lostReason, ...details } = data;
  const set: Partial<typeof franchiseLeads.$inferInsert> = { ...details, updatedAt: new Date() };
  const stageMoves = stage !== undefined && stage !== before.stage;
  if (stageMoves) {
    if (before.stage === 'onboarded') throw new ApiError(400, 'This lead is already a school');
    if (stage === 'onboarded') throw new ApiError(400, 'Use "Convert to school" to onboard this lead');
    if (stage === 'lost' && !lostReason) throw new ApiError(400, 'Say why this lead was lost', { lostReason: 'Give a reason' });
    set.stage = stage;
    set.lostReason = stage === 'lost' ? (lostReason ?? '') : '';
    if (stage === 'lost') set.nextFollowUp = null;
  }

  const lead = await db.transaction(async (tx) => {
    const [row] = await tx.update(franchiseLeads).set(set).where(eq(franchiseLeads.id, before.id)).returning();
    if (stageMoves && stage) {
      // The move goes into the timeline, so the history of a lead reads top to bottom.
      const line = `Stage changed from ${STAGE_LABELS[before.stage]} to ${STAGE_LABELS[stage]}${stage === 'lost' ? `. Reason: ${lostReason}` : ''}`;
      await insertNote(tx, session, 'franchise_lead', before.id, line);
    }
    return row;
  });
  await audit(session, stageMoves ? 'lead.stage' : 'lead.update', {
    entity: 'franchise_lead',
    entityId: lead.id,
    summary: stageMoves && stage ? `${lead.name}: ${STAGE_LABELS[before.stage]} to ${STAGE_LABELS[stage]}` : `Updated franchise lead ${lead.name}`,
  });
  return lead;
}

export async function addLeadNote(session: Session, id: string, note: string) {
  assertHq(session);
  const db = await getDb();
  const { lead } = await getLead(id);
  await insertNote(db, session, 'franchise_lead', lead.id, note);
}

export async function deleteLead(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const { lead } = await getLead(id);
  if (lead.convertedCentreId) throw new ApiError(400, 'This lead became a school, so it is kept as the record of how the school started');
  await db.transaction(async (tx) => {
    await tx.delete(activityNotes).where(and(eq(activityNotes.entityType, 'franchise_lead'), eq(activityNotes.entityId, lead.id)));
    await tx.delete(franchiseLeads).where(eq(franchiseLeads.id, lead.id));
  });
  await audit(session, 'lead.delete', { entity: 'franchise_lead', entityId: lead.id, summary: `Deleted franchise lead ${lead.name}` });
}

const convertInput = z.object({
  centreName: requiredText('School name', 120),
  area: text(80),
  city: text(80),
  state: text(80),
  royaltyType: z.enum(['percent', 'fixed']).default('percent'),
  royaltyValue: z.coerce.number().int().min(0).default(0),
  franchiseFee: z.coerce.number().int().min(0).default(0),
  /** When set, the owner's centre head login is created in the same step. */
  login: z.object({ username: z.string(), password: z.string(), mustChange: z.boolean().default(true) }).nullable().default(null),
});
export type ConvertLeadInput = z.input<typeof convertInput>;

/**
 * Turns a lead into a centre in `onboarding`: the centre, the owner's login
 * (optional) and the lead's new stage are saved together or not at all.
 */
export async function convertLead(session: Session, id: string, input: ConvertLeadInput) {
  assertHq(session);
  const data = convertInput.parse(input);
  // Creating a login is an admin job everywhere else, so it is here too.
  if (data.login) assertAdmin(session);
  const db = await getDb();
  const { lead } = await getLead(id);
  if (lead.convertedCentreId || lead.stage === 'onboarded') throw new ApiError(400, 'This lead has already been converted to a school');

  const result = await db.transaction(async (tx) => {
    const centre = await insertCentre(tx, {
      name: data.centreName,
      area: data.area,
      city: data.city || lead.city,
      state: data.state || lead.state,
      ownerName: lead.name,
      ownerPhone: lead.phone,
      ownerEmail: lead.email,
      phone: lead.phone,
      whatsapp: lead.phone,
      email: lead.email,
      // Not on the website until the centre is ready to take enquiries.
      showOnWebsite: false,
      royaltyType: data.royaltyType,
      royaltyValue: data.royaltyValue,
      franchiseFee: data.franchiseFee,
    });
    const login = data.login
      ? await insertLogin(tx, { name: lead.name, phone: lead.phone, email: lead.email, ...data.login }, { role: 'centre_admin', centreId: centre.id })
      : null;
    // Claimed with a condition, so two people converting the same lead cannot both succeed.
    const claimed = await tx
      .update(franchiseLeads)
      .set({ stage: 'onboarded', convertedCentreId: centre.id, nextFollowUp: null, lostReason: '', updatedAt: new Date() })
      .where(and(eq(franchiseLeads.id, lead.id), sql`${franchiseLeads.convertedCentreId} is null`))
      .returning({ id: franchiseLeads.id });
    if (!claimed.length) throw new ApiError(400, 'This lead has already been converted to a school');
    await insertNote(tx, session, 'franchise_lead', lead.id, `Converted to school ${centre.code} ${centre.name}`);
    return { centre, login };
  });

  await audit(session, 'lead.convert', {
    entity: 'franchise_lead',
    entityId: lead.id,
    centreId: result.centre.id,
    summary: `${lead.name} became school ${result.centre.code} ${result.centre.name}${result.login ? `, login ${result.login.username}` : ''}`,
  });
  return result;
}

export const canDeleteLead = isAdmin;
