/**
 * Centres as head office sees them: the list with each centre's key figures,
 * the profile, the agreement and royalty terms, status, and performance.
 */
import { and, asc, eq, gte, ilike, inArray, isNull, lte, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import {
  CENTRE_STATUSES,
  ROYALTY_TYPES,
  batches,
  centres,
  expenses,
  feeHeads,
  invoices,
  payments,
  programmes,
  royaltyInvoices,
  students,
  users,
  type Centre,
  type CentreStatus,
} from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { currentPeriod, lastPeriods, periodLabel, periodRange, todayIST } from '@/lib/date';
import { nextCentreCode } from '@/lib/numbering';
import { optionalDay, optionalEmail, optionalPhone, requiredText, rupees, slugify, text, uuid } from '@/lib/validators';
import { assertAdmin, assertHq, countInt, insertNote, isAdmin, liveCentre, livePayment, monthOf, royaltyRateLabel, total, type RoyaltyTerm } from './shared';

const liveStudent = isNull(students.deletedAt);
const onRoll = and(eq(students.status, 'active'), liveStudent);
const OPEN_BILLS = ['unpaid', 'partial'] as const;

export type CentreFigures = { onRoll: number; seats: number; collection: number; dues: number; royaltyDue: number };
const NO_FIGURES: CentreFigures = { onRoll: 0, seats: 0, collection: 0, dues: 0, royaltyDue: 0 };

/**
 * Children, seats, this month's collection, fee dues and royalty owed for
 * every centre at once: five grouped queries, however many centres there are.
 */
export async function centreFigures(db: DbOrTx, period: string = currentPeriod()): Promise<Map<string, CentreFigures>> {
  const { from, to } = periodRange(period);
  const [roll, seats, collected, dues, royalty] = await Promise.all([
    db.select({ centreId: students.centreId, n: countInt() }).from(students).where(onRoll).groupBy(students.centreId),
    db.select({ centreId: batches.centreId, n: total(batches.capacity) }).from(batches).where(eq(batches.active, true)).groupBy(batches.centreId),
    db
      .select({ centreId: payments.centreId, n: total(payments.amount) })
      .from(payments)
      .where(and(livePayment, gte(payments.paidOn, from), lte(payments.paidOn, to)))
      .groupBy(payments.centreId),
    db
      .select({ centreId: invoices.centreId, n: total(sql`${invoices.total} - ${invoices.paid}`) })
      .from(invoices)
      .where(inArray(invoices.status, [...OPEN_BILLS]))
      .groupBy(invoices.centreId),
    db
      .select({ centreId: royaltyInvoices.centreId, n: total(sql`${royaltyInvoices.amount} - ${royaltyInvoices.paid}`) })
      .from(royaltyInvoices)
      .where(inArray(royaltyInvoices.status, [...OPEN_BILLS]))
      .groupBy(royaltyInvoices.centreId),
  ]);
  const map = new Map<string, CentreFigures>();
  const put = (rows: { centreId: string; n: number }[], key: keyof CentreFigures) => {
    for (const row of rows) {
      const entry = map.get(row.centreId) ?? { ...NO_FIGURES };
      entry[key] = row.n;
      map.set(row.centreId, entry);
    }
  };
  put(roll, 'onRoll');
  put(seats, 'seats');
  put(collected, 'collection');
  put(dues, 'dues');
  put(royalty, 'royaltyDue');
  return map;
}

export type CentreListRow = Centre & CentreFigures;

export async function listCentres(filters: { q?: string; status?: string; type?: string } = {}): Promise<CentreListRow[]> {
  const db = await getDb();
  const where: (SQL | undefined)[] = [liveCentre];
  const q = filters.q?.trim();
  if (q) {
    const like = `%${q}%`;
    where.push(or(ilike(centres.name, like), ilike(centres.code, like), ilike(centres.city, like), ilike(centres.area, like), ilike(centres.ownerName, like)));
  }
  if (filters.status && (CENTRE_STATUSES as readonly string[]).includes(filters.status)) where.push(eq(centres.status, filters.status as CentreStatus));
  if (filters.type === 'franchise') where.push(eq(centres.isCompanyOwned, false));
  if (filters.type === 'company') where.push(eq(centres.isCompanyOwned, true));

  const [rows, figures] = await Promise.all([db.select().from(centres).where(and(...where)).orderBy(asc(centres.code)), centreFigures(db)]);
  return rows.map((row) => ({ ...row, ...(figures.get(row.id) ?? NO_FIGURES) }));
}

/** For dropdowns: every live centre, by code. */
export async function centreOptions() {
  const db = await getDb();
  return db.select({ id: centres.id, name: centres.name, code: centres.code, status: centres.status }).from(centres).where(liveCentre).orderBy(asc(centres.code));
}

export async function getCentre(id: string, db?: DbOrTx): Promise<Centre> {
  const conn = db ?? (await getDb());
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ApiError(404, 'Centre not found');
  const [row] = await conn.select().from(centres).where(and(eq(centres.id, parsed.data), liveCentre)).limit(1);
  if (!row) throw new ApiError(404, 'Centre not found');
  return row;
}

/* ───────────── create ───────────── */

const royaltyFields = {
  royaltyType: z.enum(ROYALTY_TYPES).default('percent'),
  royaltyValue: rupees.default(0),
};
const checkPercent = (value: { royaltyType: string; royaltyValue: number }, ctx: z.RefinementCtx) => {
  if (value.royaltyType === 'percent' && value.royaltyValue > 100) {
    ctx.addIssue({ code: 'custom', path: ['royaltyValue'], message: 'A percent cannot be more than 100' });
  }
};

const profileFields = {
  name: requiredText('Centre name', 120),
  address: text(300),
  area: text(80),
  city: text(80),
  state: text(80),
  pincode: z.union([z.literal(''), z.string().trim().regex(/^\d{6}$/, 'Enter a 6 digit pincode')]).default(''),
  phone: optionalPhone,
  whatsapp: optionalPhone,
  email: optionalEmail,
  mapUrl: z.union([z.literal(''), z.string().trim().url('Paste the full map link, starting with https://')]).default(''),
  photo: text(500),
  ownerName: text(80),
  ownerPhone: optionalPhone,
  ownerEmail: optionalEmail,
  openedOn: optionalDay,
  showOnWebsite: z.boolean().default(true),
  isCompanyOwned: z.boolean().default(false),
  notes: text(2000),
};

const createInput = z.object({ ...profileFields, ...royaltyFields, franchiseFee: rupees.default(0) }).superRefine(checkPercent);
export type CreateCentreInput = z.input<typeof createInput>;

async function freeSlug(db: DbOrTx, name: string, code: string) {
  const base = slugify(name.replace(/^mantra kidz\s+/i, '')) || slugify(code);
  const [taken] = await db.select({ id: centres.id }).from(centres).where(eq(centres.slug, base)).limit(1);
  return taken ? `${base}-${code.toLowerCase()}` : base;
}

/**
 * The next MK code nobody has. The running number can be behind the codes in
 * use (the sample centres were given MK-002 and MK-003 without moving it), so
 * a code that is taken is skipped rather than left to fail on the unique index.
 */
async function freeCode(db: DbOrTx) {
  for (let tries = 0; tries < 200; tries++) {
    const code = await nextCentreCode(db);
    const [taken] = await db.select({ id: centres.id }).from(centres).where(eq(centres.code, code)).limit(1);
    if (!taken) return code;
  }
  throw new ApiError(500, 'Could not find a free centre code. Please try again.');
}

/** Inserts a centre in `onboarding` inside the caller's transaction, with the next MK code and the HQ fee templates. */
export async function insertCentre(tx: DbOrTx, input: CreateCentreInput): Promise<Centre> {
  const data = createInput.parse(input);
  const code = await freeCode(tx);
  const [centre] = await tx
    .insert(centres)
    .values({ ...data, code, slug: await freeSlug(tx, data.name, code), status: 'onboarding', royaltyValue: data.isCompanyOwned ? 0 : data.royaltyValue })
    .returning();
  // Fee heads with no centre are head office templates: a new centre starts with a copy.
  const templates = await tx.select().from(feeHeads).where(and(isNull(feeHeads.centreId), eq(feeHeads.active, true)));
  if (templates.length) {
    await tx.insert(feeHeads).values(templates.map((t) => ({ centreId: centre.id, name: t.name, kind: t.kind, programmeId: t.programmeId, amount: t.amount })));
  }
  return centre;
}

export async function createCentre(session: Session, input: CreateCentreInput) {
  assertHq(session);
  const db = await getDb();
  const centre = await db.transaction((tx) => insertCentre(tx, input));
  await audit(session, 'centre.create', { entity: 'centre', entityId: centre.id, centreId: centre.id, summary: `Added centre ${centre.code} ${centre.name}` });
  return centre;
}

/* ───────────── update ───────────── */

const profileInput = z.object(profileFields);

export async function updateCentreProfile(session: Session, id: string, input: z.input<typeof profileInput>) {
  assertHq(session);
  const data = profileInput.parse(input);
  const db = await getDb();
  const before = await getCentre(id, db);
  // Company-owned centres pay no royalty, so flipping this is a change of royalty terms.
  if (before.isCompanyOwned !== data.isCompanyOwned) assertAdmin(session);
  const [centre] = await db.update(centres).set({ ...data, updatedAt: new Date() }).where(eq(centres.id, before.id)).returning();
  await audit(session, 'centre.update', {
    entity: 'centre',
    entityId: centre.id,
    centreId: centre.id,
    summary:
      before.isCompanyOwned !== data.isCompanyOwned
        ? `Updated ${centre.name}; now ${data.isCompanyOwned ? 'company-owned (no royalty)' : 'a franchise centre'}`
        : `Updated the profile of ${centre.name}`,
  });
  return centre;
}

const agreementInput = z
  .object({
    agreementStart: optionalDay,
    agreementEnd: optionalDay,
    franchiseFee: rupees.default(0),
    franchiseFeePaid: rupees.default(0),
    ...royaltyFields,
  })
  .superRefine(checkPercent)
  .superRefine((value, ctx) => {
    if (value.franchiseFeePaid > value.franchiseFee) ctx.addIssue({ code: 'custom', path: ['franchiseFeePaid'], message: 'Cannot be more than the franchise fee' });
    if (value.agreementStart && value.agreementEnd && value.agreementEnd < value.agreementStart) {
      ctx.addIssue({ code: 'custom', path: ['agreementEnd'], message: 'The end date is before the start date' });
    }
  });

/**
 * Saves the agreement. A change of royalty type or value is for admins only,
 * takes effect from the current month, and leaves finished months on the old
 * terms (kept in meta.royaltyTerms so a recalculation of an old unpaid month
 * still uses what applied then).
 */
export async function updateCentreAgreement(session: Session, id: string, input: z.input<typeof agreementInput>) {
  assertHq(session);
  const data = agreementInput.parse(input);
  const db = await getDb();
  const before = await getCentre(id, db);
  const termsChanged = before.royaltyType !== data.royaltyType || before.royaltyValue !== data.royaltyValue;
  if (termsChanged) assertAdmin(session);

  let meta = before.meta;
  if (termsChanged) {
    const history = Array.isArray(before.meta.royaltyTerms) ? (before.meta.royaltyTerms as RoyaltyTerm[]) : [];
    const period = currentPeriod();
    const kept = history.length ? history.filter((term) => term.from !== period) : [{ from: '0000-00', type: before.royaltyType, value: before.royaltyValue }];
    meta = { ...before.meta, royaltyTerms: [...kept, { from: period, type: data.royaltyType, value: data.royaltyValue }] };
  }

  const [centre] = await db.update(centres).set({ ...data, meta, updatedAt: new Date() }).where(eq(centres.id, before.id)).returning();
  await audit(session, termsChanged ? 'centre.royalty.change' : 'centre.agreement.update', {
    entity: 'centre',
    entityId: centre.id,
    centreId: centre.id,
    summary: termsChanged
      ? `Royalty of ${centre.name} changed from ${royaltyRateLabel(before.royaltyType, before.royaltyValue)} to ${royaltyRateLabel(data.royaltyType, data.royaltyValue)}, from ${periodLabel(currentPeriod())}`
      : `Updated the agreement of ${centre.name}`,
    meta: termsChanged ? { from: { type: before.royaltyType, value: before.royaltyValue }, to: { type: data.royaltyType, value: data.royaltyValue } } : {},
  });
  return centre;
}

const STATUS_WORDS: Record<CentreStatus, string> = { onboarding: 'Moved back to onboarding', active: 'Activated', suspended: 'Suspended', closed: 'Closed' };

export async function setCentreStatus(session: Session, id: string, status: CentreStatus) {
  assertHq(session);
  const next = z.enum(CENTRE_STATUSES).parse(status);
  const db = await getDb();
  const before = await getCentre(id, db);
  if (before.status === next) return before;
  const [centre] = await db
    .update(centres)
    // The first activation is the day the centre opened, unless a date was already entered.
    .set({ status: next, openedOn: next === 'active' && !before.openedOn ? todayIST() : before.openedOn, updatedAt: new Date() })
    .where(eq(centres.id, before.id))
    .returning();
  await audit(session, `centre.${next}`, { entity: 'centre', entityId: centre.id, centreId: centre.id, summary: `${STATUS_WORDS[next]} ${centre.name}` });
  return centre;
}

/** Soft delete, and only when the centre has no children on its records. */
export async function deleteCentre(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const centre = await getCentre(id, db);
  const [{ n }] = await db.select({ n: countInt() }).from(students).where(and(eq(students.centreId, centre.id), liveStudent));
  if (n > 0) {
    throw new ApiError(400, `${centre.name} has ${n} ${n === 1 ? 'child' : 'children'} on its records, so it cannot be deleted. Close the centre instead; its history stays.`);
  }
  await db.transaction(async (tx) => {
    await tx.update(centres).set({ deletedAt: new Date(), showOnWebsite: false, updatedAt: new Date() }).where(eq(centres.id, centre.id));
    await tx.update(users).set({ active: false }).where(eq(users.centreId, centre.id));
  });
  await audit(session, 'centre.delete', { entity: 'centre', entityId: centre.id, summary: `Deleted centre ${centre.code} ${centre.name}` });
}

export async function addCentreNote(session: Session, id: string, note: string) {
  assertHq(session);
  const db = await getDb();
  const centre = await getCentre(id, db);
  await insertNote(db, session, 'centre', centre.id, note);
}

/* ───────────── performance ───────────── */

export async function centrePerformance(centreId: string) {
  const db = await getDb();
  const today = todayIST();
  const periods = lastPeriods(6);
  const from = `${periods[0]}-01`;

  // Children on roll at the end of each month: admitted by then and not yet left.
  const rollColumns = Object.fromEntries(
    periods.map((period, index) => {
      const end = period === currentPeriod() ? today : periodRange(period).to;
      return [
        `m${index}`,
        sql<number>`coalesce(sum(case when ${students.admissionDate} <= ${end} and (${students.status} = 'active' or ${students.leftOn} > ${end}) then 1 else 0 end), 0)::int`,
      ];
    }),
  ) as Record<string, SQL<number>>;

  const [collected, spent, admitted, left, [roll], classes, [due], [now]] = await Promise.all([
    db
      .select({ period: monthOf(payments.paidOn), n: total(payments.amount) })
      .from(payments)
      .where(and(eq(payments.centreId, centreId), livePayment, gte(payments.paidOn, from)))
      .groupBy(monthOf(payments.paidOn)),
    db
      .select({ period: monthOf(expenses.spentOn), n: total(expenses.amount) })
      .from(expenses)
      .where(and(eq(expenses.centreId, centreId), isNull(expenses.deletedAt), gte(expenses.spentOn, from)))
      .groupBy(monthOf(expenses.spentOn)),
    db
      .select({ period: monthOf(students.admissionDate), n: countInt() })
      .from(students)
      .where(and(eq(students.centreId, centreId), liveStudent, gte(students.admissionDate, from)))
      .groupBy(monthOf(students.admissionDate)),
    db
      .select({ period: monthOf(students.leftOn), n: countInt() })
      .from(students)
      .where(and(eq(students.centreId, centreId), liveStudent, eq(students.status, 'left'), gte(students.leftOn, from)))
      .groupBy(monthOf(students.leftOn)),
    db.select(rollColumns).from(students).where(and(eq(students.centreId, centreId), liveStudent)),
    db
      .select({ id: batches.id, name: batches.name, programme: programmes.name, capacity: batches.capacity, filled: sql<number>`count(${students.id})::int` })
      .from(batches)
      .innerJoin(programmes, eq(programmes.id, batches.programmeId))
      .leftJoin(students, and(eq(students.batchId, batches.id), onRoll))
      .where(and(eq(batches.centreId, centreId), eq(batches.active, true)))
      .groupBy(batches.id, programmes.name, programmes.sort)
      .orderBy(asc(programmes.sort), asc(batches.name)),
    db
      .select({ n: total(sql`${invoices.total} - ${invoices.paid}`), bills: countInt() })
      .from(invoices)
      .where(and(eq(invoices.centreId, centreId), inArray(invoices.status, [...OPEN_BILLS]))),
    db.select({ n: countInt() }).from(students).where(and(eq(students.centreId, centreId), onRoll)),
  ]);

  const pick = (rows: { period: string; n: number }[], period: string) => rows.find((row) => row.period === period)?.n ?? 0;
  const months = periods.map((period, index) => ({
    period,
    label: periodLabel(period).slice(0, 3),
    collected: pick(collected, period),
    spent: pick(spent, period),
    admissions: pick(admitted, period),
    withdrawals: pick(left, period),
    roll: roll?.[`m${index}`] ?? 0,
  }));
  const seats = classes.reduce((sum, row) => sum + row.capacity, 0);
  return { months, classes, seats, onRoll: now?.n ?? 0, dues: due?.n ?? 0, openBills: due?.bills ?? 0 };
}

export const canEditRoyaltyTerms = isAdmin;
