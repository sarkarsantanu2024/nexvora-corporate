'use client';

/** What can be done to one child: move class, mark as left, re-admit, parent login, delete. */
import { ArrowRightLeft, KeyRound, LogOut, RotateCcw, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, Input, Select, Textarea } from '@/components/ui/core';
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
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<LoginIssued | null>(null);

  async function run(kind: 'create' | 'reset') {
    setBusy(true);
    const result = kind === 'create' ? await createParentLoginAction(studentId) : await resetParentPasswordAction(studentId);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
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
          title="Reset the parent's password?"
          text="The old password stops working. You get a new starting password to send to the parent."
          confirmLabel="Reset password"
          onConfirm={() => run('reset')}
        >
          <KeyRound size={17} /> Reset password
        </ConfirmButton>
      ) : (
        <LoadingButton size={size} variant="secondary" loading={busy} onClick={() => run('create')}>
          <UserPlus size={17} /> Create parent login
        </LoadingButton>
      )}
      <LoginDetails login={issued} onClose={() => setIssued(null)} area="parent corner" />
    </>
  );
}

export function MoveClass({ studentId, currentBatchId, classes }: { studentId: string; currentBatchId: string; classes: ClassOption[] }) {
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
    if (!result.ok) return toast.error(result.error);
    toast.success(`Moved to ${result.data.batchName}`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => { setBatchId(''); setOpen(true); }}>
        <ArrowRightLeft size={17} /> Move to another class
      </Button>
      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Move to another class"
        description="The programme and academic year follow the class you pick."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <LoadingButton loading={saving} disabled={!batchId} onClick={save}>
              Move
            </LoadingButton>
          </>
        }
      >
        {options.length ? (
          <Field label="New class" hint={chosen && chosen.filled >= chosen.capacity ? `${chosen.name} is full (${chosen.filled} of ${chosen.capacity}). You can still move the child.` : undefined}>
            <Select value={batchId} onChange={(event) => setBatchId(event.target.value)}>
              <option value="">Choose a class</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.programmeName}, {c.yearName}): {c.filled} of {c.capacity} seats filled
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-[15px] text-ink-600">There is no other class to move to. Add one under Classes first.</p>
        )}
      </Modal>
    </>
  );
}

export function MarkLeft({ studentId, name, today, admissionDate }: { studentId: string; name: string; today: string; admissionDate: string }) {
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
      return toast.error(result.error);
    }
    toast.success(`${name} marked as left`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="danger" onClick={() => { setErrors({}); setOpen(true); }}>
        <LogOut size={17} /> Mark as left
      </Button>
      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={`Mark ${name} as left`}
        description="The child stays in your records with all bills and receipts, but no longer appears in attendance or in new monthly bills."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <LoadingButton variant="accent" loading={saving} onClick={save}>
              Mark as left
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Last day" required error={errors.leftOn}>
            <Input type="date" value={leftOn} min={admissionDate} max={today} invalid={Boolean(errors.leftOn)} onChange={(event) => setLeftOn(event.target.value)} />
          </Field>
          <Field label="Reason" required error={errors.reason ?? errors._}>
            <Textarea value={reason} invalid={Boolean(errors.reason)} onChange={(event) => setReason(event.target.value)} placeholder="Family moved, joined another school" maxLength={300} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

export function Readmit({ studentId, name }: { studentId: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <ConfirmButton
      variant="secondary"
      danger={false}
      title={`Re-admit ${name}?`}
      text="The child goes back on the active list, in the same class, and appears in attendance and monthly bills again."
      confirmLabel="Re-admit"
      onConfirm={async () => {
        const result = await readmitStudentAction(studentId);
        if (!result.ok) return toast.error(result.error);
        toast.success(`${name} re-admitted`);
        router.refresh();
      }}
    >
      <RotateCcw size={17} /> Re-admit
    </ConfirmButton>
  );
}

export function DeleteStudent({ studentId, name }: { studentId: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <ConfirmButton
      size="sm"
      title={`Delete ${name}?`}
      text="Only for a child added by mistake. A child who has bills cannot be deleted: mark the child as left instead."
      confirmLabel="Delete child"
      onConfirm={async () => {
        const result = await deleteStudentAction(studentId);
        if (!result.ok) return toast.error(result.error);
        toast.success('Deleted');
        router.push('/centre/students');
      }}
    >
      Delete this record
    </ConfirmButton>
  );
}
