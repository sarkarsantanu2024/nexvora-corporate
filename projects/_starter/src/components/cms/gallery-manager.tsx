'use client';

/** The public photo gallery, as the team arranges it: albums, captions, order, show and hide. */
import { ArrowLeft, ArrowRight, Eye, EyeOff, ImagePlus, Images, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, Input, Select } from '@/components/ui/core';
import { ConfirmButton, LoadingButton, Modal, useToast } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { addGalleryPhotosAction, deleteGalleryItemsAction, reorderGalleryAction, updateGalleryItemAction } from '@/server/cms/actions';
import { imagesFrom, uploadMany } from './upload';

export type GalleryRow = { id: string; url: string; caption: string; album: string; visible: boolean; sort: number };

export function GalleryManager({ items, albums }: { items: GalleryRow[]; albums: string[] }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [album, setAlbum] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<GalleryRow | null>(null);
  const [busyId, setBusyId] = useState('');

  const groups = useMemo(() => {
    const out = new Map<string, GalleryRow[]>();
    for (const item of items) out.set(item.album, [...(out.get(item.album) ?? []), item]);
    return [...out.entries()];
  }, [items]);
  const shown = album ? groups.filter(([name]) => name === album) : groups;

  async function run<T>(id: string, job: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, done?: string) {
    setBusyId(id);
    const result = await job();
    setBusyId('');
    if (!result.ok) toast.error(t(result.error));
    else if (done) toast.success(done);
    router.refresh();
  }

  function move(list: GalleryRow[], index: number, by: number) {
    const ids = list.map((item) => item.id);
    ids.splice(index + by, 0, ...ids.splice(index, 1));
    void run(list[index].id, () => reorderGalleryAction(ids));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-1">
          {groups.length > 1
            ? [['', items.length] as const, ...groups.map(([name, list]) => [name, list.length] as const)].map(([name, n]) => (
                <button
                  key={name || 'all'}
                  type="button"
                  aria-pressed={album === name}
                  onClick={() => setAlbum(name)}
                  className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition', album === name ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300')}
                >
                  {name || t('All albums')} <span className={cn('tabular text-xs', album === name ? 'text-brand-100' : 'text-ink-400')}>{n}</span>
                </button>
              ))
            : null}
        </div>
        <Button onClick={() => setAdding(true)}>
          <ImagePlus size={18} /> {t('Add photos')}
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Images size={26} />}
            title={t('The gallery is empty')}
            text={t('Photos you add here appear on the Gallery page of the website, grouped into albums like Our work or Events.')}
            action={<Button onClick={() => setAdding(true)}>{t('Add the first photos')}</Button>}
          />
        </Card>
      ) : (
        shown.map(([name, list]) => (
          <section key={name} aria-label={name}>
            <h2 className="mb-2 flex items-baseline gap-2 font-display text-lg font-bold text-ink-900">
              {name} <span className="tabular text-sm font-medium text-ink-500">{list.length === 1 ? t('1 photo') : t('{n} photos', { n: list.length })}</span>
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {list.map((item, index) => (
                <li key={item.id} className={cn('overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition', busyId === item.id && 'opacity-60')}>
                  <div className="relative aspect-[4/3] bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.caption} loading="lazy" className={cn('h-full w-full object-cover', !item.visible && 'opacity-40 grayscale')} />
                    {!item.visible ? (
                      <Badge className="absolute left-2 top-2 bg-ink-900/80 text-white">
                        <EyeOff size={12} /> {t('Hidden')}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="px-3 pt-2">
                    <p className={cn('truncate text-sm font-semibold', item.caption ? 'text-ink-800' : 'text-ink-400')}>{item.caption || t('No caption')}</p>
                  </div>
                  <div className="flex items-center justify-between px-1.5 pb-1.5 pt-1">
                    <div className="flex">
                      <IconButton label={t('Move earlier')} disabled={index === 0 || busyId !== ''} onClick={() => move(list, index, -1)}>
                        <ArrowLeft size={17} />
                      </IconButton>
                      <IconButton label={t('Move later')} disabled={index === list.length - 1 || busyId !== ''} onClick={() => move(list, index, 1)}>
                        <ArrowRight size={17} />
                      </IconButton>
                    </div>
                    <div className="flex">
                      <IconButton label={item.visible ? t('Hide from the website') : t('Show on the website')} disabled={busyId !== ''} onClick={() => void run(item.id, () => updateGalleryItemAction(item.id, { visible: !item.visible }))}>
                        {item.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                      </IconButton>
                      <IconButton label={t('Edit caption and album')} disabled={busyId !== ''} onClick={() => setEditing(item)}>
                        <Pencil size={17} />
                      </IconButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {adding ? <AddPhotos albums={albums} startAlbum={album} onClose={() => setAdding(false)} /> : null}
      {editing ? <EditPhoto item={editing} albums={albums} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function IconButton({ label, children, ...props }: { label: string; children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} {...props} className="grid h-10 w-10 place-items-center rounded-xl text-ink-600 transition hover:bg-ink-100 disabled:opacity-30">
      {children}
    </button>
  );
}

function AlbumField({ value, onChange, albums }: { value: string; onChange: (value: string) => void; albums: string[] }) {
  const t = useT();
  return (
    <Field label={t('Album')} hint={t('Type a new name, or pick one you already have.')}>
      <Input value={value} onChange={(event) => onChange(event.target.value)} list="gallery-albums" maxLength={60} placeholder={t('Opening day 2026')} />
      <datalist id="gallery-albums">
        {albums.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </Field>
  );
}

function AddPhotos({ albums, startAlbum, onClose }: { albums: string[]; startAlbum: string; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [album, setAlbum] = useState(startAlbum);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = progress.length > 0;

  const add = (more: File[]) => setFiles((current) => [...current, ...more].slice(0, 60));

  async function submit() {
    setProgress(files.map(() => 0));
    const { done, failed } = await uploadMany(files, 'gallery', (index, fraction) => setProgress((list) => list.map((value, at) => (at === index ? fraction : value))));
    if (failed.length) toast.error(failed.length === 1 ? t(failed[0].error) : t('{n} photos could not be uploaded. {error}', { n: failed.length, error: t(failed[0].error) }));
    if (done.length) {
      const result = await addGalleryPhotosAction({ album, photos: done.map((photo) => ({ url: photo.url, width: photo.width, height: photo.height })) });
      if (!result.ok) {
        toast.error(result.fields?.album ?? result.error);
        setProgress([]);
        return;
      }
      toast.success(result.data === 1 ? t('Photo added to the gallery') : t('{n} photos added to the gallery', { n: result.data }));
      router.refresh();
      onClose();
      return;
    }
    setProgress([]);
  }

  const overall = busy ? progress.reduce((sum, value) => sum + Math.max(0, value), 0) / progress.length : 0;

  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={t('Add photos to the gallery')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <LoadingButton loading={busy} disabled={!files.length} onClick={() => void submit()}>
            {busy ? t('Uploading {n}%', { n: Math.round(overall * 100) }) : files.length > 1 ? t('Add {n} photos', { n: files.length }) : t('Add photo')}
          </LoadingButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AlbumField value={album} onChange={setAlbum} albums={albums} />
        </div>
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            add(imagesFrom(event.dataTransfer.files));
          }}
          disabled={busy}
          className={cn('flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition', dragging ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-ink-50 hover:border-brand-400')}
        >
          <UploadCloud size={26} className="text-brand-600" />
          <span className="text-[15px] font-semibold text-ink-800">{t('Choose photos, or drop them here')}</span>
          <span className="text-sm text-ink-500">{t('Up to 60 at a time. Each is resized for you.')}</span>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            add(imagesFrom(event.target.files));
            event.target.value = '';
          }}
        />
        {files.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="relative overflow-hidden rounded-xl bg-ink-100">
                <FileThumb file={file} />
                {busy ? (
                  <span className="absolute inset-x-0 bottom-0 h-1.5 bg-ink-200">
                    <span className={cn('block h-full transition-[width]', progress[index] < 0 ? 'bg-accent-500' : 'bg-brand-600')} style={{ width: `${Math.abs(progress[index] ?? 0) * 100}%` }} />
                  </span>
                ) : (
                  <button type="button" aria-label={t('Remove {name}', { name: file.name })} onClick={() => setFiles((current) => current.filter((_, at) => at !== index))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink-900/70 text-white hover:bg-ink-900">
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Modal>
  );
}

function FileThumb({ file }: { file: File }) {
  // Made once per file; the browser frees it when the dialog's page goes away.
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="aspect-square w-full object-cover" onLoad={() => URL.revokeObjectURL(url)} />;
}

function EditPhoto({ item, albums, onClose }: { item: GalleryRow; albums: string[]; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [caption, setCaption] = useState(item.caption);
  const [album, setAlbum] = useState(item.album);
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      open
      onClose={onClose}
      title={t('Edit photo')}
      footer={
        <>
          <ConfirmButton
            className="mr-auto"
            title={t('Remove this photo from the gallery?')}
            text={t("It disappears from the website's gallery and the photo is deleted.")}
            confirmLabel={t('Remove photo')}
            onConfirm={async () => {
              const result = await deleteGalleryItemsAction([item.id]);
              if (!result.ok) {
                toast.error(t(result.error));
                return;
              }
              toast.success(t('Photo removed'));
              router.refresh();
              onClose();
            }}
          >
            <Trash2 size={17} /> {t('Remove')}
          </ConfirmButton>
          <Button variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <LoadingButton
            loading={saving}
            onClick={async () => {
              setSaving(true);
              const result = await updateGalleryItemAction(item.id, { caption, album });
              setSaving(false);
              if (!result.ok) {
                toast.error(t(result.error));
                return;
              }
              toast.success(t('Saved'));
              router.refresh();
              onClose();
            }}
          >
            {t('Save')}
          </LoadingButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="" className="max-h-56 w-full rounded-2xl bg-ink-100 object-contain" />
        <Field label={t('Caption')} hint={t('A few words shown with the photo. Optional.')}>
          <Input value={caption} maxLength={160} onChange={(event) => setCaption(event.target.value)} placeholder={t('The team on opening day')} />
        </Field>
        <AlbumField value={album} onChange={setAlbum} albums={albums} />
      </div>
    </Modal>
  );
}
