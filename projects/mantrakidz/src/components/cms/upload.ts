/**
 * Sends one photo to /api/media and reports how far along it is.
 * (XMLHttpRequest, because fetch cannot report upload progress.)
 */
export type Uploaded = { id: string; url: string; width: number; height: number };

export const MAX_UPLOAD_MB = 12;

/**
 * Phone photos are often 5 to 10 MB, more than a hosted function accepts in
 * one request. So a big photo is scaled down in the browser first (longest
 * side 2400px, JPEG). The server still does the final resize and conversion.
 * If the browser cannot read the file (HEIC on some phones), it is sent as is.
 */
const SHRINK_ABOVE_BYTES = 1.5 * 1024 * 1024;
const SHRINK_MAX_SIDE = 2400;

export async function shrinkImage(file: File): Promise<File> {
  if (file.size <= SHRINK_ABOVE_BYTES || !['image/jpeg', 'image/webp'].includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, SHRINK_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    // PNG files are left alone above: a logo's see-through background would be lost as JPEG.
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/jpeg', 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.\w+$/, '')}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export async function uploadImage(original: File, folder: string, onProgress?: (fraction: number) => void, alt?: string): Promise<Uploaded> {
  const file = await shrinkImage(original);
  return new Promise((resolve, reject) => {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      reject(new Error(`${file.name} is larger than ${MAX_UPLOAD_MB} MB. Choose a smaller photo.`));
      return;
    }
    const body = new FormData();
    body.set('file', file);
    body.set('folder', folder);
    if (alt) body.set('alt', alt);

    const request = new XMLHttpRequest();
    request.open('POST', '/api/media');
    request.responseType = 'json';
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    request.onload = () => {
      const result = request.response as { ok?: boolean; data?: Uploaded; error?: string } | null;
      if (result?.ok && result.data) resolve(result.data);
      else reject(new Error(result?.error || 'The upload failed. Try again.'));
    };
    request.onerror = () => reject(new Error('The upload failed. Check the connection and try again.'));
    request.send(body);
  });
}

/** Uploads several photos, three at a time, keeping their order. Failures are returned, not thrown. */
export async function uploadMany(
  files: File[],
  folder: string,
  onProgress?: (index: number, fraction: number) => void,
): Promise<{ done: (Uploaded & { name: string })[]; failed: { name: string; error: string }[] }> {
  const results: ((Uploaded & { name: string }) | null)[] = files.map(() => null);
  const failed: { name: string; error: string }[] = [];
  let next = 0;
  async function worker() {
    while (next < files.length) {
      const index = next;
      next += 1;
      const file = files[index];
      try {
        const uploaded = await uploadImage(file, folder, (fraction) => onProgress?.(index, fraction));
        results[index] = { ...uploaded, name: file.name };
        onProgress?.(index, 1);
      } catch (error) {
        failed.push({ name: file.name, error: error instanceof Error ? error.message : 'Upload failed' });
        onProgress?.(index, -1);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker));
  return { done: results.filter((item): item is Uploaded & { name: string } => item !== null), failed };
}

/** Only image files, from a file input or a drop. */
export const imagesFrom = (list: FileList | null | undefined): File[] => Array.from(list ?? []).filter((file) => file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name));
