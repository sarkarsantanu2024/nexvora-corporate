'use client';

/**
 * Shows a new login's username and starting password. The password is only
 * ever on screen here: it is stored scrambled, so it cannot be shown again.
 */
import { Copy, MessageCircle } from 'lucide-react';
import { Modal, useToast } from '@/components/ui/client';
import { Button, buttonClass, Notice } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { waLink } from '@/lib/wa';

export type LoginIssued = {
  username: string;
  /** Null when a child was added to a login that already existed. */
  password: string | null;
  /** Who the details go to, for the WhatsApp message. */
  phone?: string;
  greeting?: string;
  /** For a parent login: the children it shows. */
  children?: string[];
};

/** Which side the login opens, for the words of the message. */
export type LoginArea = 'parent corner' | 'school dashboard' | 'head office dashboard';

export function LoginDetails({ login, onClose, area }: { login: LoginIssued | null; onClose: () => void; area: LoginArea }) {
  const t = useT();
  const toast = useToast();
  if (!login) return null;

  const loginUrl = `${window.location.origin}/login`;
  const message = [
    `${login.greeting ?? 'Hello'}, here is your login for the Mantra Kidz ${area}.`,
    `Open: ${loginUrl}`,
    `Username: ${login.username}`,
    login.password ? `Password: ${login.password}` : '',
    login.password ? 'You will be asked to choose your own password the first time.' : '',
  ]
    .filter(Boolean)
    .join('\n');
  const whatsapp = waLink(login.phone, message);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success(t('Copied'));
    } catch {
      toast.error(t('Could not copy. Select the text and copy it by hand.'));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={login.password ? t('Login ready') : t('Added to the existing login')}
      footer={
        <>
          <Button variant="secondary" onClick={copy}>
            <Copy size={17} /> {t('Copy')}
          </Button>
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonClass('success')}>
              <MessageCircle size={17} /> {t('Send on WhatsApp')}
            </a>
          ) : null}
          <Button onClick={onClose}>{t('Done')}</Button>
        </>
      }
    >
      <dl className="grid gap-3 rounded-2xl bg-ink-50 p-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Username')}</dt>
          <dd className="tabular font-display text-xl font-bold text-ink-900">{login.username}</dd>
        </div>
        {login.password ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Starting password')}</dt>
            <dd className="tabular font-display text-xl font-bold text-ink-900">{login.password}</dd>
          </div>
        ) : null}
      </dl>
      {login.children && login.children.length > 0 ? (
        <p className="mt-3 text-sm text-ink-600">
          {t('This login shows:')} <strong>{login.children.join(', ')}</strong>
        </p>
      ) : null}
      {login.password ? (
        <Notice tone="amber" className="mt-3">
          {t('Note the password or send it now. It is shown only this once. If it is lost, use Reset password.')}
        </Notice>
      ) : (
        <Notice className="mt-3">{t('This mobile number already had a parent login, so the child was added to it. The password has not changed.')}</Notice>
      )}
    </Modal>
  );
}
