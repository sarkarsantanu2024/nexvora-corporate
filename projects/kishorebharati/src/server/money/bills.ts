/**
 * Bills (invoices): the list, one bill, the bill run (yearly or monthly, for
 * a range of classes), one-off bills, cancelling, concessions, dues and the
 * fee heads.
 *
 * A government school's fees are small and set by the state. Nothing here
 * invents an amount: every amount comes from a fee head the office entered.
 */
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx, type Tx } from '@/db';
import {
  FEE_KINDS,
  INVOICE_STATUSES,
  academicYears,
  enrolments,
  feeHeads,
  invoiceItems,
  invoices,
  payments,
  sections,
  students,
  users,
  type FeeKind,
  type InvoiceStatus,
} from '@/db/schema';
import { SCHOOL } from '@/config/school';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { addDays, addMonths, currentPeriod, periodLabel, periodRange, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import type { Session } from '@/lib/session-token';
import { day, optionalUuid, period as monthSchema, requiredText, rupees, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, pageOf } from '../admin/shared';
import { assertOffice, currentYear } from '../school/access';
import { billPeriodLabel, invoiceStatus } from './labels';
import { feeSettings, isUuid, likeText, liveStudent, nextBillNo, notFound, placeJoin, sectionColumns, sectionJoin, sumInt } from './shared';

const OPEN: InvoiceStatus[] = ['unpaid', 'partial'];
const balance = sql<number>`(${invoices.total} - ${invoices.paid})`;
const yearSchema = z.string().regex(/^\d{4}$/, 'Pick a year');
const isMonth = (value: string | undefined): value is string => !!value && monthSchema.safeParse(value).success;
const isYear = (value: string | undefined): value is string => !!value && yearSchema.safeParse(value).success;

/** The English title stored on a bill of a run. Screens show it in the person's language from the period. */
const runTitle = (period: string) => `Fees for ${billPeriodLabel(period)}`;

/* ───────────── list ───────────── */

export type BillFilter = {
  q?: string;
  /** A bill status, or 'due' (unpaid and part paid) or 'overdue' (due and past its date). */
  status?: string;
  /** 'YYYY' or 'YYYY-MM'. */
  period?: string;
  section?: string;
  student?: string;
  page?: number | string;
};

function billWhere(filter: BillFilter): SQL | undefined {
  const where: (SQL | undefined)[] = [];
  const q = (filter.q ?? '').trim().slice(0, 80);
  if (q) where.push(or(ilike(students.name, likeText(q)), ilike(students.admissionNo, likeText(q)), ilike(invoices.invoiceNo, likeText(q))));
  if (filter.status === 'due') where.push(inArray(invoices.status, OPEN));
  else if (filter.status === 'overdue') where.push(inArray(invoices.status, OPEN), lt(invoices.dueDate, todayIST()));
  else if ((INVOICE_STATUSES as readonly string[]).includes(filter.status ?? '')) where.push(eq(invoices.status, filter.status as InvoiceStatus));
  if (isMonth(filter.period)) {
    // A one-off bill has no month of its own, so it is listed under the month it was raised in.
    const { from, to } = periodRange(filter.period);
    where.push(or(eq(invoices.period, filter.period), and(isNull(invoices.period), gte(invoices.issueDate, from), lte(invoices.issueDate, to))));
  } else if (isYear(filter.period)) {
    where.push(or(eq(invoices.period, filter.period), and(isNull(invoices.period), gte(invoices.issueDate, `${filter.period}-01-01`), lte(invoices.issueDate, `${filter.period}-12-31`))));
  }
  if (isUuid(filter.section)) where.push(eq(sections.id, filter.section));
  if (isUuid(filter.student)) where.push(eq(invoices.studentId, filter.student));
  return where.length ? and(...where) : undefined;
}

export async function listBills(session: Session, filter: BillFilter = {}) {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const where = billWhere(filter);
  const page = pageOf(filter.page);
  const live = sql`${invoices.status} <> 'cancelled'`;

  const [rows, [totals]] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNo: invoices.invoiceNo,
        period: invoices.period,
        title: invoices.title,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        total: invoices.total,
        paid: invoices.paid,
        status: invoices.status,
        studentId: students.id,
        studentName: students.name,
        admissionNo: students.admissionNo,
        ...sectionColumns,
      })
      .from(invoices)
      .innerJoin(students, eq(students.id, invoices.studentId))
      .leftJoin(enrolments, placeJoin(year.id))
      .leftJoin(sections, sectionJoin)
      .where(where)
      .orderBy(desc(invoices.issueDate), desc(invoices.invoiceNo))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({
        count: countInt(),
        // Cancelled bills stay in the list but nobody owes them, so they are left out of the sums.
        billed: sql<number>`coalesce(sum(${invoices.total}) filter (where ${live}), 0)::int`,
        received: sql<number>`coalesce(sum(${invoices.paid}) filter (where ${live}), 0)::int`,
      })
      .from(invoices)
      .innerJoin(students, eq(students.id, invoices.studentId))
      .leftJoin(enrolments, placeJoin(year.id))
      .leftJoin(sections, sectionJoin)
      .where(where),
  ]);

  return { rows, page, pageSize: PAGE_SIZE, count: totals.count, totals: { billed: totals.billed, received: totals.received, balance: totals.billed - totals.received } };
}

