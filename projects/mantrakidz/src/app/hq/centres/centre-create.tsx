'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { createCentreAction } from '@/server/hq/actions';
import { useAction, useForm } from '../_ui/use-action';

const BLANK = {
  name: 'Mantra Kidz ',
  area: '',
  city: '',
  state: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  isCompanyOwned: false,
  royaltyType: 'percent' as 'percent' | 'fixed',
  royaltyValue: '',
  franchiseFee: '',
};

/** The short form that starts a centre; the rest is filled in on the centre's own page. */
export function CentreCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { values, set } = useForm(BLANK);
  const create = useAction(createCentreAction, { success: (centre) => `${centre.code} added`, onDone: (centre) => router.push(`/hq/centres/${centre.id}`) });
  const errors = create.fields;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} /> Add centre
      </Button>
      <Drawer
        open={open}
        onClose={() => !create.busy && setOpen(false)}
        wide
        title="Add a centre"
        description="It starts in onboarding and gets the next MK code. A franchise lead can also be converted straight into a centre."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={create.busy}>
              Cancel
            </Button>
            <LoadingButton
              loading={create.busy}
              onClick={() => create.run({ ...values, royaltyValue: Number(values.royaltyValue) || 0, franchiseFee: Number(values.franchiseFee) || 0 })}
            >
              Add centre
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label="Centre name" required className="sm:col-span-2" error={errors.name}>
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} autoFocus />
          </Field>
          <Field label="Area">
            <Input value={values.area} onChange={(e) => set('area', e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={values.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={values.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="Who runs it">
            <Select value={values.isCompanyOwned ? 'company' : 'franchise'} onChange={(e) => set('isCompanyOwned', e.target.value === 'company')}>
              <option value="franchise">A franchise owner</option>
              <option value="company">Head office (company-owned, no royalty)</option>
            </Select>
          </Field>
          <Field label={values.isCompanyOwned ? 'Centre head' : 'Owner name'} error={errors.ownerName}>
            <Input value={values.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
          </Field>
          <Field label={values.isCompanyOwned ? 'Centre head mobile' : 'Owner mobile'} error={errors.ownerPhone}>
            <Input value={values.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} inputMode="tel" invalid={Boolean(errors.ownerPhone)} />
          </Field>
          <Field label="Email" error={errors.ownerEmail} className="sm:col-span-2">
            <Input type="email" value={values.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} invalid={Boolean(errors.ownerEmail)} />
          </Field>
          {values.isCompanyOwned ? null : (
            <>
              <Field label="Royalty">
                <Select value={values.royaltyType} onChange={(e) => set('royaltyType', e.target.value as 'percent' | 'fixed')}>
                  <option value="percent">Percent of fee collection</option>
                  <option value="fixed">Fixed amount a month</option>
                </Select>
              </Field>
              <Field label={values.royaltyType === 'percent' ? 'Percent' : 'Rupees a month'} error={errors.royaltyValue}>
                <Input type="number" min={0} value={values.royaltyValue} onChange={(e) => set('royaltyValue', e.target.value)} invalid={Boolean(errors.royaltyValue)} />
              </Field>
              <Field label="Franchise fee, rupees" error={errors.franchiseFee}>
                <Input type="number" min={0} value={values.franchiseFee} onChange={(e) => set('franchiseFee', e.target.value)} invalid={Boolean(errors.franchiseFee)} />
              </Field>
            </>
          )}
        </FormGrid>
      </Drawer>
    </>
  );
}
