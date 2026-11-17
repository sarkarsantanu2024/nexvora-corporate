'use client';

/** The centre's own contact details, and the reset and switch-off buttons for its logins. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { ConfirmButton, LoadingButton, useToast } from '@/components/ui/client';
import { Field, FormGrid, Input, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { resetLoginPasswordAction, setLoginActiveAction, updateCentreProfileAction } from '@/server/centre/children/actions';
import { LoginDetails, type LoginIssued } from './login-details';

export type ProfileValues = { phone: string; whatsapp: string; email: string; address: string; area: string; mapUrl: string; photo: string };

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = (Object.keys(values) as (keyof ProfileValues)[]).some((key) => values[key] !== initial[key]);

  const bind = (key: keyof ProfileValues) => ({
    value: values[key],
    invalid: Boolean(errors[key]),
    onChange: (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value })),
  });

  async function save() {
    setSaving(true);
    setErrors({});
    const result = await updateCentreProfileAction(values);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      return toast.error(t(result.error));
    }
    toast.success(t('Centre details saved'));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Photo of the centre')}</p>
        <ImageField value={values.photo} onChange={(photo) => setValues((v) => ({ ...v, photo }))} folder="centres" shape="wide" />
      </div>
      <FormGrid>
        <Field label={t('Phone')} error={errors.phone && t(errors.phone)}>
          <Input type="tel" inputMode="numeric" {...bind('phone')} />
        </Field>
        <Field label={t('WhatsApp number')} error={errors.whatsapp && t(errors.whatsapp)}>
          <Input type="tel" inputMode="numeric" {...bind('whatsapp')} />
        </Field>
      </FormGrid>
      <Field label={t('Email')} error={errors.email && t(errors.email)}>
        <Input type="email" {...bind('email')} />
      </Field>
      <Field label={t('Address')} error={errors.address && t(errors.address)}>
        <Textarea {...bind('address')} rows={2} maxLength={300} />
      </Field>
      <FormGrid>
        <Field label={t('Area')} error={errors.area && t(errors.area)} hint={t('The locality, as parents would say it.')}>
          <Input {...bind('area')} />
        </Field>
        <Field label={t('Google Maps link')} error={errors.mapUrl && t(errors.mapUrl)} hint={t('Open the centre in Google Maps, tap Share and paste the link.')}>
          <Input type="url" {...bind('mapUrl')} placeholder="https://maps.app.goo.gl/..." />
        </Field>
      </FormGrid>
      <div className="flex justify-end">
        <LoadingButton loading={saving} disabled={!dirty} onClick={save}>
          {t('Save details')}
        </LoadingButton>
      </div>
    </div>
  );
}

export function LoginActions({ userId, name, phone, active }: { userId: string; name: string; phone: string; active: boolean }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [issued, setIssued] = useState<LoginIssued | null>(null);
  const [busy, setBusy] = useState(false);

  async function setActive(next: boolean) {
    setBusy(true);
    const result = await setLoginActiveAction(userId, next);
    setBusy(false);
    if (!result.ok) return toast.error(t(result.error));
    toast.success(next ? t('{name} can log in again', { name }) : t('{name} can no longer log in', { name }));
    router.refresh();
  }

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {active ? (
        <>
          <ConfirmButton
            size="sm"
            variant="ghost"
            danger={false}
            title={t("Reset {name}'s password?", { name })}
            text={t('Their old password stops working. You get a new starting password to pass on.')}
            confirmLabel={t('Reset password')}
            onConfirm={async () => {
              const result = await resetLoginPasswordAction(userId);
              if (!result.ok) return toast.error(t(result.error));
              setIssued({ username: result.data.username, password: result.data.password, phone: result.data.phone || phone, greeting: `Hello ${name}` });
            }}
          >
            {t('Reset password')}
          </ConfirmButton>
          <ConfirmButton
            size="sm"
            variant="ghost"
            title={t("Switch off {name}'s login?", { name })}
            text={t('They will not be able to log in until you switch it on again.')}
            confirmLabel={t('Switch off')}
            onConfirm={() => setActive(false)}
          >
            {t('Switch off')}
          </ConfirmButton>
        </>
      ) : (
        <LoadingButton size="sm" variant="ghost" loading={busy} onClick={() => setActive(true)}>
          {t('Switch on')}
        </LoadingButton>
      )}
      <LoginDetails login={issued} onClose={() => setIssued(null)} area="centre dashboard" />
    </div>
  );
}
