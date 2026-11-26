/**
 * Circulars to staff: notices with audience 'staff' in the announcements
 * table. The office posts them; everyone in the dashboard reads them and
 * says "I have read this", which is kept in circular_reads, so the office
 * sees who has not read a circular yet.
 */
import { and, desc, eq, gte, inArray, isNull, lte, notInArray, or } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { announcements, circularReads, users } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day as dayField, optionalDay, requiredText, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, pageOf } from '../admin/shared';
import { assertOffice, assertSchool, isOffice } from '../school/access';

const STAFF = 'staff';
const isCircular = eq(announcements.audience, STAFF);
/** What a teacher sees: up already, and not past its last day. */
const live = (today: string) => and(lte(announcements.publishOn, today), or(isNull(announcements.expiresOn), gte(announcements.expiresOn, today)));

/** Logins that should read staff circulars. */
const READERS = ['admin', 'staff', 'teacher'] as const;

export async function listCirculars(session: Session, filters: { page?: string | number } = {}) {
  assertSchool(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const today = todayIST();
  const where = isOffice(session) ? isCircular : and(isCircular, live(today));
  const [list, [{ n }], [{ readers }]] = await Promise.all([
    db
      .select()
      .from(announcements)
      .where(where)
      .orderBy(desc(announcements.pinned), desc(announcements.publishOn), desc(announcements.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(announcements).where(where),
    db.select({ readers: countInt() }).from(users).where(and(eq(users.active, true), inArray(users.role, [...READERS]))),
  ]);
  const ids = list.map((row) => row.id);
  const [counts, mine] = ids.length
    ? await Promise.all([
        db.select({ id: circularReads.announcementId, n: countInt() }).from(circularReads).where(inArray(circularReads.announcementId, ids)).groupBy(circularReads.announcementId),
        db.select({ id: circularReads.announcementId, readAt: circularReads.readAt }).from(circularReads).where(and(inArray(circularReads.announcementId, ids), eq(circularReads.userId, session.uid))),
      ])
    : [[], []];
  const readsOf = new Map(counts.map((row) => [row.id, row.n]));
  const readAtOf = new Map(mine.map((row) => [row.id, row.readAt]));
  const rows = list.map((circular) => ({ circular, reads: readsOf.get(circular.id) ?? 0, readAt: readAtOf.get(circular.id) ?? null }));
  return { rows, total: n, page, pageSize: PAGE_SIZE, readers };
}

export async function getCircular(session: Session, id: string) {
  assertSchool(session);
  if (!uuid.safeParse(id).success) return null;
  const db = await getDb();
  const today = todayIST();
  const [row] = await db
    .select()
    .from(announcements)
    .where(and(eq(announcements.id, id), isOffice(session) ? isCircular : and(isCircular, live(today))))
    .limit(1);
  if (!row) return null;
  const [mine] = await db.select({ readAt: circularReads.readAt }).from(circularReads).where(and(eq(circularReads.announcementId, row.id), eq(circularReads.userId, session.uid))).limit(1);
  return { row, readAt: mine?.readAt ?? null };
}

/** Who has read a circular and who has not yet. Office only. */
export async function circularReaders(session: Session, id: string) {
  assertOffice(session);
  const db = await getDb();
  const people = await db
    .select({ id: users.id, name: users.name, role: users.role, readAt: circularReads.readAt })
    .from(users)
    .leftJoin(circularReads, and(eq(circularReads.userId, users.id), eq(circularReads.announcementId, uuid.parse(id))))
    .where(and(eq(users.active, true), inArray(users.role, [...READERS])));
  return people.sort((a, b) => Number(Boolean(a.readAt)) - Number(Boolean(b.readAt)) || a.name.localeCompare(b.name));
}

export const circularInput = z
  .object({
    title: requiredText('Title', 160),
    body: text(5000),
    attachment: text(500),
    pinned: z.coerce.boolean().default(false),
    publishOn: dayField,
    expiresOn: optionalDay,
  })
  .superRefine((value, ctx) => {
    if (value.expiresOn && value.expiresOn < value.publishOn) ctx.addIssue({ code: 'custom', path: ['expiresOn'], message: 'The last day cannot be before the first day' });
  });
export type CircularInput = z.input<typeof circularInput>;

export async function saveCircular(session: Session, id: string | null, raw: CircularInput) {
  assertOffice(session);
  const input = circularInput.parse(raw);
  const db = await getDb();
  if (id) {
    const [row] = await db.update(announcements).set(input).where(and(eq(announcements.id, uuid.parse(id)), isCircular)).returning();
    if (!row) throw new ApiError(404, 'Circular not found');
    await audit(session, 'circular.update', { entity: 'announcement', entityId: row.id, summary: `Circular "${row.title}" changed` });
    return row;
  }
  const [row] = await db.insert(announcements).values({ ...input, audience: STAFF, createdBy: session.uid }).returning();
  // The person who posts it has read it.
  await db.insert(circularReads).values({ announcementId: row.id, userId: session.uid }).onConflictDoNothing();
  await audit(session, 'circular.create', { entity: 'announcement', entityId: row.id, summary: `Circular to staff: ${row.title}` });
  return row;
}

export async function deleteCircular(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const [row] = await db.delete(announcements).where(and(eq(announcements.id, uuid.parse(id)), isCircular)).returning();
  if (!row) throw new ApiError(404, 'Circular not found');
  await audit(session, 'circular.delete', { entity: 'announcement', entityId: row.id, summary: `Removed the circular "${row.title}"` });
}

/** "I have read this." Saying it twice keeps the first time. */
export async function markCircularRead(session: Session, id: string) {
  assertSchool(session);
  const found = await getCircular(session, id);
  if (!found) throw new ApiError(404, 'Circular not found');
  const db = await getDb();
  await db.insert(circularReads).values({ announcementId: found.row.id, userId: session.uid }).onConflictDoNothing();
}

/** Circulars up now that this login has not read (for the bell). */
export async function unreadCirculars(session: Session) {
  const db = await getDb();
  const today = todayIST();
  const read = db.select({ id: circularReads.announcementId }).from(circularReads).where(eq(circularReads.userId, session.uid));
  return db
    .select({ id: announcements.id, title: announcements.title })
    .from(announcements)
    .where(and(isCircular, live(today), notInArray(announcements.id, read)))
    .orderBy(desc(announcements.publishOn))
    .limit(10);
}
