/**
 * The school calendar: holidays, exams, events and meetings. The office adds
 * and changes them; teachers read them. Holidays shut the register (see
 * ../attendance/service.ts); entries marked "show on website" are what the
 * public website lists (listPublicEvents).
 */
import { and, asc, desc, eq, gte, isNull, lte, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { CALENDAR_KINDS, calendarEvents, type CalendarEvent, type CalendarKind } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { formatDate, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day, optionalDay, requiredText, text, uuid } from '@/lib/validators';
import { assertOffice, assertSchool } from '../school/access';

export const notTrashed = isNull(calendarEvents.deletedAt);

/** Overlaps the days from…to (both included). */
const overlaps = (from: string, to: string): SQL =>
  and(lte(calendarEvents.startsOn, to), or(gte(calendarEvents.endsOn, from), and(isNull(calendarEvents.endsOn), gte(calendarEvents.startsOn, from)))) as SQL;

const isKind = (value: unknown): value is CalendarKind => (CALENDAR_KINDS as readonly unknown[]).includes(value);

/** Entries that touch these days, in date order. Office and teachers. */
export async function listEvents(session: Session, input: { from: string; to: string; kind?: string }) {
  assertSchool(session);
  const db = await getDb();
  const where = [notTrashed, overlaps(day.parse(input.from), day.parse(input.to))];
  if (isKind(input.kind)) where.push(eq(calendarEvents.kind, input.kind));
  return db
    .select()
    .from(calendarEvents)
    .where(and(...where))
    .orderBy(asc(calendarEvents.startsOn), asc(calendarEvents.title))
    .limit(500);
}

/** The next entries from today on. */
export async function upcomingEvents(session: Session, limit = 8) {
  assertSchool(session);
  const db = await getDb();
  const today = todayIST();
  return db
    .select()
    .from(calendarEvents)
    .where(and(notTrashed, or(gte(calendarEvents.startsOn, today), gte(calendarEvents.endsOn, today))))
    .orderBy(asc(calendarEvents.startsOn))
    .limit(limit);
}

/**
 * For the public website: entries marked "show on website" that end on or
 * after `from`, soonest first. No login needed, so only what the office
 * chose to show comes out.
 */
export async function listPublicEvents(from: string = todayIST(), limit = 12): Promise<CalendarEvent[]> {
  const db = await getDb();
  return db
    .select()
    .from(calendarEvents)
    .where(and(notTrashed, eq(calendarEvents.showOnWebsite, true), or(gte(calendarEvents.startsOn, day.parse(from)), gte(calendarEvents.endsOn, from))))
    .orderBy(asc(calendarEvents.startsOn))
    .limit(Math.max(1, Math.min(100, limit)));
}

/** Past entries for the website's "what happened" list, newest first. */
export async function listPastPublicEvents(before: string = todayIST(), limit = 12): Promise<CalendarEvent[]> {
  const db = await getDb();
  return db
    .select()
    .from(calendarEvents)
    .where(and(notTrashed, eq(calendarEvents.showOnWebsite, true), lte(calendarEvents.startsOn, day.parse(before))))
    .orderBy(desc(calendarEvents.startsOn))
    .limit(Math.max(1, Math.min(100, limit)));
}

const eventInput = z.object({
  title: requiredText('Title', 160),
  kind: z.enum(CALENDAR_KINDS),
  startsOn: day,
  endsOn: optionalDay,
  venue: text(160),
  details: text(4000),
  image: text(500),
  galleryAlbum: text(80),
  showOnWebsite: z.boolean().default(true),
});
export type EventInput = z.input<typeof eventInput>;

function parse(raw: EventInput) {
  const input = eventInput.parse(raw);
  if (input.endsOn && input.endsOn < input.startsOn) throw new ApiError(400, 'The last day cannot be before the first day', { endsOn: 'The last day cannot be before the first day' });
  // A one-day entry keeps endsOn empty, so "same day" is stored one way only.
  return { ...input, endsOn: input.endsOn && input.endsOn !== input.startsOn ? input.endsOn : null };
}

export async function createEvent(session: Session, raw: EventInput) {
  assertOffice(session);
  const values = parse(raw);
  const db = await getDb();
  const [row] = await db.insert(calendarEvents).values({ ...values, createdBy: session.uid }).returning();
  await audit(session, 'event.create', { entity: 'calendar_event', entityId: row.id, summary: `Added ${row.title} (${formatDate(row.startsOn)}) to the calendar` });
  return row;
}

async function existing(id: string) {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ApiError(404, 'Calendar entry not found');
  const db = await getDb();
  const [row] = await db.select().from(calendarEvents).where(and(eq(calendarEvents.id, parsed.data), notTrashed)).limit(1);
  if (!row) throw new ApiError(404, 'Calendar entry not found');
  return row;
}

export async function getEvent(session: Session, id: string) {
  assertSchool(session);
  return existing(id);
}

export async function updateEvent(session: Session, id: string, raw: EventInput) {
  assertOffice(session);
  const before = await existing(id);
  const values = parse(raw);
  const db = await getDb();
  const [row] = await db.update(calendarEvents).set({ ...values, updatedAt: new Date() }).where(eq(calendarEvents.id, before.id)).returning();
  await audit(session, 'event.update', { entity: 'calendar_event', entityId: row.id, summary: `Changed ${row.title} in the calendar` });
  return row;
}

export async function deleteEvent(session: Session, id: string) {
  assertOffice(session);
  const before = await existing(id);
  const db = await getDb();
  await db.update(calendarEvents).set({ deletedAt: new Date() }).where(eq(calendarEvents.id, before.id));
  await audit(session, 'event.delete', { entity: 'calendar_event', entityId: before.id, summary: `Moved ${before.title} to the Trash` });
}
