/**
 * Serves photos stored on this machine (see src/server/cms/storage.ts).
 * Not used on Vercel, where photos live in Blob storage and have their own address.
 *
 * File names carry a random suffix and are never rewritten, so a browser may
 * keep a photo for a year.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveLocal } from '@/server/cms/storage';

export const runtime = 'nodejs';

const TYPES: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.avif': 'image/avif' };

const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const file = resolveLocal(segments);
  const type = file ? TYPES[path.extname(file).toLowerCase()] : undefined;
  if (!file || !type) return notFound();
  try {
    const body = await fs.readFile(file);
    return new Response(new Uint8Array(body), {
      headers: {
        'Content-Type': type,
        'Content-Length': String(body.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return notFound();
  }
}
