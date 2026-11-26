/** Meetings of the managing committee, the staff and parents and teachers, with their minutes. Office only. */
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { SCHOOL } from '@/config/school';
import { getDb } from '@/db';
import { MEETING_KINDS, meetings, type MeetingKind } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { day as dayField, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, assertAdmin, countInt, pageOf } from '../admin/shared';
import { assertOffice } from '../school/access';
import { MEETING_KIND_LABELS } from './labels';
import { optionalClock } from './shared';

export type MeetingFilters = { kind?: string; q?: string; page?: string | number };
const isKind = (value: unknown): value is MeetingKind => (MEETING_KINDS as readonly string[]).includes(value as string);

export async function listMeetings(session: Session, filters: MeetingFilters = {}) {
  assertOffice(session);
  const db = await getDb();
  const page = pageOf(filters.page);
  const parts: (SQL | undefined)[] = [];
  if (isKind(filters.kind)) parts.push(eq(meetings.kind, filters.kind));
  const term = filters.q?.trim();
  if (term) parts.push(or(ilike(meetings.title, `%${term}%`), ilike(meetings.agenda, `%${term}%`), ilike(meetings.minutes, `%${term}%`)));
  const where = and(...parts);
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(meetings).where(where).orderBy(desc(meetings.day), desc(meetings.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(meetings).where(where),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE };
}

export async function getMeeting(session: Session, id: string) {
  assertOffice(session);
  if (!uuid.safeParse(id).success) return null;
  const db = await getDb();
  const [row] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  return row ?? null;
}

export const meetingInput = z.object({
  kind: z.enum(MEETING_KINDS),
  day: dayField,
  time: optionalClock,
  title: text(160),
  grade: z
    .union([z.literal(''), z.null(), z.coerce.number().int()])
    .transform((v) => (v === '' || v === null ? null : v))
    .refine((v) => v === null || SCHOOL.grades.includes(v), 'Choose a class'),
  venue: text(120),
  attendees: text(3000),
  agenda: text(3000),
  minutes: text(10000),
  attachment: text(500),
});
export type MeetingInput = z.input<typeof meetingInput>;

const clean = (input: z.output<typeof meetingInput>) => ({ ...input, grade: input.kind === 'ptm' ? input.grade : null });

export async function saveMeeting(session: Session, id: string | null, raw: MeetingInput) {
  assertOffice(session);
  const input = clean(meetingInput.parse(raw));
  const db = await getDb();
  if (id) {
    const [row] = await db.update(meetings).set({ ...input, updatedAt: new Date() }).where(eq(meetings.id, uuid.parse(id))).returning();
    if (!row) throw new ApiError(404, 'Meeting not found');
    await audit(session, 'meeting.update', { entity: 'meeting', entityId: row.id, summary: `${MEETING_KIND_LABELS[row.kind]} of ${row.day} changed` });
    return row;
  }
  const [row] = await db.insert(meetings).values({ ...input, createdBy: session.uid }).returning();
  await audit(session, 'meeting.create', { entity: 'meeting', entityId: row.id, summary: `${MEETING_KIND_LABELS[row.kind]} on ${row.day}` });
  return row;
}

export async function deleteMeeting(session: Session, id: string) {
  assertAdmin(session);
  const db = await getDb();
  const [row] = await db.delete(meetings).where(eq(meetings.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Meeting not found');
  await audit(session, 'meeting.delete', { entity: 'meeting', entityId: row.id, summary: `Removed the ${MEETING_KIND_LABELS[row.kind].toLowerCase()} of ${row.day}` });
}
