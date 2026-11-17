'use client';

/**
 * The photo library: every upload, by folder. Used as a full screen
 * (/hq/website/media) and inside the "choose a photo" dialog of image fields.
 */
import { Check, Copy, ImageUp, Loader2, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, EmptyState, Field, Input } from '@/components/ui/core';
import { ConfirmButton, LoadingButton, Modal, useToast } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { deleteMediaAction, updateMediaAltAction } from '@/server/cms/actions';
import { imagesFrom, uploadMany } from './upload';

export type LibraryItem = { id: string; url: string; filename: string; alt: string; width: number; height: number; bytes: number; folder: string; createdAt: string | Date };
type Listing = { items: LibraryItem[]; folders: { folder: string; n: number }[]; more: boolean };

const FOLDER_LABELS: Record<string, string> = { website: 'Website', gallery: 'Gallery', notices: 'Notices', students: 'Children', staff: 'Staff', centres: 'Centres', general: 'General' };
const folderLabel = (folder: string) => FOLDER_LABELS[folder] ?? folder.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const size = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function MediaLibrary({
  initial,
  mode = 'manage',
  onPick,
  uploadFolder = 'website',
  startFolder = '',
}: {
  initial?: Listing;
  mode?: 'manage' | 'pick';
  onPick?: (item: LibraryItem) => void;
  /** Where new uploads from this screen are filed. */
  uploadFolder?: string;
  startFolder?: string;
}) {
  const t = useT();
  const toast = useToast();
  const [listing, setListing] = useState<Listing>(initial ?? { items: [], folders: [], more: false });
  const [folder, setFolder] = useState(startFolder);
  const [loading, setLoading] = useState(!initial);
  const [progress, setProgress] = useState<{ name: string; fraction: number }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState<LibraryItem | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);

  const load = useCallback(async (nextFolder: string, before?: string) => {
    const ticket = (request.current += 1);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextFolder) params.set('folder', nextFolder);
      if (before) params.set('before', before);
      const response = await fetch(`/api/media?${params}`, { cache: 'no-store' });
      const result = (await response.json()) as { ok: boolean; data?: Listing; error?: string };
      if (ticket !== request.current) return; // a newer request has since been made
      if (!result.ok || !result.data) throw new Error(result.error || 'Could not load the photos');
      const data = result.data;
      setListing((current) => (before ? { ...data, items: [...current.items, ...data.items] } : data));
    } catch (error) {
      toast.error(error instanceof Error ? t(error.message) : t('Could not load the photos'));
    } finally {
      if (ticket === request.current) setLoading(false);
    }
  }, [toast]);

  const first = useRef(true);
  useEffect(() => {
    // The page already brought the first screenful; fetch only on a folder change (or in the dialog).
    if (first.current) {
      first.current = false;
      if (initial && folder === '') return;
    }
    void load(folder);
  }, [folder, load, initial]);

  async function upload(files: File[]) {
    if (!files.length) return;
    setProgress(files.map((file) => ({ name: file.name, fraction: 0 })));
    const target = folder || uploadFolder;
    const { done, failed } = await uploadMany(files, target, (index, fraction) =>
      setProgress((list) => list.map((item, at) => (at === index ? { ...item, fraction } : item))),
    );
    setProgress([]);
    if (failed.length) toast.error(failed.length === 1 ? t(failed[0].error) : t('{n} photos could not be uploaded. {error}', { n: failed.length, error: t(failed[0].error) }));
    if (done.length) {
      toast.success(done.length === 1 ? t('Photo uploaded') : t('{n} photos uploaded', { n: done.length }));
      await load(folder);
      // Choosing a photo by uploading it: one upload in the dialog is the choice.
      if (mode === 'pick' && done.length === 1 && onPick) {
        const one = done[0];
        onPick({ id: one.id, url: one.url, filename: one.name, alt: '', width: one.width, height: one.height, bytes: 0, folder: target, createdAt: new Date().toISOString() });
      }
    }
  }

  const busy = progress.length > 0;
  const total = listing.folders.reduce((sum, item) => sum + item.n, 0);

  return (
    <div
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void upload(imagesFrom(event.dataTransfer.files));
      }}
      className={cn('relative rounded-2xl transition', dragging && 'ring-4 ring-brand-200')}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-1">
          {[{ folder: '', n: total }, ...listing.folders].map((item) => (
            <button
              key={item.folder || 'all'}
              type="button"
              onClick={() => setFolder(item.folder)}
              aria-pressed={folder === item.folder}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                folder === item.folder ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
              )}
            >
              {item.folder ? t(folderLabel(item.folder)) : t('All photos')}
              <span className={cn('tabular text-xs', folder === item.folder ? 'text-brand-100' : 'text-ink-400')}>{item.n}</span>
            </button>
          ))}
        </div>
        <LoadingButton loading={busy} onClick={() => input.current?.click()}>
          {busy ? null : <UploadCloud size={18} />} {t('Upload photos')}
        </LoadingButton>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = imagesFrom(event.target.files);
            event.target.value = '';
            void upload(files);
          }}
        />
      </div>

      {busy ? (
        <ul className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {progress.map((item, index) => (
            <li key={`${item.name}-${index}`} className="rounded-xl border border-ink-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-ink-800">{item.name}</span>
                <span className={cn('tabular shrink-0 text-xs font-semibold', item.fraction < 0 ? 'text-accent-600' : 'text-ink-500')}>
                  {item.fraction < 0 ? t('Failed') : item.fraction >= 1 ? t('Done') : `${Math.round(item.fraction * 100)}%`}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div className={cn('h-full rounded-full transition-[width]', item.fraction < 0 ? 'bg-accent-400' : 'bg-brand-600')} style={{ width: `${Math.max(4, Math.abs(item.fraction) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {listing.items.length === 0 && !loading ? (
        <EmptyState
          icon={<ImageUp size={26} />}
          title={folder ? t('No photos in this folder yet') : t('No photos yet')}
          text={t('Photos you upload here can be used anywhere on the website. Drop photos on this box, or use the button.')}
          action={<Button onClick={() => input.current?.click()}>{t('Upload photos')}</Button>}
          className="rounded-2xl border-2 border-dashed border-ink-200"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {listing.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => (mode === 'pick' ? onPick?.(item) : setOpen(item))}
                className="group block w-full overflow-hidden rounded-2xl border border-ink-200/70 bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                <span className="block aspect-square overflow-hidden bg-ink-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.alt} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                </span>
                <span className="block px-3 py-2">
                  <span className="block truncate text-sm font-semibold text-ink-800">{item.alt || item.filename || t('Photo')}</span>
                  <span className="tabular block text-xs text-ink-500">
                    {item.width} × {item.height} · {t(folderLabel(item.folder))}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-500">
          <Loader2 size={16} className="animate-spin" /> {t('Loading photos')}
        </p>
      ) : listing.more ? (
        <div className="mt-5 text-center">
          <Button variant="secondary" onClick={() => void load(folder, String(listing.items[listing.items.length - 1]?.createdAt ?? ''))}>
            {t('Show more')}
          </Button>
        </div>
      ) : null}

      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-2xl bg-brand-50/90 text-brand-800">
          <p className="flex items-center gap-2 text-base font-bold">
            <UploadCloud size={22} /> {t('Drop to upload')}
          </p>
        </div>
      ) : null}

      {open ? (
        <PhotoDetails
          item={open}
          onClose={() => setOpen(null)}
          onChanged={(next) => {
            setListing((current) => ({ ...current, items: current.items.map((item) => (item.id === next.id ? { ...item, alt: next.alt } : item)) }));
            setOpen(null);
          }}
          onDeleted={() => {
            setOpen(null);
            void load(folder);
          }}
        />
      ) : null}
    </div>
  );
}

function PhotoDetails({ item, onClose, onChanged, onDeleted }: { item: LibraryItem; onClose: () => void; onChanged: (item: { id: string; alt: string }) => void; onDeleted: () => void }) {
  const t = useT();
  const toast = useToast();
  const [alt, setAlt] = useState(item.alt);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = item.url.startsWith('/') && typeof window !== 'undefined' ? `${window.location.origin}${item.url}` : item.url;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('Could not copy. Select the link and copy it by hand.'));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t('Photo details')}
      size="lg"
      footer={
        <>
          <ConfirmButton
            title={t('Delete this photo?')}
            text={t('It is removed from the library for good. Anywhere on the website that still uses it will show a gap.')}
            confirmLabel={t('Delete photo')}
            className="mr-auto"
            onConfirm={async () => {
              const result = await deleteMediaAction(item.id);
              if (!result.ok) {
                toast.error(t(result.error));
                return;
              }
              toast.success(t('Photo deleted'));
              onDeleted();
            }}
          >
            <Trash2 size={17} /> {t('Delete')}
          </ConfirmButton>
          <Button variant="secondary" onClick={onClose}>
            {t('Close')}
          </Button>
          <LoadingButton
            loading={saving}
            disabled={alt.trim() === item.alt}
            onClick={async () => {
              setSaving(true);
              const result = await updateMediaAltAction(item.id, alt);
              setSaving(false);
              if (!result.ok) {
                toast.error(t(result.error));
                return;
              }
              toast.success(t('Description saved'));
              onChanged({ id: item.id, alt: result.data.alt });
            }}
          >
            <Pencil size={17} /> {t('Save description')}
          </LoadingButton>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl bg-ink-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.alt} className="max-h-[50dvh] w-full object-contain" />
        </div>
        <div className="space-y-4">
          <Field label={t('Description')} hint={t('Read out to visitors who cannot see the photo, and used by search engines.')}>
            <Input value={alt} maxLength={200} onChange={(event) => setAlt(event.target.value)} placeholder={t('Children painting in the art corner')} />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Link')}</p>
            <div className="flex gap-2">
              <Input readOnly value={link} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 text-sm" aria-label={t('Link to this photo')} />
              <Button variant="secondary" onClick={copy} aria-label={t('Copy link')}>
                {copied ? <Check size={17} className="text-mint-500" /> : <Copy size={17} />} {copied ? t('Copied') : t('Copy')}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{t(folderLabel(item.folder))}</Badge>
            <Badge className="tabular">
              {item.width} × {item.height}
            </Badge>
            {item.bytes ? <Badge className="tabular">{size(item.bytes)}</Badge> : null}
          </div>
          {item.filename ? <p className="break-all text-sm text-ink-500">{t('Uploaded as {filename}', { filename: item.filename })}</p> : null}
        </div>
      </div>
    </Modal>
  );
}

/** "Choose from library" for image fields. */
export function MediaPicker({ open, onClose, onPick, uploadFolder = 'website' }: { open: boolean; onClose: () => void; onPick: (item: LibraryItem) => void; uploadFolder?: string }) {
  const t = useT();
  if (!open) return null;
  return (
    <Modal open onClose={onClose} title={t('Choose a photo')} description={t('Pick one from the library, or upload a new one.')} size="xl">
      <MediaLibrary mode="pick" onPick={onPick} uploadFolder={uploadFolder} />
    </Modal>
  );
}
