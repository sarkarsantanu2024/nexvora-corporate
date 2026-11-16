'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Textarea } from '@/components/ui/core';
import { fillTemplate } from '@/lib/wa';
import {
  addAcademicYearAction,
  removeSampleDataAction,
  saveFeeSettingsAction,
  saveOrgSettingsAction,
  saveRoyaltySettingsAction,
  setCurrentYearAction,
} from '@/server/hq/actions';
import { SAMPLE_CONFIRM_WORD } from '@/server/hq/constants';
import { useAction, useForm } from '../_ui/use-action';

type Org = { name: string; legalName: string; phone: string; email: string; address: string };

export function OrgForm({ initial }: { initial: Org }) {
  const { values, set } = useForm<Org>(initial);
  const save = useAction(saveOrgSettingsAction, { success: 'Organisation details saved' });
  const errors = save.fields;
  return (
    <>
      <FormGrid>
        <Field label="Name" required error={errors.name}>
          <Input value={values.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Legal name" hint="As it should read on receipts and letters" error={errors.legalName}>
          <Input value={values.legalName} onChange={(e) => set('legalName', e.target.value)} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input value={values.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" invalid={Boolean(errors.phone)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(errors.email)} />
        </Field>
        <Field label="Address" className="sm:col-span-2" error={errors.address}>
          <Textarea rows={2} value={values.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
      </FormGrid>
      <div className="mt-4 flex justify-end">
        <LoadingButton loading={save.busy} onClick={() => save.run(values)}>
          Save
        </LoadingButton>
      </div>
    </>
  );
}

export function RoyaltyDayForm({ dueDay }: { dueDay: number }) {
  const [value, setValue] = useState(String(dueDay));
  const save = useAction(saveRoyaltySettingsAction, { success: 'Royalty due day saved' });
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Royalty is due on day" hint="Of the month after the one it is for. Applies to royalty raised from now on." error={save.fields.dueDay} className="w-full sm:w-80">
        <Input type="number" min={1} max={28} value={value} onChange={(e) => setValue(e.target.value)} invalid={Boolean(save.fields.dueDay)} />
      </Field>
      <LoadingButton loading={save.busy} onClick={() => save.run({ dueDay: Number(value) })} className="mb-7">
        Save
      </LoadingButton>
    </div>
  );
}

type Fees = { dueDay: string; reminderTemplate: string; receiptFooter: string };
const SAMPLE = { parent: 'Mrs Roy', child: 'Aarav', amount: '₹2,500', month: 'Nov 2026', centre: 'Mantra Kidz Lake Town' };

export function FeeSettingsForm({ initial }: { initial: Fees }) {
  const { values, set } = useForm<Fees>(initial);
  const save = useAction(saveFeeSettingsAction, { success: 'Fee settings saved' });
  const errors = save.fields;
  return (
    <>
      <FormGrid>
        <Field label="Monthly fee is due on day" hint="Of each month, from 1 to 28" error={errors.dueDay}>
          <Input type="number" min={1} max={28} value={values.dueDay} onChange={(e) => set('dueDay', e.target.value)} invalid={Boolean(errors.dueDay)} />
        </Field>
        <Field label="Line at the bottom of a receipt" error={errors.receiptFooter}>
          <Input value={values.receiptFooter} onChange={(e) => set('receiptFooter', e.target.value)} />
        </Field>
        <Field
          label="WhatsApp fee reminder"
          className="sm:col-span-2"
          hint="These words are filled in for each child: {parent} {child} {amount} {month} {centre}"
          error={errors.reminderTemplate}
        >
          <Textarea rows={3} value={values.reminderTemplate} onChange={(e) => set('reminderTemplate', e.target.value)} invalid={Boolean(errors.reminderTemplate)} />
        </Field>
      </FormGrid>
      {values.reminderTemplate.trim() ? (
        <div className="mt-3 rounded-xl bg-mint-50 px-4 py-3 text-sm text-ink-700">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-mint-700">How it will read (example names)</p>
          {fillTemplate(values.reminderTemplate, SAMPLE)}
        </div>
      ) : null}
      <div className="mt-4 flex justify-end">
        <LoadingButton loading={save.busy} onClick={() => save.run({ ...values, dueDay: Number(values.dueDay) })}>
          Save
        </LoadingButton>
      </div>
    </>
  );
}

export function AddYear({ suggestion }: { suggestion: { name: string; startDate: string; endDate: string } }) {
  const [open, setOpen] = useState(false);
  const { values, set } = useForm(suggestion);
  const add = useAction(addAcademicYearAction, { success: 'Academic year added', onDone: () => setOpen(false) });
  const errors = add.fields;
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={15} /> Add year
      </Button>
      <Modal
        open={open}
        onClose={() => !add.busy && setOpen(false)}
        title="Add an academic year"
        description="It does not become the current year until you set it."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={add.busy}>
              Cancel
            </Button>
            <LoadingButton loading={add.busy} onClick={() => add.run(values)}>
              Add year
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label="Name" required hint="For example 2027-28" className="sm:col-span-2" error={errors.name}>
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
          </Field>
          <Field label="Starts on" required error={errors.startDate}>
            <Input type="date" value={values.startDate} onChange={(e) => set('startDate', e.target.value)} invalid={Boolean(errors.startDate)} />
          </Field>
          <Field label="Ends on" required error={errors.endDate}>
            <Input type="date" value={values.endDate} onChange={(e) => set('endDate', e.target.value)} invalid={Boolean(errors.endDate)} />
          </Field>
        </FormGrid>
      </Modal>
    </>
  );
}

export function MakeCurrent({ id, name }: { id: string; name: string }) {
  const set = useAction(setCurrentYearAction, { success: `${name} is now the current year` });
  return (
    <LoadingButton variant="secondary" size="sm" loading={set.busy} onClick={() => set.run(id)}>
      Set as current
    </LoadingButton>
  );
}

/** Asks for the word to be typed, so the sample data cannot be removed by a stray click. */
export function RemoveSample({ centres, leads }: { centres: number; leads: number }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const remove = useAction(removeSampleDataAction, {
    success: (result) => `Removed ${result.centres} sample ${result.centres === 1 ? 'centre' : 'centres'} and ${result.leads} sample ${result.leads === 1 ? 'lead' : 'leads'}`,
    onDone: () => setOpen(false),
  });
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 size={17} /> Remove sample data
      </Button>
      <Modal
        open={open}
        onClose={() => !remove.busy && setOpen(false)}
        title="Remove the sample data?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={remove.busy}>
              Cancel
            </Button>
            <LoadingButton variant="accent" loading={remove.busy} disabled={typed.trim() !== SAMPLE_CONFIRM_WORD} onClick={() => remove.run(typed)}>
              Remove sample data
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-3 text-[15px] text-ink-700">
          <p>
            This deletes the {centres} sample {centres === 1 ? 'centre' : 'centres'} with all their children, bills, receipts, attendance, expenses, royalty and logins, and the {leads} sample
            franchise {leads === 1 ? 'lead' : 'leads'}.
          </p>
          <p>Your real centres, real leads, programmes, website and head office logins are not touched. This cannot be undone.</p>
          <Field label={`Type ${SAMPLE_CONFIRM_WORD} to confirm`} error={remove.fields.confirmation}>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
