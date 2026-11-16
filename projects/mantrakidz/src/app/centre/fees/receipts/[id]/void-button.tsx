'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, Notice, Textarea } from '@/components/ui/core';
import { inr } from '@/lib/money';
import { voidPaymentAction } from '@/server/centre/money/actions';

export function VoidButton({ id, receiptNo, amount }: { id: string; receiptNo: string; amount: number }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!reason.trim()) {
      setError('Write why this receipt is being voided');
      return;
    }
    setSaving(true);
    const result = await voidPaymentAction(id, reason);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(`Receipt ${receiptNo} voided`);
    setOpen(false);
    router.refresh();
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
        Void
      </Button>
      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={`Void receipt ${receiptNo}?`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Close
            </Button>
            <LoadingButton variant="accent" loading={saving} onClick={submit}>
              Void receipt
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Notice tone="amber">{inr(amount)} will come off the bill and off the collection of the day it was received. This cannot be undone.</Notice>
          <Field label="Reason" required error={error}>
            <Textarea value={reason} invalid={!!error} placeholder="Entered against the wrong child" onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
