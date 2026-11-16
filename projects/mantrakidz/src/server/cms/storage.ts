/**
 * Where uploaded photos live.
 *
 *  - BLOB_READ_WRITE_TOKEN set (Vercel): Vercel Blob, public, random suffix.
 *  - otherwise: a folder on this machine (.data/uploads, or MK_UPLOAD_DIR),
 *    served by the route at /media/[...path]. Never public/, which is part of
 *    the build and read-only on a server.
 */
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const LOCAL_PREFIX = '/media/';

export const usingBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export const uploadDir = () => path.resolve(process.cwd(), process.env.MK_UPLOAD_DIR || '.data/uploads');

/** Lower-case letters, digits and dashes only: safe as a folder and in a URL. */
export function safeSegment(value: string, fallback: string): string {
  const cleaned = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return cleaned || fallback;
}

/**
 * Turns the path part of a /media/ URL into a file inside the upload folder,
 * or null if it would land anywhere else ("..", absolute paths, odd characters).
 */
export function resolveLocal(segments: string[]): string | null {
  if (!segments.length || segments.length > 3) return null;
  if (!segments.every((part) => /^[a-z0-9][a-z0-9._-]*$/i.test(part) && !part.includes('..'))) return null;
  const root = uploadDir();
  const file = path.resolve(root, ...segments);
  return file.startsWith(root + path.sep) ? file : null;
}

export async function putImage(body: Buffer, folder: string, name: string): Promise<string> {
  const stem = safeSegment(name, 'photo');
  if (usingBlob()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`${folder}/${stem}.webp`, body, { access: 'public', addRandomSuffix: true, contentType: 'image/webp' });
    return blob.url;
  }
  const file = `${stem}-${randomBytes(5).toString('hex')}.webp`;
  const dir = path.join(uploadDir(), folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, file), body);
  return `${LOCAL_PREFIX}${folder}/${file}`;
}

/** Removes the stored file. A file that is already gone is not an error. */
export async function removeImage(url: string): Promise<void> {
  try {
    if (url.startsWith(LOCAL_PREFIX)) {
      const file = resolveLocal(url.slice(LOCAL_PREFIX.length).split('/'));
      if (file) await fs.rm(file, { force: true });
    } else if (usingBlob() && /\.blob\.vercel-storage\.com\//.test(url)) {
      const { del } = await import('@vercel/blob');
      await del(url);
    }
  } catch (error) {
    console.error('[media] could not remove', url, error);
  }
}
