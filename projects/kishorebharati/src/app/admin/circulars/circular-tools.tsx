'use client';

import { CheckCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { ConfirmButton, Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { Announcement } from '@/db/schema';
import { todayIST } from '@/lib/date';
import { deleteCircularAction, markCircularReadAction, saveCircularAction } from '@/server/office/actions';
import { useAction, useForm } from '../_ui/use-action';

export function CircularFormButton({ circular }: { circular?: Announcement }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const start = () => ({
    title: circular?.title ?? '',
    body: circular?.body ?? '',
    attachment: circular?.attachment ?? '',
    pinned: circular?.pinned ?? false,
    publishOn: circular?.publishOn ?? todayIST(),
    expiresOn: circular?.expiresOn ?? '',
  });
  const form = useForm(start());
  const save = useAction(saveCircularAction, {
    success: circular ? t('Saved') : t('Circular sent to the staff'),
    onDone: (data) => {
      setOpen(false);
      if (!circular) router.push(`/admin/circulars/${data.id}`);
    },
  });
  const v = form.values;
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  return (
    <>
      <Button
        variant={circular ? 'secondary' : 'primary'}
        onClick={() => {
          form.reset(start());
          setOpen(true);
        }}
      >
        {circular ? <Pencil size={16} /> : <Plus size={18} />} {circular ? t('Edit') : t('New circular')}
      </Button>
      <Drawer
        wide
        open={open}
        onClose={() => setOpen(false)}
        title={circular ? t('Edit circular') : t('New circular')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run(circular?.id ?? null, v)}>
              {circular ? t('Save') : t('Send to staff')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Title')} required error={err('title')}>
            <Input value={v.title} onChange={(e) => form.set('title', e.target.value)} />
          </Field>
          <Field label={t('Circular')}>
            <Textarea rows={8} value={v.body} onChange={(e) => form.set('body', e.target.value)} />
          </Field>
          <FormGrid>
            <Field label={t('Show from')} error={err('publishOn')}>
              <Input type="date" value={v.publishOn} onChange={(e) => form.set('publishOn', e.target.value)} />
            </Field>
            <Field label={t('Take down after')} hint={t('Leave empty to keep it')} error={err('expiresOn')}>
              <Input type="date" value={v.expiresOn} min={v.publishOn} onChange={(e) => form.set('expiresOn', e.target.value)} />
            </Field>
          </FormGrid>
          <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-700">
            <input type="checkbox" className="h-5 w-5 accent-brand-700" checked={v.pinned} onChange={(e) => form.set('pinned', e.target.checked)} />
            {t('Keep at the top of the list')}
          </label>
          <Field label={t('Photo of the circular')} hint={t('A scan or photo of the signed order, if there is one.')}>
            <ImageField value={v.attachment} onChange={(url) => form.set('attachment', url)} folder="circulars" />
          </Field>
        </div>
      </Drawer>
    </>
  );
}

export function MarkRead({ id }: { id: string }) {
  const t = useT();
  const read = useAction(markCircularReadAction, { success: t('Thank you') });
  return (
    <LoadingButton size="lg" variant="success" loading={read.busy} onClick={() => read.run(id)}>
      <CheckCheck size={18} /> {t('I have read this')}
    </LoadingButton>
  );
}

export function DeleteCircular({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const remove = useAction(deleteCircularAction, { success: t('Removed'), onDone: () => router.push('/admin/circulars') });
  return (
    <ConfirmButton title={t('Remove this circular?')} confirmLabel={t('Remove')} onConfirm={async () => void (await remove.run(id))}>
      <Trash2 size={16} /> {t('Remove')}
    </ConfirmButton>
  );
}
