'use client';

import { BadgePercent, Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, Input, Notice, Textarea } from '@/components/ui/core';
import { inr } from '@/lib/money';
import { cancelBillAction, discountBillAction } from '@/server/centre/money/actions';

/** Corrections a centre head can make to a bill that is not fully paid. */
export function BillActions({ id, subtotal, discount, paid, canCancel }: { id: string; subtotal: number; discount: number; paid: number; canCancel: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<'discount' | 'cancel' | null>(null);
  const [amount, setAmount] = useState(String(discount || ''));
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const most = subtotal - paid;

  const open = (next: 'discount' | 'cancel') => {
    setErrors({});
    setReason('');
    setMode(next);
  };

  async function submit() {
    setSaving(true);
    const result = mode === 'cancel' ? await cancelBillAction(id, reason) : await discountBillAction(id, { discount: Number(amount || 0), reason });
    setSaving(false);
    if (!result.ok) {
      // A bare value that fails validation (the reason) comes back under '_'.
      const fields = result.fields ?? {};
      setErrors(fields._ ? { ...fields, reason: fields._ } : fields);
      toast.error(result.error);
      return;
    }
    toast.success(mode === 'cancel' ? 'Bill cancelled' : 'Discount saved');
    setMode(null);
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => open('discount')}>
        <BadgePercent size={18} /> Discount
      </Button>
      {canCancel ? (
        <Button variant="danger" onClick={() => open('cancel')}>
          <Ban size={18} /> Cancel bill
        </Button>
      ) : null}

      <Modal
        open={mode !== null}
        onClose={() => !saving && setMode(null)}
        title={mode === 'cancel' ? 'Cancel this bill?' : 'Give a discount'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMode(null)} disabled={saving}>
              Close
            </Button>
            <LoadingButton variant={mode === 'cancel' ? 'accent' : 'primary'} loading={saving} onClick={submit}>
              {mode === 'cancel' ? 'Cancel bill' : 'Save discount'}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          {mode === 'cancel' ? (
            <Notice tone="amber">The bill stays on record, marked cancelled, and is no longer owed. This cannot be undone.</Notice>
          ) : (
            <Field label="Discount in rupees" required error={errors.discount} hint={`Bill amount ${inr(subtotal)}. At the most ${inr(most)}. Enter 0 to remove the discount.`}>
              <Input type="number" inputMode="numeric" min={0} max={most} value={amount} invalid={!!errors.discount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          )}
          <Field label="Reason" required error={errors.reason}>
            <Textarea
              value={reason}
              invalid={!!errors.reason}
              placeholder={mode === 'cancel' ? 'Raised twice by mistake' : 'Sibling discount'}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
