'use client';

import { MessageCircle, RefreshCw, RotateCcw, X } from 'lucide-react';
import { LoadingButton } from '@/components/ui/client';
import { Button, buttonClass } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { checkNowAction, dismissReminderAction, markSentAction, reopenReminderAction } from '@/server/reminders/actions';
import { useAction } from '../_ui/use-action';

/**
 * Opens the person's own WhatsApp with the message ready, and marks the
 * reminder sent at the same moment. If they then close WhatsApp without
 * sending, "Put back" on the Sent list returns it.
 */
export function SendReminder({ id, href }: { id: string; href: string }) {
  const t = useT();
  const sent = useAction(markSentAction);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => void sent.run(id)}
      aria-disabled={sent.busy}
      className={cn(buttonClass('primary', 'sm'), 'bg-mint-600 hover:bg-mint-700', sent.busy && 'pointer-events-none opacity-60')}
    >
      <MessageCircle size={15} /> {t('Send')}
    </a>
  );
}

export function DismissReminder({ id }: { id: string }) {
  const t = useT();
  const dismiss = useAction(dismissReminderAction, { success: t('Set aside') });
  return (
    <Button variant="ghost" size="sm" disabled={dismiss.busy} onClick={() => dismiss.run(id)} title={t('Not needed')} aria-label={t('Not needed')}>
      <X size={15} />
    </Button>
  );
}

export function ReopenReminder({ id }: { id: string }) {
  const t = useT();
  const reopen = useAction(reopenReminderAction, { success: t('Back in the waiting list') });
  return (
    <Button variant="ghost" size="sm" disabled={reopen.busy} onClick={() => reopen.run(id)}>
      <RotateCcw size={15} /> {t('Put back')}
    </Button>
  );
}

export function CheckNow() {
  const t = useT();
  const check = useAction(checkNowAction, {
    success: (data) => (data.added ? t('{n} new reminders', { n: data.added }) : t('Nothing new is due')),
  });
  return (
    <LoadingButton variant="secondary" loading={check.busy} onClick={() => check.run()}>
      {check.busy ? null : <RefreshCw size={16} />} {t('Check now')}
    </LoadingButton>
  );
}