/* ───────────── one bill ───────────── */

export async function getBill(session: Session, id: string) {
  assertOffice(session);
  if (!isUuid(id)) return null;
  const db = await getDb();
  const year = await currentYear(db);
  const [bill] = await db
    .select({
      invoice: invoices,
      studentName: students.name,
      admissionNo: students.admissionNo,
      phone: students.phone,
      fatherName: students.fatherName,
      motherName: students.motherName,
      ...sectionColumns,
    })
    .from(invoices)
    .innerJoin(students, eq(students.id, invoices.studentId))
    .leftJoin(enrolments, placeJoin(year.id))
    .leftJoin(sections, sectionJoin)
    .where(eq(invoices.id, id))
    .limit(1);
  if (!bill) return null;

  const [items, receipts] = await Promise.all([
    db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).orderBy(asc(invoiceItems.description)),
    db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
        paidOn: payments.paidOn,
        voidedAt: payments.voidedAt,
        voidReason: payments.voidReason,
        receivedBy: users.name,
      })
      .from(payments)
      .leftJoin(users, eq(users.id, payments.receivedBy))
      .where(eq(payments.invoiceId, id))
      .orderBy(asc(payments.paidOn), asc(payments.receiptNo)),
  ]);
  return { ...bill, items, receipts };
}

/* ───────────── the bill run ───────────── */

const runInput = z.object({
  /** 'YYYY' for the yearly bill, 'YYYY-MM' for a month. */
  period: z.string().trim().refine((v) => yearSchema.safeParse(v).success || monthSchema.safeParse(v).success, 'Pick a year or a month'),
  fromGrade: z.coerce.number().int(),
  toGrade: z.coerce.number().int(),
  headIds: z.array(uuid).min(1, 'Tick at least one fee head').max(30),
  dueDate: day,
});
export type RunInput = z.input<typeof runInput>;

type RunPlanRow = {
  studentId: string;
  grade: number;
  /** The heads this student is to be billed that are not on the bill yet. */
  heads: { id: string; name: string; amount: number }[];
  /** The bill already raised for this period, if any. */
  existing: { id: string; status: InvoiceStatus; subtotal: number; discount: number; paid: number } | null;
  /** Why nothing is added: 'billed' (every head already on the bill), 'cancelled', 'no_fee'. */
  skip: 'billed' | 'cancelled' | 'no_fee' | null;
};

