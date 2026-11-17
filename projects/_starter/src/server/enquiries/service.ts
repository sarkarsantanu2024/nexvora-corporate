/**
 * Enquiries from the website's contact form: the list, one enquiry with its
 * notes, changing the status and adding a note.
 *
 * This is the pattern a business module follows: plain functions that take
 * the session first, check the role, validate with zod, do the work and write
 * the activity log. No cookies, no redirects, so vitest can call them.
 */
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/db';
import { ENQUIRY_STATUSES, enquiries, enquiryNotes, type EnquiryStatus } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { requiredText, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, assertTeam, countInt, pageOf } from '../admin/shared';
import { STATUS_LABELS } from './constants';

export type EnquiryFilters = { q?: string; status?: string; page?: string | number };

const isStatus = (value: unknown): value is EnquiryStatus => (ENQUIRY_STATUSES as readonly string[]).includes(value as string);

function searchWhere(q?: string): SQL | undefined {
  const term = q?.trim();
  if (!term) return undefined;
  const pattern = `%${term}%`;
  return or(ilike(enquiries.name, pattern), ilike(enquiries.phone, pattern), ilike(enquiries.email, pattern), ilike(enquiries.subject, pattern));
}

export async function listEnquiries(filters: EnquiryFilters = {}) {
  const db = await getDb();
  const page = pageOf(filters.page);
  const search = searchWhere(filters.q);
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
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, parsed.data)).limit(1);
  if (!row) return null;
  const notes = await db.select().from(enquiryNotes).where(eq(enquiryNotes.enquiryId, row.id)).orderBy(desc(enquiryNotes.createdAt)).limit(200);
  return { row, notes };
}

export async function setEnquiryStatus(session: Session, id: string, status: EnquiryStatus) {
  assertTeam(session);
  if (!isStatus(status)) throw new ApiError(400, 'Choose a status');
  const db = await getDb();
  const [row] = await db.update(enquiries).set({ status, updatedAt: new Date() }).where(eq(enquiries.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Enquiry not found');
  await audit(session, 'enquiry.status', { entity: 'enquiry', entityId: row.id, summary: `Enquiry from ${row.name} marked ${STATUS_LABELS[status].toLowerCase()}` });
  return row;
}

export async function addEnquiryNote(session: Session, id: string, note: string) {
  assertTeam(session);
  const body = requiredText('Note', 2000).parse(note);
  const db = await getDb();
  const [row] = await db.select({ id: enquiries.id, name: enquiries.name }).from(enquiries).where(eq(enquiries.id, uuid.parse(id))).limit(1);
  if (!row) throw new ApiError(404, 'Enquiry not found');
  await db.insert(enquiryNotes).values({ enquiryId: row.id, note: body, createdBy: session.uid, createdByName: session.name });
  await db.update(enquiries).set({ updatedAt: new Date() }).where(eq(enquiries.id, row.id));
  await audit(session, 'enquiry.note', { entity: 'enquiry', entityId: row.id, summary: `Added a note to the enquiry from ${row.name}` });
}

/** For spam and test entries only: a real enquiry is closed, not deleted. */
export async function deleteEnquiry(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const [row] = await db.delete(enquiries).where(eq(enquiries.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Enquiry not found');
  await audit(session, 'enquiry.delete', { entity: 'enquiry', entityId: row.id, summary: `Deleted the enquiry from ${row.name}` });
}
