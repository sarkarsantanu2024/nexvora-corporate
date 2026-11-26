'use client';

import { MoreHorizontal, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Drawer, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { ImportButton } from '@/components/ui/import';
import { useT } from '@/components/ui/lang';
import type { BookStatus } from '@/db/schema';
import { importBooksAction, saveBookAction, setBookStatusAction } from '@/server/library/actions';
import { BOOK_LANGUAGES, BOOK_STATUS_LABELS } from '@/server/library/constants';
import { useAction } from '../_ui/use-action';

type Form = { id: string; accessionNo: string; title: string; author: string; publisher: string; subject: string; language: string; isbn: string; shelf: string; price: string };
const blank: Form = { id: '', accessionNo: '', title: '', author: '', publisher: '', subject: '', language: 'Bengali', isbn: '', shelf: '', price: '' };

/** "Add book" (no `initial`) or the pencil on a row: the book's details in a drawer. */
export function BookButton({ initial }: { initial?: Form }) {
  const t = useT();
  const [form, setForm] = useState<Form | null>(null);
  const save = useAction(saveBookAction, {
    success: (data) => (initial ? t('Book changed') : t('Book {accessionNo} added', { accessionNo: data.accessionNo })),
    onDone: () => setForm(null),
  });
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  const set = (patch: Partial<Form>) => setForm((current) => (current ? { ...current, ...patch } : current));

  return (
    <>
      {initial ? (
        <Button variant="secondary" size="sm" aria-label={t('Change')} onClick={() => setForm(initial)}>
          <Pencil size={15} />
        </Button>
      ) : (
        <Button variant="secondary" onClick={() => setForm(blank)}>
          <Plus size={18} /> {t('Add book')}
        </Button>
      )}
      <Drawer
        open={form !== null}
        onClose={() => !save.busy && setForm(null)}
        title={initial ? t('Change book') : t('Add book')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={save.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => form && save.run({ ...form, price: Number(form.price || 0), addedOn: '' })}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        {form ? (
          <div className="space-y-4">
            <Field label={t('Title')} required error={err('title')}>
              <Input value={form.title} maxLength={200} invalid={!!save.fields.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <FormGrid>
              <Field label={t('Author')}>
                <Input value={form.author} maxLength={120} onChange={(e) => set({ author: e.target.value })} />
              </Field>
              <Field label={t('Publisher')}>
                <Input value={form.publisher} maxLength={120} onChange={(e) => set({ publisher: e.target.value })} />
              </Field>
              <Field label={t('Accession no')} error={err('accessionNo')} hint={initial ? undefined : t('Leave empty for the next number')}>
                <Input value={form.accessionNo} maxLength={30} invalid={!!save.fields.accessionNo} onChange={(e) => set({ accessionNo: e.target.value })} />
              </Field>
              <Field label={t('Subject')} hint={t('Novel, Poetry, Reference ...')}>
                <Input value={form.subject} maxLength={80} onChange={(e) => set({ subject: e.target.value })} />
              </Field>
              <Field label={t('Language')}>
                <Select value={form.language} onChange={(e) => set({ language: e.target.value })}>
                  {[...new Set([...BOOK_LANGUAGES, form.language])].map((language) => (
                    <option key={language} value={language}>
                      {t(language)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('Shelf')}>
                <Input value={form.shelf} maxLength={40} onChange={(e) => set({ shelf: e.target.value })} />
              </Field>
              <Field label={t('ISBN')}>
                <Input value={form.isbn} maxLength={20} onChange={(e) => set({ isbn: e.target.value })} />
              </Field>
              <Field label={t('Price in rupees')} error={err('price')}>
                <Input type="number" inputMode="numeric" min={0} value={form.price} onChange={(e) => set({ price: e.target.value })} />
              </Field>
            </FormGrid>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

/** Lost, withdrawn, or back on the shelf. */
export function BookStatusButton({ id, status, title }: { id: string; status: BookStatus; title: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const change = useAction(setBookStatusAction, { success: t('Book changed'), onDone: () => setOpen(false) });
  const options: BookStatus[] = status === 'available' ? ['lost', 'withdrawn'] : status === 'issued' ? ['lost'] : ['available'];
  return (
    <>
      <Button variant="secondary" size="sm" aria-label={t('More')} onClick={() => setOpen(true)}>
        <MoreHorizontal size={15} />
      </Button>
      <Modal
        open={open}
        onClose={() => !change.busy && setOpen(false)}
        title={title}
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={change.busy}>
            {t('Close')}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label={t('Note')} hint={t('Optional: how it was lost, why it is withdrawn')}>
            <Textarea value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {status === 'issued' ? <p className="text-sm text-ink-500">{t('The book is on loan. Marking it lost closes the loan with the late fine so far.')}</p> : null}
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <LoadingButton key={option} variant={option === 'available' ? 'primary' : 'danger'} loading={change.busy} onClick={() => change.run(id, option, note)}>
                {option === 'available' ? t('Back on the shelf') : t('Mark {status}', { status: t(BOOK_STATUS_LABELS[option]).toLowerCase() })}
              </LoadingButton>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}

export function ImportBooks() {
  const t = useT();
  return (
    <ImportButton
      title={t('Import books')}
      description={t('The accession register from a spreadsheet. A row without an accession number gets the next one; a number already in the library is left out.')}
      onImport={importBooksAction}
      fields={[
        { key: 'accessionNo', label: 'Accession no', aliases: ['accession', 'acc no', 'acc. no.', 'accession number', 'sl no'] },
        { key: 'title', label: 'Title', required: true, aliases: ['book', 'name of book', 'book name'] },
        { key: 'author', label: 'Author', aliases: ['writer'] },
        { key: 'publisher', label: 'Publisher' },
        { key: 'subject', label: 'Subject', aliases: ['category', 'type'] },
        { key: 'language', label: 'Language' },
        { key: 'isbn', label: 'ISBN' },
        { key: 'shelf', label: 'Shelf', aliases: ['rack', 'almirah'] },
        { key: 'price', label: 'Price', aliases: ['cost', 'rs'] },
      ]}
    />
  );
}
