/**
 * Pieces every money service uses: the SQL fragments that keep totals the
 * same on every screen, running numbers, the school's printout header and the
 * fee settings.
 */
import { and, eq, isNull, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import type { DbOrTx } from '@/db';
import { counters, enrolments, payments, sections, students } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { financialYear } from '@/lib/date';
import { uuid } from '@/lib/validators';
import { getSetting } from '../admin/shared';
import type { PaymentDetails } from './labels';

/** Receipts that count: voided ones are left out of every total. */
export const livePayment = isNull(payments.voidedAt);
export const liveStudent = isNull(students.deletedAt);

/** sum() that comes back as a JavaScript number and never as null. */
export const sumInt = (expr: AnyColumn | SQL) => sql<number>`coalesce(sum(${expr}), 0)::int`;
/** 'YYYY-MM' of a date column, for group by month. */
export const monthOf = (column: AnyColumn) => sql<string>`to_char(${column}, 'YYYY-MM')`;

/** Makes typed text safe inside ILIKE: % and _ are matched as themselves. */
export const likeText = (q: string) => `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

export const isUuid = (value: string | undefined | null): value is string => !!value && uuid.safeParse(value).success;

export const notFound = (what: string): never => {
  throw new ApiError(404, `${what} not found`);
};

/** Takes the next running number for a key. Call inside the transaction that uses it. */
export async function nextNumber(db: DbOrTx, key: string): Promise<number> {
  const [row] = await db
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return row.value;
}

/** Bill numbers run per calendar year, like the school year: B/2026/0001. */
export async function nextBillNo(db: DbOrTx, issueDate: string) {
  const year = issueDate.slice(0, 4);
  const n = await nextNumber(db, `bill:${year}`);
  return `B/${year}/${String(n).padStart(4, '0')}`;
}

/** Receipt numbers run per financial year, as the cash book does: R/26-27/0001. */
export async function nextReceiptNo(db: DbOrTx, paidOn: string) {
  const fy = financialYear(paidOn);
  const n = await nextNumber(db, `receipt:${fy}`);
  return `R/${fy}/${String(n).padStart(4, '0')}`;
}

/**
 * A student's place (section and roll) in one school year. Joined with a left
 * join, so a student without a place that year is still listed.
 */
export const placeJoin = (yearId: string) => and(eq(enrolments.studentId, students.id), eq(enrolments.yearId, yearId));
export const sectionJoin = eq(sections.id, enrolments.sectionId);

/** The section columns a screen needs to write "Class 7 A". */
export const sectionColumns = {
  sectionId: sections.id,
  grade: sections.grade,
  sectionName: sections.name,
  stream: sections.stream,
  shift: sections.shift,
  rollNo: enrolments.rollNo,
};

/** The school's name, address and UDISE as printed on bills, receipts and statements. */
export type SchoolHeader = { name: string; nameBn: string; address: string; addressBn: string; udise: string; phone: string };

export async function schoolHeader(db?: DbOrTx): Promise<SchoolHeader> {
  const school = await getSetting('school', db);
  const high = school.high;
  return { name: high.name, nameBn: high.nameBn, address: high.address, addressBn: high.addressBn, udise: high.udise, phone: high.phone };
}

export async function feeSettings(db?: DbOrTx) {
  const stored = await getSetting('fees', db);
  const dueDays = Number(stored.dueDays);
  return {
    dueDays: Number.isInteger(dueDays) && dueDays >= 0 && dueDays <= 365 ? dueDays : 30,
    receiptFooter: typeof stored.receiptFooter === 'string' ? stored.receiptFooter : '',
  };
}

/** How parents pay the school, whatever state the stored setting is in. */
export async function getPaymentDetails(db?: DbOrTx): Promise<PaymentDetails> {
  const stored = (await getSetting('payment', db)) as Record<string, unknown>;
  const keys: (keyof PaymentDetails)[] = ['upiId', 'payeeName', 'qrImage', 'accountName', 'accountNumber', 'ifsc', 'bank', 'branch', 'note'];
  const out = {} as PaymentDetails;
  for (const key of keys) out[key] = typeof stored[key] === 'string' ? (stored[key] as string) : '';
  return out;
}

/** The name a reminder opens with: father, then mother, then guardian. */
export const parentName = (student: { fatherName: string; motherName: string; guardianName?: string }) =>
  student.fatherName || student.motherName || student.guardianName || 'অভিভাবক';
