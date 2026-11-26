'use client';

/** The buttons of a student's page: photo, leaving and coming back, Trash, the parent login. */
import { KeyRound, LogOut, RotateCcw, Trash2, Unlink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { ConfirmButton, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, Input, Notice } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import {
  markStudentBackAction,
  markStudentLeftAction,
  setParentLoginAction,
  setStudentPhotoAction,
  trashStudentAction,
  unlinkParentAction,
} from '@/server/students/actions';
import { useAction } from '../../_ui/use-action';

export function StudentPhoto({ id, photo }: { id: string; photo: string }) {
  const t = useT();
  const save = useAction(setStudentPhotoAction, { success: t('Photo saved') });
  return <ImageField value={photo} onChange={(url) => void save.run(id, url)} folder="students" />;
}

export function MarkLeft({ id, name, today }: { id: string; name: string; today: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [leftOn, setLeftOn] = useState(today);
  const [reason, setReason] = useState('');
  const save = useAction(markStudentLeftAction, { success: t('Marked as left'), onDone: () => setOpen(false) });
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <LogOut size={15} /> {t('Mark as left')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('{name} has left the school', { name })}
        description={t('Every record stays. For a transfer certificate, issue it from Certificates instead: that marks him as left too.')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run(id, { leftOn, reason })}>
              {t('Mark as left')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Date of leaving')} required error={save.fields.leftOn && t(save.fields.leftOn)}>
            <Input type="date" value={leftOn} max={today} onChange={(e) => setLeftOn(e.target.value)} />
          </Field>
          <Field label={t('Reason')} required error={save.fields.reason && t(save.fields.reason)}>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Family moved to another town')} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

export function BackOnRoll({ id }: { id: string }) {
  const t = useT();
  const save = useAction(markStudentBackAction, { success: t('Back on roll') });
  return (
    <LoadingButton variant="secondary" size="sm" loading={save.busy} onClick={() => save.run(id)}>
      <RotateCcw size={15} /> {t('Back on roll')}
    </LoadingButton>
  );
}

export function TrashStudent({ id, name }: { id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const remove = useAction(trashStudentAction, { success: t('Moved to the Trash'), onDone: () => router.push('/admin/students') });
  return (
    <ConfirmButton
      size="sm"
      title={t('Delete the record of {name}?', { name })}
      text={t('Only for a wrong entry. A student who leaves is marked as left. It goes to the Trash, where an admin can bring it back.')}
      confirmLabel={t('Delete')}
      onConfirm={async () => void (await remove.run(id))}
    >
      <Trash2 size={15} /> {t('Delete')}
    </ConfirmButton>
  );
}

/** Gives the parent login, or sets its password again. The username is the guardian mobile. */
export function ParentLogin({ id, phone, hasLogin }: { id: string; phone: string; hasLogin: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [done, setDone] = useState<{ username: string; linked: number } | null>(null);
  const save = useAction(setParentLoginAction, { onDone: (data) => setDone({ username: data.username, linked: data.linked }) });
  const close = () => {
    setOpen(false);
    setDone(null);
    setPassword('');
  };
  return (
    <>
      <Button variant={hasLogin ? 'secondary' : 'primary'} size="sm" onClick={() => setOpen(true)} disabled={!phone}>
        <KeyRound size={15} /> {hasLogin ? t('Set a new password') : t('Give parent login')}
      </Button>
      <Modal
        open={open}
        onClose={close}
        title={hasLogin ? t('Set a new password') : t('Give parent login')}
        description={t('The username is the guardian mobile number. The parent must change the password at the first login.')}
        size="sm"
        footer={
          done ? (
            <Button onClick={close}>{t('Done')}</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>
                {t('Cancel')}
              </Button>
              <LoadingButton loading={save.busy} disabled={password.length < 6} onClick={() => save.run(id, { password })}>
                {t('Save')}
              </LoadingButton>
            </>
          )
        }
      >
        {done ? (
          <div className="space-y-3">
            <Notice tone="green">{t('Username {username}, password {password}. Tell the parent; it must be changed at the first login.', { username: done.username, password })}</Notice>
            {done.linked ? <p className="text-sm text-ink-600">{t('{n} more students with the same mobile number were added to this login.', { n: done.linked })}</p> : null}
          </div>
        ) : (
          <div className="space-y-4">
            <Field label={t('Username')}>
              <Input value={phone} readOnly className="tabular" />
            </Field>
            <Field label={t('Starting password')} required hint={t('At least 6 characters')} error={save.fields.password && t(save.fields.password)}>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

export function UnlinkParent({ id }: { id: string }) {
  const t = useT();
  const save = useAction(unlinkParentAction, { success: t('Taken off the login') });
  return (
    <ConfirmButton
      size="sm"
      title={t('Take this student off the parent login?')}
      text={t('The parent will no longer see him. Brothers on the same login are not changed.')}
      confirmLabel={t('Take off')}
      onConfirm={async () => void (await save.run(id))}
    >
      <Unlink size={15} /> {t('Take off')}
    </ConfirmButton>
  );
}
