/**
 * Receipts: taking a payment, voiding one, the printable receipt and the
 * day book. A receipt is never deleted; a wrong one is voided and then left
 * out of every total.
 */
import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { PAYMENT_METHODS, batches, centres, invoices, payments, students, users, type PaymentMethod } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import { allocatePayment, balanceOf, inr, invoiceStatus } from '@/lib/money';
import { nextReceiptNo } from '@/lib/numbering';
import { day, requiredText, rupees, text, uuid } from '@/lib/validators';
import { METHODS_NEEDING_REFERENCE, METHOD_LABELS } from './labels';
import { PAGE_SIZE, assertManager, countInt, feeSettings, liveStudent, livePayment, notFound, pageOf, sumInt, type Ctx } from './shared';

/* ───────────── take a payment ───────────── */

const paymentInput = z.object({
  studentId: uuid,
  amount: rupees.refine((v) => v > 0, 'Enter the amount received'),
  method: z.enum(PAYMENT_METHODS),
  reference: text(80),
  paidOn: day,
  note: text(200),
});
export type PaymentInput = z.input<typeof paymentInput>;

/**
 * Records money received from a parent. The amount is spread over the child's
 * unpaid bills, oldest first; each bill it touches gets its own receipt number
 * (a receipt row belongs to one bill) and they print together on one sheet.
 */
export async function takePayment(ctx: Ctx, input: PaymentInput) {
  const data = paymentInput.parse(input);
  if (data.paidOn > todayIST()) throw new ApiError(400, 'The date cannot be in the future', { paidOn: 'Pick today or an earlier date' });
  if (METHODS_NEEDING_REFERENCE.includes(data.method) && !data.reference) {
    throw new ApiError(400, `Enter the reference for this ${METHOD_LABELS[data.method]} payment`, { reference: 'Reference is required' });
  }
  const db = await getDb();

  const [student] = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(and(eq(students.id, data.studentId), eq(students.centreId, ctx.centre.id), liveStudent))
    .limit(1);
  if (!student) return notFound('Child');

  const saved = await db.transaction(async (tx) => {
    // Locked so two people taking money for the same child cannot both pay the same bill.
    const bills = await tx
      .select()
      .from(invoices)
      .where(and(eq(invoices.centreId, ctx.centre.id), eq(invoices.studentId, student.id), inArray(invoices.status, ['unpaid', 'partial'])))
      .orderBy(asc(invoices.dueDate), asc(invoices.issueDate), asc(invoices.invoiceNo))
      .for('update');
    const due = bills.reduce((sum, bill) => sum + balanceOf(bill), 0);
    if (due <= 0) throw new ApiError(400, `${student.name} has nothing due`);
    if (data.amount > due) {
      throw new ApiError(400, `Only ${inr(due)} is due. Enter ${inr(due)} or less.`, { amount: `At the most ${inr(due)}` });
    }

    const { parts } = allocatePayment(data.amount, bills.map((bill) => ({ id: bill.id, balance: balanceOf(bill) })));
    // The same moment on every row is how the receipt page finds the rows that were paid together.
    const takenAt = new Date();
    const rows = [];
    for (const part of parts) {
      const bill = bills.find((b) => b.id === part.id)!;
      const [row] = await tx
        .insert(payments)
        .values({
          centreId: ctx.centre.id,
          studentId: student.id,
          invoiceId: bill.id,
          receiptNo: await nextReceiptNo(tx, ctx.centre.id, data.paidOn),
          amount: part.amount,
          method: data.method,
          reference: data.reference,
          paidOn: data.paidOn,
          note: data.note,
          receivedBy: ctx.session.uid,
          createdAt: takenAt,
        })
        .returning();
      const paid = bill.paid + part.amount;
      await tx.update(invoices).set({ paid, status: invoiceStatus(bill.total, paid) }).where(eq(invoices.id, bill.id));
      rows.push(row);
    }
    return rows;
  });

  await audit(ctx.session, 'payment.create', {
    entity: 'payment',
    entityId: saved[0].id,
    centreId: ctx.centre.id,
    summary: `${inr(data.amount)} from ${student.name} by ${METHOD_LABELS[data.method]} (${saved.map((p) => p.receiptNo).join(', ')})`,
    meta: { receipts: saved.map((p) => p.receiptNo), amount: data.amount },
  });
  return { id: saved[0].id, amount: data.amount, receipts: saved.map((p) => ({ id: p.id, receiptNo: p.receiptNo, invoiceId: p.invoiceId, amount: p.amount })) };
}

/* ───────────── void ───────────── */

