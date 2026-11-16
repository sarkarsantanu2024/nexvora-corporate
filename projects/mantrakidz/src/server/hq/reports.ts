/**
 * Network reports for a date range. Each report is a handful of grouped
 * queries merged by centre; the same functions feed the screen and the CSV.
 */
import { and, asc, eq, gte, inArray, isNull, lt, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { ENQUIRY_STAGES, PAYMENT_METHODS, admissionEnquiries, centres, expenses, payments, royaltyInvoices, royaltyPayments, students, type EnquiryStage, type PaymentMethod } from '@/db/schema';
import { addDays, currentPeriod, todayIST } from '@/lib/date';
import { percent } from '@/lib/money';
import { day } from '@/lib/validators';
import { centreFigures } from './centres';
import { countInt, liveCentre, livePayment, total } from './shared';

export type Range = { from: string; to: string };

/** Reads ?from=&to= ; falls back to this month so far. Swaps the two when they are the wrong way round. */
export function parseRange(params: { from?: string; to?: string }): Range {
  const today = todayIST();
  const ok = (value?: string) => (value && day.safeParse(value).success ? value : '');
  let from = ok(params.from) || `${currentPeriod()}-01`;
  let to = ok(params.to) || today;
  if (from > to) [from, to] = [to, from];
  return { from, to };
}

const liveCentresList = async () => {
  const db = await getDb();
  return db
    .select({ id: centres.id, code: centres.code, name: centres.name, status: centres.status, isCompanyOwned: centres.isCompanyOwned })
    .from(centres)
    .where(liveCentre)
    .orderBy(asc(centres.code));
};
type Grouped = { centreId: string | null; n: number };
const byCentre = (rows: Grouped[]) => new Map(rows.map((row) => [row.centreId, row.n]));

/** Royalty raised for the months inside the range, and royalty money received inside the range. */
async function royaltyInRange(range: Range) {
  const db = await getDb();
  const [raised, received] = await Promise.all([
    db
      .select({ centreId: royaltyInvoices.centreId, n: total(royaltyInvoices.amount) })
      .from(royaltyInvoices)
      .where(and(gte(royaltyInvoices.period, range.from.slice(0, 7)), lte(royaltyInvoices.period, range.to.slice(0, 7)), sql`${royaltyInvoices.status} <> 'cancelled'`))
      .groupBy(royaltyInvoices.centreId),
    db
      .select({ centreId: royaltyPayments.centreId, n: total(royaltyPayments.amount) })
      .from(royaltyPayments)
      .where(and(gte(royaltyPayments.paidOn, range.from), lte(royaltyPayments.paidOn, range.to)))
      .groupBy(royaltyPayments.centreId),
  ]);
  return { raised: byCentre(raised), received: byCentre(received) };
}

export type ComparisonRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  onRoll: number;
  seats: number;
  seatsFilled: number;
  admissions: number;
  withdrawals: number;
  collection: number;
  dues: number;
  expenses: number;
  surplus: number;
  royaltyRaised: number;
  royaltyReceived: number;
};

export async function centreComparison(range: Range): Promise<{ rows: ComparisonRow[]; totals: ComparisonRow }> {
  const db = await getDb();
  const inRange = (column: typeof students.admissionDate | typeof students.leftOn | typeof payments.paidOn | typeof expenses.spentOn) =>
    and(gte(column, range.from), lte(column, range.to));
  const [list, figures, admitted, left, collected, spent, royalty] = await Promise.all([
    liveCentresList(),
    centreFigures(db),
    db.select({ centreId: students.centreId, n: countInt() }).from(students).where(and(isNull(students.deletedAt), inRange(students.admissionDate))).groupBy(students.centreId),
    db
      .select({ centreId: students.centreId, n: countInt() })
      .from(students)
      .where(and(isNull(students.deletedAt), eq(students.status, 'left'), inRange(students.leftOn)))
      .groupBy(students.centreId),
    db.select({ centreId: payments.centreId, n: total(payments.amount) }).from(payments).where(and(livePayment, inRange(payments.paidOn))).groupBy(payments.centreId),
    db.select({ centreId: expenses.centreId, n: total(expenses.amount) }).from(expenses).where(and(isNull(expenses.deletedAt), inRange(expenses.spentOn))).groupBy(expenses.centreId),
    royaltyInRange(range),
  ]);
  const maps = { admitted: byCentre(admitted), left: byCentre(left), collected: byCentre(collected), spent: byCentre(spent) };

  const rows = list.map((centre): ComparisonRow => {
    const f = figures.get(centre.id);
    const collection = maps.collected.get(centre.id) ?? 0;
    const expense = maps.spent.get(centre.id) ?? 0;
    return {
      id: centre.id,
      code: centre.code,
      name: centre.name,
      status: centre.status,
      onRoll: f?.onRoll ?? 0,
      seats: f?.seats ?? 0,
      seatsFilled: percent(f?.onRoll ?? 0, f?.seats ?? 0),
      admissions: maps.admitted.get(centre.id) ?? 0,
      withdrawals: maps.left.get(centre.id) ?? 0,
      collection,
      dues: f?.dues ?? 0,
      expenses: expense,
      surplus: collection - expense,
      royaltyRaised: royalty.raised.get(centre.id) ?? 0,
      royaltyReceived: royalty.received.get(centre.id) ?? 0,
    };
  });

  const add = (key: keyof ComparisonRow) => rows.reduce((sum, row) => sum + (row[key] as number), 0);
  const totals: ComparisonRow = {
    id: 'total',
    code: '',
    name: 'All centres',
    status: '',
    onRoll: add('onRoll'),
    seats: add('seats'),
    seatsFilled: percent(add('onRoll'), add('seats')),
    admissions: add('admissions'),
    withdrawals: add('withdrawals'),
    collection: add('collection'),
    dues: add('dues'),
    expenses: add('expenses'),
    surplus: add('surplus'),
    royaltyRaised: add('royaltyRaised'),
    royaltyReceived: add('royaltyReceived'),
  };
  return { rows, totals };
}