async function planRun(db: DbOrTx, input: z.output<typeof runInput>) {
  const yearly = yearSchema.safeParse(input.period).success;
  const yearName = input.period.slice(0, 4);
  if (input.fromGrade > input.toGrade) throw new ApiError(400, 'The first class must not be above the last class', { fromGrade: 'Check the classes' });
  if (!yearly && input.period > addMonths(currentPeriod(), 1)) throw new ApiError(400, 'Bills can be raised for next month at the most', { period: 'Too far ahead' });

  const [year] = await db.select().from(academicYears).where(eq(academicYears.name, yearName)).limit(1);
  if (!year) throw new ApiError(400, `There is no school year ${yearName}. Add it first from Classes and subjects.`, { period: 'No such school year' });

  const heads = await db
    .select()
    .from(feeHeads)
    .where(and(inArray(feeHeads.id, input.headIds), eq(feeHeads.active, true)));
  if (heads.length !== new Set(input.headIds).size) throw new ApiError(400, 'One of the fee heads is switched off or no longer there', { headIds: 'Check the fee heads' });
  // A yearly run carries the yearly and one-time charges; a monthly run only the monthly ones.
  const allowed: FeeKind[] = yearly ? ['annual', 'one_time'] : ['monthly'];
  if (heads.some((head) => !allowed.includes(head.kind))) {
    throw new ApiError(400, yearly ? 'A yearly bill can only carry fee heads charged once a year or one time' : 'A monthly bill can only carry fee heads charged every month', { headIds: 'Check the fee heads' });
  }

  const roll = await db
    .select({ studentId: students.id, grade: sections.grade })
    .from(enrolments)
    .innerJoin(students, eq(students.id, enrolments.studentId))
    .innerJoin(sections, eq(sections.id, enrolments.sectionId))
    .where(and(eq(enrolments.yearId, year.id), eq(students.status, 'active'), liveStudent, gte(sections.grade, input.fromGrade), lte(sections.grade, input.toGrade)))
    .orderBy(asc(sections.grade), asc(students.name));

  const ids = roll.map((row) => row.studentId);
  const bills = ids.length
    ? await db
        .select({ id: invoices.id, studentId: invoices.studentId, status: invoices.status, subtotal: invoices.subtotal, discount: invoices.discount, paid: invoices.paid })
        .from(invoices)
        .where(and(eq(invoices.period, input.period), inArray(invoices.studentId, ids)))
    : [];
  const billIds = bills.map((bill) => bill.id);
  const items = billIds.length
    ? await db.select({ invoiceId: invoiceItems.invoiceId, feeHeadId: invoiceItems.feeHeadId }).from(invoiceItems).where(inArray(invoiceItems.invoiceId, billIds))
    : [];

  const rows: RunPlanRow[] = roll.map((student) => {
    const existing = bills.find((bill) => bill.studentId === student.studentId) ?? null;
    const applies = heads.filter((head) => head.fromGrade <= student.grade && student.grade <= head.toGrade && head.amount > 0);
    if (!applies.length) return { studentId: student.studentId, grade: student.grade, heads: [], existing, skip: 'no_fee' };
    if (existing?.status === 'cancelled') return { studentId: student.studentId, grade: student.grade, heads: [], existing, skip: 'cancelled' };
    const onBill = new Set(items.filter((item) => item.invoiceId === existing?.id).map((item) => item.feeHeadId));
    const missing = applies.filter((head) => !onBill.has(head.id)).map((head) => ({ id: head.id, name: head.name, amount: head.amount }));
    return { studentId: student.studentId, grade: student.grade, heads: missing, existing, skip: missing.length ? null : 'billed' };
  });
  return { year, rows, yearly };
}

function summarise(rows: RunPlanRow[]) {
  const work = rows.filter((row) => !row.skip);
  const byGrade = new Map<number, { grade: number; students: number; amount: number }>();
  for (const row of work) {
    const amount = row.heads.reduce((sum, head) => sum + head.amount, 0);
    const entry = byGrade.get(row.grade) ?? { grade: row.grade, students: 0, amount: 0 };
    entry.students += 1;
    entry.amount += amount;
    byGrade.set(row.grade, entry);
  }
  return {
    students: rows.length,
    toCreate: work.filter((row) => !row.existing).length,
    toAddTo: work.filter((row) => row.existing).length,
    amount: work.reduce((sum, row) => sum + row.heads.reduce((s, head) => s + head.amount, 0), 0),
    alreadyBilled: rows.filter((row) => row.skip === 'billed').length,
    noFee: rows.filter((row) => row.skip === 'no_fee').length,
    cancelled: rows.filter((row) => row.skip === 'cancelled').length,
    byGrade: [...byGrade.values()].sort((a, b) => a.grade - b.grade),
  };
}

