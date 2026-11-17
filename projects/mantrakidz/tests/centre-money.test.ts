/**
 * The money side of a centre, against a fresh in-memory database with the
 * sample data: the monthly run, payments, voids, corrections, salaries, who
 * may do what, and that the report figures match the receipts.
 */
import { and, eq, gte, isNull, lte, sum } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.MK_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;

import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { addMonths, currentPeriod, periodRange, todayIST } from '@/lib/date';
import type { Session } from '@/lib/auth';
import { cancelBill, createBill, discountBill, getBill, listBills, listDues, openBills, previewRun, runMonthly, saveFeeHead } from '@/server/centre/money/bills';
import { deleteExpense, listExpenses, paySalaries, salarySheet, saveExpense } from '@/server/centre/money/expenses';
import { rupeesInWords } from '@/server/centre/money/labels';
import { savePaymentDetails } from '@/server/centre/money/payment-details';
import { hasPaymentDetails, paymentDetailsOf, paymentText, upiPayLink } from '@/server/centre/money/payment-info';
import { dayBook, getReceipt, takePayment, voidPayment } from '@/server/centre/money/payments';
import { collectionByMethod, collectionTotal, duesAgeing, incomeStatement, monthSummary } from '@/server/centre/money/reports';
import type { Ctx } from '@/server/centre/money/shared';

let db: DB;
let head: Ctx; // Lake Town centre head
let desk: Ctx; // Lake Town front desk
let other: Ctx; // Salt Lake centre head

async function ctxFor(username: string): Promise<Ctx> {
  const [user] = await db.select().from(s.users).where(eq(s.users.username, username));
  const [centre] = await db.select().from(s.centres).where(eq(s.centres.id, user.centreId!));
  const session: Session = { uid: user.id, name: user.name, username: user.username, role: user.role, centreId: user.centreId };
  return { session, centre };
}

const today = todayIST();
const nextMonth = addMonths(currentPeriod(), 1);

beforeAll(async () => {
  db = await getDb();
  head = await ctxFor('laketown');
  desk = await ctxFor('laketown.desk');
  other = await ctxFor('saltlake');
}, 120_000);

const billRow = async (id: string) => (await db.select().from(s.invoices).where(eq(s.invoices.id, id)))[0];

describe('monthly run', () => {
  it('raises one bill per active child, skips children who left, and adds nothing when run again', async () => {
    const active = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(and(eq(s.students.centreId, head.centre.id), eq(s.students.status, 'active')));
    const left = await db
      .select({ id: s.students.id })
      .from(s.students)
      .where(and(eq(s.students.centreId, head.centre.id), eq(s.students.status, 'left')));
    expect(left.length).toBeGreaterThan(0);

    const preview = await previewRun(head, nextMonth);
    expect(preview.rows).toHaveLength(active.length);
    expect(preview.toRaise).toBe(active.length);

    const first = await runMonthly(head, nextMonth);
    expect(first.created).toBe(active.length);

    const raised = await db
      .select()
      .from(s.invoices)
      .where(and(eq(s.invoices.centreId, head.centre.id), eq(s.invoices.period, nextMonth)));
    expect(raised).toHaveLength(active.length);
    const leftIds = new Set(left.map((l) => l.id));
    expect(raised.some((bill) => leftIds.has(bill.studentId))).toBe(false);
    expect(new Set(raised.map((bill) => bill.invoiceNo)).size).toBe(raised.length);
    for (const bill of raised) {
      expect(bill.total).toBeGreaterThan(0);
      expect(bill.status).toBe('unpaid');
      expect(bill.dueDate).toBe(`${nextMonth}-10`);
    }
    const items = await db.select().from(s.invoiceItems).where(eq(s.invoiceItems.invoiceId, raised[0].id));
    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(raised[0].total);

    const second = await runMonthly(head, nextMonth);
    expect(second.created).toBe(0);
    expect(second.alreadyBilled).toBe(active.length);
    const again = await db
      .select()
      .from(s.invoices)
      .where(and(eq(s.invoices.centreId, head.centre.id), eq(s.invoices.period, nextMonth)));
    expect(again).toHaveLength(active.length);
  });

  it("uses the child's own monthly fee when one is set, and flags a child with no fee", async () => {
    const month = currentPeriod();
    const preview = await previewRun(other, month);
    const child = preview.rows[0];
    await db.update(s.students).set({ monthlyFee: 1234 }).where(eq(s.students.id, child.studentId));
    const withOwn = await previewRun(other, month);
    expect(withOwn.rows.find((r) => r.studentId === child.studentId)).toMatchObject({ amount: 1234, source: 'child' });

    await db.update(s.students).set({ monthlyFee: null }).where(eq(s.students.id, child.studentId));
    await db.update(s.feeHeads).set({ active: false }).where(and(eq(s.feeHeads.centreId, other.centre.id), eq(s.feeHeads.kind, 'monthly')));
    const noFee = await previewRun(other, month);
    expect(noFee.rows.every((r) => r.amount === null)).toBe(true);
    await db.update(s.feeHeads).set({ active: true }).where(and(eq(s.feeHeads.centreId, other.centre.id), eq(s.feeHeads.kind, 'monthly')));
  });

  it('refuses a month too far ahead', async () => {
    await expect(runMonthly(head, addMonths(currentPeriod(), 2))).rejects.toThrow(/next month/);
  });
});

