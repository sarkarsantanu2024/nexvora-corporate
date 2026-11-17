/**
 * Makes the app icons a phone needs from the one square logo.
 *
 *   npm run icons
 *
 * Reads public/brand/mark.png and writes into public/brand:
 *   app-192.png, app-512.png     the icon on the home screen
 *   app-maskable-512.png         the same with room around it (Android cuts it to a circle)
 *   apple-touch-icon.png         iPhone and iPad
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const brand = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'brand');
const source = path.join(brand, 'mark.png');
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/** The logo on a white square, filling `fill` of the side. */
async function icon(file, size, fill) {
  const inner = Math.round(size * fill);
  const logo = await sharp(source).resize(inner, inner, { fit: 'contain', background: { ...WHITE, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: WHITE } })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(path.join(brand, file));
  console.log('made', file);
}

await icon('app-192.png', 192, 0.86);
await icon('app-512.png', 512, 0.86);
await icon('app-maskable-512.png', 512, 0.62);
await icon('apple-touch-icon.png', 180, 0.8);