/** What a run would do, without doing it. */
export async function previewRun(session: Session, input: RunInput) {
  assertAdmin(session);
  const data = runInput.parse(input);
  const db = await getDb();
  const { rows } = await planRun(db, data);
  return summarise(rows);
}

/**
 * Raises the bill of a year or a month for every student on roll in the
 * chosen classes. A student who already has that bill gets only the fee heads
 * not yet on it (so the Class 11 admission fee can be added to the yearly
 * bill later). Safe to run twice: the second run finds everything in place.
 */
export async function runBills(session: Session, input: RunInput) {
  assertAdmin(session);
  const data = runInput.parse(input);
  const db = await getDb();
  const today = todayIST();
  if (data.dueDate < today) throw new ApiError(400, 'The due date cannot be in the past', { dueDate: 'Pick today or a later date' });

  const result = await db.transaction(async (tx) => {
    const { year, rows } = await planRun(tx, data);
    let created = 0;
    let added = 0;
    let amount = 0;
    for (const row of rows) {
      if (row.skip) continue;
      const lineTotal = row.heads.reduce((sum, head) => sum + head.amount, 0);
      if (row.existing) {
        await tx.insert(invoiceItems).values(row.heads.map((head) => ({ invoiceId: row.existing!.id, feeHeadId: head.id, description: head.name, amount: head.amount })));
        const subtotal = row.existing.subtotal + lineTotal;
        const total = subtotal - row.existing.discount;
        await tx.update(invoices).set({ subtotal, total, status: invoiceStatus(total, row.existing.paid) }).where(eq(invoices.id, row.existing.id));
        added += 1;
      } else {
        const [bill] = await tx
          .insert(invoices)
          .values({
            studentId: row.studentId,
            yearId: year.id,
            invoiceNo: await nextBillNo(tx, today),
            period: data.period,
            title: runTitle(data.period),
            issueDate: today,
            dueDate: data.dueDate,
            subtotal: lineTotal,
            total: lineTotal,
            status: invoiceStatus(lineTotal, 0),
            createdBy: session.uid,
          })
          // Two people pressing Run together: the unique (student, period) index lets only one bill in.
          .onConflictDoNothing({ target: [invoices.studentId, invoices.period] })
          .returning({ id: invoices.id });
        if (!bill) continue;
        await tx.insert(invoiceItems).values(row.heads.map((head) => ({ invoiceId: bill.id, feeHeadId: head.id, description: head.name, amount: head.amount })));
        created += 1;
      }
      amount += lineTotal;
    }
    return { created, added, amount, ...summariseSkips(rows) };
  });

  if (result.created + result.added > 0) {
    await audit(session, 'invoice.run', {
      entity: 'invoice',
      summary: `Bill run for ${billPeriodLabel(data.period)}: ${result.created} new, ${result.added} added to, ${inr(result.amount)}`,
      meta: { period: data.period, fromGrade: data.fromGrade, toGrade: data.toGrade, ...result },
    });
  }
  return result;
}

const summariseSkips = (rows: RunPlanRow[]) => ({
  alreadyBilled: rows.filter((row) => row.skip === 'billed').length,
  noFee: rows.filter((row) => row.skip === 'no_fee').length,
});

/* ───────────── one-off bill ───────────── */

const billInput = z.object({
  studentId: uuid,
  title: requiredText('What the bill is for', 120),
  lines: z
    .array(z.object({ feeHeadId: optionalUuid, description: requiredText('Description', 160), amount: rupees.refine((v) => v > 0, 'Enter an amount') }))
    .min(1, 'Add at least one line')
    .max(20),
  dueDate: day,
  notes: text(500),
});
export type BillInput = z.input<typeof billInput>;

