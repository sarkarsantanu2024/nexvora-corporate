/**
 * The media library: every photo uploaded through the app.
 * A photo is turned the right way up, shrunk to fit 1920px, saved as WebP and
 * stripped of its camera data (which can include where it was taken) before
 * it is stored.
 */
import { and, count, desc, eq, ilike, lt, or } from 'drizzle-orm';
import sharp from 'sharp';
import { z } from 'zod';
import { getDb } from '@/db';
import { galleryItems, media, type MediaItem } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { putImage, removeImage, safeSegment } from './storage';

type Actor = Pick<Session, 'uid' | 'name'>;

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 1920;

export type StoredImage = { id: string; url: string; width: number; height: number };

export async function storeImage(
  actor: Actor,
  file: { bytes: Buffer; filename: string },
  options: { folder?: string; alt?: string } = {},
): Promise<StoredImage> {
  if (!file.bytes.length) throw new ApiError(400, 'That file is empty. Choose a photo.');
  if (file.bytes.length > MAX_UPLOAD_BYTES) throw new ApiError(413, 'That photo is larger than 12 MB. Choose a smaller one.');

  let output: { data: Buffer; info: sharp.OutputInfo };
  try {
    output = await sharp(file.bytes, { failOn: 'none', limitInputPixels: 80_000_000 })
      .rotate() // turn it the way the phone was held, then forget the camera data
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    // The file type is decided by what sharp can read, not by the name or the
    // type the browser claims. iPhone HEIC photos land here on servers whose
    // image library has no HEIC reader.
    throw new ApiError(415, 'That file could not be read as a photo. Use a JPG, PNG or WebP. On an iPhone, choose "Most compatible" in the camera settings.');
  }

  const folder = safeSegment(options.folder ?? '', 'general');
  const stem = file.filename.replace(/\.[a-z0-9]+$/i, '');
  const url = await putImage(output.data, folder, stem);
  const db = await getDb();
  const [row] = await db
    .insert(media)
    .values({
      url,
      filename: file.filename.slice(0, 200),
      alt: (options.alt ?? '').trim().slice(0, 200),
      width: output.info.width,
      height: output.info.height,
      bytes: output.info.size,
      folder,
      uploadedBy: actor.uid,
    })
    .returning();
  return { id: row.id, url: row.url, width: row.width, height: row.height };
}

export const MEDIA_PAGE = 48;

export async function listMedia(options: { folder?: string; q?: string; before?: string } = {}): Promise<{ items: MediaItem[]; folders: { folder: string; n: number }[]; more: boolean }> {
  const db = await getDb();
  const filters = [
    options.folder ? eq(media.folder, options.folder) : undefined,
    options.q ? or(ilike(media.filename, `%${options.q}%`), ilike(media.alt, `%${options.q}%`)) : undefined,
    options.before && !Number.isNaN(Date.parse(options.before)) ? lt(media.createdAt, new Date(options.before)) : undefined,
  ].filter((part) => part !== undefined);
  const rows = await db
    .select()
    .from(media)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(media.createdAt))
    .limit(MEDIA_PAGE + 1);
  const folders = await db.select({ folder: media.folder, n: count() }).from(media).groupBy(media.folder).orderBy(media.folder);
  return { items: rows.slice(0, MEDIA_PAGE), folders, more: rows.length > MEDIA_PAGE };
}

const altInput = z.object({ alt: z.string().trim().max(200) });

export async function updateMediaAlt(actor: Actor, id: string, input: unknown): Promise<MediaItem> {
  const { alt } = altInput.parse(input);
  const db = await getDb();
  const [row] = await db.update(media).set({ alt }).where(eq(media.id, id)).returning();
  if (!row) throw new ApiError(404, 'That photo was not found');
  return row;
}

/** Removes the row and the stored file. Says so if the gallery still shows it. */
export async function deleteMedia(actor: Actor, id: string): Promise<void> {
  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!row) throw new ApiError(404, 'That photo was not found');
  const [inGallery] = await db.select({ n: count() }).from(galleryItems).where(eq(galleryItems.url, row.url));
  if (inGallery.n > 0) throw new ApiError(409, 'This photo is in the gallery. Remove it from the gallery first.');
  await db.delete(media).where(eq(media.id, id));
  await removeImage(row.url);
  await audit(actor, 'media.delete', { entity: 'media', entityId: id, summary: `Deleted photo ${row.filename || row.url}` });
}

/** Deletes the library entry for a URL, if there is one and nothing else shows it. */
export async function deleteMediaByUrl(actor: Actor, url: string): Promise<void> {
  const db = await getDb();
  const [row] = await db.select({ id: media.id }).from(media).where(eq(media.url, url)).limit(1);
  if (row) await deleteMedia(actor, row.id);
}
