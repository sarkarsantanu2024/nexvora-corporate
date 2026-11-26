/**
 * Enquiries from the website's contact form: the list, one enquiry with its
 * notes, changing the status and adding a note.
 *
 * This is the pattern a business module follows: plain functions that take
 * the session first, check the role, validate with zod, do the work and write
 * the activity log. No cookies, no redirects, so vitest can call them.
 */
import { and, desc, eq, ilike, isNull, ne, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { ENQUIRY_STATUSES, enquiries, enquiryNotes, type EnquiryStatus } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { optionalEmail, optionalPhone, requiredText, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, assertTeam, countInt, pageOf } from '../admin/shared';
import { runImport, type ImportResult } from '../import';
import { STATUS_LABELS } from './constants';

export type EnquiryFilters = { q?: string; status?: string; page?: string | number };

const isStatus = (value: unknown): value is EnquiryStatus => (ENQUIRY_STATUSES as readonly string[]).includes(value as string);

function searchWhere(q?: string): SQL | undefined {
  const term = q?.trim();
  if (!term) return undefined;
  const pattern = `%${term}%`;
  return or(ilike(enquiries.name, pattern), ilike(enquiries.phone, pattern), ilike(enquiries.email, pattern), ilike(enquiries.subject, pattern));
}

/** An enquiry in the Trash is left out of every list, count and screen. */
export const notTrashed = isNull(enquiries.deletedAt);

export async function listEnquiries(filters: EnquiryFilters = {}) {
  const db = await getDb();
  const page = pageOf(filters.page);
  const search = and(notTrashed, searchWhere(filters.q));
  const where = isStatus(filters.status) ? and(search, eq(enquiries.status, filters.status)) : search;
  const [rows, [{ n }], statusRows] = await Promise.all([
    db
      .select()
      .from(enquiries)
      .where(where)
      .orderBy(desc(enquiries.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(enquiries).where(where),
    // The numbers on the status buttons follow the search, not the chosen status.
    db.select({ status: enquiries.status, n: countInt() }).from(enquiries).where(search).groupBy(enquiries.status),
  ]);
  const counts = Object.fromEntries(ENQUIRY_STATUSES.map((status) => [status, 0])) as Record<EnquiryStatus, number>;
  for (const row of statusRows) counts[row.status] = row.n;
  return { rows, total: n, page, pageSize: PAGE_SIZE, counts };
}

export async function getEnquiry(id: string) {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return null;
  const db = await getDb();
  const [row] = await db.select().from(enquiries).where(and(eq(enquiries.id, parsed.data), notTrashed)).limit(1);
  if (!row) return null;
  const notes = await db.select().from(enquiryNotes).where(eq(enquiryNotes.enquiryId, row.id)).orderBy(desc(enquiryNotes.createdAt)).limit(200);
  return { row, notes };
}

export async function setEnquiryStatus(session: Session, id: string, status: EnquiryStatus) {
  assertTeam(session);
  if (!isStatus(status)) throw new ApiError(400, 'Choose a status');
  const db = await getDb();
  const [row] = await db.update(enquiries).set({ status, updatedAt: new Date() }).where(and(eq(enquiries.id, uuid.parse(id)), notTrashed)).returning();
  if (!row) throw new ApiError(404, 'Enquiry not found');
  await audit(session, 'enquiry.status', { entity: 'enquiry', entityId: row.id, summary: `Enquiry from ${row.name} marked ${STATUS_LABELS[status].toLowerCase()}` });
  return row;
}

export async function addEnquiryNote(session: Session, id: string, note: string) {
  assertTeam(session);
  const body = requiredText('Note', 2000).parse(note);
  const db = await getDb();
  const [row] = await db.select({ id: enquiries.id, name: enquiries.name }).from(enquiries).where(and(eq(enquiries.id, uuid.parse(id)), notTrashed)).limit(1);
  if (!row) throw new ApiError(404, 'Enquiry not found');
  await db.insert(enquiryNotes).values({ enquiryId: row.id, note: body, createdBy: session.uid, createdByName: session.name });
  await db.update(enquiries).set({ updatedAt: new Date() }).where(eq(enquiries.id, row.id));
  await audit(session, 'enquiry.note', { entity: 'enquiry', entityId: row.id, summary: `Added a note to the enquiry from ${row.name}` });
}

const importRow = z.object({
  name: requiredText('Name', 80),
  phone: optionalPhone,
  email: optionalEmail,
  subject: text(120),
  message: text(2000),
});

/**
 * An old list of contacts from a spreadsheet. They come in as "contacted"
 * (they are not new to the business, so no thank-you reminder is made), and a
 * mobile number already in the list is left out.
 */
export async function importEnquiries(session: Session, rows: unknown): Promise<ImportResult> {
  assertAdmin(session);
  const db = await getDb();
  const existing = await db.select({ phone: enquiries.phone }).from(enquiries).where(and(notTrashed, ne(enquiries.phone, '')));
  const seen = new Set(existing.map((row) => row.phone));
  const result = await runImport(rows, importRow, async (row) => {
    if (!row.phone && !row.email) throw new ApiError(400, 'Give a mobile number or an email');
    if (row.phone && seen.has(row.phone)) throw new ApiError(400, 'This mobile number is already in the list');
    await db.insert(enquiries).values({ ...row, message: row.message || row.subject || 'Imported from a spreadsheet', source: 'import', status: 'contacted' });
    if (row.phone) seen.add(row.phone);
  });
  await audit(session, 'enquiry.import', { entity: 'enquiry', summary: `Imported ${result.added} enquiries from a spreadsheet` });
  return result;
}

/**
 * For spam and test entries: a real enquiry is closed, not deleted. It goes
 * to the Trash, where an admin can bring it back or remove it for good.
 */
export async function deleteEnquiry(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const [row] = await db
    .update(enquiries)
    .set({ deletedAt: new Date() })
    .where(and(eq(enquiries.id, uuid.parse(id)), notTrashed))
    .returning();
  if (!row) throw new ApiError(404, 'Enquiry not found');
  await audit(session, 'enquiry.delete', { entity: 'enquiry', entityId: row.id, summary: `Moved the enquiry from ${row.name} to the Trash` });
}
