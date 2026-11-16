/**
 * Cuts the brand files out of the client's original logo JPEG:
 *   public/brand/logo.png  full logo, background removed
 *   public/brand/mark.png  the crest alone (shield and laurel), square
 *   public/brand/icon.png  the crest on white, for the browser tab
 * Run again whenever the client sends a better logo:  node scripts/make-brand.mjs
 */
import sharp from 'sharp';

const SRC = 'public/brand/logo-original.jpg';

/** Turns the near-white paper of the JPEG transparent, with a soft edge. */
async function cutout(input) {
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    // 235 and brighter is paper; 205 to 235 fades out so edges stay smooth.
    if (min >= 235) data[i + 3] = 0;
    else if (min > 205) data[i + 3] = Math.round(((235 - min) / 30) * 255);
  }
  return sharp(data, { raw: info });
}

const meta = await sharp(SRC).metadata();
const W = meta.width;
const H = meta.height;

// Full logo
await (await cutout(sharp(SRC))).trim().resize({ width: 900 }).png({ compressionLevel: 9 }).toFile('public/brand/logo.png');

// Crest: the top 64% of the artwork holds the laurel and shield.
const crest = sharp(SRC).extract({ left: Math.round(W * 0.15), top: 0, width: Math.round(W * 0.68), height: Math.round(H * 0.64) });
const mark = await (await cutout(crest)).trim().png().toBuffer();
await sharp(mark)
  .resize({ width: 512, height: 512, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile('public/brand/mark.png');

await sharp({ create: { width: 256, height: 256, channels: 4, background: '#ffffff' } })
  .composite([{ input: await sharp(mark).resize({ width: 216, height: 216, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer() }])
  .png()
  .toFile('public/brand/icon.png');

console.log('Brand files written to public/brand');
