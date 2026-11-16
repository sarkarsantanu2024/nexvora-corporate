/**
 * Bills (invoices) of one centre: the list, one bill, the monthly run,
 * one-off bills, cancelling, discounts, the dues list and fee heads.
 */
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx, type Tx } from '@/db';
import {
  FEE_KINDS,
  INVOICE_STATUSES,
  batches,
  feeHeads,
  invoiceItems,
  invoices,
  payments,
  programmes,
  students,
  users,
  type InvoiceStatus,
} from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { addMonths, currentPeriod, periodLabel, periodRange, todayIST } from '@/lib/date';
import { inr, invoiceStatus } from '@/lib/money';
import { nextInvoiceNo } from '@/lib/numbering';
import { day, optionalUuid, period as periodSchema, requiredText, rupees, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertManager, countInt, feeSettings, likeText, liveStudent, notFound, pageOf, sumInt, type Ctx } from './shared';

const OPEN: InvoiceStatus[] = ['unpaid', 'partial'];
const balance = sql<number>`(${invoices.total} - ${invoices.paid})`;

/* ───────────── list ───────────── */

export type BillFilter = {
  q?: string;
  /** A bill status, or 'due' (unpaid and part paid) or 'overdue' (due and past its date). */
  status?: string;
  month?: string;
  batch?: string;
  student?: string;
  page?: number | string;
};

const isUuid = (value: string | undefined): value is string => !!value && uuid.safeParse(value).success;
const isPeriod = (value: string | undefined): value is string => !!value && periodSchema.safeParse(value).success;

function billWhere(ctx: Ctx, filter: BillFilter): SQL | undefined {
  const where: (SQL | undefined)[] = [eq(invoices.centreId, ctx.centre.id)];
  const q = (filter.q ?? '').trim().slice(0, 80);
  if (q) where.push(or(ilike(students.name, likeText(q)), ilike(students.admissionNo, likeText(q)), ilike(invoices.invoiceNo, likeText(q))));
  if (filter.status === 'due') where.push(inArray(invoices.status, OPEN));
  else if (filter.status === 'overdue') where.push(inArray(invoices.status, OPEN), lt(invoices.dueDate, todayIST()));
  else if ((INVOICE_STATUSES as readonly string[]).includes(filter.status ?? '')) where.push(eq(invoices.status, filter.status as InvoiceStatus));
  if (isPeriod(filter.month)) {
    // A one-off bill has no month of its own, so it is listed under the month it was raised in.
    const { from, to } = periodRange(filter.month);
    where.push(or(eq(invoices.period, filter.month), and(isNull(invoices.period), gte(invoices.issueDate, from), lte(invoices.issueDate, to))));
  }
  if (isUuid(filter.batch)) where.push(eq(students.batchId, filter.batch));
  if (isUuid(filter.student)) where.push(eq(invoices.studentId, filter.student));
  return and(...where);
}

export async function listBills(ctx: Ctx, filter: BillFilter = {}) {
  const db = await getDb();
  const where = billWhere(ctx, filter);
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
        batchName: batches.name,
      })
      .from(invoices)
      .innerJoin(students, eq(students.id, invoices.studentId))
      .leftJoin(batches, eq(batches.id, students.batchId))
      .where(where)
      .orderBy(desc(invoices.issueDate), desc(invoices.invoiceNo))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({
        count: countInt(),
        // Cancelled bills stay in the list but are owed by nobody, so they are left out of the sums.
        billed: sql<number>`coalesce(sum(${invoices.total}) filter (where ${live}), 0)::int`,
        received: sql<number>`coalesce(sum(${invoices.paid}) filter (where ${live}), 0)::int`,
      })
      .from(invoices)
      .innerJoin(students, eq(students.id, invoices.studentId))
      .where(where),
  ]);

  return {
    rows,
    page,
    pageSize: PAGE_SIZE,
    count: totals.count,
    totals: { billed: totals.billed, received: totals.received, balance: totals.billed - totals.received },
  };
}

/* ───────────── one bill ───────────── */

