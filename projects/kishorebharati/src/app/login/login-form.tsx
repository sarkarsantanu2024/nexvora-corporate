'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useActionState, useRef, useState } from 'react';
import { Field, Input, Notice, buttonClass } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { DEFAULT_PASSWORD } from '@/db/seed-defaults';
import { login, type LoginState } from '@/server/session-actions';

export function LoginForm({ next, showDemo }: { next: string; showDemo: boolean }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action={formAction} className="mt-7 space-y-4">
        <input type="hidden" name="next" value={next} />
        {state.error ? <Notice tone="red">{t(state.error)}</Notice> : null}
        <Field label={t('Username')}>
          <Input ref={userRef} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} defaultValue={state.username ?? ''} required autoFocus />
        </Field>
        <Field label={t('Password')}>
          <div className="relative">
            <Input ref={passRef} name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className="pr-12" />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? t('Hide password') : t('Show password')}
              className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <button type="submit" disabled={pending} className={buttonClass('primary', 'lg', 'w-full')}>
          {pending ? <Loader2 size={18} className="animate-spin" /> : null}
          {t('Log in')}
        </button>
      </form>

      {showDemo ? (
        <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
          <p className="text-sm font-semibold text-brand-800">{t('First login (this machine only)')}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {t('Username admin, password {password}', { password: DEFAULT_PASSWORD })}
          </p>
          <button
            type="button"
            onClick={() => {
              if (userRef.current) userRef.current.value = 'admin';
              if (passRef.current) passRef.current.value = DEFAULT_PASSWORD;
              formRef.current?.requestSubmit();
            }}
            className="mt-3 w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-left text-sm font-semibold text-brand-800 transition hover:border-brand-400 hover:shadow-sm"
          >
            {t('Log in as admin')}
          </button>
        </div>
      ) : null}
    </>
  );
}
