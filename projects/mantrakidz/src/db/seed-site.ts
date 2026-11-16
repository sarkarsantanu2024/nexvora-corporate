/**
 * Website-side first-run data (gallery photos and the like).
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

// Stock photographs from Pexels (free licence). To be replaced with the
// school's own photos before launch: see docs/CONTENT_TO_CONFIRM.md.
const SAMPLE_PHOTOS: { file: string; caption: string; width: number; height: number }[] = [
  { file: 'sensorial-play', caption: 'Working together on the mat', width: 1600, height: 1067 },
  { file: 'pouring-water', caption: 'Learning to pour', width: 1200, height: 800 },
  { file: 'slide', caption: 'Down the slide', width: 1200, height: 1600 },
  { file: 'pink-tower', caption: 'How tall can it go?', width: 1200, height: 800 },
  { file: 'picture-book', caption: 'Story time', width: 1200, height: 1800 },
  { file: 'circle-time', caption: 'Circle time', width: 1200, height: 675 },
  { file: 'table-activity', caption: 'Busy hands', width: 1200, height: 800 },
  { file: 'peekaboo', caption: 'Peekaboo', width: 1200, height: 1500 },
  { file: 'map-lesson', caption: 'Finding places on the map', width: 1200, height: 800 },
  { file: 'choosing-colours', caption: 'Choosing a colour', width: 1200, height: 1887 },
  { file: 'reading-corner', caption: 'A quiet read', width: 1200, height: 800 },
  { file: 'listening', caption: 'All ears', width: 1200, height: 1800 },
];

export async function seedSite(db: DB) {
  const [done] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, MARKER));
  if (done) return;
  await db.insert(galleryItems).values(
    SAMPLE_PHOTOS.map((photo, index) => ({
      url: `/images/${photo.file}.webp`,
      caption: photo.caption,
      album: SAMPLE_ALBUM,
      width: photo.width,
      height: photo.height,
      sort: index + 1,
    })),
  );
  await db.insert(settings).values({ key: MARKER, value: { addedOn: new Date().toISOString() } }).onConflictDoNothing();
}
