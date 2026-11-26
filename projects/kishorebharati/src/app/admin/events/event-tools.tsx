'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ConfirmButton, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { ImageField } from '@/components/cms/image-field';
import { CALENDAR_KINDS, type CalendarKind } from '@/db/schema';
import { createEventAction, deleteEventAction, updateEventAction } from '@/server/events/actions';
import { useAction, useForm } from '../_ui/use-action';

import { KIND_WORDS } from '@/server/events/constants';

type Values = { title: string; kind: CalendarKind; startsOn: string; endsOn: string; venue: string; details: string; image: string; galleryAlbum: string; showOnWebsite: boolean };

export function EventForm({ entry, defaultDay }: { entry?: Values & { id: string }; defaultDay: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const blank: Values = { title: '', kind: 'event', startsOn: defaultDay, endsOn: '', venue: '', details: '', image: '', galleryAlbum: '', showOnWebsite: true };
  const { values, set, reset } = useForm<Values>(entry ?? blank);
  const close = () => {
    setOpen(false);
    if (!entry) reset(blank);
  };
  const create = useAction(createEventAction, { success: t('Added to the calendar'), onDone: close });
  const update = useAction(updateEventAction, { success: t('Calendar entry saved'), onDone: close });
  const busy = create.busy || update.busy;
  const errors = entry ? update.fields : create.fields;

  return (
    <>
      {entry ? (
        <Button variant="secondary" size="sm" className="w-9 px-0" aria-label={t('Edit')} title={t('Edit')} onClick={() => setOpen(true)}>
          <Pencil size={15} />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus size={18} /> {t('Add to calendar')}
        </Button>
      )}
      <FormFrame
        open={open}
        busy={busy}
        onClose={close}
        title={entry ? t('Change the calendar entry') : t('Add to the school calendar')}
        onSave={() => (entry ? update.run(entry.id, values) : create.run(values))}
        saveLabel={entry ? t('Save') : t('Add')}
      >
        <FormGrid>
          <Field label={t('Title')} required error={errors.title && t(errors.title)} className="sm:col-span-2">
            <Input value={values.title} onChange={(e) => set('title', e.target.value)} maxLength={160} invalid={Boolean(errors.title)} placeholder={t('Annual Sports')} />
          </Field>
          <Field label={t('Kind')} hint={values.kind === 'holiday' ? t('On a holiday the register is not taken.') : undefined}>
            <Select value={values.kind} onChange={(e) => set('kind', e.target.value as CalendarKind)}>
              {CALENDAR_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(KIND_WORDS[kind])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Venue')}>
            <Input value={values.venue} onChange={(e) => set('venue', e.target.value)} maxLength={160} placeholder={t('School ground')} />
          </Field>
          <Field label={t('First day')} required error={errors.startsOn && t(errors.startsOn)}>
            <Input type="date" value={values.startsOn} onChange={(e) => set('startsOn', e.target.value)} invalid={Boolean(errors.startsOn)} />
          </Field>
          <Field label={t('Last day')} hint={t('Leave empty for one day')} error={errors.endsOn && t(errors.endsOn)}>
            <Input type="date" value={values.endsOn} min={values.startsOn} onChange={(e) => set('endsOn', e.target.value)} invalid={Boolean(errors.endsOn)} />
          </Field>
          <Field label={t('Details')} className="sm:col-span-2">
            <Textarea value={values.details} onChange={(e) => set('details', e.target.value)} maxLength={4000} />
          </Field>
          <Field label={t('Gallery album for its photos')} hint={t('The album name in Gallery, if the photos are up')}>
            <Input value={values.galleryAlbum} onChange={(e) => set('galleryAlbum', e.target.value)} maxLength={80} />
          </Field>
          <label className="flex items-center gap-2.5 self-center text-sm text-ink-700">
            <input type="checkbox" checked={values.showOnWebsite} onChange={(e) => set('showOnWebsite', e.target.checked)} className="h-5 w-5 accent-brand-700" />
            {t('Show on the website')}
          </label>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Photo or poster (optional)')}</p>
            <ImageField value={values.image} onChange={(url) => set('image', url)} folder="events" shape="wide" />
          </div>
        </FormGrid>
      </FormFrame>
    </>
  );
}

/** The form's frame: a dialog (a bottom sheet on a phone). */
function FormFrame({ open, busy, onClose, title, onSave, saveLabel, children }: { open: boolean; busy: boolean; onClose: () => void; title: string; onSave: () => void; saveLabel: string; children: ReactNode }) {
  const t = useT();
  return (
    <Modal
      open={open}
      size="lg"
      onClose={() => !busy && onClose()}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <LoadingButton loading={busy} onClick={onSave}>
            {saveLabel}
          </LoadingButton>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export function DeleteEvent({ id, title }: { id: string; title: string }) {
  const t = useT();
  const remove = useAction(deleteEventAction, { success: t('Moved to the Trash') });
  return (
    <ConfirmButton
      size="sm"
      className="w-9 px-0"
      aria-label={t('Delete')}
      title={t('Delete {name}?', { name: title })}
      text={t('It leaves the calendar and the website. It goes to the Trash, where the head of school can bring it back.')}
      confirmLabel={t('Delete')}
      onConfirm={async () => void (await remove.run(id))}
    >
      <Trash2 size={15} />
    </ConfirmButton>
  );
}
