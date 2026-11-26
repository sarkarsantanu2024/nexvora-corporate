'use client';

import { BookDown } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, Input, Notice } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { inr } from '@/lib/money';
import { markFinePaidAction, returnBookAction } from '@/server/library/actions';
import { useAction } from '../_ui/use-action';

const late = (dueOn: string, on: string) => Math.max(0, Math.round((Date.parse(`${on}T00:00:00Z`) - Date.parse(`${dueOn}T00:00:00Z`)) / 86_400_000));

/** The book comes back: the date, the fine it comes to, and whether it is paid now. */
export function ReturnButton({ id, title, dueOn, today, finePerDay }: { id: string; title: string; dueOn: string; today: string; finePerDay: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [returnedOn, setReturnedOn] = useState(today);
  const [paid, setPaid] = useState(false);
  const back = useAction(returnBookAction, {
    success: (data) => (data.fine ? (data.finePaid ? t('Returned. Fine {amount} paid', { amount: inr(data.fine) }) : t('Returned. Fine {amount} to pay', { amount: inr(data.fine) })) : t('Returned')),
    onDone: () => setOpen(false),
  });
  const days = returnedOn ? late(dueOn, returnedOn) : 0;
  const fine = days * finePerDay;

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setReturnedOn(today);
          setPaid(false);
          setOpen(true);
        }}
      >
        <BookDown size={15} /> {t('Return')}
      </Button>
      <Modal
        open={open}
        onClose={() => !back.busy && setOpen(false)}
        title={t('Return {title}', { title })}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={back.busy}>
              {t('Close')}
            </Button>
            <LoadingButton loading={back.busy} onClick={() => back.run(id, { returnedOn, finePaid: paid })}>
              {t('Take back')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Returned on')} required error={back.fields.returnedOn ? t(back.fields.returnedOn) : undefined}>
            <Input type="date" max={today} value={returnedOn} onChange={(e) => setReturnedOn(e.target.value)} />
          </Field>
          {fine > 0 ? (
            <>
              <Notice tone="amber">{t('{n} days late: fine {amount}', { n: days, amount: inr(fine) })}</Notice>
              <label className="flex items-center gap-3 text-[15px] font-medium text-ink-800">
                <input type="checkbox" className="h-5 w-5 rounded accent-brand-700" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                {t('Fine paid now')}
              </label>
            </>
          ) : (
            <Notice tone="green">{t('Back on time. No fine.')}</Notice>
          )}
        </div>
      </Modal>
    </>
  );
}

export function FinePaidButton({ id, amount }: { id: string; amount: number }) {
  const t = useT();
  const mark = useAction(markFinePaidAction, { success: t('Fine marked paid') });
  return (
    <ConfirmButton size="sm" variant="secondary" danger={false} title={t('Fine of {amount} paid?', { amount: inr(amount) })} text={t('Mark it paid once the money is in hand.')} confirmLabel={t('Mark paid')} onConfirm={async () => void (await mark.run(id))}>
      {t('Fine paid')}
    </ConfirmButton>
  );
}
