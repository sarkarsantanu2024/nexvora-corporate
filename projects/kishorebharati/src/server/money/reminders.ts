/**
 * The fee reminders of REMINDER_KINDS (src/server/reminders/kinds.ts): a fee
 * falling due in a few days, and a fee past its due date (once a month while
 * it stays unpaid). A paid or cancelled bill's waiting reminder is set aside
 * by itself. The wording is Bengali, as parents of this school read it; the
 * head of school can change it in Settings.
 */
import { and, eq, gte, inArray, isNull, lt, lte, ne, type SQL } from 'drizzle-orm';
import type { DB } from '@/db';
import { invoices, students } from '@/db/schema';
import { addDays, formatDate } from '@/lib/date';
import { inr } from '@/lib/money';
import type { ReminderKind } from '../reminders/kinds';
import { billPeriodLabel } from './labels';
import { parentName, schoolHeader } from './shared';

const OPEN = ['unpaid', 'partial'] as const;

async function openBillsDue(db: DB, where: SQL | undefined) {
  return db
    .select({
      id: invoices.id,
      invoiceNo: invoices.invoiceNo,
      title: invoices.title,
      period: invoices.period,
      dueDate: invoices.dueDate,
      total: invoices.total,
      paid: invoices.paid,
      studentName: students.name,
      fatherName: students.fatherName,
      motherName: students.motherName,
      guardianName: students.guardianName,
      phone: students.phone,
    })
    .from(invoices)
    .innerJoin(students, eq(students.id, invoices.studentId))
    .where(and(inArray(invoices.status, [...OPEN]), isNull(students.deletedAt), eq(students.status, 'active'), ne(students.phone, ''), where));
}

const billWords = (bill: { period: string | null; title: string }) => (bill.period ? `${billPeriodLabel(bill.period)} সালের ফি` : bill.title);

/** The bill is paid, cancelled or gone: its reminder is no longer needed. */
async function billsSettled(db: DB, ids: string[]) {
  if (!ids.length) return [];
  const open = await db.select({ id: invoices.id }).from(invoices).where(and(inArray(invoices.id, ids), inArray(invoices.status, [...OPEN])));
  const still = new Set(open.map((row) => row.id));
  return ids.filter((id) => !still.has(id));
}

export const feeDueReminder: ReminderKind = {
  key: 'fee_due',
  label: 'Fee due soon',
  description: 'A WhatsApp to the parent a few days before a bill falls due, while it is unpaid.',
  defaultTemplate: 'নমস্কার {parent}, {school}: {student}-এর {bill} {amount} জমা দেওয়ার শেষ দিন {date}। দয়া করে সময়মতো স্কুল অফিসে জমা দিন। ধন্যবাদ।',
  placeholders: ['parent', 'student', 'bill', 'amount', 'date', 'school'],
  defaultOn: true,
  async collect({ db, today, settings }) {
    const days = Number.isInteger(settings.daysBefore) && settings.daysBefore > 0 ? settings.daysBefore : 3;
    const [school, bills] = await Promise.all([schoolHeader(db), openBillsDue(db, and(gte(invoices.dueDate, today), lte(invoices.dueDate, addDays(today, days))))]);
    return bills.map((bill) => ({
      dedupeKey: `fee_due:${bill.id}`,
      toName: bill.studentName,
      phone: bill.phone,
      values: { parent: parentName(bill), student: bill.studentName, bill: billWords(bill), amount: inr(bill.total - bill.paid), date: formatDate(bill.dueDate), school: school.nameBn || school.name },
      entity: 'invoice',
      entityId: bill.id,
      href: `/admin/fees/bills/${bill.id}`,
      dueOn: today,
    }));
  },
  resolved: billsSettled,
};

export const feeOverdueReminder: ReminderKind = {
  key: 'fee_overdue',
  label: 'Fee overdue',
  description: 'A WhatsApp to the parent when a bill is past its due date, once a month while it stays unpaid.',
  defaultTemplate: 'নমস্কার {parent}, {school}: {student}-এর {bill} {amount} এখনও বকেয়া (শেষ দিন ছিল {date})। দয়া করে যত তাড়াতাড়ি সম্ভব স্কুল অফিসে জমা দিন। ধন্যবাদ।',
  placeholders: ['parent', 'student', 'bill', 'amount', 'date', 'school'],
  defaultOn: true,
  async collect({ db, today }) {
    const month = today.slice(0, 7);
    const [school, bills] = await Promise.all([schoolHeader(db), openBillsDue(db, lt(invoices.dueDate, today))]);
    return bills.map((bill) => ({
      // Once a month per bill, however often the job runs.
      dedupeKey: `fee_overdue:${bill.id}:${month}`,
      toName: bill.studentName,
      phone: bill.phone,
      values: { parent: parentName(bill), student: bill.studentName, bill: billWords(bill), amount: inr(bill.total - bill.paid), date: formatDate(bill.dueDate), school: school.nameBn || school.name },
      entity: 'invoice',
      entityId: bill.id,
      href: `/admin/fees/bills/${bill.id}`,
      dueOn: today,
    }));
  },
  resolved: billsSettled,
};
