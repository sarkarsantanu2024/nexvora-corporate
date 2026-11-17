'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Field, Input, Notice, buttonClass } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { changePassword } from '@/server/session-actions';

export function PasswordForm({ home, first }: { home: string; first: boolean }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true);
        setError('');
        setFields({});
        const result = await changePassword({
          current: String(form.get('current') ?? ''),
          next: String(form.get('next') ?? ''),
          confirm: String(form.get('confirm') ?? ''),
        });
        setBusy(false);
        if (!result.ok) {
          setError(t(result.error));
          setFields(result.fields ?? {});
          return;
        }
        toast.success(t('Password changed'));
        router.replace(result.data.home);
        router.refresh();
      }}
    >
      {error ? <Notice tone="red">{error}</Notice> : null}
      <Field label={t('Current password')} error={fields.current && t(fields.current)}>
        <Input name="current" type="password" autoComplete="current-password" required invalid={Boolean(fields.current)} />
      </Field>
      <Field label={t('New password')} hint={t('At least 6 characters.')} error={fields.next && t(fields.next)}>
        <Input name="next" type="password" autoComplete="new-password" required minLength={6} invalid={Boolean(fields.next)} />
      </Field>
      <Field label={t('New password again')} error={fields.confirm && t(fields.confirm)}>
        <Input name="confirm" type="password" autoComplete="new-password" required invalid={Boolean(fields.confirm)} />
      </Field>
      <div className="flex gap-2 pt-2">
        <LoadingButton type="submit" loading={busy} className="flex-1">
          {t('Save password')}
        </LoadingButton>
        {first ? null : (
          <Link href={home} className={buttonClass('secondary')}>
            {t('Cancel')}
          </Link>
        )}
      </div>
    </form>
  );
}