export async function getBill(ctx: Ctx, id: string) {
  if (!isUuid(id)) return notFound('Bill');
  const db = await getDb();
  const [bill] = await db
    .select({
      invoice: invoices,
      studentName: students.name,
      admissionNo: students.admissionNo,
      guardianPhone: students.guardianPhone,
      fatherName: students.fatherName,
      motherName: students.motherName,
      batchName: batches.name,
    })
    .from(invoices)
    .innerJoin(students, eq(students.id, invoices.studentId))
    .leftJoin(batches, eq(batches.id, students.batchId))
    .where(and(eq(invoices.id, id), eq(invoices.centreId, ctx.centre.id)))
    .limit(1);
  if (!bill) return notFound('Bill');

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
      .where(and(eq(payments.invoiceId, id), eq(payments.centreId, ctx.centre.id)))
      .orderBy(asc(payments.paidOn), asc(payments.receiptNo)),
  ]);
  return { ...bill, items, receipts };
}

/* ───────────── monthly run ───────────── */

export type RunRow = {
  studentId: string;
  name: string;
  admissionNo: string;
  batchName: string | null;
  /** Null when neither the child nor the class has a monthly fee. */
  amount: number | null;
  /** Where the amount came from. */
  source: 'child' | 'fee head' | null;
  feeHeadId: string | null;
  invoiceId: string | null;
  invoiceNo: string | null;
  invoiceStatus: InvoiceStatus | null;
};

async function runRows(db: DbOrTx, centreId: string, month: string): Promise<RunRow[]> {
  const { to } = periodRange(month);
  const [children, heads] = await Promise.all([
    db
      .select({
        studentId: students.id,
        name: students.name,
        admissionNo: students.admissionNo,
        programmeId: students.programmeId,
        monthlyFee: students.monthlyFee,
        batchName: batches.name,
        invoiceId: invoices.id,
        invoiceNo: invoices.invoiceNo,
        invoiceStatus: invoices.status,
      })
      .from(students)
      .leftJoin(batches, eq(batches.id, students.batchId))
      .leftJoin(invoices, and(eq(invoices.studentId, students.id), eq(invoices.period, month)))
      // Children who have left are not billed; a child joining next month is not billed for this one.
      .where(and(eq(students.centreId, centreId), eq(students.status, 'active'), liveStudent, lte(students.admissionDate, to)))
      .orderBy(asc(batches.name), asc(students.name)),
    db
      .select()
      .from(feeHeads)
      .where(and(eq(feeHeads.centreId, centreId), eq(feeHeads.kind, 'monthly'), eq(feeHeads.active, true)))
      .orderBy(asc(feeHeads.createdAt)),
  ]);
  const headFor = (programmeId: string | null) => heads.find((h) => h.programmeId === programmeId) ?? null;

  return children.map((child) => {
    const head = headFor(child.programmeId);
    const own = child.monthlyFee != null && child.monthlyFee > 0;
    const amount = own ? child.monthlyFee : head && head.amount > 0 ? head.amount : null;
    return {
      studentId: child.studentId,
      name: child.name,
      admissionNo: child.admissionNo,
      batchName: child.batchName,
      amount,
      source: amount == null ? null : own ? 'child' : 'fee head',
      feeHeadId: head?.id ?? null,
      invoiceId: child.invoiceId,
      invoiceNo: child.invoiceNo,
      invoiceStatus: child.invoiceStatus,
    };
  });
}

/** Bills can be raised for past months and one month ahead, not further. */
function assertRunMonth(month: string) {
  const parsed = periodSchema.parse(month);
  if (parsed > addMonths(currentPeriod(), 1)) throw new ApiError(400, 'Bills can be raised for next month at the most');
  return parsed;
}

export async function previewRun(ctx: Ctx, month: string) {
  assertManager(ctx);
  const period = assertRunMonth(month);
  const db = await getDb();
  const rows = await runRows(db, ctx.centre.id, period);
  const toRaise = rows.filter((r) => !r.invoiceId && r.amount != null);
  return {
    period,
    rows,
    toRaise: toRaise.length,
    toRaiseAmount: toRaise.reduce((sum, r) => sum + (r.amount ?? 0), 0),
    noFee: rows.filter((r) => !r.invoiceId && r.amount == null).length,
    alreadyBilled: rows.filter((r) => r.invoiceId).length,
  };
}

/**
 * Raises the month's bill for every active child who does not have one.
 * Safe to run twice: the second run finds every bill in place and adds nothing.
 */
