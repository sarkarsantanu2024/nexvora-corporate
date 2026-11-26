/**
 * Sample fee heads, the yearly bill of every sample student, some receipts
 * and a few expenses, so the money screens have something to show on a
 * computer without Neon.
 *
 * The amounts are made up and every fee head says "(sample)" in its name: a
 * government school's real fees are set by the state, and the office enters
 * them itself. Never loaded into Neon unless SEED_DEMO=1.
 */
import { and, eq } from 'drizzle-orm';
import { addDays, currentPeriod, periodRange, todayIST } from '@/lib/date';
import { nextBillNo, nextReceiptNo } from '@/server/money/shared';
import type { DB } from '../index';
import * as s from '../schema';
import type { SampleContext } from './index';

type HeadSeed = { name: string; kind: s.FeeKind; fromGrade: number; toGrade: number; amount: number };

const HEADS: HeadSeed[] = [
  { name: 'Session fee (sample)', kind: 'annual', fromGrade: 5, toGrade: 12, amount: 240 },
  { name: 'Development fee (sample)', kind: 'annual', fromGrade: 9, toGrade: 12, amount: 60 },
  { name: 'Admission fee, Class 11 (sample)', kind: 'one_time', fromGrade: 11, toGrade: 11, amount: 300 },
];

export async function seedMoneySample(db: DB, context: SampleContext): Promise<void> {
  const today = todayIST();
  const [year] = await db.select().from(s.academicYears).where(eq(s.academicYears.id, context.yearId)).limit(1);
  if (!year) return;
  const heads = await db.insert(s.feeHeads).values(HEADS).returning();

  // The yearly bill of every sample student, raised in April and due at the end of May.
  const roll = await db
    .select({ studentId: s.enrolments.studentId, grade: s.sections.grade })
    .from(s.enrolments)
    .innerJoin(s.sections, eq(s.sections.id, s.enrolments.sectionId))
    .where(eq(s.enrolments.yearId, year.id));
  const issueDate = `${year.name}-04-01` < today ? `${year.name}-04-01` : today;
  const dueDate = `${year.name}-05-31` < today ? `${year.name}-05-31` : addDays(today, 30);

  const bills: { id: string; studentId: string; total: number }[] = [];
  for (const place of roll) {
    const lines = heads.filter((head) => head.fromGrade <= place.grade && place.grade <= head.toGrade);
    if (!lines.length) continue;
    const total = lines.reduce((sum, head) => sum + head.amount, 0);
    const [bill] = await db
      .insert(s.invoices)
      .values({
        studentId: place.studentId,
        yearId: year.id,
        invoiceNo: await nextBillNo(db, issueDate),
        period: year.name,
        title: `Fees for ${year.name}`,
        issueDate,
        dueDate,
        subtotal: total,
        total,
        status: 'unpaid',
        createdBy: context.officeUserId,
      })
      .returning({ id: s.invoices.id });
    await db.insert(s.invoiceItems).values(lines.map((head) => ({ invoiceId: bill.id, feeHeadId: head.id, description: head.name, amount: head.amount })));
    bills.push({ id: bill.id, studentId: place.studentId, total });
  }

  // About two in three have paid in full, a few in part, the rest not yet: receipts spread over the last two months.
  const methods: s.PaymentMethod[] = ['cash', 'cash', 'cash', 'upi', 'bank'];
  for (const [index, bill] of bills.entries()) {
    const kind = index % 6;
    if (kind >= 4 && kind !== 5) continue;
    const amount = kind === 5 ? Math.floor(bill.total / 2) : bill.total;
    const paidOn = addDays(today, -((index * 7) % 55));
    const method = methods[index % methods.length];
    await db.insert(s.payments).values({
      studentId: bill.studentId,
      invoiceId: bill.id,
      receiptNo: await nextReceiptNo(db, paidOn),
      amount,
      method,
      reference: method === 'cash' ? '' : `${method.toUpperCase()}${String(400000 + index * 37)}`,
      paidOn,
      receivedBy: context.officeUserId,
    });
    await db
      .update(s.invoices)
      .set({ paid: amount, status: amount >= bill.total ? 'paid' : 'partial' })
      .where(and(eq(s.invoices.id, bill.id)));
  }

  // A few expenses this month and last.
  const thisMonth = periodRange(currentPeriod());
  const lastDay = (offset: number) => {
    const day = addDays(today, -offset);
    return day < `${year.name}-01-01` ? today : day;
  };
  await db.insert(s.expenses).values([
    { category: 'Electricity', description: 'Electricity bill (sample)', amount: 3850, spentOn: lastDay(35), paidTo: 'CESC', method: 'bank', createdBy: context.officeUserId },
    { category: 'Electricity', description: 'Electricity bill (sample)', amount: 3420, spentOn: thisMonth.from < today ? thisMonth.from : today, paidTo: 'CESC', method: 'bank', createdBy: context.officeUserId },
    { category: 'Repairs', description: 'Bench repair, Room 12 (sample)', amount: 1200, spentOn: lastDay(20), paidTo: 'Local carpenter', method: 'cash', createdBy: context.officeUserId },
    { category: 'Stationery', description: 'Register books and chalk (sample)', amount: 640, spentOn: lastDay(9), paidTo: 'Stationery shop', method: 'cash', createdBy: context.officeUserId },
    { category: 'Cleaning', description: 'Phenyl and brooms (sample)', amount: 380, spentOn: lastDay(3), paidTo: 'Local shop', method: 'cash', createdBy: context.officeUserId },
  ]);
}
