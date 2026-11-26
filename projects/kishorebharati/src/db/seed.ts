/**
 * First-run data: the admin login and the organisation details.
 *
 * The website needs no seeding: every section falls back to the defaults in
 * src/cms/sections until it is edited. A business module that needs starting
 * rows adds them to seedBase.
 */
import bcrypt from 'bcryptjs';
import { count } from 'drizzle-orm';
import { BRAND } from '@/config/brand';
import type { DB } from './index';
import * as s from './schema';
import { DEFAULT_PASSWORD } from './seed-defaults';
import { seedSchool, seedSchoolSample } from './seed-school';
import { seedSite } from './seed-site';

export async function seedIfEmpty(db: DB) {
  const [{ n }] = await db.select({ n: count() }).from(s.users);
  if (n > 0) return;
  await seedBase(db);
}

export async function seedBase(db: DB) {
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD, 10);

  await db.insert(s.users).values({
    name: 'Admin',
    username: 'admin',
    passwordHash: hash,
    role: 'admin',
    // A real deployment sets ADMIN_PASSWORD and is still asked to change it.
    mustChangePassword: Boolean(process.env.DATABASE_URL),
  });

  await db
    .insert(s.settings)
    .values({ key: 'org', value: { name: BRAND.name, legalName: '', phone: '', email: '', address: '' } })
    .onConflictDoNothing();

  await seedSite(db);
  await seedSchool(db);

  // Sample students and records: on a computer without Neon (not in tests), or when asked for.
  const local = !process.env.DATABASE_URL && !process.env.VITEST;
  if (local || process.env.SEED_DEMO === '1') await seedSchoolSample(db);
}