/** A bill outside the run: a certificate fee, a lost identity card, anything the school charges once. */
export async function createBill(session: Session, input: BillInput) {
  assertOffice(session);
  const data = billInput.parse(input);
  const db = await getDb();
  const today = todayIST();
  if (data.dueDate < today) throw new ApiError(400, 'The due date cannot be in the past', { dueDate: 'Pick today or a later date' });

  const [student] = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(and(eq(students.id, data.studentId), liveStudent))
    .limit(1);
  if (!student) return notFound('Student');

  const headIds = [...new Set(data.lines.map((line) => line.feeHeadId).filter((id): id is string => !!id))];
  if (headIds.length) {
    const found = await db.select({ id: feeHeads.id }).from(feeHeads).where(inArray(feeHeads.id, headIds));
    if (found.length !== headIds.length) throw new ApiError(400, 'One of the fee heads is no longer there');
  }
  const total = data.lines.reduce((sum, line) => sum + line.amount, 0);
  const year = await currentYear(db);

  const bill = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(invoices)
      .values({
        studentId: student.id,
        yearId: year.id,
        invoiceNo: await nextBillNo(tx, today),
        period: null,
        title: data.title,
        issueDate: today,
        dueDate: data.dueDate,
        subtotal: total,
        total,
        status: invoiceStatus(total, 0),
        notes: data.notes,
        createdBy: session.uid,
      })
      .returning();
    await tx.insert(invoiceItems).values(data.lines.map((line) => ({ invoiceId: row.id, feeHeadId: line.feeHeadId, description: line.description, amount: line.amount })));
    return row;
  });

  await audit(session, 'invoice.create', { entity: 'invoice', entityId: bill.id, summary: `Bill ${bill.invoiceNo} for ${student.name}: ${data.title}, ${inr(total)}` });
  return bill;
}

/* ───────────── corrections (head of school only) ───────────── */

async function lockBill(tx: Tx, id: string) {
  // Locked so a payment saved at the same moment cannot slip past the checks below.
  const [bill] = await tx.select().from(invoices).where(eq(invoices.id, id)).for('update').limit(1);
  return bill ?? notFound('Bill');
}

/** A bill raised by mistake. It is kept, marked cancelled, and drops out of every total. */
export async function cancelBill(session: Session, id: string, reason: string) {
  assertAdmin(session);
  const why = requiredText('Reason', 200).parse(reason);
  const billId = uuid.parse(id);
  const db = await getDb();
  const bill = await db.transaction(async (tx) => {
    const row = await lockBill(tx, billId);
    if (row.status === 'cancelled') throw new ApiError(400, 'This bill is already cancelled');
    const [{ n }] = await tx
      .select({ n: countInt() })
      .from(payments)
      .where(and(eq(payments.invoiceId, row.id), isNull(payments.voidedAt)));
    if (n > 0 || row.paid > 0) throw new ApiError(400, 'This bill has a receipt against it. Void the receipt first, then cancel the bill.');
    await tx
      .update(invoices)
      .set({ status: 'cancelled', notes: [row.notes, `Cancelled: ${why}`].filter(Boolean).join('\n') })
      .where(eq(invoices.id, row.id));
    return row;
  });
  await audit(session, 'invoice.cancel', { entity: 'invoice', entityId: bill.id, summary: `Cancelled bill ${bill.invoiceNo} (${inr(bill.total)}): ${why}` });
  return { id: bill.id };
}

const concessionInput = z.object({ discount: rupees, reason: text(200) });