/** Brings a bill's paid amount and status back in line with its receipts that still count. */
async function recomputeBill(tx: DbOrTx, invoiceId: string) {
  const [{ paid }] = await tx
    .select({ paid: sumInt(payments.amount) })
    .from(payments)
    .where(and(eq(payments.invoiceId, invoiceId), isNull(payments.voidedAt)));
  const [bill] = await tx.select({ total: invoices.total, status: invoices.status }).from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  await tx
    .update(invoices)
    // A cancelled bill stays cancelled whatever its receipts say.
    .set({ paid, status: bill.status === 'cancelled' ? 'cancelled' : invoiceStatus(bill.total, paid) })
    .where(eq(invoices.id, invoiceId));
  return paid;
}

/** A receipt entered by mistake. It stays on record, marked void, and its bill goes back to unpaid or part paid. */
export async function voidPayment(ctx: Ctx, id: string, reason: string) {
  assertManager(ctx);
  const paymentId = uuid.parse(id);
  const why = requiredText('Reason', 200).parse(reason);
  const db = await getDb();
  const payment = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.centreId, ctx.centre.id)))
      .for('update')
      .limit(1);
    if (!row) return notFound('Receipt');
    if (row.voidedAt) throw new ApiError(400, 'This receipt is already void');
    await tx.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, row.invoiceId)).for('update');
    await tx.update(payments).set({ voidedAt: new Date(), voidReason: why }).where(eq(payments.id, row.id));
    await recomputeBill(tx, row.invoiceId);
    return row;
  });
  await audit(ctx.session, 'payment.void', {
    entity: 'payment',
    entityId: payment.id,
    centreId: ctx.centre.id,
    summary: `Voided receipt ${payment.receiptNo} (${inr(payment.amount)}): ${why}`,
  });
  return { id: payment.id };
}

/* ───────────── receipt ───────────── */

export type ReceiptLine = {
  id: string;
  receiptNo: string;
  amount: number;
  invoiceId: string;
  invoiceNo: string;
  title: string;
  /** What is still owed on that bill today. */
  billBalance: number;
  voidedAt: Date | null;
  voidReason: string;
};

export type ReceiptData = {
  id: string;
  centre: { name: string; address: string; area: string; city: string; pincode: string; phone: string };
  student: { id: string; name: string; admissionNo: string; batchName: string | null; guardianPhone: string; fatherName: string; motherName: string };
  paidOn: string;
  method: PaymentMethod;
  reference: string;
  note: string;
  receivedBy: string;
  lines: ReceiptLine[];
  /** Total of the lines that are not void. */
  amount: number;
  /** True when every line is void. */
  voided: boolean;
  /** Everything the child still owes today, over all bills. */
  balanceDue: number;
  footer: string;
};

/**
 * Loads one receipt sheet. `scope` is the caller's own limit (this centre, or
 * this parent's children); the id alone is never trusted.
 */
export async function loadReceipt(paymentId: string, scope: SQL | undefined): Promise<ReceiptData | null> {
  if (!uuid.safeParse(paymentId).success) return null;
  const db = await getDb();
  const [head] = await db
    .select({ payment: payments, receivedBy: users.name })
    .from(payments)
    .leftJoin(users, eq(users.id, payments.receivedBy))
    .where(and(eq(payments.id, paymentId), scope))
    .limit(1);
  if (!head) return null;
  const p = head.payment;

  const [lines, [student], [centre], [owed], settings] = await Promise.all([
    // Rows saved in the same moment for the same child are one payment spread over several bills.
    db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        amount: payments.amount,
        invoiceId: invoices.id,
        invoiceNo: invoices.invoiceNo,
        title: invoices.title,
        billBalance: sql<number>`case when ${invoices.status} = 'cancelled' then 0 else greatest(${invoices.total} - ${invoices.paid}, 0) end::int`,
        voidedAt: payments.voidedAt,
        voidReason: payments.voidReason,
      })
      .from(payments)
      .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
      .where(
        or(
          eq(payments.id, p.id),
          and(
            eq(payments.centreId, p.centreId),
            eq(payments.studentId, p.studentId),
            // The database keeps microseconds, JavaScript only milliseconds.
            sql`date_trunc('milliseconds', ${payments.createdAt}) = ${p.createdAt.toISOString()}::timestamptz`,
            eq(payments.paidOn, p.paidOn),
            eq(payments.method, p.method),
            eq(payments.reference, p.reference),
          ),
        ),
      )
      .orderBy(asc(payments.receiptNo)),
    db
      .select({
        id: students.id,
        name: students.name,
        admissionNo: students.admissionNo,
        batchName: batches.name,
        guardianPhone: students.guardianPhone,
        fatherName: students.fatherName,
        motherName: students.motherName,
      })
      .from(students)
      .leftJoin(batches, eq(batches.id, students.batchId))
      .where(eq(students.id, p.studentId))
      .limit(1),
    db
      .select({ name: centres.name, address: centres.address, area: centres.area, city: centres.city, pincode: centres.pincode, phone: centres.phone })
      .from(centres)
      .where(eq(centres.id, p.centreId))
      .limit(1),
    db
      .select({ due: sumInt(sql`${invoices.total} - ${invoices.paid}`) })
      .from(invoices)
      .where(and(eq(invoices.studentId, p.studentId), inArray(invoices.status, ['unpaid', 'partial']))),
    feeSettings(db),
  ]);

  const live = lines.filter((line) => !line.voidedAt);
  return {
    id: p.id,
    centre,
    student,
    paidOn: p.paidOn,
    method: p.method,
    reference: p.reference,
    note: p.note,
    receivedBy: head.receivedBy ?? '',
    lines,
    amount: live.reduce((sum, line) => sum + line.amount, 0),
    voided: live.length === 0,
    balanceDue: owed.due,
    footer: settings.receiptFooter,
  };
}

