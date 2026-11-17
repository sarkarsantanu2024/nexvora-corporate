/**
 * Website-side first-run data: a few sample photos in the gallery, so the
 * gallery page and the home page strip can be seen working.
 * Called once from seedBase. Website copy itself needs no seeding: every
 * section falls back to the defaults in src/cms/sections until it is edited.
 *
 * Safe to call again: a marker row in `settings` records that the sample
 * photos were added, so they are never added twice and never return after an
 * owner deletes them.
 */
import { eq } from 'drizzle-orm';
import type { DB } from './index';
import { galleryItems, settings } from './schema';

/** Shown in the gallery so the client can see at a glance which photos are not theirs. */
export const SAMPLE_ALBUM = 'Sample photos';
const MARKER = 'site.samplePhotos';

// Plain coloured placeholders made by scripts/make-placeholders.mjs.
// Delete them from Gallery in the dashboard once the client's own photos are in.
const SAMPLE_PHOTOS: { file: string; width: number; height: number }[] = [
  { file: 'sample-1', width: 1200, height: 1500 },
  { file: 'sample-2', width: 1200, height: 1200 },
  { file: 'sample-3', width: 1600, height: 1200 },
  { file: 'sample-4', width: 1600, height: 1000 },
  { file: 'sample-5', width: 1200, height: 800 },
  { file: 'sample-6', width: 1200, height: 1600 },
];

export async function seedSite(db: DB) {
  const [done] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, MARKER));
  if (done) return;
  await db.insert(galleryItems).values(
    SAMPLE_PHOTOS.map((photo, index) => ({
      url: `/images/${photo.file}.webp`,
      caption: `Sample photo ${index + 1}`,
      album: SAMPLE_ALBUM,
      width: photo.width,
      height: photo.height,
      sort: index + 1,
    })),
  );
  await db.insert(settings).values({ key: MARKER, value: { addedOn: new Date().toISOString() } }).onConflictDoNothing();
}
