/**
 * Website-side first-run data: the school's own photos in the gallery, in
 * albums, with Bengali captions (captions are one language only, and the
 * school's website is Bengali first). Website copy itself needs no seeding:
 * every section falls back to the defaults in src/cms/sections until edited.
 *
 * Safe to call again: a marker row in `settings` records that the photos
 * were added, so they are never added twice and never come back after the
 * school deletes one. A database made by the starter, which still has the
 * starter's grey sample photos, loses those when the school's arrive.
 */
import { and, eq, like } from 'drizzle-orm';
import type { DB } from './index';
import { galleryItems, settings } from './schema';

/** The starter's placeholder album. Kept so the "delete the sample photos" hint keeps working on an old database. */
export const SAMPLE_ALBUM = 'Sample photos';
const MARKER = 'site.schoolPhotos';

/** Album names, in Bengali like the captions: Sports, Celebrations, Activities, Campus. */
export const ALBUMS = { sports: 'খেলাধুলা', celebrations: 'উৎসব ও অনুষ্ঠান', activities: 'নানা কাজ', campus: 'স্কুল' } as const;

const S = '/images/school';

export const SCHOOL_PHOTOS: { url: string; width: number; height: number; album: string; caption: string }[] = [
  { url: `${S}/high-gate.jpg`, width: 1280, height: 808, album: ALBUMS.campus, caption: 'মতিঝিল এভিনিউতে স্কুলের গেটের সাইনবোর্ড' },
  { url: `${S}/high-campus.jpg`, width: 439, height: 323, album: ALBUMS.campus, caption: 'স্কুলের বাড়ি' },
  { url: `${S}/high-sports.jpg`, width: 1600, height: 1066, album: ALBUMS.sports, caption: 'ফুটবল খেলার পরে ছাত্র ও শিক্ষকেরা' },
  { url: `${S}/high-football-2019.jpg`, width: 1600, height: 1066, album: ALBUMS.sports, caption: 'ফুটবল প্রতিযোগিতা' },
  { url: `${S}/high-activity.jpg`, width: 960, height: 540, album: ALBUMS.sports, caption: 'মাঠে ফুটবল ম্যাচ' },
  { url: `${S}/high-annual-sports.jpg`, width: 960, height: 720, album: ALBUMS.sports, caption: 'বার্ষিক ক্রীড়া প্রতিযোগিতা' },
  { url: `${S}/high-netaji-125.jpg`, width: 1280, height: 575, album: ALBUMS.celebrations, caption: 'স্কুলের গেটে নেতাজির 125তম জন্মজয়ন্তী' },
  { url: `${S}/high-netaji-125b.jpg`, width: 1280, height: 435, album: ALBUMS.celebrations, caption: 'নেতাজির 125তম জন্মজয়ন্তী পালন' },
  { url: `${S}/high-independence-day.jpg`, width: 540, height: 960, album: ALBUMS.celebrations, caption: 'স্বাধীনতা দিবসে পতাকা উত্তোলন' },
  { url: `${S}/high-foundation-day.jpg`, width: 194, height: 259, album: ALBUMS.celebrations, caption: 'স্কুলের প্রতিষ্ঠা দিবস' },
  { url: `${S}/high-prize-distribution.jpg`, width: 614, height: 461, album: ALBUMS.celebrations, caption: 'পুরস্কার বিতরণী অনুষ্ঠান' },
  { url: `${S}/high-drama.jpg`, width: 800, height: 531, album: ALBUMS.activities, caption: 'মঞ্চে নাটক' },
  { url: `${S}/high-trekking.jpg`, width: 602, height: 400, album: ALBUMS.activities, caption: 'স্কুলের ব্যানার হাতে হিমালয়ে ট্রেকিং' },
  { url: `${S}/high-seminar.jpg`, width: 960, height: 540, album: ALBUMS.activities, caption: 'স্কুলে সেমিনার' },
  { url: `${S}/high-blood-donation.jpg`, width: 640, height: 480, album: ALBUMS.activities, caption: 'রক্তদান শিবির' },
];

export async function seedSite(db: DB) {
  // Taking the marker first means two calls at the same moment cannot both add the photos.
  const claimed = await db.insert(settings).values({ key: MARKER, value: { addedOn: new Date().toISOString() } }).onConflictDoNothing().returning({ key: settings.key });
  if (!claimed.length) return;
  // The starter's grey placeholders are not the school's: they go when the real photos come.
  await db.delete(galleryItems).where(and(eq(galleryItems.album, SAMPLE_ALBUM), like(galleryItems.url, '/images/sample-%')));
  await db.insert(galleryItems).values(SCHOOL_PHOTOS.map((photo, index) => ({ ...photo, sort: index + 1 })));
}
