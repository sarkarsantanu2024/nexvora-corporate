/**
 * Loads first-run data into Neon.
 *
 *   npm run db:seed            the admin login, programmes, academic year, head centre
 *   npm run db:seed -- --demo  the same, plus the two sample franchise centres
 *
 * Set ADMIN_PASSWORD first, or the admin password is "mantra123".
 * Safe to run twice: it does nothing once a user exists.
 */
import { count } from 'drizzle-orm';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is not set. The local embedded database seeds itself on first run.');
    return;
  }
  const { getDb } = await import('../src/db');
  const { users } = await import('../src/db/schema');
  const { seedBase, seedDemo } = await import('../src/db/seed');

  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n > 0) {
    console.log('Users already exist: nothing to do.');
    process.exit(0);
  }
  await seedBase(db);
  console.log('Base data loaded. Login: admin');
  if (process.argv.includes('--demo')) {
    await seedDemo(db);
    console.log('Sample centres loaded.');
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
