'use client';

import { useState } from 'react';
import { LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, Notice, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { inr } from '@/lib/money';
import { voidPaymentAction } from '@/server/money/actions';
import { useAction } from '../../../_ui/use-action';

/** Voids one receipt, with the reason. Head of school only (checked on the server too). */
export function VoidButton({ id, receiptNo, amount }: { id: string; receiptNo: string; amount: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const run = useAction(voidPaymentAction, { success: t('Receipt {receiptNo} voided', { receiptNo }), onDone: () => setOpen(false) });

  async function submit() {
    if (!reason.trim()) {
      setError(t('Write why this receipt is being voided'));
      return;
    }
    setError('');
    await run.run(id, reason);
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        onClick={() => {
          setError('');
          setReason('');
          setOpen(true);
        }}
      >
        {t('Void')}
      </Button>
      <Modal
        open={open}
        onClose={() => !run.busy && setOpen(false)}
        title={t('Void receipt {receiptNo}?', { receiptNo })}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={run.busy}>
              {t('Close')}
            </Button>
            <LoadingButton variant="accent" loading={run.busy} onClick={submit}>
              {t('Void receipt')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Notice tone="amber">{t('{amount} will come off the bill and off the collection of the day it was received. This cannot be undone.', { amount: inr(amount) })}</Notice>
          <Field label={t('Reason')} required error={error || (run.fields._ ? t(run.fields._) : undefined)}>
            <Textarea value={reason} invalid={!!error} placeholder={t('Entered against the wrong student')} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