export const getReceipt = (ctx: Ctx, paymentId: string) => loadReceipt(paymentId, eq(payments.centreId, ctx.centre.id));

/** The text sent to the parent on WhatsApp after a payment. */
export function receiptMessage(receipt: ReceiptData): string {
  const live = receipt.lines.filter((line) => !line.voidedAt);
  const numbers = live.map((line) => line.receiptNo).join(', ');
  const what = live.map((line) => line.title).join(', ');
  return [
    `${receipt.centre.name}`,
    `Received ${inr(receipt.amount)} for ${receipt.student.name} towards ${what}.`,
    `Receipt ${numbers}, ${METHOD_LABELS[receipt.method]}${receipt.reference ? ` (${receipt.reference})` : ''}.`,
    receipt.balanceDue > 0 ? `Balance due: ${inr(receipt.balanceDue)}.` : 'No balance due.',
    'Thank you.',
  ].join('\n');
}

/* ───────────── day book and list ───────────── */

const receiptColumns = {
  id: payments.id,
  receiptNo: payments.receiptNo,
  amount: payments.amount,
  method: payments.method,
  reference: payments.reference,
  paidOn: payments.paidOn,
  voidedAt: payments.voidedAt,
  studentId: students.id,
  studentName: students.name,
  admissionNo: students.admissionNo,
  invoiceId: invoices.id,
  invoiceNo: invoices.invoiceNo,
  title: invoices.title,
  receivedBy: users.name,
};

/** Every receipt of one day, and what should be in the drawer and the bank for it. */
export async function dayBook(ctx: Ctx, forDay: string) {
  const on = day.safeParse(forDay).success ? forDay : todayIST();
  const db = await getDb();
  const rows = await db
    .select(receiptColumns)
    .from(payments)
    .innerJoin(students, eq(students.id, payments.studentId))
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .leftJoin(users, eq(users.id, payments.receivedBy))
    .where(and(eq(payments.centreId, ctx.centre.id), eq(payments.paidOn, on)))
    .orderBy(asc(payments.receiptNo));

  const byMethod = PAYMENT_METHODS.map((method) => {
    const live = rows.filter((r) => r.method === method && !r.voidedAt);
    return { method, count: live.length, amount: live.reduce((sum, r) => sum + r.amount, 0) };
  });
  return {
    day: on,
    rows,
    byMethod,
    total: byMethod.reduce((sum, m) => sum + m.amount, 0),
    count: byMethod.reduce((sum, m) => sum + m.count, 0),
    voided: rows.filter((r) => r.voidedAt).length,
  };
}

export type PaymentFilter = { from?: string; to?: string; student?: string; page?: number | string };

export async function listPayments(ctx: Ctx, filter: PaymentFilter = {}) {
  const db = await getDb();
  const where = and(
    eq(payments.centreId, ctx.centre.id),
    day.safeParse(filter.from).success ? gte(payments.paidOn, filter.from!) : undefined,
    day.safeParse(filter.to).success ? lte(payments.paidOn, filter.to!) : undefined,
    uuid.safeParse(filter.student).success ? eq(payments.studentId, filter.student!) : undefined,
  );
  const page = pageOf(filter.page);
  const [rows, [totals]] = await Promise.all([
    db
      .select(receiptColumns)
      .from(payments)
      .innerJoin(students, eq(students.id, payments.studentId))
      .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
      .leftJoin(users, eq(users.id, payments.receivedBy))
      .where(where)
      .orderBy(desc(payments.paidOn), desc(payments.receiptNo))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: countInt(), amount: sql<number>`coalesce(sum(${payments.amount}) filter (where ${livePayment}), 0)::int` })
      .from(payments)
      .where(where),
  ]);
  return { rows, page, pageSize: PAGE_SIZE, count: totals.count, amount: totals.amount };
}
