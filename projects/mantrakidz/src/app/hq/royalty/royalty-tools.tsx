'use client';

import { BadgeIndianRupee, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, Modal, useToast, useUrlParam } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { inr } from '@/lib/money';
import { recordRoyaltyPaymentAction, runRoyaltyAction, voidRoyaltyPaymentAction } from '@/server/hq/actions';
import type { RoyaltyRunResult } from '@/server/hq/royalty';
import { useAction, useForm } from '../_ui/use-action';

/** Month picker bound to ?period=, showing the month the page is on even when the URL has none. */
export function MonthPicker({ value, max }: { value: string; max: string }) {
  const { set } = useUrlParam();
  return <input type="month" aria-label="Month" value={value} max={max} onChange={(e) => e.target.value && set('period', e.target.value)} className="control w-auto" />;
}

/**
 * "Raise royalty for <month>". Safe to press again: centres already billed are
 * skipped. If an unpaid bill no longer matches the month's collection, it
 * offers to recalculate instead of changing it silently.
 */
export function RaiseRoyalty({ period, label, alreadyRaised }: { period: string; label: string; alreadyRaised: boolean }) {
  const toast = useToast();
  const [stale, setStale] = useState<RoyaltyRunResult['stale']>([]);
  const report = (result: RoyaltyRunResult) => {
    if (result.stale.length) {
      setStale(result.stale);
      if (result.created) toast.success(`${result.created} royalty ${result.created === 1 ? 'bill' : 'bills'} raised for ${label}`);
      return;
    }
    setStale([]);
    if (result.created || result.recalculated) {
      const parts = [result.created ? `${result.created} raised` : '', result.recalculated ? `${result.recalculated} recalculated` : ''].filter(Boolean);
      toast.success(`Royalty for ${label}: ${parts.join(', ')}`);
    } else toast.success(`Royalty for ${label} is already raised. Nothing changed.`);
  };
  const run = useAction(runRoyaltyAction, { onDone: report });

  return (
    <>
      <LoadingButton loading={run.busy} variant={alreadyRaised ? 'secondary' : 'primary'} onClick={() => run.run({ period })}>
        {alreadyRaised ? <RefreshCw size={17} /> : <BadgeIndianRupee size={18} />}
        {alreadyRaised ? 'Check again' : `Raise royalty for ${label}`}
      </LoadingButton>
      <Modal
        open={stale.length > 0}
        onClose={() => !run.busy && setStale([])}
        title="Recalculate unpaid royalty?"
        description={`The fee collection of ${label} changed after these bills were raised. Nothing has been paid against them yet.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStale([])} disabled={run.busy}>
              Leave as they are
            </Button>
            <LoadingButton loading={run.busy} onClick={() => run.run({ period, recalculate: true })}>
              Recalculate
            </LoadingButton>
          </>
        }
      >
        <ul className="divide-y divide-ink-100">
          {stale.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
              <span className="font-semibold text-ink-900">{row.centre}</span>
              <span className="tabular whitespace-nowrap text-ink-600">
                {inr(row.oldAmount)} → <strong className="text-ink-900">{inr(row.newAmount)}</strong>
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

const METHODS = [
  { value: 'bank', label: 'Bank transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
] as const;
type Method = (typeof METHODS)[number]['value'];

export function RecordPayment({ invoiceId, centre, month, balance, today }: { invoiceId: string; centre: string; month: string; balance: number; today: string }) {
  const [open, setOpen] = useState(false);
  const blank = { amount: String(balance), method: 'bank' as Method, reference: '', paidOn: today };
  const { values, set, reset } = useForm(blank);
  const save = useAction(recordRoyaltyPaymentAction, { success: 'Royalty payment recorded', onDone: () => setOpen(false) });
  const errors = save.fields;

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          reset(blank);
          setOpen(true);
        }}
      >
        Record payment
      </Button>
      <Modal
        open={open}
        onClose={() => !save.busy && setOpen(false)}
        title="Record a royalty payment"
        description={`${centre}, ${month}. ${inr(balance)} is due.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={save.busy}>
              Cancel
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run({ invoiceId, ...values, amount: Number(values.amount) })}>
              Save payment
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label="Amount received, rupees" required hint="A part payment is fine" error={errors.amount}>
            <Input type="number" min={1} max={balance} value={values.amount} onChange={(e) => set('amount', e.target.value)} invalid={Boolean(errors.amount)} autoFocus />
          </Field>
          <Field label="Received on" required error={errors.paidOn}>
            <Input type="date" max={today} value={values.paidOn} onChange={(e) => set('paidOn', e.target.value)} invalid={Boolean(errors.paidOn)} />
          </Field>
          <Field label="Paid by">
            <Select value={values.method} onChange={(e) => set('method', e.target.value as Method)}>
              {METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reference" hint="UTR, cheque number or a short remark" error={errors.reference}>
            <Input value={values.reference} onChange={(e) => set('reference', e.target.value)} />
          </Field>
        </FormGrid>
      </Modal>
    </>
  );
}

export function CancelPayment({ paymentId, amount }: { paymentId: string; amount: number }) {
  const cancel = useAction(voidRoyaltyPaymentAction, { success: 'Payment cancelled' });
  return (
    <ConfirmButton
      size="sm"
      title={`Cancel this ${inr(amount)} payment?`}
      text="Use this for an entry made by mistake. The entry stays in the statement with a matching minus entry, and the amount becomes due again."
      confirmLabel="Cancel payment"
      onConfirm={async () => void (await cancel.run(paymentId))}
    >
      Cancel entry
    </ConfirmButton>
  );
}