export async function runMonthly(ctx: Ctx, month: string) {
  assertManager(ctx);
  const period = assertRunMonth(month);
  const db = await getDb();
  const today = todayIST();
  const { dueDay } = await feeSettings(db);
  // A bill for a month that has not begun is dated the 1st of that month.
  const issueDate = `${period}-01` > today ? `${period}-01` : today;
  const dueOn = `${period}-${String(dueDay).padStart(2, '0')}`;
  const dueDate = dueOn < issueDate ? issueDate : dueOn;
  const label = periodLabel(period);

  const result = await db.transaction(async (tx) => {
    const rows = await runRows(tx, ctx.centre.id, period);
    let created = 0;
    let amount = 0;
    for (const row of rows) {
      if (row.invoiceId || row.amount == null) continue;
      const [bill] = await tx
        .insert(invoices)
        .values({
          centreId: ctx.centre.id,
          studentId: row.studentId,
          invoiceNo: await nextInvoiceNo(tx, ctx.centre.id, issueDate),
          period,
          title: `Fee for ${label}`,
          issueDate,
          dueDate,
          subtotal: row.amount,
          total: row.amount,
          status: invoiceStatus(row.amount, 0),
          createdBy: ctx.session.uid,
        })
        // Two people pressing the button together: the unique (child, month) index lets only one bill in.
        .onConflictDoNothing({ target: [invoices.studentId, invoices.period] })
        .returning({ id: invoices.id });
      if (!bill) continue;
      await tx.insert(invoiceItems).values({ invoiceId: bill.id, feeHeadId: row.feeHeadId, description: `Tuition fee, ${label}`, amount: row.amount });
      created += 1;
      amount += row.amount;
    }
    return {
      period,
      created,
      amount,
      alreadyBilled: rows.filter((r) => r.invoiceId).length,
      noFee: rows.filter((r) => !r.invoiceId && r.amount == null).length,
    };
  });

  if (result.created > 0) {
    await audit(ctx.session, 'invoice.run', {
      entity: 'invoice',
      centreId: ctx.centre.id,
      summary: `Raised ${result.created} bill${result.created === 1 ? '' : 's'} for ${label}, ${inr(result.amount)}`,
      meta: { period, created: result.created, amount: result.amount },
    });
  }
  return result;
}

/* ───────────── one-off bill ───────────── */

const billInput = z.object({
  studentId: uuid,
  title: requiredText('What the bill is for', 120),
  lines: z
    .array(z.object({ feeHeadId: optionalUuid, description: requiredText('Description', 160), amount: rupees.refine((v) => v > 0, 'Enter an amount') }))
    .min(1, 'Add at least one line')
    .max(20),
  discount: rupees.default(0),
  discountReason: text(200),
  dueDate: day,
  notes: text(500),
});
export type BillInput = z.input<typeof billInput>;

/** A bill outside the monthly run: admission fee, annual kit, anything else. */
export async function createBill(ctx: Ctx, input: BillInput) {
  const data = billInput.parse(input);
  const db = await getDb();
  const today = todayIST();
  if (data.dueDate < today) throw new ApiError(400, 'The due date cannot be in the past', { dueDate: 'Pick today or a later date' });

  const subtotal = data.lines.reduce((sum, line) => sum + line.amount, 0);
  if (data.discount > 0) {
    assertManager(ctx);
    if (!data.discountReason) throw new ApiError(400, 'Write the reason for the discount', { discountReason: 'Reason is required' });
    if (data.discount > subtotal) throw new ApiError(400, 'The discount cannot be more than the bill', { discount: 'More than the bill amount' });
  }
  const total = subtotal - data.discount;

  const [student] = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(and(eq(students.id, data.studentId), eq(students.centreId, ctx.centre.id), liveStudent))
    .limit(1);
  if (!student) return notFound('Child');

  const headIds = [...new Set(data.lines.map((l) => l.feeHeadId).filter((id): id is string => !!id))];
  if (headIds.length) {
    const found = await db
      .select({ id: feeHeads.id })
      .from(feeHeads)
      .where(and(inArray(feeHeads.id, headIds), eq(feeHeads.centreId, ctx.centre.id)));
    if (found.length !== headIds.length) throw new ApiError(400, 'One of the fee heads does not belong to this centre');
  }

  const bill = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(invoices)
      .values({
        centreId: ctx.centre.id,
        studentId: student.id,
        invoiceNo: await nextInvoiceNo(tx, ctx.centre.id, today),
        period: null,
        title: data.title,
        issueDate: today,
        dueDate: data.dueDate,
        subtotal,
        discount: data.discount,
        total,
        status: invoiceStatus(total, 0),
        notes: [data.notes, data.discount > 0 ? `Discount: ${data.discountReason}` : ''].filter(Boolean).join('\n'),
        createdBy: ctx.session.uid,
      })
      .returning();
    await tx.insert(invoiceItems).values(data.lines.map((line) => ({ invoiceId: row.id, feeHeadId: line.feeHeadId, description: line.description, amount: line.amount })));
    return row;
  });

  await audit(ctx.session, 'invoice.create', {
    entity: 'invoice',
    entityId: bill.id,
    centreId: ctx.centre.id,
    summary: `Bill ${bill.invoiceNo} for ${student.name}: ${data.title}, ${inr(total)}`,
  });
  return bill;
}

