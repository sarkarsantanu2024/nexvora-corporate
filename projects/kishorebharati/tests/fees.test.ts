/**
 * Fees against a fresh in-memory database: fee heads, the bill run (yearly,
 * by class range, safe to repeat), payments over several bills, voiding,
 * the day book and reports, and what the office may not do.
 */
import { and, eq, inArray } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { todayIST, addDays } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { createUser } from '@/server/admin/users';
import { cancelBill, createBill, listBills, listBillsForStudent, listDues, previewRun, runBills, saveFeeHead, setConcession } from '@/server/money/bills';
import { deleteExpense, listExpenses, saveExpense, expenseTrashSource } from '@/server/money/expenses';
import { allocatePayment, invoiceStatus, rupeesInWords } from '@/server/money/labels';
import { dayBook, getReceipt, getReceiptForStudents, takePayment, voidPayment } from '@/server/money/payments';
import { collectionByHead, duesByClass, moneyTiles, splitByLines, statement } from '@/server/money/reports';
import { feeDueReminder, feeOverdueReminder } from '@/server/money/reminders';
import { savePaymentDetails } from '@/server/money/settings';
import { getPaymentDetails } from '@/server/money/shared';
import { currentYear } from '@/server/school/access';

let db: DB;
let admin: Session;
let staff: Session;
let teacher: Session;
let year: string;
const today = todayIST();
const ids: Record<string, string> = {};
let sessionHead = '';
let devHead = '';
let admissionHead = '';

async function addStudent(name: string, grade: number, roll: number, stream: s.Stream = '') {
  const y = await currentYear(db);
  const [section] = await db
    .select()
    .from(s.sections)
    .where(and(eq(s.sections.yearId, y.id), eq(s.sections.grade, grade), eq(s.sections.stream, stream)))
    .limit(1);
  const [student] = await db.insert(s.students).values({ admissionNo: `T-${grade}-${roll}-${name}`, name, phone: '9830012345', fatherName: `Father of ${name}` }).returning();
  await db.insert(s.enrolments).values({ yearId: y.id, studentId: student.id, sectionId: section.id, rollNo: roll });
  return student.id;
}

beforeAll(async () => {
  db = await getDb();
  const [row] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  admin = { uid: row.id, name: row.name, username: row.username, role: row.role };
  const desk = await createUser(admin, { name: 'Office Clerk', username: 'clerk', password: 'start123', role: 'staff' });
  staff = { uid: desk.id, name: desk.name, username: desk.username, role: desk.role };
  const tUser = await createUser(admin, { name: 'A Teacher', username: 'teach', password: 'start123', role: 'teacher' });
  teacher = { uid: tUser.id, name: tUser.name, username: tUser.username, role: tUser.role };
  year = (await currentYear(db)).name;

  ids.a7 = await addStudent('Arnab', 7, 1);
  ids.b7 = await addStudent('Bikram', 7, 2);
  ids.c9 = await addStudent('Chandan', 9, 1);
  ids.d11 = await addStudent('Dipak', 11, 1, 'science');
}, 120_000);

describe('fee heads', () => {
  it('start empty for real use, and only the head of school may add one', async () => {
    expect(await db.select().from(s.feeHeads)).toHaveLength(0);
    await expect(saveFeeHead(staff, { name: 'Session fee', kind: 'annual', fromGrade: 5, toGrade: 12, amount: 240 })).rejects.toMatchObject({ status: 403 });
    await expect(saveFeeHead(admin, { name: 'Bad', kind: 'annual', fromGrade: 10, toGrade: 5, amount: 10 })).rejects.toMatchObject({ status: 400 });
    sessionHead = (await saveFeeHead(admin, { name: 'Session fee', kind: 'annual', fromGrade: 5, toGrade: 12, amount: 240 })).id;
    devHead = (await saveFeeHead(admin, { name: 'Development fee', kind: 'annual', fromGrade: 9, toGrade: 12, amount: 100 })).id;
    admissionHead = (await saveFeeHead(admin, { name: 'Admission fee', kind: 'one_time', fromGrade: 11, toGrade: 11, amount: 300 })).id;
  });
});