describe('payments', () => {
  let studentId: string;
  let secondReceiptId: string;
  let secondBillId: string;

  it('spreads a payment oldest bill first and updates paid and status', async () => {
    const [student] = await db
      .select()
      .from(s.students)
      .where(and(eq(s.students.centreId, head.centre.id), eq(s.students.status, 'active')));
    studentId = student.id;
    // A one-off bill due today, so the child surely has at least two unpaid bills (this and next month's).
    await createBill(head, { studentId, title: 'Picnic', lines: [{ description: 'Picnic charge', amount: 800 }], dueDate: today });

    const before = await openBills(head, studentId);
    expect(before.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < before.length; i++) expect(before[i].dueDate >= before[i - 1].dueDate).toBe(true);
    const due = before.reduce((sum, b) => sum + (b.total - b.paid), 0);
    const firstBalance = before[0].total - before[0].paid;

    await expect(takePayment(head, { studentId, amount: due + 1, method: 'cash', paidOn: today })).rejects.toThrow(/is due/);
    await expect(takePayment(head, { studentId, amount: 100, method: 'upi', paidOn: today })).rejects.toThrow(/reference/i);
    await expect(takePayment(head, { studentId, amount: 100, method: 'cash', paidOn: addMonths(currentPeriod(), 1) + '-01' })).rejects.toThrow(/future/);
    await expect(takePayment(head, { studentId, amount: 0, method: 'cash', paidOn: today })).rejects.toThrow();

    // The front desk may take a payment.
    const result = await takePayment(desk, { studentId, amount: firstBalance + 100, method: 'upi', reference: 'UPI123', paidOn: today });
    expect(result.receipts).toHaveLength(2);
    expect(result.receipts[0]).toMatchObject({ invoiceId: before[0].id, amount: firstBalance });
    expect(result.receipts[1]).toMatchObject({ invoiceId: before[1].id, amount: 100 });
    expect(result.receipts[0].receiptNo).not.toBe(result.receipts[1].receiptNo);

    const first = await billRow(before[0].id);
    expect(first.paid).toBe(first.total);
    expect(first.status).toBe('paid');
    const second = await billRow(before[1].id);
    expect(second.paid).toBe(before[1].paid + 100);
    expect(second.status).toBe('partial');

    const after = await openBills(head, studentId);
    expect(after.reduce((sum, b) => sum + (b.total - b.paid), 0)).toBe(due - firstBalance - 100);

    secondReceiptId = result.receipts[1].id;
    secondBillId = before[1].id;

    // Both parts print on one sheet.
    const sheet = await getReceipt(head, result.id);
    expect(sheet?.lines).toHaveLength(2);
    expect(sheet?.amount).toBe(firstBalance + 100);
    expect(sheet?.balanceDue).toBe(due - firstBalance - 100);
  });

  it('voiding a receipt recomputes the bill and needs a reason', async () => {
    const before = await billRow(secondBillId);
    await expect(voidPayment(head, secondReceiptId, '  ')).rejects.toThrow();
    await voidPayment(head, secondReceiptId, 'Entered against the wrong child');
    const after = await billRow(secondBillId);
    expect(after.paid).toBe(before.paid - 100);
    expect(after.status).toBe(after.paid > 0 ? 'partial' : 'unpaid');
    const [payment] = await db.select().from(s.payments).where(eq(s.payments.id, secondReceiptId));
    expect(payment.voidedAt).not.toBeNull();
    expect(payment.voidReason).toBe('Entered against the wrong child');
    await expect(voidPayment(head, secondReceiptId, 'again')).rejects.toThrow(/already void/);

    const [log] = await db.select().from(s.auditLog).where(and(eq(s.auditLog.action, 'payment.void'), eq(s.auditLog.entityId, secondReceiptId)));
    expect(log).toBeTruthy();
  });

  it('keeps every bill equal to the sum of its live receipts', async () => {
    const paid = await db
      .select({ invoiceId: s.payments.invoiceId, total: sum(s.payments.amount) })
      .from(s.payments)
      .where(and(eq(s.payments.centreId, head.centre.id), isNull(s.payments.voidedAt)))
      .groupBy(s.payments.invoiceId);
    const byInvoice = new Map(paid.map((p) => [p.invoiceId, Number(p.total)]));
    const bills = await db.select().from(s.invoices).where(eq(s.invoices.centreId, head.centre.id));
    for (const bill of bills) expect(bill.paid).toBe(byInvoice.get(bill.id) ?? 0);
  });

  it('the day book adds up by method and leaves void receipts out', async () => {
    const book = await dayBook(head, today);
    const live = book.rows.filter((r) => !r.voidedAt);
    expect(book.total).toBe(live.reduce((sum, r) => sum + r.amount, 0));
    expect(book.byMethod.reduce((sum, m) => sum + m.amount, 0)).toBe(book.total);
    expect(book.voided).toBeGreaterThanOrEqual(1);
  });
});