/* ───────────── corrections ───────────── */

async function lockBill(tx: Tx, ctx: Ctx, id: string) {
  // Locked so a payment saved at the same moment cannot slip past the checks below.
  const [bill] = await tx
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.centreId, ctx.centre.id)))
    .for('update')
    .limit(1);
  return bill ?? notFound('Bill');
}

/** A bill raised by mistake. It is kept, marked cancelled, and drops out of every total. */
export async function cancelBill(ctx: Ctx, id: string, reason: string) {
  assertManager(ctx);
  const why = requiredText('Reason', 200).parse(reason);
  const billId = uuid.parse(id);
  const db = await getDb();
  const bill = await db.transaction(async (tx) => {
    const row = await lockBill(tx, ctx, billId);
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
  await audit(ctx.session, 'invoice.cancel', {
    entity: 'invoice',
    entityId: bill.id,
    centreId: ctx.centre.id,
    summary: `Cancelled bill ${bill.invoiceNo} (${inr(bill.total)}): ${why}`,
  });
  return { id: bill.id };
}

const discountInput = z.object({ discount: rupees, reason: text(200) });

/** Sets the discount on a bill that is not fully paid. The bill can never drop below what is already received. */
export async function discountBill(ctx: Ctx, id: string, input: z.input<typeof discountInput>) {
  assertManager(ctx);
  const data = discountInput.parse(input);
  const billId = uuid.parse(id);
  if (data.discount > 0 && !data.reason) throw new ApiError(400, 'Write the reason for the discount', { reason: 'Reason is required' });
  const db = await getDb();
  const bill = await db.transaction(async (tx) => {
    const row = await lockBill(tx, ctx, billId);
    if (!OPEN.includes(row.status)) throw new ApiError(400, 'A discount can only be given on a bill that is not fully paid');
    if (data.discount > row.subtotal) throw new ApiError(400, 'The discount cannot be more than the bill', { discount: 'More than the bill amount' });
    const total = row.subtotal - data.discount;
    if (total < row.paid) {
      throw new ApiError(400, `${inr(row.paid)} is already received on this bill, so the discount can be ${inr(row.subtotal - row.paid)} at the most`, {
        discount: 'Too much for what is already paid',
      });
    }
    // One discount line in the notes: a changed discount replaces the old reason.
    const kept = row.notes.split('\n').filter((line) => line && !line.startsWith('Discount: '));
    const [updated] = await tx
      .update(invoices)
      .set({
        discount: data.discount,
        total,
        status: invoiceStatus(total, row.paid),
        notes: [...kept, data.discount > 0 ? `Discount: ${data.reason}` : ''].filter(Boolean).join('\n'),
      })
      .where(eq(invoices.id, row.id))
      .returning();
    return updated;
  });
  await audit(ctx.session, 'invoice.discount', {
    entity: 'invoice',
    entityId: bill.id,
    centreId: ctx.centre.id,
    summary: `Discount of ${inr(data.discount)} on bill ${bill.invoiceNo}${data.reason ? `: ${data.reason}` : ''}`,
  });
  return bill;
}

/* ───────────── dues ───────────── */

export type DueRow = {
  studentId: string;
  name: string;
  admissionNo: string;
  batchName: string | null;
  guardianPhone: string;
  fatherName: string;
  motherName: string;
  bills: number;
  due: number;
  oldestDue: string;
  /** What is pending, oldest first: 'Oct 2026', 'Nov 2026', 'Admission'. */
  pending: string[];
};

/** One row per child who owes something. */
export async function listDues(ctx: Ctx, opts: { sort?: string; batch?: string; q?: string } = {}): Promise<DueRow[]> {
  const db = await getDb();
  const due = sumInt(balance);
  const oldest = sql<string>`min(${invoices.dueDate})::text`;
  const q = (opts.q ?? '').trim().slice(0, 80);
  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      admissionNo: students.admissionNo,
      batchName: batches.name,
      guardianPhone: students.guardianPhone,
      fatherName: students.fatherName,
      motherName: students.motherName,
      bills: countInt(),
      due,
      oldestDue: oldest,
      // Month for a monthly bill, the title for a one-off; unit separator because titles may hold commas.
      pending: sql<string>`string_agg(coalesce(${invoices.period}, ${invoices.title}), chr(31) order by ${invoices.dueDate}, ${invoices.invoiceNo})`,
    })
    .from(invoices)
    .innerJoin(students, eq(students.id, invoices.studentId))
    .leftJoin(batches, eq(batches.id, students.batchId))
    .where(
      and(
        eq(invoices.centreId, ctx.centre.id),
        inArray(invoices.status, OPEN),
        isUuid(opts.batch) ? eq(students.batchId, opts.batch) : undefined,
        q ? or(ilike(students.name, likeText(q)), ilike(students.admissionNo, likeText(q)), ilike(students.guardianPhone, likeText(q))) : undefined,
      ),
    )
    .groupBy(students.id, batches.name)
    .orderBy(...(opts.sort === 'age' ? [sql`min(${invoices.dueDate}) asc`, sql`sum(${balance}) desc`] : [sql`sum(${balance}) desc`, sql`min(${invoices.dueDate}) asc`]));

  return rows.map((row) => ({
    ...row,
    pending: (row.pending ?? '').split(String.fromCharCode(31)).filter(Boolean).map((p) => (isPeriod(p) ? periodLabel(p) : p)),
  }));
}

