/**
 * The parent corner. Read-only. A parent sees only the children whose
 * parentUserId is their own login; every function starts from that list, so
 * an id sent from the browser can never open another family's record.
 */
import { and, asc, desc, eq, gte, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { announcements, attendance, batches, centres, invoices, payments, programmes, students, type AttendanceStatus } from '@/db/schema';
import { ApiError } from '@/lib/api';
import type { Session } from '@/lib/auth';
import { currentPeriod, periodRange, todayIST } from '@/lib/date';
import { percent } from '@/lib/money';
import { period as periodSchema, uuid } from '@/lib/validators';
import { hasPaymentDetails, paymentDetailsOf } from '@/server/centre/money/payment-info';
import { loadReceipt } from '@/server/centre/money/payments';

function assertParent(session: Session) {
  if (session.role !== 'parent') throw new ApiError(403, 'This is for parents only');
}

const mine = (session: Session) => and(eq(students.parentUserId, session.uid), isNull(students.deletedAt));

export type ParentChild = Awaited<ReturnType<typeof listChildren>>[number];

/** The parent's children with this month's attendance and what is due. */
export async function listChildren(session: Session) {
  assertParent(session);
  const db = await getDb();
  const kids = await db
    .select({
      id: students.id,
      name: students.name,
      photo: students.photo,
      admissionNo: students.admissionNo,
      status: students.status,
      centreId: students.centreId,
      centreName: centres.name,
      centrePhone: centres.phone,
      batchName: batches.name,
      batchTiming: batches.timing,
      programmeName: programmes.name,
    })
    .from(students)
    .innerJoin(centres, eq(centres.id, students.centreId))
    .leftJoin(batches, eq(batches.id, students.batchId))
    .leftJoin(programmes, eq(programmes.id, students.programmeId))
    .where(mine(session))
    .orderBy(asc(students.name));
  if (!kids.length) return [];

  const ids = kids.map((k) => k.id);
  const { from, to } = periodRange(currentPeriod());
  const [marks, dues] = await Promise.all([
    db
      .select({
        studentId: attendance.studentId,
        present: sql<number>`(count(*) filter (where ${attendance.status} = 'present'))::int`,
        // Holidays are not school days, so they are left out of the percent.
        marked: sql<number>`(count(*) filter (where ${attendance.status} <> 'holiday'))::int`,
      })
      .from(attendance)
      .where(and(inArray(attendance.studentId, ids), gte(attendance.day, from), lte(attendance.day, to)))
      .groupBy(attendance.studentId),
    db
      .select({ studentId: invoices.studentId, due: sql<number>`coalesce(sum(${invoices.total} - ${invoices.paid}), 0)::int`, bills: sql<number>`count(*)::int` })
      .from(invoices)
      .where(and(inArray(invoices.studentId, ids), inArray(invoices.status, ['unpaid', 'partial'])))
      .groupBy(invoices.studentId),
  ]);

  return kids.map((kid) => {
    const mark = marks.find((m) => m.studentId === kid.id);
    const due = dues.find((d) => d.studentId === kid.id);
    return {
      ...kid,
      attendance: { present: mark?.present ?? 0, marked: mark?.marked ?? 0, percent: percent(mark?.present ?? 0, mark?.marked ?? 0) },
      due: due?.due ?? 0,
      dueBills: due?.bills ?? 0,
    };
  });
}

/** Ids of the parent's own children; the gate every other function passes through. */
async function childIds(session: Session): Promise<string[]> {
  assertParent(session);
  const db = await getDb();
  const rows = await db.select({ id: students.id }).from(students).where(mine(session));
  return rows.map((r) => r.id);
}

/** One child, only if it belongs to this parent. */
export async function getChild(session: Session, studentId: string) {
  assertParent(session);
  if (!uuid.safeParse(studentId).success) throw new ApiError(404, 'Child not found');
  const db = await getDb();
  const [row] = await db
    .select({ id: students.id, name: students.name, photo: students.photo, admissionDate: students.admissionDate, batchName: batches.name, centreName: centres.name })
    .from(students)
    .innerJoin(centres, eq(centres.id, students.centreId))
    .leftJoin(batches, eq(batches.id, students.batchId))
    .where(and(eq(students.id, studentId), mine(session)))
    .limit(1);
  if (!row) throw new ApiError(404, 'Child not found');
  return row;
}

/** Bills of the parent's children, newest first, each with its receipts. */
export async function listFees(session: Session) {
  const ids = await childIds(session);
  if (!ids.length) return [];
  const db = await getDb();
  const [bills, receipts] = await Promise.all([
    db
      .select({
        id: invoices.id,
        studentId: invoices.studentId,
        invoiceNo: invoices.invoiceNo,
        title: invoices.title,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        total: invoices.total,
        paid: invoices.paid,
        status: invoices.status,
      })
      .from(invoices)
      // A bill raised by mistake and cancelled is the centre's business, not the parent's.
      .where(and(inArray(invoices.studentId, ids), ne(invoices.status, 'cancelled')))
      .orderBy(desc(invoices.issueDate), desc(invoices.invoiceNo)),
    db
      .select({ id: payments.id, invoiceId: payments.invoiceId, receiptNo: payments.receiptNo, amount: payments.amount, method: payments.method, paidOn: payments.paidOn })
      .from(payments)
      .where(and(inArray(payments.studentId, ids), isNull(payments.voidedAt)))
      .orderBy(asc(payments.paidOn), asc(payments.receiptNo)),
  ]);
  return bills.map((bill) => ({ ...bill, receipts: receipts.filter((r) => r.invoiceId === bill.id) }));
}

/** A receipt, only if it is for one of the parent's children and has not been voided. */
export async function getReceipt(session: Session, paymentId: string) {
  const ids = await childIds(session);
  if (!ids.length) throw new ApiError(404, 'Receipt not found');
  const receipt = await loadReceipt(paymentId, and(inArray(payments.studentId, ids), isNull(payments.voidedAt)));
  if (!receipt) throw new ApiError(404, 'Receipt not found');
  // A void line on the same sheet is of no use to a parent.
  return { ...receipt, lines: receipt.lines.filter((line) => !line.voidedAt) };
}

/** One child's attendance for a month, a mark per day, and the percent. */
export async function monthAttendance(session: Session, studentId: string, month?: string) {
  const child = await getChild(session, studentId);
  const period = month && periodSchema.safeParse(month).success && month <= currentPeriod() ? month : currentPeriod();
  const { from, to } = periodRange(period);
  const db = await getDb();
  const rows = await db
    .select({ day: attendance.day, status: attendance.status, note: attendance.note })
    .from(attendance)
    .where(and(eq(attendance.studentId, child.id), gte(attendance.day, from), lte(attendance.day, to)))
    .orderBy(asc(attendance.day));
  const count = (status: AttendanceStatus) => rows.filter((r) => r.status === status).length;
  const present = count('present');
  const marked = rows.length - count('holiday');
  return {
    child,
    period,
    from,
    to,
    marks: Object.fromEntries(rows.map((r) => [r.day, r.status])) as Record<string, AttendanceStatus>,
    counts: { present, absent: count('absent'), leave: count('leave'), holiday: count('holiday') },
    percent: percent(present, marked),
    marked,
  };
}

/** Notices from the children's centres and head office notices to all parents. */
export async function listNotices(session: Session, limit = 50) {
  assertParent(session);
  const db = await getDb();
  const today = todayIST();
  const kids = await db.selectDistinct({ centreId: students.centreId }).from(students).where(mine(session));
  const centreIds = kids.map((k) => k.centreId);
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      pinned: announcements.pinned,
      eventDate: announcements.eventDate,
      publishOn: announcements.publishOn,
      centreId: announcements.centreId,
      centreName: centres.name,
    })
    .from(announcements)
    .leftJoin(centres, eq(centres.id, announcements.centreId))
    .where(
      and(
        eq(announcements.audience, 'parents'),
        centreIds.length ? or(isNull(announcements.centreId), inArray(announcements.centreId, centreIds)) : isNull(announcements.centreId),
        lte(announcements.publishOn, today),
        or(isNull(announcements.expiresOn), gte(announcements.expiresOn, today)),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.publishOn), desc(announcements.createdAt))
    .limit(limit);
}

/**
 * How to pay each centre the parent owes money to: the centre's UPI and bank
 * details, the amount due there and the bill numbers it is for.
 */
export async function listPayInfo(session: Session) {
  const ids = await childIds(session);
  if (!ids.length) return [];
  const db = await getDb();
  const rows = await db
    .select({
      centreId: centres.id,
      centreName: centres.name,
      phone: centres.phone,
      whatsapp: centres.whatsapp,
      meta: centres.meta,
      due: sql<number>`coalesce(sum(${invoices.total} - ${invoices.paid}), 0)::int`,
      bills: sql<string>`string_agg(${invoices.invoiceNo}, ', ' order by ${invoices.dueDate}, ${invoices.invoiceNo})`,
    })
    .from(invoices)
    .innerJoin(centres, eq(centres.id, invoices.centreId))
    .where(and(inArray(invoices.studentId, ids), inArray(invoices.status, ['unpaid', 'partial'])))
    .groupBy(centres.id);
  return rows.map(({ meta, ...row }) => {
    const details = paymentDetailsOf({ meta });
    return { ...row, contact: row.whatsapp || row.phone, details, ready: hasPaymentDetails(details) };
  });
}