/** A concession (fee waiver) on a bill not fully paid. The bill never drops below what is already received. */
export async function setConcession(session: Session, id: string, input: z.input<typeof concessionInput>) {
  assertAdmin(session);
  const data = concessionInput.parse(input);
  const billId = uuid.parse(id);
  if (data.discount > 0 && !data.reason) throw new ApiError(400, 'Write the reason for the concession', { reason: 'Reason is required' });
  const db = await getDb();
  const bill = await db.transaction(async (tx) => {
    const row = await lockBill(tx, billId);
    if (!OPEN.includes(row.status)) throw new ApiError(400, 'A concession can only be given on a bill that is not fully paid');
    if (data.discount > row.subtotal) throw new ApiError(400, 'The concession cannot be more than the bill', { discount: 'More than the bill amount' });
    const total = row.subtotal - data.discount;
    if (total < row.paid) throw new ApiError(400, `${inr(row.paid)} is already received on this bill, so the concession can be ${inr(row.subtotal - row.paid)} at the most`, { discount: 'Too much for what is already paid' });
    // One concession line in the notes: a changed concession replaces the old reason.
    const kept = row.notes.split('\n').filter((line) => line && !line.startsWith('Concession: '));
    const [updated] = await tx
      .update(invoices)
      .set({ discount: data.discount, total, status: invoiceStatus(total, row.paid), notes: [...kept, data.discount > 0 ? `Concession: ${data.reason}` : ''].filter(Boolean).join('\n') })
      .where(eq(invoices.id, row.id))
      .returning();
    return updated;
  });
  await audit(session, 'invoice.concession', { entity: 'invoice', entityId: bill.id, summary: `Concession of ${inr(data.discount)} on bill ${bill.invoiceNo}${data.reason ? `: ${data.reason}` : ''}` });
  return bill;
}

/* ───────────── dues ───────────── */

export type DueRow = {
  studentId: string;
  name: string;
  admissionNo: string;
  phone: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  sectionId: string | null;
  grade: number | null;
  sectionName: string | null;
  stream: string | null;
  shift: string | null;
  rollNo: number | null;
  bills: number;
  due: number;
  oldestDue: string;
  /** What is pending, oldest first: '2026', 'Apr 2026', or a one-off bill's title. */
  pending: string[];
};

/** One row per student who owes something. */
export async function listDues(session: Session, opts: { sort?: string; section?: string; q?: string; grade?: string } = {}): Promise<DueRow[]> {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const q = (opts.q ?? '').trim().slice(0, 80);
  const grade = Number(opts.grade);
  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      admissionNo: students.admissionNo,
      phone: students.phone,
      fatherName: students.fatherName,
      motherName: students.motherName,
      guardianName: students.guardianName,
      ...sectionColumns,
      bills: countInt(),
      due: sumInt(balance),
      oldestDue: sql<string>`min(${invoices.dueDate})::text`,
      // Period for a run's bill, the title for a one-off; unit separator because titles may hold commas.
      pending: sql<string>`string_agg(coalesce(${invoices.period}, ${invoices.title}), chr(31) order by ${invoices.dueDate}, ${invoices.invoiceNo})`,
    })
    .from(invoices)
    .innerJoin(students, eq(students.id, invoices.studentId))
    .leftJoin(enrolments, placeJoin(year.id))
    .leftJoin(sections, sectionJoin)
    .where(
      and(
        inArray(invoices.status, OPEN),
        liveStudent,
        isUuid(opts.section) ? eq(sections.id, opts.section) : undefined,
        Number.isInteger(grade) && grade > 0 ? eq(sections.grade, grade) : undefined,
        q ? or(ilike(students.name, likeText(q)), ilike(students.admissionNo, likeText(q)), ilike(students.phone, likeText(q))) : undefined,
      ),
    )
    .groupBy(students.id, sections.id, enrolments.rollNo)
    .orderBy(
      ...(opts.sort === 'age'
        ? [sql`min(${invoices.dueDate}) asc`, sql`sum(${balance}) desc`]
        : opts.sort === 'class'
          ? [asc(sections.grade), asc(sections.stream), asc(sections.name), asc(enrolments.rollNo)]
          : [sql`sum(${balance}) desc`, sql`min(${invoices.dueDate}) asc`]),
    );

  return rows.map((row) => ({
    ...row,
    pending: (row.pending ?? '').split(String.fromCharCode(31)).filter(Boolean).map((p) => (isMonth(p) ? periodLabel(p) : p)),
  }));
}

