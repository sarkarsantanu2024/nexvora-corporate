/**
 * Receipts: taking a payment, voiding one, the printable receipt and the day
 * book. A receipt is never deleted; a wrong one is voided (head of school
 * only) and then left out of every total.
 */
import { and, asc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DbOrTx } from '@/db';
import { PAYMENT_METHODS, enrolments, invoices, payments, sections, students, users, type PaymentMethod } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import type { Session } from '@/lib/session-token';
import { day, requiredText, rupees, text, uuid } from '@/lib/validators';
import { assertAdmin } from '../admin/shared';
import { assertOffice, currentYear } from '../school/access';
import { METHODS_NEEDING_REFERENCE, METHOD_LABELS, allocatePayment, billPeriodLabel, invoiceStatus } from './labels';
import { feeSettings, liveStudent, nextReceiptNo, notFound, placeJoin, schoolHeader, sectionColumns, sectionJoin, sumInt, type SchoolHeader } from './shared';

/* ───────────── take a payment ───────────── */

const paymentInput = z.object({
  studentId: uuid,
  /** The bills to pay; empty means every unpaid bill of the student, oldest first. */
  invoiceIds: z.array(uuid).max(50).default([]),
  amount: rupees.refine((v) => v > 0, 'Enter the amount received'),
  method: z.enum(PAYMENT_METHODS),
  reference: text(80),
  paidOn: day,
  note: text(200),
});
export type PaymentInput = z.input<typeof paymentInput>;

/**
 * Records money received for a student. The amount is spread over the chosen
 * bills, oldest first. Each bill it touches gets its own receipt number (a
 * receipt row belongs to one bill) and they print together on one sheet.
 */
export async function takePayment(session: Session, input: PaymentInput) {
  assertOffice(session);
  const data = paymentInput.parse(input);
  if (data.paidOn > todayIST()) throw new ApiError(400, 'The date cannot be in the future', { paidOn: 'Pick today or an earlier date' });
  if (METHODS_NEEDING_REFERENCE.includes(data.method) && !data.reference) {
    throw new ApiError(400, 'Enter the reference of this payment', { reference: 'Reference is required' });
  }
  const db = await getDb();
  const [student] = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(and(eq(students.id, data.studentId), liveStudent))
    .limit(1);
  if (!student) return notFound('Student');

  const saved = await db.transaction(async (tx) => {
    // Locked so two people taking money for the same student cannot both pay the same bill.
    const all = await tx
      .select()
      .from(invoices)
      .where(and(eq(invoices.studentId, student.id), inArray(invoices.status, ['unpaid', 'partial'])))
      .orderBy(asc(invoices.dueDate), asc(invoices.issueDate), asc(invoices.invoiceNo))
      .for('update');
    const bills = data.invoiceIds.length ? all.filter((bill) => data.invoiceIds.includes(bill.id)) : all;
    if (data.invoiceIds.length && bills.length !== new Set(data.invoiceIds).size) throw new ApiError(400, 'One of the chosen bills is already paid. Open the page again.');
    const due = bills.reduce((sum, bill) => sum + Math.max(0, bill.total - bill.paid), 0);
    if (due <= 0) throw new ApiError(400, `${student.name} has nothing due`);
    if (data.amount > due) throw new ApiError(400, `Only ${inr(due)} is due on the chosen bills. Enter ${inr(due)} or less.`, { amount: `At the most ${inr(due)}` });

    const { parts } = allocatePayment(data.amount, bills.map((bill) => ({ id: bill.id, balance: bill.total - bill.paid })));
    // The same moment on every row is how the receipt page finds the rows that were paid together.
    const takenAt = new Date();
    const rows = [];
    for (const part of parts) {
      const bill = bills.find((b) => b.id === part.id)!;
      const [row] = await tx
        .insert(payments)
        .values({
          studentId: student.id,
          invoiceId: bill.id,
          receiptNo: await nextReceiptNo(tx, data.paidOn),
          amount: part.amount,
          method: data.method,
          reference: data.reference,
          paidOn: data.paidOn,
          note: data.note,
          receivedBy: session.uid,
          createdAt: takenAt,
        })
        .returning();
      const paid = bill.paid + part.amount;
      await tx.update(invoices).set({ paid, status: invoiceStatus(bill.total, paid) }).where(eq(invoices.id, bill.id));
      rows.push(row);
    }
    return rows;
  });

  await audit(session, 'payment.create', {
    entity: 'payment',
    entityId: saved[0].id,
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
export async function voidPayment(session: Session, id: string, reason: string) {
  assertAdmin(session);
  const paymentId = uuid.parse(id);
  const why = requiredText('Reason', 200).parse(reason);
  const db = await getDb();
  const payment = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(payments).where(eq(payments.id, paymentId)).for('update').limit(1);
    if (!row) return notFound('Receipt');
    if (row.voidedAt) throw new ApiError(400, 'This receipt is already void');
    await tx.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, row.invoiceId)).for('update');
    await tx.update(payments).set({ voidedAt: new Date(), voidReason: why }).where(eq(payments.id, row.id));
    await recomputeBill(tx, row.invoiceId);
    return row;
  });
  await audit(session, 'payment.void', { entity: 'payment', entityId: payment.id, summary: `Voided receipt ${payment.receiptNo} (${inr(payment.amount)}): ${why}` });
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
  period: string | null;
  /** What is still owed on that bill today. */
  billBalance: number;
  voidedAt: Date | null;
  voidReason: string;
};

