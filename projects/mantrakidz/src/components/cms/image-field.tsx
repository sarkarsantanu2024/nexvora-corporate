'use client';

/**
 * A photo field for any form: shows the current photo, uploads a new one.
 *
 *   <ImageField value={photo} onChange={setPhoto} folder="students" />
 *
 * Contract (do not change the props): the file is POSTed as multipart field
 * "file" (plus "folder") to /api/media, which answers
 * { ok: true, data: { url, width, height } }.
 */
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { shrinkImage } from './upload';

export type ImageFieldProps = {
  value: string;
  onChange: (url: string) => void;
  /** Groups uploads in the media library: 'students', 'centres', 'website'. */
  folder?: string;
  /** 'square' for faces and logos, 'wide' for banners. */
  shape?: 'square' | 'wide';
  className?: string;
};

export function ImageField({ value, onChange, folder = 'general', shape = 'square', className }: ImageFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file: File) {
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.set('file', await shrinkImage(file));
      body.set('folder', folder);
      const response = await fetch('/api/media', { method: 'POST', body });
      const result = (await response.json()) as { ok: boolean; data?: { url: string }; error?: string };
      if (!result.ok || !result.data) throw new Error(result.error || 'Upload failed');
      onChange(result.data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn(
            'relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50 text-ink-400 transition hover:border-brand-400 hover:text-brand-600',
            shape === 'wide' ? 'h-24 w-40' : 'h-24 w-24',
          )}
          aria-label={value ? 'Change photo' : 'Add photo'}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={26} />
          )}
          {busy ? (
            <span className="absolute inset-0 grid place-items-center bg-white/70">
              <Loader2 size={22} className="animate-spin text-brand-700" />
            </span>
          ) : null}
        </button>
        <div className="text-sm">
          <button type="button" onClick={() => input.current?.click()} className="font-semibold text-brand-700 hover:underline">
            {value ? 'Change photo' : 'Add a photo'}
          </button>
          {value ? (
            <button type="button" onClick={() => onChange('')} className="ml-3 inline-flex items-center gap-1 font-medium text-ink-500 hover:text-accent-600">
              <Trash2 size={14} /> Remove
            </button>
          ) : null}
          <p className="mt-0.5 text-ink-500">JPG or PNG. It is resized for you.</p>
          {error ? <p className="mt-0.5 font-medium text-accent-600">{error}</p> : null}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
