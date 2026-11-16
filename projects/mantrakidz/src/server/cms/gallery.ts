/**
 * The public photo gallery (/gallery) and the public notices and events,
 * as head office manages them.
 */
import { and, asc, desc, eq, inArray, isNull, max, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { announcements, centres, galleryItems, media, type Announcement, type GalleryItem } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day, optionalDay, optionalUuid, uuid } from '@/lib/validators';
import { deleteMediaByUrl } from './media';
import { isSafeImage } from './service';

type Actor = Pick<Session, 'uid' | 'name'>;

/* ───────────── gallery ───────────── */

const album = z
  .string()
  .trim()
  .max(60, 'Keep the album name within 60 characters')
  .transform((value) => value.replace(/\s+/g, ' ') || 'General');
const image = z.string().trim().min(1, 'Add a photo').refine(isSafeImage, 'Choose a photo from the library or upload one');

const addInput = z.object({
  album,
  centreId: optionalUuid,
  photos: z
    .array(z.object({ url: image, width: z.number().int().min(0).default(0), height: z.number().int().min(0).default(0), caption: z.string().trim().max(160).default('') }))
    .min(1, 'Add at least one photo')
    .max(60, 'Add up to 60 photos at a time'),
});

export async function listGallery(): Promise<GalleryItem[]> {
  const db = await getDb();
  return db.select().from(galleryItems).orderBy(asc(galleryItems.album), asc(galleryItems.sort), desc(galleryItems.createdAt));
}

export async function listCentreOptions(): Promise<{ id: string; name: string }[]> {
  const db = await getDb();
  return db.select({ id: centres.id, name: centres.name }).from(centres).where(isNull(centres.deletedAt)).orderBy(asc(centres.name));
}

export async function addGalleryPhotos(actor: Actor, input: unknown, via: 'panel' | 'voice' = 'panel'): Promise<GalleryItem[]> {
  const data = addInput.parse(input);
  const db = await getDb();
  const [last] = await db.select({ sort: max(galleryItems.sort) }).from(galleryItems).where(eq(galleryItems.album, data.album));
  const start = (last?.sort ?? -1) + 1;
  const rows = await db
    .insert(galleryItems)
    .values(data.photos.map((photo, index) => ({ url: photo.url, caption: photo.caption, album: data.album, centreId: data.centreId, width: photo.width, height: photo.height, sort: start + index })))
    .returning();
  await audit(actor, 'gallery.add', { entity: 'gallery', summary: `Added ${rows.length} photo${rows.length === 1 ? '' : 's'} to the album "${data.album}"${via === 'voice' ? ' by voice' : ''}`, meta: { via } });
  return rows;
}

const updateInput = z.object({
  caption: z.string().trim().max(160).optional(),
  album: album.optional(),
  visible: z.boolean().optional(),
  centreId: optionalUuid.optional(),
});

export async function updateGalleryItem(actor: Actor, id: string, input: unknown): Promise<GalleryItem> {
  const data = updateInput.parse(input);
  const db = await getDb();
  const [row] = await db.update(galleryItems).set(data).where(eq(galleryItems.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'That photo was not found');
  if (data.visible !== undefined) await audit(actor, 'gallery.update', { entity: 'gallery', entityId: id, summary: `${data.visible ? 'Showed' : 'Hid'} a gallery photo in "${row.album}"` });
  return row;
}

/** Saves the order the photos of one album were arranged in. */
export async function reorderGallery(actor: Actor, ids: unknown): Promise<void> {
  const list = z.array(uuid).min(1).max(500).parse(ids);
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const [index, id] of list.entries()) await tx.update(galleryItems).set({ sort: index }).where(eq(galleryItems.id, id));
  });
}

