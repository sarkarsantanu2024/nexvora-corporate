'use client';

import { KeyRound, LockOpen, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { createCentreUserAction, createHqUserAction, resetUserPasswordAction, setUserActiveAction, unlockUserAction } from '@/server/hq/actions';
import { useAction, useForm } from './use-action';

type Scope = { kind: 'hq' } | { kind: 'centre'; centreId: string };
type NewLogin = { name: string; username: string; phone: string; email: string; role: string; password: string; mustChange: boolean };

const ROLE_CHOICES = {
  hq: [
    { value: 'hq_staff', label: 'Head office staff' },
    { value: 'hq_admin', label: 'Head office admin' },
  ],
  centre: [
    { value: 'centre_admin', label: 'Centre head' },
    { value: 'centre_staff', label: 'Centre staff (teacher, front desk)' },
  ],
};

/** Creates a login for head office or for one centre. The password is typed once and never shown again. */
export function NewLogin({ scope, label }: { scope: Scope; label?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const blank: NewLogin = { name: '', username: '', phone: '', email: '', role: ROLE_CHOICES[scope.kind][0].value, password: '', mustChange: true };
  const { values, set, reset } = useForm<NewLogin>(blank);
  const done = () => {
    setOpen(false);
    reset(blank);
  };
  const createHq = useAction(createHqUserAction, { success: (row) => t('Login {username} created', { username: row.username }), onDone: done });
  const createCentre = useAction(createCentreUserAction, { success: (row) => t('Login {username} created', { username: row.username }), onDone: done });
  const busy = createHq.busy || createCentre.busy;
  const errors = scope.kind === 'hq' ? createHq.fields : createCentre.fields;

  const save = () =>
    scope.kind === 'hq'
      ? createHq.run({ ...values, role: values.role as 'hq_admin' | 'hq_staff' })
      : createCentre.run({ ...values, role: values.role as 'centre_admin' | 'centre_staff', centreId: scope.centreId });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus size={18} /> {label ?? t('Add login')}
      </Button>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={scope.kind === 'hq' ? t('Add a head office login') : t('Add a login for this centre')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={busy} onClick={save}>
              {t('Create login')}
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label={t('Name')} required error={errors.name && t(errors.name)}>
            <Input value={values.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} autoFocus />
          </Field>
          <Field label={t('Role')}>
            <Select value={values.role} onChange={(e) => set('role', e.target.value)}>
              {ROLE_CHOICES[scope.kind].map((role) => (
                <option key={role.value} value={role.value}>
                  {t(role.label)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Username')} required hint={t('Small letters and numbers, no spaces')} error={errors.username && t(errors.username)}>
            <Input value={values.username} onChange={(e) => set('username', e.target.value)} autoCapitalize="none" autoComplete="off" invalid={Boolean(errors.username)} />
          </Field>
          <Field label={t('Starting password')} required hint={t('Shown only now. Pass it on in person.')} error={errors.password && t(errors.password)}>
            <Input value={values.password} onChange={(e) => set('password', e.target.value)} autoComplete="off" invalid={Boolean(errors.password)} />
          </Field>
          <Field label={t('Mobile number')} error={errors.phone && t(errors.phone)}>
            <Input value={values.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" invalid={Boolean(errors.phone)} />
          </Field>
          <Field label={t('Email')} error={errors.email && t(errors.email)}>
            <Input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(errors.email)} />
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-ink-700 sm:col-span-2">
            <input type="checkbox" checked={values.mustChange} onChange={(e) => set('mustChange', e.target.checked)} className="h-4 w-4 accent-brand-700" />
            {t('Ask for a new password at the first login')}
          </label>
        </FormGrid>
      </Modal>
    </>
  );
}

/** Reset password, unlock, activate or deactivate, for one row of a logins table. */
export function LoginActions({ id, username, active, locked, isSelf }: { id: string; username: string; active: boolean; locked: boolean; isSelf: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [mustChange, setMustChange] = useState(true);
  const reset = useAction(resetUserPasswordAction, {
    success: t('New password set for {username}', { username }),
    onDone: () => {
      setOpen(false);
      setPassword('');
    },
  });
  const toggle = useAction(setUserActiveAction, { success: active ? t('{username} deactivated', { username }) : t('{username} activated', { username }) });
  const unlock = useAction(unlockUserAction, { success: t('{username} unlocked', { username }) });

  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      {locked ? (
        <LoadingButton variant="secondary" size="sm" loading={unlock.busy} onClick={() => unlock.run(id)}>
          <LockOpen size={15} /> {t('Unlock')}
        </LoadingButton>
      ) : null}
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <KeyRound size={15} /> {t('Reset password')}
      </Button>
      {isSelf ? null : active ? (
        <ConfirmButton
          size="sm"
          title={t('Deactivate {username}?', { username })}
          text={t('This person will not be able to log in until the login is activated again. Nothing they entered is removed.')}
          confirmLabel={t('Deactivate')}
          onConfirm={async () => void (await toggle.run(id, false))}
        >
          {t('Deactivate')}
        </ConfirmButton>
      ) : (
        <LoadingButton variant="secondary" size="sm" loading={toggle.busy} onClick={() => toggle.run(id, true)}>
          {t('Activate')}
        </LoadingButton>
      )}
      <Modal
        open={open}
        onClose={() => !reset.busy && setOpen(false)}
        size="sm"
        title={t('New password for {username}', { username })}
        description={t('The old password stops working at once.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={reset.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={reset.busy} onClick={() => reset.run({ userId: id, password, mustChange })}>
              {t('Set password')}
            </LoadingButton>
          </>
        }
      >
        <Field label={t('Starting password')} required hint={t('At least 6 characters. It is not shown again after you save.')} error={reset.fields.password && t(reset.fields.password)}>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" invalid={Boolean(reset.fields.password)} autoFocus />
        </Field>
        <label className="mt-4 flex items-center gap-2.5 text-sm text-ink-700">
          <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="h-4 w-4 accent-brand-700" />
          {t('Ask for a new password at the next login')}
        </label>
      </Modal>
    </span>
  );
}
