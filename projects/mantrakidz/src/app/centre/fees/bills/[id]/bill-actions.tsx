'use client';

import { BadgePercent, Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, Input, Notice, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { inr } from '@/lib/money';
import { cancelBillAction, discountBillAction } from '@/server/centre/money/actions';

/** Corrections a centre head can make to a bill that is not fully paid. */
export function BillActions({ id, subtotal, discount, paid, canCancel }: { id: string; subtotal: number; discount: number; paid: number; canCancel: boolean }) {
  const t = useT();
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
      toast.error(t(result.error));
      return;
    }
    toast.success(mode === 'cancel' ? t('Bill cancelled') : t('Discount saved'));
    setMode(null);
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => open('discount')}>
        <BadgePercent size={18} /> {t('Discount')}
      </Button>
      {canCancel ? (
        <Button variant="danger" onClick={() => open('cancel')}>
          <Ban size={18} /> {t('Cancel bill')}
        </Button>
      ) : null}

      <Modal
        open={mode !== null}
        onClose={() => !saving && setMode(null)}
        title={mode === 'cancel' ? t('Cancel this bill?') : t('Give a discount')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMode(null)} disabled={saving}>
              {t('Close')}
            </Button>
            <LoadingButton variant={mode === 'cancel' ? 'accent' : 'primary'} loading={saving} onClick={submit}>
              {mode === 'cancel' ? t('Cancel bill') : t('Save discount')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          {mode === 'cancel' ? (
            <Notice tone="amber">{t('The bill stays on record, marked cancelled, and is no longer owed. This cannot be undone.')}</Notice>
          ) : (
            <Field label={t('Discount in rupees')} required error={errors.discount && t(errors.discount)} hint={t('Bill amount {subtotal}. At the most {most}. Enter 0 to remove the discount.', { subtotal: inr(subtotal), most: inr(most) })}>
              <Input type="number" inputMode="numeric" min={0} max={most} value={amount} invalid={!!errors.discount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          )}
          <Field label={t('Reason')} required error={errors.reason && t(errors.reason)}>
            <Textarea
              value={reason}
              invalid={!!errors.reason}
              placeholder={mode === 'cancel' ? t('Raised twice by mistake') : t('Sibling discount')}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
