'use client';

/** What can be done to one child: move class, mark as left, re-admit, parent login, delete. */
import { ArrowRightLeft, KeyRound, LogOut, RotateCcw, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import {
  createParentLoginAction,
  deleteStudentAction,
  markStudentLeftAction,
  moveStudentAction,
  readmitStudentAction,
  resetParentPasswordAction,
} from '@/server/centre/children/actions';
import { LoginDetails, type LoginIssued } from '../../settings/login-details';

type ClassOption = { id: string; name: string; programmeName: string; yearName: string; capacity: number; filled: number };

/** Create the parent login, or reset its password, and show the details once. */
export function ParentLogin({
  studentId,
  hasLogin,
  phone,
  parentName,
  size = 'md',
}: {
  studentId: string;
  hasLogin: boolean;
  phone: string;
  parentName: string;
  size?: 'sm' | 'md';
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<LoginIssued | null>(null);

  async function run(kind: 'create' | 'reset') {
    setBusy(true);
    const result = kind === 'create' ? await createParentLoginAction(studentId) : await resetParentPasswordAction(studentId);
    setBusy(false);
    if (!result.ok) return toast.error(t(result.error));
    setIssued({ ...result.data, phone, greeting: parentName ? `Dear ${parentName}` : 'Dear parent' });
    router.refresh();
  }

  return (
    <>
      {hasLogin ? (
        <ConfirmButton
          size={size}
          variant="secondary"
          danger={false}
          title={t("Reset the parent's password?")}
          text={t('The old password stops working. You get a new starting password to send to the parent.')}
          confirmLabel={t('Reset password')}
          onConfirm={() => run('reset')}
        >
          <KeyRound size={17} /> {t('Reset password')}
        </ConfirmButton>
      ) : (
        <LoadingButton size={size} variant="secondary" loading={busy} onClick={() => run('create')}>
          <UserPlus size={17} /> {t('Create parent login')}
        </LoadingButton>
      )}
      <LoginDetails login={issued} onClose={() => setIssued(null)} area="parent corner" />
    </>
  );
}

export function MoveClass({ studentId, currentBatchId, classes }: { studentId: string; currentBatchId: string; classes: ClassOption[] }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [saving, setSaving] = useState(false);
  const options = classes.filter((c) => c.id !== currentBatchId);
  const chosen = options.find((c) => c.id === batchId);

  async function save() {
    setSaving(true);
    const result = await moveStudentAction(studentId, batchId);
    setSaving(false);
    if (!result.ok) return toast.error(t(result.error));
    toast.success(t('Moved to {batchName}', { batchName: result.data.batchName }));
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => { setBatchId(''); setOpen(true); }}>
        <ArrowRightLeft size={17} /> {t('Move to another class')}
      </Button>
      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={t('Move to another class')}
        description={t('The programme and academic year follow the class you pick.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={saving} disabled={!batchId} onClick={save}>
              {t('Move')}
            </LoadingButton>
          </>
        }
      >
        {options.length ? (
          <Field label={t('New class')} hint={chosen && chosen.filled >= chosen.capacity ? t('{name} is full ({filled} of {capacity}). You can still move the child.', { name: chosen.name, filled: chosen.filled, capacity: chosen.capacity }) : undefined}>
            <Select value={batchId} onChange={(event) => setBatchId(event.target.value)}>
              <option value="">{t('Choose a class')}</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {t('{name} ({programmeName}, {yearName}): {filled} of {capacity} seats filled', { name: c.name, programmeName: c.programmeName, yearName: c.yearName, filled: c.filled, capacity: c.capacity })}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-[15px] text-ink-600">{t('There is no other class to move to. Add one under Classes first.')}</p>
        )}
      </Modal>
    </>
  );
}

export function MarkLeft({ studentId, name, today, admissionDate }: { studentId: string; name: string; today: string; admissionDate: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [leftOn, setLeftOn] = useState(today);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const result = await markStudentLeftAction(studentId, { leftOn, reason });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      return toast.error(t(result.error));
    }
    toast.success(t('{name} marked as left', { name }));
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="danger" onClick={() => { setErrors({}); setOpen(true); }}>
        <LogOut size={17} /> {t('Mark as left')}
      </Button>
      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={t('Mark {name} as left', { name })}
        description={t('The child stays in your records with all bills and receipts, but no longer appears in attendance or in new monthly bills.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <LoadingButton variant="accent" loading={saving} onClick={save}>
              {t('Mark as left')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Last day')} required error={errors.leftOn && t(errors.leftOn)}>
            <Input type="date" value={leftOn} min={admissionDate} max={today} invalid={Boolean(errors.leftOn)} onChange={(event) => setLeftOn(event.target.value)} />
          </Field>
          <Field label={t('Reason')} required error={t(errors.reason ?? errors._ ?? '')}>
            <Textarea value={reason} invalid={Boolean(errors.reason)} onChange={(event) => setReason(event.target.value)} placeholder={t('Family moved, joined another school')} maxLength={300} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

export function Readmit({ studentId, name }: { studentId: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  return (
    <ConfirmButton
      variant="secondary"
      danger={false}
      title={t('Re-admit {name}?', { name })}
      text={t('The child goes back on the active list, in the same class, and appears in attendance and monthly bills again.')}
      confirmLabel={t('Re-admit')}
      onConfirm={async () => {
        const result = await readmitStudentAction(studentId);
        if (!result.ok) return toast.error(t(result.error));
        toast.success(t('{name} re-admitted', { name }));
        router.refresh();
      }}
    >
      <RotateCcw size={17} /> {t('Re-admit')}
    </ConfirmButton>
  );
}

export function DeleteStudent({ studentId, name }: { studentId: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  return (
    <ConfirmButton
      size="sm"
      title={t('Delete {name}?', { name })}
      text={t('Only for a child added by mistake. A child who has bills cannot be deleted: mark the child as left instead.')}
      confirmLabel={t('Delete child')}
      onConfirm={async () => {
        const result = await deleteStudentAction(studentId);
        if (!result.ok) return toast.error(t(result.error));
        toast.success(t('Deleted'));
        router.push('/centre/students');
      }}
    >
      {t('Delete this record')}
    </ConfirmButton>
  );
}
