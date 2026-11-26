'use client';

/** Forms of Teachers and staff: add and edit, the login, leaving, Trash. */
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { ConfirmButton, Drawer, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Notice, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { STAFF_KINDS, type StaffKind, type StaffMember } from '@/db/schema';
import { saveStaffAction, setStaffActiveAction, setStaffLoginAction, trashStaffAction } from '@/server/staff/actions';
import { STAFF_KIND_LABELS } from '@/server/students/constants';
import { useAction } from '../_ui/use-action';

export function StaffForm({ staff }: { staff?: StaffMember }) {
  const t = useT();
  const start = () => ({
    name: staff?.name ?? '',
    nameBn: staff?.nameBn ?? '',
    kind: (staff?.kind ?? 'teaching') as StaffKind,
    designation: staff?.designation ?? 'Assistant teacher',
    subjects: staff?.subjects ?? '',
    qualification: staff?.qualification ?? '',
    phone: staff?.phone ?? '',
    email: staff?.email ?? '',
    joinedOn: staff?.joinedOn ?? '',
    photo: staff?.photo ?? '',
    showOnWebsite: staff?.showOnWebsite ?? true,
    sort: String(staff?.sort ?? 0),
  });
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(start);
  const save = useAction(saveStaffAction, { success: t('Saved'), onDone: () => setOpen(false) });
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  return (
    <>
      {staff ? (
        <Button variant="secondary" size="sm" onClick={() => (setValues(start()), setOpen(true))} aria-label={t('Edit')}>
          <Pencil size={15} />
        </Button>
      ) : (
        <Button onClick={() => (setValues(start()), setOpen(true))}>
          <Plus size={18} /> {t('Add staff')}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={staff ? t('Edit {name}', { name: staff.name }) : t('Add staff')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run(staff?.id ?? null, { ...values, sort: Number(values.sort) || 0 })}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormGrid>
            <Field label={t('Name')} required error={err('name')}>
              <Input value={values.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label={t('Name in Bengali')} error={err('nameBn')}>
              <Input value={values.nameBn} onChange={(e) => set('nameBn', e.target.value)} lang="bn" />
            </Field>
            <Field label={t('Kind')} error={err('kind')}>
              <Select value={values.kind} onChange={(e) => set('kind', e.target.value as StaffKind)}>
                {STAFF_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(STAFF_KIND_LABELS[kind])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Designation')} error={err('designation')} hint={t('Headmaster, Assistant teacher, Clerk, Librarian')}>
              <Input value={values.designation} onChange={(e) => set('designation', e.target.value)} />
            </Field>
            <Field label={t('Subjects')} error={err('subjects')} hint={t('In words: Bengali, History')}>
              <Input value={values.subjects} onChange={(e) => set('subjects', e.target.value)} />
            </Field>
            <Field label={t('Qualification')} error={err('qualification')}>
              <Input value={values.qualification} onChange={(e) => set('qualification', e.target.value)} placeholder="M.A., B.Ed." />
            </Field>
            <Field label={t('Mobile')} error={err('phone')}>
              <Input type="tel" inputMode="numeric" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label={t('Email')} error={err('email')}>
              <Input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label={t('Joined on')} error={err('joinedOn')}>
              <Input type="date" value={values.joinedOn} onChange={(e) => set('joinedOn', e.target.value)} />
            </Field>
            <Field label={t('Order on the list')} error={err('sort')} hint={t('Lower comes first.')}>
              <Input type="number" inputMode="numeric" min={0} value={values.sort} onChange={(e) => set('sort', e.target.value)} />
            </Field>
          </FormGrid>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Photo')}</p>
            <ImageField value={values.photo} onChange={(url) => set('photo', url)} folder="staff" />
          </div>
          <label className="flex items-center gap-3 text-[15px] text-ink-800">
            <input type="checkbox" checked={values.showOnWebsite} onChange={(e) => set('showOnWebsite', e.target.checked)} className="h-4 w-4 accent-brand-700" />
            {t('Show on the website’s teachers page')}
          </label>
        </div>
      </Drawer>
    </>
  );
}

/** "Give login" for someone without one; "New password" for someone who has one. Admin only. */
export function StaffLogin({ id, name, kind, username: existing }: { id: string; name: string; kind: StaffKind; username: string }) {
  const t = useT();
  const suggested = name.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 2).join('.').replace(/[^a-z0-9._-]/g, '');
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(suggested);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'staff'>(kind === 'teaching' ? 'teacher' : 'staff');
  const [done, setDone] = useState('');
  const save = useAction(setStaffLoginAction, { onDone: (data) => setDone(data.username) });
  const close = () => {
    setOpen(false);
    setDone('');
    setPassword('');
  };
  return (
    <>
      <Button variant={existing ? 'secondary' : 'primary'} size="sm" onClick={() => setOpen(true)}>
        <KeyRound size={15} /> {existing ? t('New password') : t('Give login')}
      </Button>
      <Modal
        open={open}
        onClose={close}
        size="sm"
        title={existing ? t('New password for {name}', { name }) : t('Give {name} a login', { name })}
        description={t('They must change the password at the first login.')}
        footer={
          done ? (
            <Button onClick={close}>{t('Done')}</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>
                {t('Cancel')}
              </Button>
              <LoadingButton loading={save.busy} disabled={password.length < 6} onClick={() => save.run(id, { username: existing ? undefined : username, password, role })}>
                {t('Save')}
              </LoadingButton>
            </>
          )
        }
      >
        {done ? (
          <Notice tone="green">{t('Username {username}, password {password}. Tell them; it must be changed at the first login.', { username: done, password })}</Notice>
        ) : (
          <div className="space-y-4">
            {existing ? (
              <Field label={t('Username')}>
                <Input value={existing} readOnly />
              </Field>
            ) : (
              <>
                <Field label={t('Username')} required error={save.fields.username && t(save.fields.username)}>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
                </Field>
                <Field label={t('What the login opens')}>
                  <Select value={role} onChange={(e) => setRole(e.target.value as 'teacher' | 'staff')}>
                    <option value="teacher">{t('Teacher: own classes only')}</option>
                    <option value="staff">{t('Office: students, fees and records')}</option>
                  </Select>
                </Field>
              </>
            )}
            <Field label={t('Starting password')} required hint={t('At least 6 characters')} error={save.fields.password && t(save.fields.password)}>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

export function StaffActive({ id, name, active }: { id: string; name: string; active: boolean }) {
  const t = useT();
  const save = useAction(setStaffActiveAction, { success: t('Saved') });
  if (!active)
    return (
      <LoadingButton variant="secondary" size="sm" loading={save.busy} onClick={() => save.run(id, true)}>
        {t('Bring back')}
      </LoadingButton>
    );
  return (
    <ConfirmButton
      size="sm"
      variant="secondary"
      danger={false}
      title={t('{name} has left the school?', { name })}
      text={t('The record stays, the name comes off the website and the login is switched off.')}
      confirmLabel={t('Mark as left')}
      onConfirm={async () => void (await save.run(id, false))}
    >
      {t('Left')}
    </ConfirmButton>
  );
}

export function TrashStaff({ id, name }: { id: string; name: string }) {
  const t = useT();
  const remove = useAction(trashStaffAction, { success: t('Moved to the Trash') });
  return (
    <ConfirmButton
      size="sm"
      title={t('Delete {name}?', { name })}
      text={t('Only for a wrong entry. Someone who left is marked as left. It goes to the Trash, where an admin can bring it back.')}
      confirmLabel={t('Delete')}
      onConfirm={async () => void (await remove.run(id))}
      aria-label={t('Delete')}
    >
      <Trash2 size={15} />
    </ConfirmButton>
  );
}
