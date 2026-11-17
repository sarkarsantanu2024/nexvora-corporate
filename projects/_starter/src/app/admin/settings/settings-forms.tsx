'use client';

import { LoadingButton } from '@/components/ui/client';
import { Field, FormGrid, Input, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { saveOrgSettingsAction } from '@/server/admin/actions';
import { useAction, useForm } from '../_ui/use-action';

type Org = { name: string; legalName: string; phone: string; email: string; address: string };

export function OrgForm({ initial }: { initial: Org }) {
  const t = useT();
  const { values, set } = useForm<Org>(initial);
  const save = useAction(saveOrgSettingsAction, { success: t('Business details saved') });
  const errors = save.fields;
  return (
    <>
      <FormGrid>
        <Field label={t('Name')} required error={errors.name && t(errors.name)}>
          <Input value={values.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
        </Field>
        <Field label={t('Legal name')} hint={t('As it should read on bills and letters')} error={errors.legalName && t(errors.legalName)}>
          <Input value={values.legalName} onChange={(e) => set('legalName', e.target.value)} />
        </Field>
        <Field label={t('Phone')} error={errors.phone && t(errors.phone)}>
          <Input value={values.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" invalid={Boolean(errors.phone)} />
        </Field>
        <Field label={t('Email')} error={errors.email && t(errors.email)}>
          <Input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(errors.email)} />
        </Field>
        <Field label={t('Address')} className="sm:col-span-2" error={errors.address && t(errors.address)}>
          <Textarea rows={2} value={values.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
      </FormGrid>
      <div className="mt-4 flex justify-end">
        <LoadingButton loading={save.busy} onClick={() => save.run(values)}>
          {t('Save')}
        </LoadingButton>
      </div>
    </>
  );
}
