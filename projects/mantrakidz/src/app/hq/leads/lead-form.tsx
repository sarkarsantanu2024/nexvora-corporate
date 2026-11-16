'use client';

import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { createLeadAction, updateLeadAction } from '@/server/hq/actions';
import { LEAD_SOURCES, sourceLabel } from '@/server/hq/constants';
import { useAction, useForm } from '../_ui/use-action';

export type LeadFormValues = {
  id?: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  occupation: string;
  investmentRange: string;
  hasSpace: boolean | null;
  spaceSqft: number | null;
  message: string;
  source: string;
  assignedTo: string | null;
  nextFollowUp: string | null;
};

const EMPTY: LeadFormValues = {
  name: '',
  phone: '',
  email: '',
  city: '',
  state: '',
  occupation: '',
  investmentRange: '',
  hasSpace: null,
  spaceSqft: null,
  message: '',
  source: 'phone',
  assignedTo: null,
  nextFollowUp: null,
};

/** Add a lead by hand, or edit one. The same drawer does both. */
export function LeadForm({ lead, people }: { lead?: LeadFormValues; people: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const form = useForm<LeadFormValues>(lead ?? EMPTY);
  const { values, set } = form;
  const close = () => setOpen(false);
  const create = useAction(createLeadAction, { success: 'Lead added', onDone: () => { close(); form.reset(EMPTY); } });
  const update = useAction(updateLeadAction, { success: 'Lead updated', onDone: close });
  const busy = create.busy || update.busy;
  const errors = lead ? update.fields : create.fields;
  // A source that is not in the usual list (an import, an older record) stays selectable.
  const sources = LEAD_SOURCES.includes(values.source as (typeof LEAD_SOURCES)[number]) ? LEAD_SOURCES : [...LEAD_SOURCES, values.source];

  const save = () => {
    const { id, ...input } = values;
    return id ? update.run(id, input) : create.run(input);
  };

  return (
    <>
      {lead ? (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <Pencil size={16} /> Edit details
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus size={18} /> Add lead
        </Button>
      )}
      <Drawer
        open={open}
        onClose={close}
        wide
        title={lead ? 'Edit lead' : 'Add a franchise lead'}
        description={lead ? undefined : 'For someone who called, walked in or was referred. Website enquiries arrive here on their own.'}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <LoadingButton loading={busy} onClick={save}>
              {lead ? 'Save changes' : 'Add lead'}
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label="Name" required error={errors.name}>
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} autoFocus />
          </Field>
          <Field label="Mobile number" required error={errors.phone}>
            <Input value={values.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" invalid={Boolean(errors.phone)} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(errors.email)} />
          </Field>
          <Field label="Occupation" error={errors.occupation}>
            <Input value={values.occupation} onChange={(e) => set('occupation', e.target.value)} />
          </Field>
          <Field label="City or area" error={errors.city}>
            <Input value={values.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="State" error={errors.state}>
            <Input value={values.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="Investment range" hint="As the person said it, for example 8 to 12 lakh" error={errors.investmentRange}>
            <Input value={values.investmentRange} onChange={(e) => set('investmentRange', e.target.value)} />
          </Field>
          <Field label="How they reached us" error={errors.source}>
            <Select value={values.source} onChange={(e) => set('source', e.target.value)}>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {sourceLabel(source)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Has a space for the school">
            <Select value={values.hasSpace === null ? '' : values.hasSpace ? 'yes' : 'no'} onChange={(e) => set('hasSpace', e.target.value === '' ? null : e.target.value === 'yes')}>
              <option value="">Not known</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="Size of the space, sq ft" error={errors.spaceSqft}>
            <Input
              type="number"
              min={0}
              value={values.spaceSqft ?? ''}
              onChange={(e) => set('spaceSqft', e.target.value === '' ? null : Number(e.target.value))}
              invalid={Boolean(errors.spaceSqft)}
            />
          </Field>
          <Field label="Assigned to">
            <Select value={values.assignedTo ?? ''} onChange={(e) => set('assignedTo', e.target.value || null)}>
              <option value="">Nobody yet</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Next follow-up" error={errors.nextFollowUp}>
            <Input type="date" value={values.nextFollowUp ?? ''} onChange={(e) => set('nextFollowUp', e.target.value || null)} />
          </Field>
          <Field label="What they said" className="sm:col-span-2" error={errors.message}>
            <Textarea value={values.message} onChange={(e) => set('message', e.target.value)} />
          </Field>
        </FormGrid>
      </Drawer>
    </>
  );
}
