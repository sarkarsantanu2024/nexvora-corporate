'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { ImageField } from '@/components/cms/image-field';
import { createDiaryAction, deleteDiaryAction, updateDiaryAction } from '@/server/diary/actions';
import { useAction, useForm } from '../_ui/use-action';

export type DiaryChoice = { sectionId: string; label: string; general: boolean; subjects: { id: string; label: string }[] };

type Values = { sectionId: string; subjectId: string; givenOn: string; dueOn: string; title: string; details: string; attachment: string };

/** The add / edit form. With `entry` it changes that entry; without, it adds one. */
export function DiaryForm({ choices, today, entry }: { choices: DiaryChoice[]; today: string; entry?: Values & { id: string } }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const first = choices[0];
  const blank: Values = { sectionId: first?.sectionId ?? '', subjectId: first && !first.general ? (first.subjects[0]?.id ?? '') : '', givenOn: today, dueOn: '', title: '', details: '', attachment: '' };
  const { values, set, reset } = useForm<Values>(entry ?? blank);
  const choice = choices.find((item) => item.sectionId === values.sectionId);
  const close = () => {
    setOpen(false);
    if (!entry) reset(blank);
  };
  const create = useAction(createDiaryAction, { success: t('Diary entry posted'), onDone: close });
  const update = useAction(updateDiaryAction, { success: t('Diary entry saved'), onDone: close });
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
          <Plus size={18} /> {t('Post homework')}
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => !busy && close()}
        title={entry ? t('Change the diary entry') : t('Post in the class diary')}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={busy} onClick={() => (entry ? update.run(entry.id, values) : create.run(values))}>
              {entry ? t('Save') : t('Post')}
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label={t('Class')} required>
            <Select
              value={values.sectionId}
              onChange={(e) => {
                const next = choices.find((item) => item.sectionId === e.target.value);
                set('sectionId', e.target.value);
                set('subjectId', next && !next.general ? (next.subjects[0]?.id ?? '') : '');
              }}
            >
              {choices.map((item) => (
                <option key={item.sectionId} value={item.sectionId}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Subject')} hint={choice?.general ? t('Leave empty for a note from the class teacher') : undefined}>
            <Select value={values.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
              {choice?.general ? <option value="">{t('General note')}</option> : null}
              {(choice?.subjects ?? []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Title')} required error={errors.title && t(errors.title)} className="sm:col-span-2">
            <Input value={values.title} onChange={(e) => set('title', e.target.value)} placeholder={t('Exercise 4.2, sums 1 to 10')} maxLength={160} invalid={Boolean(errors.title)} />
          </Field>
          <Field label={t('Details')} className="sm:col-span-2">
            <Textarea value={values.details} onChange={(e) => set('details', e.target.value)} maxLength={4000} />
          </Field>
          <Field label={t('Given on')} error={errors.givenOn && t(errors.givenOn)}>
            <Input type="date" value={values.givenOn} max={today} onChange={(e) => set('givenOn', e.target.value)} />
          </Field>
          <Field label={t('To be done by')} error={errors.dueOn && t(errors.dueOn)}>
            <Input type="date" value={values.dueOn} min={values.givenOn} onChange={(e) => set('dueOn', e.target.value)} invalid={Boolean(errors.dueOn)} />
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Photo of the page (optional)')}</p>
            <ImageField value={values.attachment} onChange={(url) => set('attachment', url)} folder="diary" />
          </div>
        </FormGrid>
      </Modal>
    </>
  );
}

export function DeleteDiary({ id, title }: { id: string; title: string }) {
  const t = useT();
  const remove = useAction(deleteDiaryAction, { success: t('Moved to the Trash') });
  return (
    <ConfirmButton
      size="sm"
      className="w-9 px-0"
      aria-label={t('Delete')}
      title={t('Delete {name}?', { name: title })}
      text={t('Parents will no longer see it. It goes to the Trash, where the head of school can bring it back.')}
      confirmLabel={t('Delete')}
      onConfirm={async () => void (await remove.run(id))}
    >
      <Trash2 size={15} />
    </ConfirmButton>
  );
}
