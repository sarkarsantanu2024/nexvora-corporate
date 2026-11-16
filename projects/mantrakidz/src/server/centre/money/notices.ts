/**
 * Notices a centre sends to its parents, and the head office circulars it
 * receives. Kept beside the money services because the same builder owns the
 * notices screen; nothing here touches money.
 */
import { and, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { announcements } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import { day, optionalDay, optionalUuid, requiredText, text, uuid } from '@/lib/validators';
import { notFound, type Ctx } from './shared';

const ownNotice = (ctx: Ctx) => and(eq(announcements.audience, 'parents'), eq(announcements.centreId, ctx.centre.id));
const newestFirst = [desc(announcements.pinned), desc(announcements.publishOn), desc(announcements.createdAt)] as const;

/** This centre's notices to parents, including ones that have expired or are still to come. */
export async function listNotices(ctx: Ctx) {
  const db = await getDb();
  return db.select().from(announcements).where(ownNotice(ctx)).orderBy(...newestFirst).limit(200);
}

/** Head office circulars to this centre (or to all centres) that are out and not expired. */
export async function listCirculars(ctx: Ctx) {
  const db = await getDb();
  const today = todayIST();
  return db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.audience, 'centres'),
        or(isNull(announcements.centreId), eq(announcements.centreId, ctx.centre.id)),
        lte(announcements.publishOn, today),
        or(isNull(announcements.expiresOn), gte(announcements.expiresOn, today)),
      ),
    )
    .orderBy(...newestFirst)
    .limit(50);
}

const noticeInput = z.object({
  id: optionalUuid,
  title: requiredText('Title', 140),
  body: text(3000),
  pinned: z.boolean().default(false),
  eventDate: optionalDay,
  publishOn: day,
  expiresOn: optionalDay,
});
export type NoticeInput = z.input<typeof noticeInput>;

export async function saveNotice(ctx: Ctx, input: NoticeInput) {
  const data = noticeInput.parse(input);
  if (data.expiresOn && data.expiresOn < data.publishOn) {
    throw new ApiError(400, 'The last day to show the notice cannot be before the day it goes out', { expiresOn: 'Before the publish date' });
  }
  const db = await getDb();
  const values = { title: data.title, body: data.body, pinned: data.pinned, eventDate: data.eventDate, publishOn: data.publishOn, expiresOn: data.expiresOn };
  let row;
  if (data.id) {
    [row] = await db
      .update(announcements)
      .set(values)
      .where(and(eq(announcements.id, data.id), ownNotice(ctx)))
      .returning();
    if (!row) return notFound('Notice');
  } else {
    [row] = await db
      .insert(announcements)
      .values({ ...values, audience: 'parents', centreId: ctx.centre.id, createdBy: ctx.session.uid })
      .returning();
  }
  await audit(ctx.session, data.id ? 'notice.update' : 'notice.create', { entity: 'announcement', entityId: row.id, centreId: ctx.centre.id, summary: row.title });
  return row;
}

export async function setNoticePinned(ctx: Ctx, id: string, pinned: boolean) {
  const db = await getDb();
  const [row] = await db
    .update(announcements)
    .set({ pinned })
    .where(and(eq(announcements.id, uuid.parse(id)), ownNotice(ctx)))
    .returning();
  if (!row) return notFound('Notice');
  return row;
}

/** Notices are not money, so a deleted notice is really removed. */
export async function deleteNotice(ctx: Ctx, id: string) {
  const db = await getDb();
  const [row] = await db
    .delete(announcements)
    .where(and(eq(announcements.id, uuid.parse(id)), ownNotice(ctx)))
    .returning();
  if (!row) return notFound('Notice');
  await audit(ctx.session, 'notice.delete', { entity: 'announcement', entityId: row.id, centreId: ctx.centre.id, summary: row.title });
  return { id: row.id };
}
