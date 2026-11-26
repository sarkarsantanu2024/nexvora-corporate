'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Button, Card, CardBody, Field, FormGrid, Input, Select, Table, Td, Th, Tr } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { PaymentMethod } from '@/db/schema';
import { formatDate } from '@/lib/date';
import { inr } from '@/lib/money';
import { takePaymentAction } from '@/server/money/actions';
import { METHODS, METHODS_NEEDING_REFERENCE, METHOD_LABELS, REFERENCE_HINT, allocatePayment } from '@/server/money/labels';

type Bill = { id: string; invoiceNo: string; title: string; dueDate: string; total: number; paid: number };

/**
 * The bills to pay (all ticked to start with), the amount, how it was paid
 * and the reference. The amount is spread over the ticked bills oldest first,
 * as the server does, and shown before saving.
 */
export function CollectForm({ studentId, bills, today }: { studentId: string; bills: Bill[]; today: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [picked, setPicked] = useState<string[]>(bills.map((bill) => bill.id));
  const chosen = bills.filter((bill) => picked.includes(bill.id));
  const due = chosen.reduce((sum, bill) => sum + (bill.total - bill.paid), 0);
  const [amount, setAmount] = useState(String(due));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const value = Math.max(0, Math.floor(Number(amount) || 0));
  const spread = useMemo(() => {
    const { parts } = allocatePayment(Math.min(value, due), chosen.map((bill) => ({ id: bill.id, balance: bill.total - bill.paid })));
    return new Map(parts.map((part) => [part.id, part.amount]));
  }, [value, due, chosen]);
  const needsReference = METHODS_NEEDING_REFERENCE.includes(method);

  function toggle(id: string) {
    const next = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
    setPicked(next);
    // The amount follows the ticks, so the usual case (pay the ticked bills in full) needs no typing.
    setAmount(String(bills.filter((bill) => next.includes(bill.id)).reduce((sum, bill) => sum + (bill.total - bill.paid), 0)));
  }

  async function save() {
    const problems: Record<string, string> = {};
    if (!chosen.length) problems.amount = t('Tick at least one bill');
    else if (value <= 0) problems.amount = t('Enter the amount received');
    else if (value > due) problems.amount = t('Only {amount} is due on the ticked bills', { amount: inr(due) });
    if (needsReference && !reference.trim()) problems.reference = t('Reference is required');
    if (!paidOn) problems.paidOn = t('Pick a date');
    else if (paidOn > today) problems.paidOn = t('Pick today or an earlier date');
    setErrors(problems);
    if (Object.keys(problems).length) return;

    setSaving(true);
    const result = await takePaymentAction({ studentId, invoiceIds: picked, amount: value, method, reference, paidOn, note });
    if (!result.ok) {
      setSaving(false);
      setErrors(Object.fromEntries(Object.entries(result.fields ?? {}).map(([key, message]) => [key, t(message)])));
      toast.error(t(result.error));
      return;
    }
    toast.success(t('{amount} received', { amount: inr(result.data.amount) }));
    // The button stays busy until the receipt opens, so a second tap cannot save twice.
    router.push(`/admin/fees/receipts/${result.data.id}`);
  }

  return (
    <>
      <Card className="mb-5 overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>{t('Pay')}</Th>
              <Th>{t('Bill')}</Th>
              <Th>{t('Due date')}</Th>
              <Th className="text-right">{t('Balance')}</Th>
              <Th className="text-right">{t('This payment')}</Th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => {
              const part = spread.get(bill.id) ?? 0;
              return (
                <Tr key={bill.id}>
                  <Td>
                    <input type="checkbox" aria-label={t('Pay {bill}', { bill: bill.title })} className="h-5 w-5 rounded accent-brand-700" checked={picked.includes(bill.id)} onChange={() => toggle(bill.id)} />
                  </Td>
                  <Td>
                    <span className="font-semibold text-ink-900">{bill.title}</span>
                    <span className="tabular block text-xs text-ink-500">{bill.invoiceNo}</span>
                  </Td>
                  <Td className={`whitespace-nowrap ${bill.dueDate < today ? 'font-semibold text-accent-600' : ''}`}>{formatDate(bill.dueDate)}</Td>
                  <Td className="tabular text-right">{inr(bill.total - bill.paid)}</Td>
                  <Td className={`tabular text-right font-semibold ${part ? 'text-mint-700' : 'text-ink-300'}`}>{inr(part)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 px-4 py-3 text-sm">
          <span className="text-ink-500">{t('The oldest ticked bill is paid first.')}</span>
          <span className="font-semibold text-ink-800">
            {t('Due on ticked bills')}: <span className="tabular text-base font-bold text-accent-600">{inr(due)}</span>
          </span>
        </div>
      </Card>

      <Card>
        <CardBody>
          <FormGrid>
            <Field label={t('Amount received')} required error={errors.amount} hint={value > 0 && value < due ? t('{amount} will stay due', { amount: inr(due - value) }) : undefined}>
              <Input type="number" inputMode="numeric" min={1} max={due} value={amount} invalid={!!errors.amount} onChange={(e) => setAmount(e.target.value)} className="tabular text-lg font-bold" />
            </Field>
            <Field label={t('Paid by')} required>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {t(METHOD_LABELS[m])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Reference')} required={needsReference} error={errors.reference} hint={t(REFERENCE_HINT[method])}>
              <Input value={reference} invalid={!!errors.reference} maxLength={80} onChange={(e) => setReference(e.target.value)} />
            </Field>
            <Field label={t('Date received')} required error={errors.paidOn}>
              <Input type="date" value={paidOn} max={today} invalid={!!errors.paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </Field>
            <Field label={t('Note')} className="sm:col-span-2" hint={t('Optional. Prints on the receipt.')}>
              <Input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </FormGrid>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => router.back()} disabled={saving}>
              {t('Cancel')}
            </Button>
            <LoadingButton size="lg" loading={saving} onClick={save}>
              {t('Save and show receipt')}
            </LoadingButton>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