describe('corrections', () => {
  it('cancels an unpaid bill but not one with a receipt', async () => {
    const [student] = await db.select().from(s.students).where(and(eq(s.students.centreId, head.centre.id), eq(s.students.status, 'active')));
    const bill = await createBill(head, { studentId: student.id, title: 'Annual day', lines: [{ description: 'Costume', amount: 500 }], dueDate: today });
    await expect(cancelBill(head, bill.id, '')).rejects.toThrow();
    await cancelBill(head, bill.id, 'Raised twice');
    expect((await billRow(bill.id)).status).toBe('cancelled');
    await expect(cancelBill(head, bill.id, 'again')).rejects.toThrow(/already cancelled/);

    const [paidBill] = await db
      .select()
      .from(s.invoices)
      .where(and(eq(s.invoices.centreId, head.centre.id), eq(s.invoices.status, 'paid')));
    await expect(cancelBill(head, paidBill.id, 'Mistake')).rejects.toThrow(/receipt/);
    expect((await billRow(paidBill.id)).status).toBe('paid');
  });

  it('a discount cannot take a bill below what is already paid', async () => {
    const [student] = await db.select().from(s.students).where(and(eq(s.students.centreId, other.centre.id), eq(s.students.status, 'active')));
    const bill = await createBill(other, { studentId: student.id, title: 'Trip', lines: [{ description: 'Trip', amount: 1000 }], dueDate: today });
    // Paying this very bill: make it the oldest by paying everything older first is not needed, so pay the whole due.
    const open = await openBills(other, student.id);
    const olderDue = open.filter((b) => b.id !== bill.id && b.dueDate <= today).reduce((sum, b) => sum + (b.total - b.paid), 0);
    await takePayment(other, { studentId: student.id, amount: olderDue + 600, method: 'cash', paidOn: today });
    expect((await billRow(bill.id)).paid).toBe(600);

    await expect(discountBill(other, bill.id, { discount: 500, reason: 'Sibling' })).rejects.toThrow(/already received/);
    await expect(discountBill(other, bill.id, { discount: 100, reason: '' })).rejects.toThrow(/reason/);
    const partly = await discountBill(other, bill.id, { discount: 300, reason: 'Sibling' });
    expect(partly).toMatchObject({ discount: 300, total: 700, paid: 600, status: 'partial' });
    const full = await discountBill(other, bill.id, { discount: 400, reason: 'Sibling' });
    expect(full).toMatchObject({ total: 600, status: 'paid' });
  });
});

