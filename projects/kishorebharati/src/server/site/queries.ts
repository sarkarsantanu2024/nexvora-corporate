/**
 * Everything the public website reads from the database.
 *
 * Each read is cached for a minute and tagged SITE_TAG, so a busy page does
 * not query the database on every visit, and a change made in the dashboard
 * shows within a minute (or at once, if the dashboard calls
 * revalidateTag('site-data') after saving).
 *
 * Only the columns the website shows are selected, so nothing private
 * leaves the server through these functions. The reads themselves live in
 * ./school.ts, where the tests can reach them without the cache.
 */
import { asc, desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/db';
import { galleryItems } from '@/db/schema';
import { seedSite } from '@/db/seed-site';
import { addDays, todayIST } from '@/lib/date';
import { loadPublicEvents, loadPublicNotices, loadWebsiteStaff, splitEvents } from './school';

export type { SiteEvent, SiteNotice, SiteStaff } from './school';

export const SITE_TAG = 'site-data';
const cached = <A extends unknown[], T>(fn: (...args: A) => Promise<T>, key: string) =>
  unstable_cache(fn, ['site', key], { tags: [SITE_TAG], revalidate: 60 });

/* ───────────── gallery ───────────── */

export type SitePhoto = { id: string; url: string; caption: string; album: string; width: number; height: number };

let photoCheck: Promise<void> | null = null;
/**
 * The school's photos are added by seedSite on a brand-new database. A
 * database made before they were part of the site missed that step, so the
 * first gallery read of each server start gives seedSite one more chance. It
 * keeps a marker in `settings` and does nothing the second time, so photos
 * the school deletes never come back.
 */
function ensureSchoolPhotos(): Promise<void> {
  photoCheck ??= getDb()
    .then((db) => seedSite(db))
    .catch((error) => {
      photoCheck = null;
      console.error('[site] could not add the school photos', error);
    });
  return photoCheck;
}

export const getGallery = cached(async (): Promise<SitePhoto[]> => {
  await ensureSchoolPhotos();
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

// The day is part of the cache key, so a notice dated tomorrow appears tomorrow.
const noticesOn = cached(async (today: string) => loadPublicNotices(await getDb(), today), 'notices');

/** Public notices that are published and have not expired. */
export const getNotices = () => noticesOn(todayIST());

/* ───────────── calendar ───────────── */

const eventsOn = cached(async (today: string) => {
  // From 1 January: the Events page shows what already happened this year as well.
  const events = await loadPublicEvents(await getDb(), `${today.slice(0, 4)}-01-01`);
  return splitEvents(events, today);
}, 'events');

/** The calendar for the Events page, split into coming events, this year's holidays and past events. */
export const getCalendar = () => eventsOn(todayIST());

/** The next few events and holidays from today, for the home page. */
export async function getUpcoming(limit = 4) {
  const today = todayIST();
  const { upcoming, holidays } = await getCalendar();
  const soon = addDays(today, 120);
  return [...upcoming, ...holidays.filter((h) => (h.endsOn ?? h.startsOn) >= today && h.startsOn <= soon)]
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
    .slice(0, limit);
}

/* ───────────── teachers ───────────── */

export const getStaff = cached(async () => loadWebsiteStaff(await getDb()), 'staff');
