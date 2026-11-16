'use client';

import { Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { deleteCircularAction, pinCircularAction, saveCircularAction } from '@/server/hq/actions';
import { Toggle } from '../_ui/toggle';
import { useAction, useForm } from '../_ui/use-action';

export type CircularValues = { id?: string; title: string; body: string; centreId: string | null; pinned: boolean; publishOn: string; expiresOn: string | null };

export function CircularForm({ circular, centres, today }: { circular?: CircularValues; centres: { id: string; name: string }[]; today: string }) {
  const blank: CircularValues = { title: '', body: '', centreId: null, pinned: false, publishOn: today, expiresOn: null };
  const [open, setOpen] = useState(false);
  const { values, set, reset } = useForm<CircularValues>(circular ?? blank);
  const save = useAction(saveCircularAction, {
    success: circular ? 'Circular updated' : 'Circular sent',
    onDone: () => {
      setOpen(false);
      if (!circular) reset(blank);
    },
  });
  const errors = save.fields;

  return (
    <>
      {circular ? (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Pencil size={15} /> Edit
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus size={18} /> New circular
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => !save.busy && setOpen(false)}
        wide
        title={circular ? 'Edit circular' : 'New circular to centres'}
        description="It is for the centres from the first day until the last day set below."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={save.busy}>
              Cancel
            </Button>
            <LoadingButton
              loading={save.busy}
              onClick={() => {
                const { id, ...input } = values;
                return save.run(id ?? null, input);
              }}
            >
              {circular ? 'Save changes' : 'Send circular'}
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label="Title" required className="sm:col-span-2" error={errors.title}>
            <Input value={values.title} onChange={(e) => set('title', e.target.value)} invalid={Boolean(errors.title)} autoFocus />
          </Field>
          <Field label="Message" className="sm:col-span-2" error={errors.body}>
            <Textarea rows={7} value={values.body} onChange={(e) => set('body', e.target.value)} />
          </Field>
          <Field label="Send to" className="sm:col-span-2">
            <Select value={values.centreId ?? ''} onChange={(e) => set('centreId', e.target.value || null)}>
              <option value="">All centres</option>
              {centres.map((centre) => (
                <option key={centre.id} value={centre.id}>
                  Only {centre.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="First day shown" required error={errors.publishOn}>
            <Input type="date" value={values.publishOn} onChange={(e) => set('publishOn', e.target.value)} invalid={Boolean(errors.publishOn)} />
          </Field>
          <Field label="Last day shown" hint="Leave empty to keep it until you delete it" error={errors.expiresOn}>
            <Input type="date" value={values.expiresOn ?? ''} min={values.publishOn} onChange={(e) => set('expiresOn', e.target.value || null)} invalid={Boolean(errors.expiresOn)} />
          </Field>
          <div className="sm:col-span-2">
            <Toggle checked={values.pinned} onChange={(next) => set('pinned', next)} label="Pin to the top" hint="A pinned circular stays above newer ones." />
          </div>
        </FormGrid>
      </Drawer>
    </>
  );
}

export function PinCircular({ id, pinned }: { id: string; pinned: boolean }) {
  const pin = useAction(pinCircularAction, { success: pinned ? 'Unpinned' : 'Pinned to the top' });
  return (
    <LoadingButton variant="secondary" size="sm" loading={pin.busy} onClick={() => pin.run(id, !pinned)}>
      {pinned ? <PinOff size={15} /> : <Pin size={15} />} {pinned ? 'Unpin' : 'Pin'}
    </LoadingButton>
  );
}

export function DeleteCircular({ id, title }: { id: string; title: string }) {
  const remove = useAction(deleteCircularAction, { success: 'Circular deleted' });
  return (
    <ConfirmButton size="sm" title="Delete this circular?" text={`"${title}" is removed for every centre.`} confirmLabel="Delete" onConfirm={async () => void (await remove.run(id))}>
      <Trash2 size={15} /> Delete
    </ConfirmButton>
  );
}