/** One student's unpaid bills, oldest first. */
export async function openBills(session: Session, studentId: string) {
  assertOffice(session);
  if (!isUuid(studentId)) return [];
  const db = await getDb();
  return db
    .select({ id: invoices.id, invoiceNo: invoices.invoiceNo, title: invoices.title, period: invoices.period, dueDate: invoices.dueDate, total: invoices.total, paid: invoices.paid, status: invoices.status })
    .from(invoices)
    .where(and(eq(invoices.studentId, studentId), inArray(invoices.status, OPEN)))
    .orderBy(asc(invoices.dueDate), asc(invoices.issueDate), asc(invoices.invoiceNo));
}

/**
 * Finds a student for "Take payment" and "New bill": by name, admission
 * number or mobile; or, with a section picked, by roll number.
 */
export async function findStudents(session: Session, opts: { q?: string; section?: string }) {
  assertOffice(session);
  const db = await getDb();
  const year = await currentYear(db);
  const term = (opts.q ?? '').trim().slice(0, 80);
  const section = isUuid(opts.section) ? opts.section : null;
  const roll = /^\d{1,3}$/.test(term) ? Number(term) : null;
  const dueOf = db
    .select({ studentId: invoices.studentId, due: sumInt(balance).as('due') })
    .from(invoices)
    .where(inArray(invoices.status, OPEN))
    .groupBy(invoices.studentId)
    .as('due_of');

  let match: SQL | undefined;
  if (section && roll !== null) match = and(eq(sections.id, section), eq(enrolments.rollNo, roll));
  else if (term) {
    match = and(
      section ? eq(sections.id, section) : undefined,
      or(ilike(students.name, likeText(term)), ilike(students.admissionNo, likeText(term)), ilike(students.phone, likeText(term))),
    );
  } else if (section) match = eq(sections.id, section);
  else match = sql`coalesce(${dueOf.due}, 0) > 0`;

  return db
    .select({
      id: students.id,
      name: students.name,
      admissionNo: students.admissionNo,
      status: students.status,
      phone: students.phone,
      photo: students.photo,
      ...sectionColumns,
      due: sql<number>`coalesce(${dueOf.due}, 0)::int`,
    })
    .from(students)
    .leftJoin(enrolments, placeJoin(year.id))
    .leftJoin(sections, sectionJoin)
    .leftJoin(dueOf, eq(dueOf.studentId, students.id))
    .where(and(liveStudent, match))
    .orderBy(...(section ? [asc(enrolments.rollNo)] : [sql`coalesce(${dueOf.due}, 0) desc`, asc(students.name)]))
    .limit(section ? 120 : term ? 25 : 15);
}

export async function getStudentCard(session: Session, studentId: string) {
  assertOffice(session);
  if (!isUuid(studentId)) return null;
  const db = await getDb();
  const year = await currentYear(db);
  const [row] = await db
    .select({
      id: students.id,
      name: students.name,
      admissionNo: students.admissionNo,
      photo: students.photo,
      status: students.status,
      phone: students.phone,
      fatherName: students.fatherName,
      motherName: students.motherName,
      ...sectionColumns,
    })
    .from(students)
    .leftJoin(enrolments, placeJoin(year.id))
    .leftJoin(sections, sectionJoin)
    .where(and(eq(students.id, studentId), liveStudent))
    .limit(1);
  return row ?? null;
}

/** Sections of the current year, for the class filters. */
export async function listSections() {
  const db = await getDb();
  const year = await currentYear(db);
  const rows = await db.select().from(sections).where(eq(sections.yearId, year.id));
  return rows.sort((a, b) => a.grade - b.grade || a.shift.localeCompare(b.shift) || a.stream.localeCompare(b.stream) || a.name.localeCompare(b.name));
}

/* ───────────── fee heads ───────────── */

