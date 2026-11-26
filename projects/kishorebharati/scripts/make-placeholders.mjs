/**
 * Makes the stand-in pictures a new project starts with, so no client ever
 * ships with another client's logo or photos:
 *
 *   public/brand/mark.png, icon.png      a plain square logo with the first letter of the name
 *   public/images/hero.jpg               the banner photo
 *   public/images/sample-1..6.webp       photos for the welcome block, the About page and the gallery
 *
 *   node scripts/make-placeholders.mjs "Client Name"
 *
 * Replace them with the client's real logo and photos, then run `npm run icons`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const letter = (process.argv[2] || 'Client Name').trim().charAt(0).toUpperCase() || 'C';

/** brand-700 and brand-500 from tailwind.config.ts. */
const logo = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a5cc6"/><stop offset="1" stop-color="#3f348f"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <text x="256" y="350" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="300" font-weight="700" fill="#ffffff">${letter}</text>
</svg>`;

/** A soft two-colour picture with a few round shapes and the words "Sample photo". */
const photo = (width, height, from, to, label) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <circle cx="${width * 0.82}" cy="${height * 0.2}" r="${Math.min(width, height) * 0.26}" fill="#ffffff" opacity="0.18"/>
  <circle cx="${width * 0.16}" cy="${height * 0.86}" r="${Math.min(width, height) * 0.34}" fill="#ffffff" opacity="0.12"/>
  <circle cx="${width * 0.62}" cy="${height * 0.74}" r="${Math.min(width, height) * 0.12}" fill="#ffffff" opacity="0.16"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(Math.min(width, height) * 0.07)}" font-weight="700" fill="#ffffff" opacity="0.92">${label}</text>
</svg>`;

fs.mkdirSync(path.join(root, 'brand'), { recursive: true });
fs.mkdirSync(path.join(root, 'images'), { recursive: true });

await sharp(Buffer.from(logo(512))).png().toFile(path.join(root, 'brand', 'mark.png'));
await sharp(Buffer.from(logo(512))).resize(64, 64).png().toFile(path.join(root, 'brand', 'icon.png'));
console.log('made brand/mark.png and brand/icon.png');

await sharp(Buffer.from(photo(1600, 1000, '#6a5cc6', '#38b6ff', 'Sample banner photo'))).jpeg({ quality: 82 }).toFile(path.join(root, 'images', 'hero.jpg'));
console.log('made images/hero.jpg');

// Sizes match src/db/seed-site.ts, which lists these in the gallery.
const SAMPLES = [
  [1200, 1500, '#2ec4a0', '#1296e6'],
  [1200, 1200, '#ffc83d', '#ff7a59'],
  [1600, 1200, '#ff7a59', '#897ed6'],
  [1600, 1000, '#38b6ff', '#5445ae'],
  [1200, 800, '#17a685', '#ffc83d'],
  [1200, 1600, '#897ed6', '#f0562f'],
];
for (const [index, [width, height, from, to]] of SAMPLES.entries()) {
  const file = `sample-${index + 1}.webp`;
  await sharp(Buffer.from(photo(width, height, from, to, `Sample photo ${index + 1}`))).webp({ quality: 80 }).toFile(path.join(root, 'images', file));
  console.log('made images/' + file);
}