describe('the bill run', () => {
  it('previews, raises one bill a student, and adds nothing the second time', async () => {
    const input = { period: year, fromGrade: 5, toGrade: 12, headIds: [sessionHead, devHead], dueDate: addDays(today, 20) };
    await expect(previewRun(staff, input)).rejects.toMatchObject({ status: 403 });
    await expect(runBills(staff, input)).rejects.toMatchObject({ status: 403 });

    const preview = await previewRun(admin, input);
    expect(preview).toMatchObject({ students: 4, toCreate: 4, toAddTo: 0, amount: 240 * 4 + 100 * 2 });

    const first = await runBills(admin, input);
    expect(first).toMatchObject({ created: 4, added: 0, amount: 1160 });
    const second = await runBills(admin, input);
    expect(second).toMatchObject({ created: 0, added: 0, amount: 0, alreadyBilled: 4 });

    const bills = await db.select().from(s.invoices).where(eq(s.invoices.period, year));
    expect(bills).toHaveLength(4);
    expect(new Set(bills.map((b) => b.invoiceNo)).size).toBe(4);
    const c9 = bills.find((b) => b.studentId === ids.c9)!;
    expect(c9).toMatchObject({ total: 340, status: 'unpaid' });
  });

  it('adds a head the yearly bill lacks (Class 11 admission) without a second bill', async () => {
    const input = { period: year, fromGrade: 11, toGrade: 11, headIds: [admissionHead], dueDate: addDays(today, 20) };
    expect(await previewRun(admin, input)).toMatchObject({ students: 1, toCreate: 0, toAddTo: 1, amount: 300 });
    expect(await runBills(admin, input)).toMatchObject({ created: 0, added: 1, amount: 300 });
    expect(await runBills(admin, input)).toMatchObject({ added: 0, alreadyBilled: 1 });
    const [bill] = await db.select().from(s.invoices).where(and(eq(s.invoices.studentId, ids.d11), eq(s.invoices.period, year)));
    expect(bill.total).toBe(640);
    expect(await db.select().from(s.invoiceItems).where(eq(s.invoiceItems.invoiceId, bill.id))).toHaveLength(3);
  });

  it('refuses a monthly head in a yearly run and a run with no heads', async () => {
    const monthly = await saveFeeHead(admin, { name: 'Computer fee', kind: 'monthly', fromGrade: 11, toGrade: 12, amount: 50 });
    await expect(runBills(admin, { period: year, fromGrade: 5, toGrade: 12, headIds: [monthly.id], dueDate: today })).rejects.toMatchObject({ status: 400 });
    await expect(runBills(admin, { period: year, fromGrade: 5, toGrade: 12, headIds: [], dueDate: today })).rejects.toThrow();
    // Switched off again so it does not get in the way below.
    await saveFeeHead(admin, { id: monthly.id, name: 'Computer fee', kind: 'monthly', fromGrade: 11, toGrade: 12, amount: 50, active: false });
  });
});

