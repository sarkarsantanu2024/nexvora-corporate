/**
 * POST  a photo (multipart: file, folder?, alt?) → { ok, data: { id, url, width, height } }
 * GET   the library (?folder=&q=&before=).
 * Both need a login.
 */
import { ApiError, handle, ok } from '@/lib/api';
import { TEAM_ROLES, apiSession } from '@/lib/auth';
import { MAX_UPLOAD_BYTES, listMedia, storeImage } from '@/server/cms/media';

export const runtime = 'nodejs';

export const POST = handle(async (req) => {
  const session = await apiSession(TEAM_ROLES);
  // Refuse an oversized body before reading it into memory.
  if (Number(req.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES + 64 * 1024) {
    throw new ApiError(413, 'That photo is larger than 12 MB. Choose a smaller one.');
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, 'Send the photo as a file');
  }
  const file = form.get('file');
  if (!(file instanceof File)) throw new ApiError(400, 'Choose a photo to upload');
  const folder = form.get('folder');
  const alt = form.get('alt');
  const stored = await storeImage(
    session,
    { bytes: Buffer.from(await file.arrayBuffer()), filename: file.name || 'photo' },
    { folder: typeof folder === 'string' ? folder : undefined, alt: typeof alt === 'string' ? alt : undefined },
  );
  return ok(stored, { status: 201 });
});

export const GET = handle(async (req) => {
  await apiSession(TEAM_ROLES);
  const params = new URL(req.url).searchParams;
  const result = await listMedia({
    folder: params.get('folder') || undefined,
    q: params.get('q')?.trim().slice(0, 60) || undefined,
    before: params.get('before') || undefined,
  });
  return ok(result);
});
