'use client';

/** Add and edit staff, give or remove a login, mark as left. */
import { KeyRound, Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
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
      return toast.error(result.error);
    }
    toast.success(edit ? 'Saved' : `${values.name} added`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {edit ? (
        <Button variant="ghost" size="sm" onClick={() => { setValues(edit.values); setErrors({}); setOpen(true); }}>
          <Pencil size={15} /> Edit
        </Button>
      ) : (
        <Button onClick={() => { setValues(blank); setErrors({}); setOpen(true); }}>
          <Plus size={18} /> Add staff
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={edit ? `Edit ${edit.values.name}` : 'New staff member'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <LoadingButton loading={saving} onClick={save}>
              {edit ? 'Save' : 'Add staff'}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name" required error={errors.name}>
            <Input {...bind('name')} autoComplete="off" />
          </Field>
          <FormGrid>
            <Field label="Role" required error={errors.roleTitle}>
              <Select {...bind('roleTitle')}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mobile number" error={errors.phone}>
              <Input type="tel" inputMode="numeric" {...bind('phone')} autoComplete="off" />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Joined on" error={errors.joinedOn}>
              <Input type="date" {...bind('joinedOn')} />
            </Field>
            <Field label="Monthly salary" error={errors.monthlySalary} hint="In rupees.">
              <Input type="number" inputMode="numeric" min={0} step={1} {...bind('monthlySalary')} />
            </Field>
          </FormGrid>
          <Field label="Qualification" error={errors.qualification}>
            <Input {...bind('qualification')} placeholder="Montessori trained, B.A." />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" {...bind('email')} autoComplete="off" />
          </Field>
        </div>
      </Drawer>
    </>
  );
}

export function StaffRowActions({ row, today }: { row: StaffRow; today: string }) {
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
      return toast.error(result.error);
    }
    setLoginOpen(false);
    setIssued({ username: result.data.username, password: result.data.password, phone: result.data.phone, greeting: `Hello ${result.data.name}` });
    router.refresh();
  }

  async function markLeft() {
    setBusy(true);
    const result = await markStaffLeftAction(row.id, leftOn);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    toast.success(`${row.name} marked as left`);
    setLeftOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap justify-end gap-1">
      <StaffFormButton today={today} edit={{ id: row.id, values: row.values }} />
      {row.active && !row.hasLogin ? (
        <Button variant="ghost" size="sm" onClick={openLogin}>
          <KeyRound size={15} /> Give login
        </Button>
      ) : null}
      {row.hasLogin ? (
        <ConfirmButton
          size="sm"
          variant="ghost"
          title={`Remove ${row.name}'s login?`}
          text="They will not be able to log in any more. What they entered stays. You can give the login back later."
          confirmLabel="Remove login"
          onConfirm={async () => {
            const result = await removeStaffLoginAction(row.id);
            if (!result.ok) return toast.error(result.error);
            toast.success('Login removed');
            router.refresh();
          }}
        >
          Remove login
        </ConfirmButton>
      ) : null}
      {row.active ? (
        <Button variant="ghost" size="sm" className="text-accent-700" onClick={() => { setLeftOn(today); setLeftOpen(true); }}>
          Mark as left
        </Button>
      ) : (
        <>
          <ConfirmButton
            size="sm"
            variant="ghost"
            danger={false}
            title={`Bring ${row.name} back?`}
            text="They go back on the staff list and the staff attendance sheet."
            confirmLabel="Bring back"
            onConfirm={async () => {
              const result = await rejoinStaffAction(row.id);
              if (!result.ok) return toast.error(result.error);
              toast.success(`${row.name} is back on the list`);
              router.refresh();
            }}
          >
            Bring back
          </ConfirmButton>
          <ConfirmButton
            size="sm"
            variant="ghost"
            title={`Delete ${row.name}?`}
            text="Only for an entry made by mistake. Anyone with salary, attendance, a class or a login on record is kept."
            confirmLabel="Delete"
            onConfirm={async () => {
              const result = await deleteStaffAction(row.id);
              if (!result.ok) return toast.error(result.error);
              toast.success('Deleted');
              router.refresh();
            }}
          >
            Delete
          </ConfirmButton>
        </>
      )}

      <Modal
        open={loginOpen}
        onClose={() => !busy && setLoginOpen(false)}
        title={`Login for ${row.name}`}
        description="A front desk login: enquiries, children, attendance and fee collection. No expenses, salaries, reports or settings."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLoginOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <LoadingButton loading={busy} disabled={!username.trim()} onClick={createLogin}>
              Create login
            </LoadingButton>
          </>
        }
      >
        <Field label="Username" required error={usernameError} hint={row.username ? 'This switches their old login back on with a new password.' : 'Small letters, numbers and dots. They type this to log in.'}>
          <Input value={username} invalid={Boolean(usernameError)} disabled={Boolean(row.username)} onChange={(event) => setUsername(event.target.value.toLowerCase())} autoComplete="off" />
        </Field>
      </Modal>

      <Modal
        open={leftOpen}
        onClose={() => !busy && setLeftOpen(false)}
        title={`Mark ${row.name} as left`}
        description="They stay in past salary and attendance records. Their login is switched off and they are taken off any class."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setLeftOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <LoadingButton variant="accent" loading={busy} onClick={markLeft}>
              Mark as left
            </LoadingButton>
          </>
        }
      >
        <Field label="Last working day" required>
          <Input type="date" value={leftOn} min={row.joinedOn ?? undefined} max={today} onChange={(event) => setLeftOn(event.target.value)} />
        </Field>
      </Modal>

      <LoginDetails login={issued} onClose={() => setIssued(null)} area="centre dashboard" />
    </div>
  );
}
