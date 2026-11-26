'use client';

/**
 * The photo field of the website editor: upload, take a photo on a phone, or
 * choose one already in the library. (Other forms use the simpler
 * <ImageField>; this one needs the library, which only the team can open.)
 */
import { Camera, FolderOpen, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { MediaPicker } from './media-library';
import { uploadImage } from './upload';

const action = 'inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-800 shadow-sm transition hover:border-ink-300 hover:bg-ink-50 disabled:opacity-50';

export function ImageInput({
  value,
  onChange,
  folder = 'website',
  label,
  invalid,
  compact,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label: string;
  invalid?: boolean;
  /** Smaller preview, for rows of a list. */
  compact?: boolean;
}) {
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [fraction, setFraction] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [library, setLibrary] = useState(false);
  const busy = fraction !== null;

  async function upload(picked: File | undefined) {
    if (!picked) return;
    setError('');
    setFraction(0);
    try {
      const stored = await uploadImage(picked, folder, setFraction);
      onChange(stored.url);
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('The upload failed. Try again.'));
    } finally {
      setFraction(null);
    }
  }

  return (
    <div>
      <div className={cn('flex gap-3', compact ? 'items-center' : 'flex-col sm:flex-row sm:items-start')}>
        <button
          type="button"
          onClick={() => file.current?.click()}
          aria-label={value ? t('Change {label}', { label }) : t('Add {label}', { label })}
          className={cn(
            'relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-ink-50 text-ink-400 transition hover:border-brand-400 hover:text-brand-600',
            invalid ? 'border-accent-300' : 'border-ink-200',
            compact ? 'h-20 w-20' : 'h-36 w-full sm:w-56',
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={compact ? 22 : 28} />
          )}
          {busy ? (
            <span className="absolute inset-0 grid place-items-center bg-white/80 text-sm font-semibold text-brand-800">
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" /> {Math.round((fraction ?? 0) * 100)}%
              </span>
            </span>
          ) : null}
        </button>
        <div className="min-w-0 text-sm">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={action} disabled={busy} onClick={() => file.current?.click()}>
              <UploadCloud size={16} /> {t('Upload')}
            </button>
            {/* Only a phone or tablet has a camera worth offering. */}
            <button type="button" className={cn(action, 'hidden [@media(pointer:coarse)]:inline-flex')} disabled={busy} onClick={() => camera.current?.click()}>
              <Camera size={16} /> {t('Take a photo')}
            </button>
            <button type="button" className={action} disabled={busy} onClick={() => setLibrary(true)}>
              <FolderOpen size={16} /> {t('From library')}
            </button>
            {value ? (
              <button type="button" className={cn(action, 'text-accent-700 hover:bg-accent-50')} disabled={busy} onClick={() => onChange('')}>
                <Trash2 size={16} /> {t('Remove')}
              </button>
            ) : null}
          </div>
          {!compact ? <p className="mt-2 text-ink-500">{t('JPG, PNG or WebP up to 12 MB. It is resized for you.')}</p> : null}
          {error ? <p className="mt-1 font-medium text-accent-600">{error}</p> : null}
        </div>
      </div>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(event) => { const picked = event.target.files?.[0]; event.target.value = ''; void upload(picked); }} />
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { const picked = event.target.files?.[0]; event.target.value = ''; void upload(picked); }} />
      <MediaPicker
        open={library}
        onClose={() => setLibrary(false)}
        uploadFolder={folder}
        onPick={(item) => {
          onChange(item.url);
          setLibrary(false);
        }}
      />
    </div>
  );
}