describe('payments', () => {
  it('lets staff take a part payment, then the rest, with unique receipt numbers', async () => {
    const part = await takePayment(staff, { studentId: ids.a7, amount: 100, method: 'cash', paidOn: today });
    let [bill] = await db.select().from(s.invoices).where(eq(s.invoices.studentId, ids.a7));
    expect(bill).toMatchObject({ paid: 100, status: 'partial' });
    await expect(takePayment(staff, { studentId: ids.a7, amount: 500, method: 'cash', paidOn: today })).rejects.toMatchObject({ status: 400 });
    await expect(takePayment(staff, { studentId: ids.a7, amount: 140, method: 'upi', reference: '', paidOn: today })).rejects.toMatchObject({ status: 400 });
    const rest = await takePayment(staff, { studentId: ids.a7, amount: 140, method: 'upi', reference: 'UPI123', paidOn: today });
    [bill] = await db.select().from(s.invoices).where(eq(s.invoices.studentId, ids.a7));
    expect(bill).toMatchObject({ paid: 240, status: 'paid' });
    expect(part.receipts[0].receiptNo).not.toBe(rest.receipts[0].receiptNo);
    await expect(takePayment(teacher, { studentId: ids.b7, amount: 10, method: 'cash', paidOn: today })).rejects.toMatchObject({ status: 403 });
  });

  it('spreads one payment over several bills, oldest first, one receipt each, printed on one sheet', async () => {
    await createBill(staff, { studentId: ids.c9, title: 'Duplicate identity card', lines: [{ description: 'Identity card', amount: 30 }], dueDate: addDays(today, 40) });
    const paid = await takePayment(staff, { studentId: ids.c9, amount: 350, method: 'cash', paidOn: today });
    expect(paid.receipts).toHaveLength(2);
    expect(paid.receipts.map((r) => r.amount)).toEqual([340, 10]);
    const receipt = await getReceipt(staff, paid.id);
    expect(receipt?.lines).toHaveLength(2);
    expect(receipt?.amount).toBe(350);
    expect(receipt?.balanceDue).toBe(20);
    // A parent sees only receipts of their own children.
    expect(await getReceiptForStudents(paid.id, [ids.a7])).toBeNull();
    expect((await getReceiptForStudents(paid.id, [ids.c9]))?.amount).toBe(350);
  });

  it('pays only the bills picked', async () => {
    const [yearly] = await db.select().from(s.invoices).where(and(eq(s.invoices.studentId, ids.d11), eq(s.invoices.period, year)));
    const extra = await createBill(staff, { studentId: ids.d11, title: 'Practical copy', lines: [{ description: 'Practical copy', amount: 60 }], dueDate: today });
    await takePayment(staff, { studentId: ids.d11, invoiceIds: [extra.id], amount: 60, method: 'cash', paidOn: today });
    const rows = await db.select().from(s.invoices).where(inArray(s.invoices.id, [yearly.id, extra.id]));
    expect(rows.find((r) => r.id === extra.id)?.status).toBe('paid');
    expect(rows.find((r) => r.id === yearly.id)?.status).toBe('unpaid');
  });

  it('every receipt number is unique', async () => {
    const all = await db.select({ no: s.payments.receiptNo }).from(s.payments);
    expect(new Set(all.map((r) => r.no)).size).toBe(all.length);
  });

  it('lets only the head of school void, and a void receipt leaves every total', async () => {
    const before = await dayBook(staff, today);
    const tilesBefore = await moneyTiles();
    const [receipt] = await db.select().from(s.payments).where(and(eq(s.payments.studentId, ids.a7), eq(s.payments.method, 'upi')));
    await expect(voidPayment(staff, receipt.id, 'Wrong student')).rejects.toMatchObject({ status: 403 });
    await expect(voidPayment(admin, receipt.id, '  ')).rejects.toThrow();
    await voidPayment(admin, receipt.id, 'Wrong student');
    await expect(voidPayment(admin, receipt.id, 'Again')).rejects.toMatchObject({ status: 400 });

    const after = await dayBook(staff, today);
    expect(after.total).toBe(before.total - 140);
    expect(after.voided).toBe(1);
    expect((await moneyTiles()).collectedThisMonth).toBe(tilesBefore.collectedThisMonth - 140);
    const [bill] = await db.select().from(s.invoices).where(eq(s.invoices.studentId, ids.a7));
    expect(bill).toMatchObject({ paid: 100, status: 'partial' });
    const byHead = await collectionByHead(admin, { from: today, to: today });
    expect(byHead.total).toBe(after.total);
    // The row is still there, marked void.
    const [kept] = await db.select().from(s.payments).where(eq(s.payments.id, receipt.id));
    expect(kept.voidedAt).not.toBeNull();
  });
});

