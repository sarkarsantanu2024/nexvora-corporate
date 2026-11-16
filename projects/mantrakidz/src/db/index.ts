/**
 * One database handle for the whole app.
 *
 *  - DATABASE_URL set  → Neon Postgres over its serverless driver (transactions work).
 *  - DATABASE_URL unset → PGlite, a real Postgres compiled to WASM, stored in
 *    .data/. It creates its tables and loads the sample data on first use, so
 *    `npm install && npm run dev` is the entire local setup.
 *
 * Both speak the same SQL and are driven through the same Drizzle query
 * builder, so no code outside this file knows which one is running.
 *
 * Usage:  const db = await getDb();
 */
import path from 'node:path';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from './schema';

export type DB = PgliteDatabase<typeof schema>;
/** The handle inside `db.transaction(async (tx) => …)`. */
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];
/** Accept either, for helpers that may run inside or outside a transaction. */
export type DbOrTx = DB | Tx;

export { schema };

type Holder = { promise?: Promise<DB> };
const holder = ((globalThis as unknown as { __mkDb?: Holder }).__mkDb ??= {});

export const usingNeon = () => Boolean(process.env.DATABASE_URL);

export function getDb(): Promise<DB> {
  holder.promise ??= connect().catch((error) => {
    holder.promise = undefined; // let the next request try again
    throw error;
  });
  return holder.promise;
}

async function connect(): Promise<DB> {
  if (process.env.DATABASE_URL) {
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    if (typeof WebSocket === 'undefined') {
      const ws = (await import('ws')).default;
      neonConfig.webSocketConstructor = ws;
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return drizzle(pool, { schema }) as unknown as DB;
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const fs = await import('node:fs');

  const memory = process.env.MK_DATA_DIR === 'memory';
  const dir = path.resolve(process.cwd(), process.env.MK_DATA_DIR || '.data/pg');
  if (!memory) fs.mkdirSync(dir, { recursive: true });

  const client = memory ? new PGlite() : new PGlite(dir);
  const db = drizzle(client, { schema }) as DB;
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });

  if (process.env.MK_NO_SEED !== '1') {
    const { seedIfEmpty } = await import('./seed');
    await seedIfEmpty(db);
  }
  return db;
}