describe('who may do what', () => {
  it('the front desk cannot void, change fee heads, run, cancel, discount or see expenses and reports', async () => {
    const [payment] = await db
      .select()
      .from(s.payments)
      .where(and(eq(s.payments.centreId, desk.centre.id), isNull(s.payments.voidedAt)));
    const [headRow] = await db.select().from(s.feeHeads).where(eq(s.feeHeads.centreId, desk.centre.id));
    const [bill] = await db.select().from(s.invoices).where(and(eq(s.invoices.centreId, desk.centre.id), eq(s.invoices.status, 'unpaid')));
    const denied = /Only the school head/;

    await expect(voidPayment(desk, payment.id, 'Mistake')).rejects.toThrow(denied);
    await expect(saveFeeHead(desk, { id: headRow.id, name: headRow.name, kind: headRow.kind, programmeId: headRow.programmeId, amount: 1 })).rejects.toThrow(denied);
    await expect(runMonthly(desk, currentPeriod())).rejects.toThrow(denied);
    await expect(previewRun(desk, currentPeriod())).rejects.toThrow(denied);
    await expect(cancelBill(desk, bill.id, 'Mistake')).rejects.toThrow(denied);
    await expect(discountBill(desk, bill.id, { discount: 10, reason: 'x' })).rejects.toThrow(denied);
    await expect(createBill(desk, { studentId: bill.studentId, title: 'Kit', lines: [{ description: 'Kit', amount: 500 }], discount: 50, discountReason: 'x', dueDate: today })).rejects.toThrow(denied);
    await expect(listExpenses(desk)).rejects.toThrow(denied);
    await expect(saveExpense(desk, { category: 'Rent', amount: 100, spentOn: today, method: 'cash' })).rejects.toThrow(denied);
    await expect(salarySheet(desk)).rejects.toThrow(denied);
    await expect(incomeStatement(desk, periodRange(currentPeriod()))).rejects.toThrow(denied);
    await expect(duesAgeing(desk)).rejects.toThrow(denied);

    expect((await db.select().from(s.payments).where(eq(s.payments.id, payment.id)))[0].voidedAt).toBeNull();
    expect((await db.select().from(s.feeHeads).where(eq(s.feeHeads.id, headRow.id)))[0].amount).toBe(headRow.amount);

    // What the front desk may do: see bills and dues, raise a plain one-off bill.
    expect((await listBills(desk)).count).toBeGreaterThan(0);
    expect((await listDues(desk)).length).toBeGreaterThan(0);
  });

  it('a manager changes a fee head and old bills keep their amounts', async () => {
    const [headRow] = await db.select().from(s.feeHeads).where(and(eq(s.feeHeads.centreId, head.centre.id), eq(s.feeHeads.kind, 'monthly')));
    const [oldBill] = await db.select().from(s.invoices).where(and(eq(s.invoices.centreId, head.centre.id), eq(s.invoices.period, currentPeriod())));
    await saveFeeHead(head, { id: headRow.id, name: headRow.name, kind: 'monthly', programmeId: headRow.programmeId, amount: headRow.amount + 200 });
    expect((await db.select().from(s.feeHeads).where(eq(s.feeHeads.id, headRow.id)))[0].amount).toBe(headRow.amount + 200);
    expect((await billRow(oldBill.id)).total).toBe(oldBill.total);
    await expect(saveFeeHead(head, { name: 'Second tuition', kind: 'monthly', programmeId: headRow.programmeId, amount: 100 })).rejects.toThrow(/already has/);
  });

  it("refuses a bill, receipt, child or fee head that belongs to another school", async () => {
    const [bill] = await db.select().from(s.invoices).where(and(eq(s.invoices.centreId, head.centre.id), eq(s.invoices.status, 'unpaid')));
    const [payment] = await db.select().from(s.payments).where(and(eq(s.payments.centreId, head.centre.id), isNull(s.payments.voidedAt)));
    const [headRow] = await db.select().from(s.feeHeads).where(eq(s.feeHeads.centreId, head.centre.id));

    await expect(getBill(other, bill.id)).rejects.toThrow(/not found/);
    expect(await getReceipt(other, payment.id)).toBeNull();
    await expect(voidPayment(other, payment.id, 'Mistake')).rejects.toThrow(/not found/);
    await expect(cancelBill(other, bill.id, 'Mistake')).rejects.toThrow(/not found/);
    await expect(discountBill(other, bill.id, { discount: 10, reason: 'x' })).rejects.toThrow(/not found/);
    await expect(takePayment(other, { studentId: bill.studentId, amount: 10, method: 'cash', paidOn: today })).rejects.toThrow(/not found/);
    await expect(createBill(other, { studentId: bill.studentId, title: 'Kit', lines: [{ description: 'Kit', amount: 10 }], dueDate: today })).rejects.toThrow(/not found/);
    await expect(saveFeeHead(other, { id: headRow.id, name: 'Hijack', kind: 'one_time', amount: 1 })).rejects.toThrow(/not found/);
    expect((await listBills(other, { student: bill.studentId })).count).toBe(0);

    expect((await billRow(bill.id)).status).toBe('unpaid');
    expect((await db.select().from(s.payments).where(eq(s.payments.id, payment.id)))[0].voidedAt).toBeNull();
  });
});

