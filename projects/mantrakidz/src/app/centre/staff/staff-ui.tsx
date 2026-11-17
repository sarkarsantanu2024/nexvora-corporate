'use client';

/** Add and edit staff, give or remove a login, mark as left. */
import { KeyRound, Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import {
  createStaffAction,
  createStaffLoginAction,
  deleteStaffAction,
  markStaffLeftAction,
  proposeUsernameAction,
  rejoinStaffAction,
  removeStaffLoginAction,
  updateStaffAction,
} from '@/server/centre/children/actions';
import { STAFF_ROLES } from '@/server/centre/children/constants';
import { LoginDetails, type LoginIssued } from '../settings/login-details';

export type StaffValues = { name: string; roleTitle: string; phone: string; email: string; qualification: string; joinedOn: string; monthlySalary: string };
export type StaffRow = { id: string; name: string; active: boolean; joinedOn: string | null; hasLogin: boolean; username: string | null; values: StaffValues };

export function StaffFormButton({ today, edit }: { today: string; edit?: { id: string; values: StaffValues } }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const blank: StaffValues = { name: '', roleTitle: 'Teacher', phone: '', email: '', qualification: '', joinedOn: today, monthlySalary: '' };
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<StaffValues>(edit?.values ?? blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const bind = (key: keyof StaffValues) => ({
    value: values[key],
    invalid: Boolean(errors[key]),
    onChange: (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value })),
  });
  // A role typed in the past that is not on our list stays selectable.
  const roles = STAFF_ROLES.includes(values.roleTitle as (typeof STAFF_ROLES)[number]) ? [...STAFF_ROLES] : [values.roleTitle, ...STAFF_ROLES];

  async function save() {
    setSaving(true);
    const input = { ...values, monthlySalary: Number(values.monthlySalary || 0) };
    const result = edit ? await updateStaffAction(edit.id, input) : await createStaffAction(input);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      return toast.error(t(result.error));
    }
    toast.success(edit ? t('Saved') : t('{name} added', { name: values.name }));
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {edit ? (
        <Button variant="ghost" size="sm" onClick={() => { setValues(edit.values); setErrors({}); setOpen(true); }}>
          <Pencil size={15} /> {t('Edit')}
        </Button>
      ) : (
        <Button onClick={() => { setValues(blank); setErrors({}); setOpen(true); }}>
          <Plus size={18} /> {t('Add staff')}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={edit ? t('Edit {name}', { name: edit.values.name }) : t('New staff member')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={saving} onClick={save}>
              {edit ? t('Save') : t('Add staff')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Full name')} required error={errors.name && t(errors.name)}>
            <Input {...bind('name')} autoComplete="off" />
          </Field>
          <FormGrid>
            <Field label={t('Role')} required error={errors.roleTitle && t(errors.roleTitle)}>
              <Select {...bind('roleTitle')}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {t(role)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Mobile number')} error={errors.phone && t(errors.phone)}>
              <Input type="tel" inputMode="numeric" {...bind('phone')} autoComplete="off" />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label={t('Joined on')} error={errors.joinedOn && t(errors.joinedOn)}>
              <Input type="date" {...bind('joinedOn')} />
            </Field>
            <Field label={t('Monthly salary')} error={errors.monthlySalary && t(errors.monthlySalary)} hint={t('In rupees.')}>
              <Input type="number" inputMode="numeric" min={0} step={1} {...bind('monthlySalary')} />
            </Field>
          </FormGrid>
          <Field label={t('Qualification')} error={errors.qualification && t(errors.qualification)}>
            <Input {...bind('qualification')} placeholder={t('Montessori trained, B.A.')} />
          </Field>
          <Field label={t('Email')} error={errors.email && t(errors.email)}>
            <Input type="email" {...bind('email')} autoComplete="off" />
          </Field>
        </div>
      </Drawer>
    </>
  );
}

export function StaffRowActions({ row, today }: { row: StaffRow; today: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<LoginIssued | null>(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [leftOn, setLeftOn] = useState(today);

  async function openLogin() {
    setUsernameError('');
    setUsername(row.username ?? '');
    setLoginOpen(true);
    // A login that was switched off keeps its username; a new one gets a suggestion.
    if (!row.username) {
      const proposal = await proposeUsernameAction(row.name);
      if (proposal.ok) setUsername((current) => current || proposal.data);
    }
  }

  async function createLogin() {
    setBusy(true);
    const result = await createStaffLoginAction(row.id, username);
    setBusy(false);
    if (!result.ok) {
      setUsernameError(result.fields?.username ?? result.fields?._ ?? '');
      return toast.error(t(result.error));
    }
    setLoginOpen(false);
    setIssued({ username: result.data.username, password: result.data.password, phone: result.data.phone, greeting: `Hello ${result.data.name}` });
    router.refresh();
  }

  async function markLeft() {
    setBusy(true);
    const result = await markStaffLeftAction(row.id, leftOn);
    setBusy(false);
    if (!result.ok) return toast.error(t(result.error));
    toast.success(t('{name} marked as left', { name: row.name }));
    setLeftOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap justify-end gap-1">
      <StaffFormButton today={today} edit={{ id: row.id, values: row.values }} />
      {row.active && !row.hasLogin ? (
        <Button variant="ghost" size="sm" onClick={openLogin}>
          <KeyRound size={15} /> {t('Give login')}
        </Button>
      ) : null}
      {row.hasLogin ? (
        <ConfirmButton
          size="sm"
          variant="ghost"
          title={t("Remove {name}'s login?", { name: row.name })}
          text={t('They will not be able to log in any more. What they entered stays. You can give the login back later.')}
          confirmLabel={t('Remove login')}
          onConfirm={async () => {
            const result = await removeStaffLoginAction(row.id);
            if (!result.ok) return toast.error(t(result.error));
            toast.success(t('Login removed'));
            router.refresh();
          }}
        >
          {t('Remove login')}
        </ConfirmButton>
      ) : null}
      {row.active ? (
        <Button variant="ghost" size="sm" className="text-accent-700" onClick={() => { setLeftOn(today); setLeftOpen(true); }}>
          {t('Mark as left')}
        </Button>
      ) : (
        <>
          <ConfirmButton
            size="sm"
            variant="ghost"
            danger={false}
            title={t('Bring {name} back?', { name: row.name })}
            text={t('They go back on the staff list and the staff attendance sheet.')}
            confirmLabel={t('Bring back')}
            onConfirm={async () => {
              const result = await rejoinStaffAction(row.id);
              if (!result.ok) return toast.error(t(result.error));
              toast.success(t('{name} is back on the list', { name: row.name }));
              router.refresh();
            }}
          >
            {t('Bring back')}
          </ConfirmButton>
          <ConfirmButton
            size="sm"
            variant="ghost"
            title={t('Delete {name}?', { name: row.name })}
            text={t('Only for an entry made by mistake. Anyone with salary, attendance, a class or a login on record is kept.')}
            confirmLabel={t('Delete')}
            onConfirm={async () => {
              const result = await deleteStaffAction(row.id);
              if (!result.ok) return toast.error(t(result.error));
              toast.success(t('Deleted'));
              router.refresh();
            }}
          >
            {t('Delete')}
          </ConfirmButton>
        </>
      )}

      <Modal
        open={loginOpen}
        onClose={() => !busy && setLoginOpen(false)}
        title={t('Login for {name}', { name: row.name })}
        description={t('A front desk login: enquiries, children, attendance and fee collection. No expenses, salaries, reports or settings.')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLoginOpen(false)} disabled={busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={busy} disabled={!username.trim()} onClick={createLogin}>
              {t('Create login')}
            </LoadingButton>
          </>
        }
      >
        <Field label={t('Username')} required error={usernameError && t(usernameError)} hint={row.username ? t('This switches their old login back on with a new password.') : t('Small letters, numbers and dots. They type this to log in.')}>
          <Input value={username} invalid={Boolean(usernameError)} disabled={Boolean(row.username)} onChange={(event) => setUsername(event.target.value.toLowerCase())} autoComplete="off" />
        </Field>
      </Modal>

      <Modal
        open={leftOpen}
        onClose={() => !busy && setLeftOpen(false)}
        title={t('Mark {name} as left', { name: row.name })}
        description={t('They stay in past salary and attendance records. Their login is switched off and they are taken off any class.')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLeftOpen(false)} disabled={busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton variant="accent" loading={busy} onClick={markLeft}>
              {t('Mark as left')}
            </LoadingButton>
          </>
        }
      >
        <Field label={t('Last working day')} required>
          <Input type="date" value={leftOn} min={row.joinedOn ?? undefined} max={today} onChange={(event) => setLeftOn(event.target.value)} />
        </Field>
      </Modal>

      <LoginDetails login={issued} onClose={() => setIssued(null)} area="centre dashboard" />
    </div>
  );
}