export async function listFeeHeads(opts: { activeOnly?: boolean } = {}) {
  const db = await getDb();
  return db
    .select()
    .from(feeHeads)
    .where(opts.activeOnly ? eq(feeHeads.active, true) : undefined)
    .orderBy(asc(feeHeads.kind), asc(feeHeads.fromGrade), asc(feeHeads.name));
}

const lowest = Math.min(...SCHOOL.grades);
const highest = Math.max(...SCHOOL.grades);

const feeHeadInput = z.object({
  id: optionalUuid,
  name: requiredText('Name', 80),
  kind: z.enum(FEE_KINDS),
  fromGrade: z.coerce.number().int().min(0).max(12),
  toGrade: z.coerce.number().int().min(0).max(12),
  amount: rupees,
  active: z.boolean().default(true),
});
export type FeeHeadInput = z.input<typeof feeHeadInput>;

/** Adds or changes a fee head. Bills already raised keep their own amounts. Head of school only. */
export async function saveFeeHead(session: Session, input: FeeHeadInput) {
  assertAdmin(session);
  const data = feeHeadInput.parse(input);
  if (data.fromGrade > data.toGrade) throw new ApiError(400, 'The first class must not be above the last class', { fromGrade: 'Check the classes' });
  if (data.toGrade < lowest || data.fromGrade > highest) throw new ApiError(400, 'Pick classes this school teaches', { fromGrade: 'Check the classes' });
  const values = { name: data.name, kind: data.kind, fromGrade: data.fromGrade, toGrade: data.toGrade, amount: data.amount, active: data.active };
  const db = await getDb();
  let row;
  if (data.id) {
    [row] = await db.update(feeHeads).set(values).where(eq(feeHeads.id, data.id)).returning();
    if (!row) return notFound('Fee head');
  } else {
    [row] = await db.insert(feeHeads).values(values).returning();
  }
  await audit(session, data.id ? 'fee_head.update' : 'fee_head.create', {
    entity: 'fee_head',
    entityId: row.id,
    summary: `${row.name}: ${inr(row.amount)}, Class ${row.fromGrade} to ${row.toGrade}${row.active ? '' : ' (switched off)'}`,
  });
  return row;
}

/* ───────────── for the parents' corner ───────────── */

/**
 * A student's bills and receipts. The caller checks that this login may see
 * this student (parentStudentIds in src/server/school/access.ts).
 */
export async function listBillsForStudent(studentId: string) {
  if (!isUuid(studentId)) return { bills: [], receipts: [], due: 0 };
  const db = await getDb();
  const [bills, receipts] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNo: invoices.invoiceNo,
        title: invoices.title,
        period: invoices.period,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        total: invoices.total,
        paid: invoices.paid,
        status: invoices.status,
      })
      .from(invoices)
      .where(and(eq(invoices.studentId, studentId), ne(invoices.status, 'cancelled')))
      .orderBy(desc(invoices.issueDate), desc(invoices.invoiceNo)),
    db
      .select({ id: payments.id, receiptNo: payments.receiptNo, amount: payments.amount, method: payments.method, paidOn: payments.paidOn, invoiceNo: invoices.invoiceNo, title: invoices.title, period: invoices.period })
      .from(payments)
      .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
      .where(and(eq(payments.studentId, studentId), isNull(payments.voidedAt)))
      .orderBy(desc(payments.paidOn), desc(payments.receiptNo)),
  ]);
  const items = bills.length ? await db.select({ invoiceId: invoiceItems.invoiceId, description: invoiceItems.description, amount: invoiceItems.amount }).from(invoiceItems).where(inArray(invoiceItems.invoiceId, bills.map((bill) => bill.id))) : [];
  return {
    bills: bills.map((bill) => ({ ...bill, items: items.filter((item) => item.invoiceId === bill.id) })),
    receipts,
    due: bills.filter((bill) => OPEN.includes(bill.status)).reduce((sum, bill) => sum + bill.total - bill.paid, 0),
  };
}

/** Default due date of a new bill: today plus the days in the fee settings. */
export async function defaultDueDate() {
  const { dueDays } = await feeSettings();
  return addDays(todayIST(), dueDays);
}
