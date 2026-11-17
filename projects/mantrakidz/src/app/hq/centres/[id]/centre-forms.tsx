'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ImageField } from '@/components/cms/image-field';
import { ConfirmButton, LoadingButton } from '@/components/ui/client';
import { Field, FormGrid, Input, Notice, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { CentreStatus } from '@/db/schema';
import { deleteCentreAction, setCentreStatusAction, updateCentreAgreementAction, updateCentreProfileAction } from '@/server/hq/actions';
import { Toggle } from '../../_ui/toggle';
import { useAction, useForm } from '../../_ui/use-action';

export type ProfileValues = {
  name: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  mapUrl: string;
  photo: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  openedOn: string | null;
  showOnWebsite: boolean;
  isCompanyOwned: boolean;
  notes: string;
};

export function ProfileForm({ id, initial, isAdmin }: { id: string; initial: ProfileValues; isAdmin: boolean }) {
  const t = useT();
  const { values, set } = useForm<ProfileValues>(initial);
  const save = useAction(updateCentreProfileAction, { success: t('Profile saved') });
  const errors = save.fields;
  const text = (key: keyof ProfileValues & string, label: string, props: { type?: string; inputMode?: 'tel' | 'numeric'; hint?: string; className?: string } = {}) => (
    <Field label={label} error={errors[key] && t(errors[key])} hint={props.hint} className={props.className}>
      <Input type={props.type} inputMode={props.inputMode} value={String(values[key] ?? '')} onChange={(e) => set(key, e.target.value as never)} invalid={Boolean(errors[key])} />
    </Field>
  );

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">{t('School')}</h3>
        <FormGrid>
          <Field label={t('School name')} required error={errors.name && t(errors.name)} className="sm:col-span-2">
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
          </Field>
          <Field label={t('Photo of the school')} className="sm:col-span-2">
            <ImageField value={values.photo} onChange={(url) => set('photo', url)} folder="centres" shape="wide" />
          </Field>
          {text('address', t('Address'), { className: 'sm:col-span-2' })}
          {text('area', t('Area'))}
          {text('city', t('City'))}
          {text('state', t('State'))}
          {text('pincode', t('Pincode'), { inputMode: 'numeric' })}
          {text('phone', t('Phone'), { inputMode: 'tel' })}
          {text('whatsapp', t('WhatsApp number'), { inputMode: 'tel' })}
          {text('email', t('Email'), { type: 'email' })}
          {text('mapUrl', t('Google Maps link'), { hint: t('Paste the share link of the school from Google Maps') })}
          <Field label={t('Opened on')} error={errors.openedOn && t(errors.openedOn)}>
            <Input type="date" value={values.openedOn ?? ''} onChange={(e) => set('openedOn', e.target.value || null)} />
          </Field>
        </FormGrid>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">{values.isCompanyOwned ? t('School head') : t('Owner')}</h3>
        <FormGrid>
          {text('ownerName', t('Name'))}
          {text('ownerPhone', t('Mobile number'), { inputMode: 'tel' })}
          {text('ownerEmail', t('Email'), { type: 'email' })}
        </FormGrid>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Toggle checked={values.showOnWebsite} onChange={(next) => set('showOnWebsite', next)} label={t('Show on the website')} hint={t('Lists this school on the Schools page and in the enquiry form.')} />
        <Toggle
          checked={values.isCompanyOwned}
          onChange={(next) => set('isCompanyOwned', next)}
          disabled={!isAdmin}
          label={t('Company-owned')}
          hint={isAdmin ? t('Run by head office. No royalty is raised for it.') : t('Only a head office admin can change this.')}
        />
      </section>

      <Field label={t('Remarks')} hint={t('For head office only')} error={errors.notes && t(errors.notes)}>
        <Textarea value={values.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>

      <div className="flex justify-end">
        <LoadingButton loading={save.busy} onClick={() => save.run(id, values)}>
          {t('Save profile')}
        </LoadingButton>
      </div>
    </div>
  );
}

export type AgreementValues = {
  agreementStart: string | null;
  agreementEnd: string | null;
  franchiseFee: string;
  franchiseFeePaid: string;
  royaltyType: 'percent' | 'fixed';
  royaltyValue: string;
};

export function AgreementForm({ id, initial, isAdmin, isCompanyOwned, effectiveFrom }: { id: string; initial: AgreementValues; isAdmin: boolean; isCompanyOwned: boolean; effectiveFrom: string }) {
  const t = useT();
  const { values, set } = useForm<AgreementValues>(initial);
  const save = useAction(updateCentreAgreementAction, { success: t('Agreement saved') });
  const errors = save.fields;
  const termsChanged = values.royaltyType !== initial.royaltyType || values.royaltyValue !== initial.royaltyValue;

  return (
    <div className="space-y-6">
      <FormGrid>
        <Field label={t('Agreement starts')} error={errors.agreementStart && t(errors.agreementStart)}>
          <Input type="date" value={values.agreementStart ?? ''} onChange={(e) => set('agreementStart', e.target.value || null)} />
        </Field>
        <Field label={t('Agreement ends')} error={errors.agreementEnd && t(errors.agreementEnd)}>
          <Input type="date" value={values.agreementEnd ?? ''} onChange={(e) => set('agreementEnd', e.target.value || null)} invalid={Boolean(errors.agreementEnd)} />
        </Field>
        <Field label={t('Franchise fee, rupees')} error={errors.franchiseFee && t(errors.franchiseFee)}>
          <Input type="number" min={0} value={values.franchiseFee} onChange={(e) => set('franchiseFee', e.target.value)} invalid={Boolean(errors.franchiseFee)} />
        </Field>
        <Field label={t('Received so far, rupees')} error={errors.franchiseFeePaid && t(errors.franchiseFeePaid)}>
          <Input type="number" min={0} value={values.franchiseFeePaid} onChange={(e) => set('franchiseFeePaid', e.target.value)} invalid={Boolean(errors.franchiseFeePaid)} />
        </Field>
      </FormGrid>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">{t('Monthly royalty')}</h3>
        {isCompanyOwned ? (
          <Notice>{t('This school is company-owned, so no royalty is raised for it.')}</Notice>
        ) : (
          <>
            <FormGrid>
              <Field label={t('Worked out as')}>
                <Select value={values.royaltyType} disabled={!isAdmin} onChange={(e) => set('royaltyType', e.target.value as 'percent' | 'fixed')}>
                  <option value="percent">{t("Percent of the month's fee collection")}</option>
                  <option value="fixed">{t('Fixed amount a month')}</option>
                </Select>
              </Field>
              <Field label={values.royaltyType === 'percent' ? t('Percent') : t('Rupees a month')} error={errors.royaltyValue && t(errors.royaltyValue)}>
                <Input type="number" min={0} disabled={!isAdmin} value={values.royaltyValue} onChange={(e) => set('royaltyValue', e.target.value)} invalid={Boolean(errors.royaltyValue)} />
              </Field>
            </FormGrid>
            {!isAdmin ? (
              <p className="mt-2 text-sm text-ink-500">{t('Only a head office admin can change royalty terms.')}</p>
            ) : termsChanged ? (
              <Notice tone="amber" className="mt-3">
                {t('The new terms apply from {effectiveFrom} onwards. Months already over keep the old terms, and the change is recorded in the activity log.', { effectiveFrom })}
              </Notice>
            ) : null}
          </>
        )}
      </section>

      <div className="flex justify-end">
        <LoadingButton
          loading={save.busy}
          onClick={() =>
            save.run(id, {
              ...values,
              franchiseFee: Number(values.franchiseFee) || 0,
              franchiseFeePaid: Number(values.franchiseFeePaid) || 0,
              royaltyValue: Number(values.royaltyValue) || 0,
            })
          }
        >
          {t('Save agreement')}
        </LoadingButton>
      </div>
    </div>
  );
}

const STATUS_STEPS: Record<CentreStatus, { to: CentreStatus; label: string; title: string; text: string; danger: boolean }[]> = {
  onboarding: [{ to: 'active', label: 'Activate', title: 'Activate this school?', text: 'It becomes an active school from today: royalty is raised for it and it counts in the network figures.', danger: false }],
  active: [
    { to: 'suspended', label: 'Suspend', title: 'Suspend this school?', text: 'It stops counting as an active school and no new royalty is raised. Its records stay as they are. You can activate it again.', danger: true },
    { to: 'closed', label: 'Close', title: 'Close this school?', text: 'Use this when the school has shut for good. Its history stays for reports.', danger: true },
  ],
  suspended: [
    { to: 'active', label: 'Activate again', title: 'Activate this school again?', text: 'It goes back to being an active school.', danger: false },
    { to: 'closed', label: 'Close', title: 'Close this school?', text: 'Use this when the school has shut for good. Its history stays for reports.', danger: true },
  ],
  closed: [{ to: 'active', label: 'Reopen', title: 'Reopen this school?', text: 'It goes back to being an active school.', danger: false }],
};

export function StatusActions({ id, status }: { id: string; status: CentreStatus }) {
  const t = useT();
  const change = useAction(setCentreStatusAction, { success: t('Status changed') });
  return (
    <>
      {STATUS_STEPS[status].map((step) => (
        <ConfirmButton
          key={step.to}
          variant={step.danger ? 'danger' : 'secondary'}
          danger={step.danger}
          title={t(step.title)}
          text={t(step.text)}
          confirmLabel={t(step.label)}
          onConfirm={async () => void (await change.run(id, step.to))}
        >
          {t(step.label)}
        </ConfirmButton>
      ))}
    </>
  );
}

export function DeleteCentre({ id, name }: { id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const remove = useAction(deleteCentreAction, { success: t('School deleted'), onDone: () => router.push('/hq/centres') });
  return (
    <ConfirmButton
      size="sm"
      title={t('Delete {name}?', { name })}
      text={t('Only a school with no children on its records can be deleted. It disappears from every list and its logins stop working.')}
      confirmLabel={t('Delete school')}
      onConfirm={async () => void (await remove.run(id))}
    >
      <Trash2 size={15} /> {t('Delete school')}
    </ConfirmButton>
  );
}
