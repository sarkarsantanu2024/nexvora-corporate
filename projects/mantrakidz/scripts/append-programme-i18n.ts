/**
 * One-off helper used when the `i18n` column was added: appends statements to
 * the newest migration that fill in Bengali and Hindi wording for the four
 * starting programmes on databases that already exist.
 *   npx tsx scripts/append-programme-i18n.ts drizzle/<file>.sql
 */
import fs from 'node:fs';
import { PROGRAMME_I18N } from '../src/db/programme-i18n';

const file = process.argv[2];
if (!file) throw new Error('Pass the migration file');
let sql = fs.readFileSync(file, 'utf8');
if (sql.includes('-- programme translations')) {
  console.log('Already appended.');
  process.exit(0);
}
sql += '\n--> statement-breakpoint\n-- programme translations\n';
const statements = Object.entries(PROGRAMME_I18N).map(([slug, words]) => {
  const json = JSON.stringify(words).replace(/'/g, "''");
  return `UPDATE "programmes" SET "i18n" = '${json}'::jsonb WHERE "slug" = '${slug}' AND "i18n" = '{}'::jsonb;`;
});
sql += statements.join('\n--> statement-breakpoint\n') + '\n';
fs.writeFileSync(file, sql);
console.log(`Appended ${statements.length} statements to ${file}`);