describe('expenses and salaries', () => {
  it('adds, changes and soft deletes an expense', async () => {
    const before = await listExpenses(head, { month: currentPeriod() });
    const row = await saveExpense(head, { category: 'Repairs', description: 'Tap', amount: 450, spentOn: today, paidTo: 'Plumber', method: 'cash' });
    expect((await listExpenses(head, { month: currentPeriod() })).total).toBe(before.total + 450);
    await saveExpense(head, { id: row.id, category: 'Repairs', description: 'Tap and pipe', amount: 500, spentOn: today, paidTo: 'Plumber', method: 'cash' });
    expect((await listExpenses(head, { month: currentPeriod() })).total).toBe(before.total + 500);
    await expect(saveExpense(other, { id: row.id, category: 'Repairs', amount: 1, spentOn: today, method: 'cash' })).rejects.toThrow(/not found/);
    await deleteExpense(head, row.id);
    expect((await listExpenses(head, { month: currentPeriod() })).total).toBe(before.total);
    const [kept] = await db.select().from(s.expenses).where(eq(s.expenses.id, row.id));
    expect(kept.deletedAt).not.toBeNull();
    await expect(saveExpense(head, { category: 'Salary', amount: 100, spentOn: today, method: 'cash' })).rejects.toThrow(/Pay salaries/);
  });

  it('salary cannot be paid twice to the same person for the same month', async () => {
    const month = currentPeriod();
    const sheet = await salarySheet(head, month);
    const unpaid = sheet.rows.filter((r) => !r.paid);
    expect(unpaid.length).toBeGreaterThanOrEqual(2);
    const [a, b] = unpaid;

    const paid = await paySalaries(head, { month, paidOn: today, method: 'bank', items: [{ staffId: a.id, amount: a.monthlySalary - 500 }] });
    expect(paid).toEqual({ count: 1, total: a.monthlySalary - 500 });
    await expect(paySalaries(head, { month, paidOn: today, method: 'bank', items: [{ staffId: a.id, amount: a.monthlySalary }] })).rejects.toThrow(/already paid/);
    // One already paid name in the batch stops the whole batch.
    await expect(
      paySalaries(head, { month, paidOn: today, method: 'bank', items: [{ staffId: b.id, amount: b.monthlySalary }, { staffId: a.id, amount: 1 }] }),
    ).rejects.toThrow(/already paid/);
    const rows = await db
      .select()
      .from(s.expenses)
      .where(and(eq(s.expenses.centreId, head.centre.id), eq(s.expenses.salaryPeriod, month), isNull(s.expenses.deletedAt)));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ staffId: a.id, category: 'Salary', amount: a.monthlySalary - 500 });

    await expect(paySalaries(other, { month, paidOn: today, method: 'bank', items: [{ staffId: b.id, amount: 1 }] })).rejects.toThrow(/not found/);
    const after = await salarySheet(head, month);
    expect(after.rows.find((r) => r.id === a.id)?.paid?.amount).toBe(a.monthlySalary - 500);
  });
});

describe('reports', () => {
  it('collection equals the sum of receipts that are not void, by the day received', async () => {
    for (const month of [currentPeriod(), addMonths(currentPeriod(), -1)]) {
      const range = periodRange(month);
      const [{ expected }] = await db
        .select({ expected: sum(s.payments.amount) })
        .from(s.payments)
        .where(and(eq(s.payments.centreId, head.centre.id), isNull(s.payments.voidedAt), gte(s.payments.paidOn, range.from), lte(s.payments.paidOn, range.to)));
      const total = Number(expected ?? 0);
      expect(total).toBeGreaterThan(0);

      expect(await collectionTotal(head, range)).toBe(total);
      const statement = await incomeStatement(head, range);
      expect(statement.collection).toBe(total);
      expect(statement.income.reduce((acc, row) => acc + row.amount, 0)).toBe(total);
      expect(statement.surplus).toBe(total - statement.expenseTotal);
      expect((await collectionByMethod(head, range)).total).toBe(total);
      const summary = await monthSummary(head, month);
      expect(summary.collection).toBe(total);
      expect(summary.surplus).toBe(total - summary.expenses);
    }
  });

  it('a voided receipt drops out of the collection', async () => {
    const range = periodRange(currentPeriod());
    const before = await collectionTotal(head, range);
    const [student] = await db.select().from(s.students).where(and(eq(s.students.centreId, head.centre.id), eq(s.students.status, 'active')));
    const paid = await takePayment(head, { studentId: student.id, amount: 50, method: 'cash', paidOn: today });
    expect(await collectionTotal(head, range)).toBe(before + 50);
    await voidPayment(head, paid.id, 'Test entry');
    expect(await collectionTotal(head, range)).toBe(before);
    expect((await incomeStatement(head, range)).collection).toBe(before);
  });

  it('dues ageing adds up to the dues list', async () => {
    const ageing = await duesAgeing(head);
    const dues = await listDues(head);
    expect(ageing.totals.total).toBe(dues.reduce((acc, row) => acc + row.due, 0));
    expect(ageing.totals.notDue + ageing.totals.d0 + ageing.totals.d31 + ageing.totals.d61).toBe(ageing.totals.total);
    expect(ageing.rows).toHaveLength(dues.length);
  });
});

