/**
 * Running numbers. Each is taken with one atomic upsert (inside the caller's
 * transaction when one is passed), so two people saving at the same moment
 * never get the same receipt number.
 */
import { sql } from 'drizzle-orm';
import type { DbOrTx } from '@/db';
import { counters } from '@/db/schema';
import { financialYear, todayIST } from './date';

export async function nextNumber(db: DbOrTx, key: string): Promise<number> {
  const [row] = await db
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return row.value;
}

const pad = (n: number, width = 4) => String(n).padStart(width, '0');

/** MK-001/26-27/014 */
export async function nextAdmissionNo(db: DbOrTx, centre: { id: string; code: string }, day: string = todayIST()) {
  const fy = financialYear(day);
  return `${centre.code}/${fy}/${pad(await nextNumber(db, `${centre.id}:admission:${fy}`), 3)}`;
}

/** INV/26-27/0042 */
export async function nextInvoiceNo(db: DbOrTx, centreId: string, day: string = todayIST()) {
  const fy = financialYear(day);
  return `INV/${fy}/${pad(await nextNumber(db, `${centreId}:invoice:${fy}`))}`;
}

/** RCT/26-27/0042 */
export async function nextReceiptNo(db: DbOrTx, centreId: string, day: string = todayIST()) {
  const fy = financialYear(day);
  return `RCT/${fy}/${pad(await nextNumber(db, `${centreId}:receipt:${fy}`))}`;
}

/** MK-007 for the next centre. */
export async function nextCentreCode(db: DbOrTx) {
  return `MK-${pad(await nextNumber(db, 'centre:code'), 3)}`;
}