export type ReceiptData = {
  id: string;
  school: SchoolHeader;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    phone: string;
    fatherName: string;
    grade: number | null;
    sectionName: string | null;
    stream: string | null;
    shift: string | null;
    rollNo: number | null;
  };
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
  /** Everything the student still owes today, over all bills. */
  balanceDue: number;
  footer: string;
};

/**
 * Loads one receipt sheet. `scope` is the caller's own limit (a parent's
 * children); the id alone is never trusted for a parent.
 */
async function loadReceipt(paymentId: string, scope: SQL | undefined): Promise<ReceiptData | null> {
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
  const year = await currentYear(db);

  const [lines, [student], [owed], settings, school] = await Promise.all([
    // Rows saved in the same moment for the same student are one payment spread over several bills.
    db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        amount: payments.amount,
        invoiceId: invoices.id,
        invoiceNo: invoices.invoiceNo,
        title: invoices.title,
        period: invoices.period,
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
      .select({ id: students.id, name: students.name, admissionNo: students.admissionNo, phone: students.phone, fatherName: students.fatherName, ...sectionColumns })
      .from(students)
      .leftJoin(enrolments, placeJoin(year.id))
      .leftJoin(sections, sectionJoin)
      .where(eq(students.id, p.studentId))
      .limit(1),
    db
      .select({ due: sumInt(sql`${invoices.total} - ${invoices.paid}`) })
      .from(invoices)
      .where(and(eq(invoices.studentId, p.studentId), inArray(invoices.status, ['unpaid', 'partial']))),
    feeSettings(db),
    schoolHeader(db),
  ]);

  const live = lines.filter((line) => !line.voidedAt);
  return {
    id: p.id,
    school,
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

export async function getReceipt(session: Session, paymentId: string) {
  assertOffice(session);
  return loadReceipt(paymentId, undefined);
}

/** For the parents' corner: a receipt only when it belongs to one of these students. */
export async function getReceiptForStudents(paymentId: string, studentIds: string[]) {
  if (!studentIds.length) return null;
  return loadReceipt(paymentId, inArray(payments.studentId, studentIds));
}

/** The text sent to the parent on WhatsApp after a payment, in Bengali. */
export function receiptMessage(receipt: ReceiptData): string {
  const live = receipt.lines.filter((line) => !line.voidedAt);
  const numbers = live.map((line) => line.receiptNo).join(', ');
  const what = live.map((line) => (line.period ? `${billPeriodLabel(line.period)} সালের ফি` : line.title)).join(', ');
  const school = receipt.school.nameBn || receipt.school.name;
  return [
    school,
    `${receipt.student.name}-এর ${what} বাবদ ${inr(receipt.amount)} পাওয়া গেছে।`,
    `রসিদ নং ${numbers}${receipt.reference ? ` (${receipt.reference})` : ''}।`,
    receipt.balanceDue > 0 ? `বাকি: ${inr(receipt.balanceDue)}।` : 'আর কোনো বকেয়া নেই।',
    'ধন্যবাদ।',
  ].join('\n');
}

/* ───────────── day book ───────────── */

/** Every receipt of one day, and what should be in the cash box and the bank for it. */
export async function dayBook(session: Session, forDay: string) {
  assertOffice(session);
  const on = day.safeParse(forDay).success ? forDay : todayIST();
  const db = await getDb();
  const rows = await db
    .select({
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
      period: invoices.period,
      receivedBy: users.name,
    })
    .from(payments)
    .innerJoin(students, eq(students.id, payments.studentId))
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .leftJoin(users, eq(users.id, payments.receivedBy))
    .where(eq(payments.paidOn, on))
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
