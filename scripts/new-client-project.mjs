/**
 * Starts a new client project from the starter kit.
 *
 *   node scripts/new-client-project.mjs <slug> "<Business Name>"
 *   node scripts/new-client-project.mjs sunrise-stores "Sunrise Stores"
 *
 * Copies projects/_starter to projects/<slug> (without node_modules, build
 * folders, the local database and uploaded files), then writes the business
 * name into the brand file, package.json, the README and the offline page.
 * It never touches an existing project: if projects/<slug> is there, it stops.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const starter = path.join(repo, 'projects', '_starter');
const PLACEHOLDER_NAME = 'Client Name';
const PLACEHOLDER_SHORT = 'Client';
const PLACEHOLDER_PACKAGE = 'client-starter';

function stop(message) {
  console.error(`\nStopped: ${message}\n`);
  console.error('Use it like this:');
  console.error('  node scripts/new-client-project.mjs <slug> "<Business Name>"');
  console.error('  node scripts/new-client-project.mjs sunrise-stores "Sunrise Stores"\n');
  process.exit(1);
}

const [slug, ...rest] = process.argv.slice(2);
const name = rest.join(' ').replace(/\s+/g, ' ').trim();

if (!slug) stop('give the folder name (slug) and the business name.');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) stop(`"${slug}" is not a valid slug. Use small letters, digits and hyphens only, for example sunrise-stores.`);
if (slug.length > 50) stop('the slug is too long. Keep it within 50 letters.');
if (!name) stop('give the business name in quotes after the slug.');
if (name.length > 60) stop('the business name is too long. Keep it within 60 letters.');
if (/[<>`\\\r\n]/.test(name)) stop('the business name has a character that cannot be used ( < > ` \\ ).');
if (!fs.existsSync(starter)) stop('projects/_starter was not found. Run this from the nexvora-corporate repository.');

const target = path.join(repo, 'projects', slug);
if (fs.existsSync(target)) stop(`projects/${slug} already exists. Choose another slug, or delete that folder first if it was a mistake.`);

/* ───────────── copy ───────────── */

/** Folders and files that belong to one machine or one build, never to a new project. */
const SKIP_NAMES = new Set(['node_modules', '.data', '.env', '.env.local', 'next-env.d.ts', 'test-results', '.vercel']);
const skip = (source) => {
  const relative = path.relative(starter, source).split(path.sep).join('/');
  const base = path.basename(source);
  if (SKIP_NAMES.has(base)) return true;
  if (base === '.next' || base.startsWith('.next-')) return true;
  if (base.endsWith('.tsbuildinfo')) return true;
  // Uploaded files stay behind; the empty folder and its .gitkeep come along.
  if (relative.startsWith('public/uploads/') && base !== '.gitkeep') return true;
  return false;
};

fs.cpSync(starter, target, { recursive: true, filter: (source) => !skip(source) });

/* ───────────── put the name in ───────────── */

/** Under the app icon on a phone there is room for about 12 letters. */
function shortNameOf(full) {
  if (full.length <= 12) return full;
  let short = '';
  for (const word of full.split(' ')) {
    const next = short ? `${short} ${word}` : word;
    if (next.length > 12) break;
    short = next;
  }
  return short || full.slice(0, 12).trim();
}

const tsString = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const htmlText = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Replaces text in one file of the new project and stops loudly if the text was not there. */
function rewrite(file, changes) {
  const full = path.join(target, file);
  let text = fs.readFileSync(full, 'utf8');
  for (const [from, to] of changes) {
    if (!text.includes(from)) {
      fs.rmSync(target, { recursive: true, force: true });
      stop(`could not find "${from}" in ${file} of the starter. The starter has changed; update scripts/new-client-project.mjs to match. Nothing was created.`);
    }
    text = text.split(from).join(to);
  }
  fs.writeFileSync(full, text);
}

const shortName = shortNameOf(name);

rewrite('src/config/brand.ts', [
  [`name: '${PLACEHOLDER_NAME}'`, `name: '${tsString(name)}'`],
  [`shortName: '${PLACEHOLDER_SHORT}'`, `shortName: '${tsString(shortName)}'`],
]);
rewrite('package.json', [[`"name": "${PLACEHOLDER_PACKAGE}"`, `"name": "${slug}"`]]);
// The lock file names the package twice; keeping it in step avoids a needless change on the first install.
rewrite('package-lock.json', [[`"name": "${PLACEHOLDER_PACKAGE}"`, `"name": "${slug}"`]]);
rewrite('README.md', [
  [PLACEHOLDER_NAME, name],
  ['projects/<slug>', `projects/${slug}`],
]);
rewrite('public/offline.html', [[PLACEHOLDER_NAME, htmlText(name)]]);

/* ───────────── what to do next ───────────── */

console.log(`
Created projects/${slug} for "${name}".

Next steps:

 1. Install and run it
      cd projects/${slug}
      npm install
      npm run dev
    Open http://localhost:3400 and log in at /login with  admin / admin123

 2. Check the name and tagline
      src/config/brand.ts      (short name is "${shortName}": 12 letters or fewer)

 3. Change the two colour scales to the client's colours
      tailwind.config.ts       ("brand" and "accent"; the note at the top explains)
    then copy the new brand 700 colour into themeColor in src/config/brand.ts
    and into public/offline.html

 4. Put in the logo
      replace public/brand/mark.png   (square PNG, 512 x 512 or larger)
      replace public/brand/icon.png   (64 x 64, for the browser tab)
      npm run icons
    No logo yet? This makes a plain one with the first letter:
      node scripts/make-placeholders.mjs "${name}"
      npm run icons

 5. Go live: create the Neon and Vercel projects, set the environment
    variables and seed the admin login. The steps are in README.md.
    On Vercel the Root Directory is  projects/${slug}

The full checklist is in projects/${slug}/docs/NEW_PROJECT.md
`);