describe('amount in words', () => {
  it('reads the Indian way', () => {
    expect(rupeesInWords(2500)).toBe('Rupees two thousand five hundred only');
    expect(rupeesInWords(125000)).toBe('Rupees one lakh twenty five thousand only');
    expect(rupeesInWords(10000019)).toBe('Rupees one crore nineteen only');
    expect(rupeesInWords(0)).toBe('Rupees zero only');
  });
});

describe('payment details', () => {
  const good = { upiId: 'mantrakidz@okhdfcbank', payeeName: 'Mantra Kidz Lake Town', accountName: 'Mantra Kidz', accountNumber: '123456789012', ifsc: 'hdfc0001234', bank: 'HDFC Bank', branch: 'Lake Town' };

  it('only a manager saves them, and bad UPI IDs and IFSC codes are refused', async () => {
    await expect(savePaymentDetails(desk, good)).rejects.toThrow(/Only the school head/);
    await expect(savePaymentDetails(head, { ...good, upiId: 'no-at-sign' })).rejects.toThrow();
    await expect(savePaymentDetails(head, { ...good, upiId: 'two@@handles' })).rejects.toThrow();
    await expect(savePaymentDetails(head, { ...good, ifsc: 'HDFC1001234' })).rejects.toThrow();
    await expect(savePaymentDetails(head, { ...good, ifsc: 'HDF0001234' })).rejects.toThrow();
    await expect(savePaymentDetails(head, { ...good, ifsc: '' })).rejects.toThrow();
    const [untouched] = await db.select().from(s.centres).where(eq(s.centres.id, head.centre.id));
    expect(paymentDetailsOf(untouched).upiId).toBe('');
  });

  it('keeps them in schools.meta.payment without touching the rest of meta, and audits', async () => {
    await db.update(s.centres).set({ meta: { royaltyTerms: [{ from: '2026-01', type: 'percent', value: 10 }] } }).where(eq(s.centres.id, head.centre.id));
    const saved = await savePaymentDetails(head, good);
    expect(saved.ifsc).toBe('HDFC0001234');
    const [centre] = await db.select().from(s.centres).where(eq(s.centres.id, head.centre.id));
    expect(centre.meta.royaltyTerms).toHaveLength(1);
    const details = paymentDetailsOf(centre);
    expect(details).toMatchObject({ upiId: 'mantrakidz@okhdfcbank', accountNumber: '123456789012', ifsc: 'HDFC0001234', qrImage: '' });
    expect(hasPaymentDetails(details)).toBe(true);
    const [otherCentre] = await db.select().from(s.centres).where(eq(s.centres.id, other.centre.id));
    expect(hasPaymentDetails(paymentDetailsOf(otherCentre))).toBe(false);
    const [log] = await db.select().from(s.auditLog).where(and(eq(s.auditLog.action, 'centre.payment_details'), eq(s.auditLog.centreId, head.centre.id)));
    expect(log.summary).toContain('mantrakidz@okhdfcbank');

    expect(upiPayLink(details, 2500, 'INV/26-27/0042')).toBe('upi://pay?pa=mantrakidz%40okhdfcbank&pn=Mantra%20Kidz%20Lake%20Town&am=2500&cu=INR&tn=INV%2F26-27%2F0042');
    expect(upiPayLink({ ...details, upiId: '' }, 2500, 'x')).toBe('');
    const text = paymentText(details);
    expect(text).toContain('Pay by UPI: mantrakidz@okhdfcbank');
    expect(text).toContain('A/c 123456789012, IFSC HDFC0001234');
    expect(paymentText(paymentDetailsOf(otherCentre))).toBe('');
  });
});