/** What one child owes in all, and the unpaid bills behind it, oldest first. */
export async function openBills(ctx: Ctx, studentId: string) {
  const db = await getDb();
  return db
    .select({
      id: invoices.id,
      invoiceNo: invoices.invoiceNo,
      title: invoices.title,
      period: invoices.period,
      dueDate: invoices.dueDate,
      total: invoices.total,
      paid: invoices.paid,
      status: invoices.status,
    })
    .from(invoices)
    .where(and(eq(invoices.centreId, ctx.centre.id), eq(invoices.studentId, studentId), inArray(invoices.status, OPEN)))
    .orderBy(asc(invoices.dueDate), asc(invoices.issueDate), asc(invoices.invoiceNo));
}

/** For the child pickers on "Take a payment" and "New bill". */
export async function findChildren(ctx: Ctx, q: string) {
  const db = await getDb();
  const term = q.trim().slice(0, 80);
  const dueOf = db
    .select({ studentId: invoices.studentId, due: sumInt(balance).as('due') })
    .from(invoices)
    .where(and(eq(invoices.centreId, ctx.centre.id), inArray(invoices.status, OPEN)))
    .groupBy(invoices.studentId)
    .as('due_of');
  return db
    .select({
      id: students.id,
      name: students.name,
      admissionNo: students.admissionNo,
      status: students.status,
      guardianPhone: students.guardianPhone,
      batchName: batches.name,
      due: sql<number>`coalesce(${dueOf.due}, 0)::int`,
    })
    .from(students)
    .leftJoin(batches, eq(batches.id, students.batchId))
    .leftJoin(dueOf, eq(dueOf.studentId, students.id))
    .where(
      and(
        eq(students.centreId, ctx.centre.id),
        liveStudent,
        term
          ? or(ilike(students.name, likeText(term)), ilike(students.admissionNo, likeText(term)), ilike(students.guardianPhone, likeText(term)))
          : eq(students.status, 'active'),
      ),
    )
    .orderBy(sql`coalesce(${dueOf.due}, 0) desc`, asc(students.name))
    .limit(term ? 20 : 12);
}

