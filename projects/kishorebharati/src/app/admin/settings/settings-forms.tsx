'use client';

import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Field, FormGrid, Input, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { saveOrgSettingsAction } from '@/server/admin/actions';
import { saveReminderSettingsAction } from '@/server/reminders/actions';
import { useAction, useForm } from '../_ui/use-action';

type ReminderKindSetting = { key: string; label: string; description: string; placeholders: string[]; defaultTemplate: string; enabled: boolean; template: string };

/** One switch and one wording box per kind of reminder. */
export function ReminderForm({ initial }: { initial: ReminderKindSetting[] }) {
  const t = useT();
  const [kinds, setKinds] = useState(initial);
  const save = useAction(saveReminderSettingsAction, { success: t('Reminder settings saved') });
  const change = (key: string, patch: Partial<ReminderKindSetting>) => setKinds((list) => list.map((kind) => (kind.key === key ? { ...kind, ...patch } : kind)));
  return (
    <>
      <div className="space-y-6">
        {kinds.map((kind) => (
          <div key={kind.key} className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 size-4 accent-brand-700" checked={kind.enabled} onChange={(e) => change(kind.key, { enabled: e.target.checked })} />
              <span>
                <span className="block font-semibold text-ink-900">{t(kind.label)}</span>
                <span className="block text-sm text-ink-500">{t(kind.description)}</span>
              </span>
            </label>
            <Field label={t('Message')} hint={t('Words in curly brackets are filled in for each person: {list}', { list: kind.placeholders.map((word) => `{${word}}`).join(' ') })}>
              <Textarea rows={3} value={kind.template} disabled={!kind.enabled} onChange={(e) => change(kind.key, { template: e.target.value })} />
            </Field>
            {kind.template !== kind.defaultTemplate ? (
              <button type="button" className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => change(kind.key, { template: kind.defaultTemplate })}>
                {t('Use the original wording')}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <LoadingButton loading={save.busy} onClick={() => save.run({ kinds: kinds.map(({ key, enabled, template }) => ({ key, enabled, template })) })}>
          {t('Save')}
        </LoadingButton>
      </div>
    </>
  );
}

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