export async function deleteGalleryItems(actor: Actor, ids: unknown): Promise<number> {
  const list = z.array(uuid).min(1).max(500).parse(ids);
  const db = await getDb();
  const rows = await db.delete(galleryItems).where(inArray(galleryItems.id, list)).returning();
  // A photo uploaded for the gallery has no other use: remove the file too,
  // unless another gallery row still points at it.
  for (const row of rows) {
    const [uploaded] = await db.select({ folder: media.folder }).from(media).where(eq(media.url, row.url)).limit(1);
    if (uploaded?.folder === 'gallery') await deleteMediaByUrl(actor, row.url).catch(() => undefined);
  }
  if (rows.length) await audit(actor, 'gallery.delete', { entity: 'gallery', summary: `Removed ${rows.length} photo${rows.length === 1 ? '' : 's'} from the gallery` });
  return rows.length;
}

/* ───────────── notices and events ───────────── */

const noticeInput = z
  .object({
    title: z.string().trim().min(1, 'Give the notice a title').max(120, 'Keep the title within 120 characters'),
    body: z.string().trim().max(2000, 'Keep the notice within 2000 characters').default(''),
    image: z.string().trim().refine(isSafeImage, 'Choose a photo from the library or upload one').default(''),
    pinned: z.boolean().default(false),
    eventDate: optionalDay,
    publishOn: z.union([z.literal(''), day, z.undefined()]).transform((value) => value || todayIST()),
    expiresOn: optionalDay,
  })
  .refine((data) => !data.expiresOn || data.expiresOn >= data.publishOn, { path: ['expiresOn'], message: 'This is before the day the notice goes up' });

export type NoticeStatus = 'scheduled' | 'live' | 'expired';

export function noticeStatus(notice: Pick<Announcement, 'publishOn' | 'expiresOn'>, today: string = todayIST()): NoticeStatus {
  if (notice.publishOn > today) return 'scheduled';
  if (notice.expiresOn && notice.expiresOn < today) return 'expired';
  return 'live';
}

const publicNotice = and(eq(announcements.audience, 'public'), isNull(announcements.centreId));

export async function listNotices(): Promise<Announcement[]> {
  const db = await getDb();
  return db.select().from(announcements).where(publicNotice).orderBy(desc(announcements.pinned), desc(announcements.publishOn), desc(announcements.createdAt));
}

export async function createNotice(actor: Actor, input: unknown, via: 'panel' | 'voice' = 'panel'): Promise<Announcement> {
  const data = noticeInput.parse(input);
  const db = await getDb();
  const [row] = await db
    .insert(announcements)
    .values({ ...data, audience: 'public', centreId: null, createdBy: actor.uid })
    .returning();
  await audit(actor, 'notice.create', { entity: 'announcement', entityId: row.id, summary: `Put up the public notice "${row.title}"${via === 'voice' ? ' by voice' : ''}`, meta: { via } });
  return row;
}

export async function updateNotice(actor: Actor, id: string, input: unknown): Promise<Announcement> {
  const data = noticeInput.parse(input);
  const db = await getDb();
  const [row] = await db
    .update(announcements)
    .set(data)
    .where(and(eq(announcements.id, uuid.parse(id)), publicNotice))
    .returning();
  if (!row) throw new ApiError(404, 'That notice was not found');
  await audit(actor, 'notice.update', { entity: 'announcement', entityId: id, summary: `Changed the public notice "${row.title}"` });
  return row;
}

export async function deleteNotice(actor: Actor, id: string): Promise<void> {
  const db = await getDb();
  const [row] = await db
    .delete(announcements)
    .where(and(eq(announcements.id, uuid.parse(id)), publicNotice))
    .returning();
  if (!row) throw new ApiError(404, 'That notice was not found');
  await audit(actor, 'notice.delete', { entity: 'announcement', entityId: id, summary: `Deleted the public notice "${row.title}"` });
}

/** Album names already in use, most used first, for the suggestions list. */
export async function albumNames(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select({ album: galleryItems.album, n: sql<number>`count(*)::int` }).from(galleryItems).groupBy(galleryItems.album).orderBy(desc(sql`count(*)`));
  return rows.map((row) => row.album);
}