export async function getChild(ctx: Ctx, studentId: string) {
  if (!isUuid(studentId)) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      id: students.id,
      name: students.name,
      admissionNo: students.admissionNo,
      photo: students.photo,
      status: students.status,
      guardianPhone: students.guardianPhone,
      fatherName: students.fatherName,
      motherName: students.motherName,
      batchName: batches.name,
    })
    .from(students)
    .leftJoin(batches, eq(batches.id, students.batchId))
    .where(and(eq(students.id, studentId), eq(students.centreId, ctx.centre.id), liveStudent))
    .limit(1);
  return row ?? null;
}

/** The centre's classes, for the class filter on the money lists. */
export async function listClasses(ctx: Ctx) {
  const db = await getDb();
  return db
    .select({ id: batches.id, name: batches.name })
    .from(batches)
    .where(and(eq(batches.centreId, ctx.centre.id), eq(batches.active, true)))
    .orderBy(asc(batches.createdAt), asc(batches.name));
}

/* ───────────── fee heads ───────────── */

export async function listFeeHeads(ctx: Ctx, opts: { activeOnly?: boolean } = {}) {
  const db = await getDb();
  return db
    .select({
      id: feeHeads.id,
      name: feeHeads.name,
      kind: feeHeads.kind,
      programmeId: feeHeads.programmeId,
      programmeName: programmes.name,
      amount: feeHeads.amount,
      active: feeHeads.active,
    })
    .from(feeHeads)
    .leftJoin(programmes, eq(programmes.id, feeHeads.programmeId))
    .where(and(eq(feeHeads.centreId, ctx.centre.id), opts.activeOnly ? eq(feeHeads.active, true) : undefined))
    .orderBy(asc(feeHeads.kind), asc(programmes.sort), asc(feeHeads.name));
}

export async function listProgrammes() {
  const db = await getDb();
  return db.select({ id: programmes.id, name: programmes.name }).from(programmes).where(eq(programmes.active, true)).orderBy(asc(programmes.sort));
}

const feeHeadInput = z.object({
  id: optionalUuid,
  name: requiredText('Name', 80),
  kind: z.enum(FEE_KINDS),
  programmeId: optionalUuid,
  amount: rupees,
  active: z.boolean().default(true),
});
export type FeeHeadInput = z.input<typeof feeHeadInput>;

/**
 * Adds or changes a fee head. Bills already raised keep their own amounts,
 * so a new amount only shows on bills raised from now on.
 */
export async function saveFeeHead(ctx: Ctx, input: FeeHeadInput) {
  assertManager(ctx);
  const data = feeHeadInput.parse(input);
  const db = await getDb();
  // Only tuition is per programme; an admission fee or kit charge is the same for every class.
  const programmeId = data.kind === 'monthly' ? data.programmeId : null;
  if (data.kind === 'monthly' && !programmeId) throw new ApiError(400, 'Choose the programme this monthly fee is for', { programmeId: 'Choose a programme' });

  if (programmeId && data.active) {
    const [clash] = await db
      .select({ id: feeHeads.id })
      .from(feeHeads)
      .where(
        and(
          eq(feeHeads.centreId, ctx.centre.id),
          eq(feeHeads.kind, 'monthly'),
          eq(feeHeads.programmeId, programmeId),
          eq(feeHeads.active, true),
          data.id ? ne(feeHeads.id, data.id) : undefined,
        ),
      )
      .limit(1);
    // Two active monthly fees for one programme would leave the monthly run guessing.
    if (clash) throw new ApiError(400, 'This programme already has an active monthly fee. Change that one, or switch it off first.', { programmeId: 'Already has a monthly fee' });
  }

  const values = { name: data.name, kind: data.kind, programmeId, amount: data.amount, active: data.active };
  let row;
  if (data.id) {
    [row] = await db
      .update(feeHeads)
      .set(values)
      .where(and(eq(feeHeads.id, data.id), eq(feeHeads.centreId, ctx.centre.id)))
      .returning();
    if (!row) return notFound('Fee head');
  } else {
    [row] = await db.insert(feeHeads).values({ ...values, centreId: ctx.centre.id }).returning();
  }
  await audit(ctx.session, data.id ? 'fee_head.update' : 'fee_head.create', {
    entity: 'fee_head',
    entityId: row.id,
    centreId: ctx.centre.id,
    summary: `${row.name}: ${inr(row.amount)}${row.active ? '' : ' (switched off)'}`,
  });
  return row;
}
