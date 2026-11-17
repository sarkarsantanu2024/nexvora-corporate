/**
 * Everything the public website reads from the database.
 *
 * Each read is cached for a minute and tagged SITE_TAG, so a busy page does
 * not query the database on every visit, and a change made in the dashboard
 * shows within a minute (or at once, if the dashboard calls
 * revalidateTag('site-data') after saving).
 *
 * Only the columns the website shows are selected, so nothing private
 * leaves the server through these functions.
 */
import { and, asc, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/db';
import { announcements, galleryItems } from '@/db/schema';
import { seedSite } from '@/db/seed-site';
import { todayIST } from '@/lib/date';

export const SITE_TAG = 'site-data';
const cached = <A extends unknown[], T>(fn: (...args: A) => Promise<T>, key: string) =>
  unstable_cache(fn, ['site', key], { tags: [SITE_TAG], revalidate: 60 });

/* ───────────── gallery ───────────── */

export type SitePhoto = { id: string; url: string; caption: string; album: string; width: number; height: number };

let sampleCheck: Promise<void> | null = null;
/**
 * The sample photos are added by seedSite on a brand-new database. A database
 * that was created before the website existed missed that step, so the first
 * gallery read of each server start gives seedSite one more chance. It keeps
 * a marker in `settings` and does nothing the second time, which also means
 * photos an owner deletes never come back.
 */
function ensureSamplePhotos(): Promise<void> {
  sampleCheck ??= getDb()
    .then((db) => seedSite(db))
    .catch((error) => {
      sampleCheck = null;
      console.error('[site] could not add the sample photos', error);
    });
  return sampleCheck;
}

export const getGallery = cached(async (): Promise<SitePhoto[]> => {
  await ensureSamplePhotos();
  const db = await getDb();
  return db
    .select({
      id: galleryItems.id,
      url: galleryItems.url,
      caption: galleryItems.caption,
      album: galleryItems.album,
      width: galleryItems.width,
      height: galleryItems.height,
    })
    .from(galleryItems)
    .where(eq(galleryItems.visible, true))
    .orderBy(asc(galleryItems.sort), desc(galleryItems.createdAt));
}, 'gallery');

/* ───────────── notices ───────────── */

export type SiteNotice = {
  id: string;
  title: string;
  body: string;
  image: string;
  pinned: boolean;
  eventDate: string | null;
  publishOn: string;
};

// The day is part of the cache key, so a notice dated tomorrow appears tomorrow.
const noticesOn = cached(async (today: string): Promise<SiteNotice[]> => {
  const db = await getDb();
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      image: announcements.image,
      pinned: announcements.pinned,
      eventDate: announcements.eventDate,
      publishOn: announcements.publishOn,
    })
    .from(announcements)
    .where(
      and(
        lte(announcements.publishOn, today),
        or(isNull(announcements.expiresOn), gte(announcements.expiresOn, today)),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.publishOn), desc(announcements.createdAt));
}, 'notices');

/** Public notices that are published and have not expired. */
export const getNotices = () => noticesOn(todayIST());
