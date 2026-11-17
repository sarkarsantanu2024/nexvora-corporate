/**
 * Builds a fresh in-memory database, runs the migration and the seed, then
 * checks what a new project starts with. If this passes, a new machine can
 * run the app with nothing but `npm install && npm run dev`.
 */
import bcrypt from 'bcryptjs';
import { count } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;
delete process.env.ADMIN_PASSWORD;

import { BRAND } from '@/config/brand';
import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { seedIfEmpty } from '@/db/seed';
import { DEFAULT_PASSWORD } from '@/db/seed-defaults';
import { SAMPLE_ALBUM, seedSite } from '@/db/seed-site';

let db: DB;
beforeAll(async () => {
  db = await getDb();
}, 120_000);

describe('seed', () => {
  it('creates one admin login with the default password', async () => {
    const rows = await db.select().from(s.users);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ username: 'admin', role: 'admin', active: true });
    expect(await bcrypt.compare(DEFAULT_PASSWORD, rows[0].passwordHash)).toBe(true);
    // Only a real database (Neon) forces the first password change.
    expect(rows[0].mustChangePassword).toBe(false);
  });

  it('stores the business name from the brand file', async () => {
    const rows = await db.select().from(s.settings);
    const org = rows.find((row) => row.key === 'org');
    expect(org?.value).toMatchObject({ name: BRAND.name });
  });

  it('adds the sample photos once and starts with nothing else', async () => {
    const photos = await db.select().from(s.galleryItems);
    expect(photos).toHaveLength(6);
    expect(photos.every((photo) => photo.album === SAMPLE_ALBUM)).toBe(true);
    for (const table of [s.enquiries, s.enquiryNotes, s.announcements, s.media, s.siteContent]) {
      const [{ n }] = await db.select({ n: count() }).from(table);
      expect(n).toBe(0);
    }
  });

  it('is safe to run again', async () => {
    await seedIfEmpty(db);
    await seedSite(db);
    const [{ n: users }] = await db.select({ n: count() }).from(s.users);
    const [{ n: photos }] = await db.select({ n: count() }).from(s.galleryItems);
    expect(users).toBe(1);
    expect(photos).toBe(6);
  });
});
