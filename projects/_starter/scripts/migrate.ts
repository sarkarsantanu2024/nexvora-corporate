/**
 * Creates or updates the tables on Neon.  npm run db:migrate
 * (Locally there is nothing to run: the embedded database migrates itself.)
 * On Vercel this runs before every build via the "vercel-build" script.
 */
import path from 'node:path';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('DATABASE_URL is not set: skipping (the local embedded database migrates itself).');
    return;
  }
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-serverless');
  const { migrate } = await import('drizzle-orm/neon-serverless/migrator');
  if (typeof WebSocket === 'undefined') neonConfig.webSocketConstructor = (await import('ws')).default;

  const pool = new Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
  await pool.end();
  console.log('Database is up to date.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