describe('dues, corrections and the parents corner', () => {
  it('lists who owes what, and staff cannot open reports', async () => {
    const dues = await listDues(staff);
    const a7 = dues.find((d) => d.studentId === ids.a7);
    expect(a7?.due).toBe(140);
    expect(dues.find((d) => d.studentId === ids.c9)?.due).toBe(20);
    await expect(duesByClass(staff)).rejects.toMatchObject({ status: 403 });
    await expect(statement(staff, { from: today, to: today })).rejects.toMatchObject({ status: 403 });
    const byClass = await duesByClass(admin);
    expect(byClass.total).toBe(dues.reduce((sum, d) => sum + d.due, 0));
  });

  it('lists bills with totals and filters', async () => {
    // The four yearly bills, and the two one-off bills raised this year.
    const all = await listBills(staff, { period: year });
    expect(all.count).toBe(6);
    expect((await listBills(staff, { q: 'Chandan' })).count).toBe(2);
    expect((await listBills(staff, { status: 'paid' })).rows.every((r) => r.status === 'paid')).toBe(true);
  });

  it('gives a concession and cancels a bill only for the head of school', async () => {
    const [b7] = await db.select().from(s.invoices).where(eq(s.invoices.studentId, ids.b7));
    await expect(setConcession(staff, b7.id, { discount: 40, reason: 'SC student' })).rejects.toMatchObject({ status: 403 });
    await setConcession(admin, b7.id, { discount: 40, reason: 'Fee waiver' });
    const [after] = await db.select().from(s.invoices).where(eq(s.invoices.id, b7.id));
    expect(after.total).toBe(200);
    await expect(cancelBill(staff, b7.id, 'Mistake')).rejects.toMatchObject({ status: 403 });
    await cancelBill(admin, b7.id, 'Raised by mistake');
    const [cancelled] = await db.select().from(s.invoices).where(eq(s.invoices.id, b7.id));
    expect(cancelled.status).toBe('cancelled');
    // A bill with money on it cannot be cancelled.
    const [a7] = await db.select().from(s.invoices).where(eq(s.invoices.studentId, ids.a7));
    await expect(cancelBill(admin, a7.id, 'x')).rejects.toMatchObject({ status: 400 });
  });

  it('gives a parent the bills and receipts, and the payment details', async () => {
    const mine = await listBillsForStudent(ids.a7);
    expect(mine.bills).toHaveLength(1);
    expect(mine.due).toBe(140);
    expect(mine.receipts.map((r) => r.amount)).toEqual([100]);
    await expect(savePaymentDetails(staff, { upiId: 'school@sbi' })).rejects.toMatchObject({ status: 403 });
    await expect(savePaymentDetails(admin, { accountNumber: '12345678' })).rejects.toThrow();
    await savePaymentDetails(admin, { upiId: 'ddkb@sbi', payeeName: 'DDKB High School' });
    expect((await getPaymentDetails()).upiId).toBe('ddkb@sbi');
  });
});

describe('reminders', () => {
  it('queues fee reminders by bill and sets them aside once paid', async () => {
    const settings = { enabled: {}, templates: {}, daysBefore: 30 };
    const due = await feeDueReminder.collect({ db, today, settings, business: 'School' });
    expect(due.every((c) => c.dedupeKey.startsWith('fee_due:'))).toBe(true);
    expect(due.length).toBeGreaterThan(0);
    const late = await feeOverdueReminder.collect({ db, today: addDays(today, 60), settings, business: 'School' });
    expect(late[0].dedupeKey).toMatch(/^fee_overdue:.+:\d{4}-\d{2}$/);
    const [paid] = await db.select().from(s.invoices).where(eq(s.invoices.status, 'paid')).limit(1);
    const open = due[0].entityId;
    expect(await feeDueReminder.resolved!(db, [paid.id, open])).toEqual([paid.id]);
  });
});

describe('expenses and the statement', () => {
  it('adds, totals and moves an expense to the Trash, which never removes it for good', async () => {
    const light = await saveExpense(staff, { category: 'Electricity', amount: 1800, spentOn: today, method: 'bank', paidTo: 'CESC' });
    await saveExpense(staff, { category: 'Repairs', amount: 450, spentOn: today, method: 'cash' });
    await expect(saveExpense(staff, { category: 'Repairs', amount: 0, spentOn: today, method: 'cash' })).rejects.toThrow();
    expect((await listExpenses(staff, {})).total).toBe(2250);
    await deleteExpense(staff, light.id);
    expect((await listExpenses(staff, {})).total).toBe(450);
    await expect(expenseTrashSource.purge(db, light.id)).rejects.toMatchObject({ status: 400 });
    expect(await expenseTrashSource.restore(db, light.id)).toContain('Electricity');
    const sheet = await statement(admin, { from: today, to: today });
    expect(sheet.expenseTotal).toBe(2250);
    expect(sheet.balance).toBe(sheet.collection - 2250);
  });
});

describe('small helpers', () => {
  it('works out status, spreads, splits and words', () => {
    expect(invoiceStatus(100, 0)).toBe('unpaid');
    expect(invoiceStatus(100, 40)).toBe('partial');
    expect(invoiceStatus(100, 100)).toBe('paid');
    expect(allocatePayment(150, [{ id: 'a', balance: 100 }, { id: 'b', balance: 100 }]).parts).toEqual([{ id: 'a', amount: 100 }, { id: 'b', amount: 50 }]);
    const split = splitByLines(100, [{ key: 'x', amount: 1 }, { key: 'y', amount: 2 }]);
    expect((split.get('x') ?? 0) + (split.get('y') ?? 0)).toBe(100);
    expect(rupeesInWords(125000)).toBe('Rupees one lakh twenty five thousand only');
  });
});
