'use client';

import { BadgePercent, XCircle } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, Input, Notice, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { inr } from '@/lib/money';
import { cancelBillAction, setConcessionAction } from '@/server/money/actions';
import { useAction } from '../../../_ui/use-action';

/** Concession and cancel: the head of school's corrections to a bill not fully paid. */
export function BillActions({ id, subtotal, discount, paid, canCancel }: { id: string; subtotal: number; discount: number; paid: number; canCancel: boolean }) {
  const t = useT();
  const [open, setOpen] = useState<'concession' | 'cancel' | null>(null);
  const [amount, setAmount] = useState(String(discount || ''));
  const [reason, setReason] = useState('');
  const concession = useAction(setConcessionAction, { success: t('Concession saved'), onDone: () => setOpen(null) });
  const cancel = useAction(cancelBillAction, { success: t('Bill cancelled'), onDone: () => setOpen(null) });
  const most = subtotal - paid;

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen('concession')}>
        <BadgePercent size={18} /> {t('Concession')}
      </Button>
      {canCancel ? (
        <Button variant="danger" onClick={() => setOpen('cancel')}>
          <XCircle size={18} /> {t('Cancel bill')}
        </Button>
      ) : null}

      <Modal
        open={open === 'concession'}
        onClose={() => !concession.busy && setOpen(null)}
        title={t('Concession on this bill')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(null)} disabled={concession.busy}>
              {t('Close')}
            </Button>
            <LoadingButton loading={concession.busy} onClick={() => concession.run(id, { discount: Number(amount || 0), reason })}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Concession in rupees')} hint={t('{amount} at the most', { amount: inr(most) })} error={concession.fields.discount ? t(concession.fields.discount) : undefined}>
            <Input type="number" inputMode="numeric" min={0} max={most} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t('Reason')} required error={concession.fields.reason ? t(concession.fields.reason) : undefined}>
            <Input value={reason} maxLength={200} placeholder={t('Fee waiver by order of the head of school')} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <p className="text-sm text-ink-500">{t('Enter 0 to take the concession off.')}</p>
        </div>
      </Modal>

      <Modal
        open={open === 'cancel'}
        onClose={() => !cancel.busy && setOpen(null)}
        title={t('Cancel this bill?')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(null)} disabled={cancel.busy}>
              {t('Close')}
            </Button>
            <LoadingButton variant="accent" loading={cancel.busy} disabled={!reason.trim()} onClick={() => cancel.run(id, reason)}>
              {t('Cancel bill')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Notice tone="amber">{t('The bill stays on record marked cancelled. Nobody owes it and it is left out of every total.')}</Notice>
          <Field label={t('Reason')} required>
            <Textarea value={reason} placeholder={t('Raised for the wrong student')} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
