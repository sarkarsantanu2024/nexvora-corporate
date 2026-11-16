/**
 * Throws away the LOCAL embedded database so the next start rebuilds it with
 * fresh sample data.  npm run db:reset   (stop the dev server first)
 * Never touches Neon.
 */
import fs from 'node:fs';
import path from 'node:path';

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL is set: refusing to reset a real database.');
  process.exit(1);
}
const dir = path.resolve(process.cwd(), process.env.MK_DATA_DIR || '.data/pg');
fs.rmSync(dir, { recursive: true, force: true });
console.log(`Removed ${dir}. Start the app to rebuild it.`);