export type FunnelRow = { id: string; name: string; total: number; conversion: number } & Record<EnquiryStage, number>;

/** Enquiries received in the range, by the stage they are at now. */
export async function admissionsFunnel(range: Range): Promise<{ rows: FunnelRow[]; totals: FunnelRow }> {
  const db = await getDb();
  // Timestamps are stored in UTC; the range is in India days.
  const start = new Date(`${range.from}T00:00:00+05:30`);
  const end = new Date(`${addDays(range.to, 1)}T00:00:00+05:30`);
  const [list, grouped] = await Promise.all([
    liveCentresList(),
    db
      .select({ centreId: admissionEnquiries.centreId, stage: admissionEnquiries.stage, n: countInt() })
      .from(admissionEnquiries)
      .where(and(gte(admissionEnquiries.createdAt, start), lt(admissionEnquiries.createdAt, end)))
      .groupBy(admissionEnquiries.centreId, admissionEnquiries.stage),
  ]);
  const blank = () => Object.fromEntries(ENQUIRY_STAGES.map((stage) => [stage, 0])) as Record<EnquiryStage, number>;
  const build = (id: string, name: string, match: (centreId: string | null) => boolean): FunnelRow => {
    const stages = blank();
    for (const row of grouped) if (match(row.centreId)) stages[row.stage] += row.n;
    const sum = ENQUIRY_STAGES.reduce((n, stage) => n + stages[stage], 0);
    return { id, name, ...stages, total: sum, conversion: percent(stages.admitted, sum) };
  };
  const rows = list.map((centre) => build(centre.id, centre.name, (id) => id === centre.id));
  const unassigned = build('none', 'No centre chosen yet', (id) => id === null);
  if (unassigned.total) rows.push(unassigned);
  return { rows, totals: build('total', 'All centres', () => true) };
}

export type MethodRow = { id: string; name: string; total: number } & Record<PaymentMethod, number>;

/** Fee collection in the range by how it was paid, per centre. */
export async function collectionByMethod(range: Range): Promise<{ rows: MethodRow[]; totals: MethodRow; receipts: Record<PaymentMethod, number> }> {
  const db = await getDb();
  const [list, grouped] = await Promise.all([
    liveCentresList(),
    db
      .select({ centreId: payments.centreId, method: payments.method, n: total(payments.amount), receipts: countInt() })
      .from(payments)
      .where(and(livePayment, gte(payments.paidOn, range.from), lte(payments.paidOn, range.to)))
      .groupBy(payments.centreId, payments.method),
  ]);
  const blank = () => Object.fromEntries(PAYMENT_METHODS.map((method) => [method, 0])) as Record<PaymentMethod, number>;
  const ids = new Set(list.map((centre) => centre.id));
  const live = grouped.filter((row) => ids.has(row.centreId));
  const build = (id: string, name: string, match: (centreId: string) => boolean): MethodRow => {
    const methods = blank();
    for (const row of live) if (match(row.centreId)) methods[row.method] += row.n;
    return { id, name, ...methods, total: PAYMENT_METHODS.reduce((n, method) => n + methods[method], 0) };
  };
  const receipts = blank();
  for (const row of live) receipts[row.method] += row.receipts;
  return { rows: list.map((centre) => build(centre.id, centre.name, (id) => id === centre.id)), totals: build('total', 'All centres', () => true), receipts };
}

export type RoyaltySummaryRow = { id: string; code: string; name: string; raised: number; received: number; outstanding: number; overdue: number };

/** Franchise centres only: raised and received in the range, and what is owed and overdue today. */
export async function royaltySummary(range: Range): Promise<{ rows: RoyaltySummaryRow[]; totals: RoyaltySummaryRow }> {
  const db = await getDb();
  const today = todayIST();
  const [list, inRange, owed] = await Promise.all([
    liveCentresList(),
    royaltyInRange(range),
    db
      .select({
        centreId: royaltyInvoices.centreId,
        outstanding: total(sql`${royaltyInvoices.amount} - ${royaltyInvoices.paid}`),
        overdue: total(sql`case when ${royaltyInvoices.dueDate} < ${today} then ${royaltyInvoices.amount} - ${royaltyInvoices.paid} else 0 end`),
      })
      .from(royaltyInvoices)
      .where(inArray(royaltyInvoices.status, ['unpaid', 'partial']))
      .groupBy(royaltyInvoices.centreId),
  ]);
  const owedBy = new Map(owed.map((row) => [row.centreId, row]));
  const rows = list
    .filter((centre) => !centre.isCompanyOwned || inRange.raised.has(centre.id) || owedBy.has(centre.id))
    .map((centre) => ({
      id: centre.id,
      code: centre.code,
      name: centre.name,
      raised: inRange.raised.get(centre.id) ?? 0,
      received: inRange.received.get(centre.id) ?? 0,
      outstanding: owedBy.get(centre.id)?.outstanding ?? 0,
      overdue: owedBy.get(centre.id)?.overdue ?? 0,
    }));
  const add = (key: 'raised' | 'received' | 'outstanding' | 'overdue') => rows.reduce((sum, row) => sum + row[key], 0);
  return { rows, totals: { id: 'total', code: '', name: 'All franchise centres', raised: add('raised'), received: add('received'), outstanding: add('outstanding'), overdue: add('overdue') } };
}
