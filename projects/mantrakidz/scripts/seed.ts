/**
 * Loads first-run data into Neon.
 *
 *   npm run db:seed            the admin login, programmes, academic year, head centre
 *   npm run db:seed -- --demo  the same, plus the two sample franchise centres
 *                              (PowerShell: set SEED_DEMO=1 instead of --demo)
 *
 * Set ADMIN_PASSWORD first, or the admin password is "mantra123".
 * Safe to run twice: it adds only what is missing.
 */
import { count, eq } from 'drizzle-orm';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is not set. The local embedded database seeds itself on first run.');
    return;
  }
  const { getDb } = await import('../src/db');
  const { users, centres } = await import('../src/db/schema');
  const { seedBase, seedDemo } = await import('../src/db/seed');

  // PowerShell drops the "--" before npm sees it, so "--demo" never arrives
  // there: SEED_DEMO=1 asks for the same thing on any shell.
  const wantDemo = process.argv.includes('--demo') || process.env.SEED_DEMO === '1';

  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n === 0) {
    await seedBase(db);
    console.log('Base data loaded. Login: admin');
  } else {
    console.log('Users already exist: base data left as it is.');
  }
  if (wantDemo) {
    const [{ demo }] = await db.select({ demo: count() }).from(centres).where(eq(centres.isDemo, true));
    if (demo > 0) {
      console.log('Sample schools are already there: nothing to do.');
    } else {
      await seedDemo(db);
      console.log('Sample schools loaded.');
    }
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
