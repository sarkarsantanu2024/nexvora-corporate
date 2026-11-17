/**
 * Loads first-run data into Neon: the admin login and the organisation details.
 *
 *   npm run db:seed
 *
 * Set ADMIN_PASSWORD first, or the admin password is "admin123".
 * Safe to run twice: it adds only what is missing.
 */
import { count } from 'drizzle-orm';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is not set. The local embedded database seeds itself on first run.');
    return;
  }
  const { getDb } = await import('../src/db');
  const { users } = await import('../src/db/schema');
  const { seedBase } = await import('../src/db/seed');

  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n === 0) {
    await seedBase(db);
    console.log('Base data loaded. Login: admin');
  } else {
    console.log('Users already exist: nothing to do.');
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
