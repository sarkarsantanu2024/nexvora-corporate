'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Button, Card, CardBody, Field, FormGrid, Input, Select, Table, Td, Th, Tr } from '@/components/ui/core';
import type { PaymentMethod } from '@/db/schema';
import { formatDate } from '@/lib/date';
import { allocatePayment, inr } from '@/lib/money';
import { takePaymentAction } from '@/server/centre/money/actions';
import { METHODS, METHODS_NEEDING_REFERENCE, METHOD_LABELS, REFERENCE_HINT } from '@/server/centre/money/labels';

type Bill = { id: string; invoiceNo: string; title: string; dueDate: string; total: number; paid: number };

export function CollectForm({ studentId, bills, today }: { studentId: string; bills: Bill[]; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const due = bills.reduce((sum, bill) => sum + (bill.total - bill.paid), 0);
  const [amount, setAmount] = useState(String(due));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const value = Math.max(0, Math.floor(Number(amount) || 0));
  // The same oldest-first spread the server does, shown before saving so there are no surprises.
  const spread = useMemo(() => {
    const { parts } = allocatePayment(Math.min(value, due), bills.map((bill) => ({ id: bill.id, balance: bill.total - bill.paid })));
    return new Map(parts.map((part) => [part.id, part.amount]));
  }, [value, due, bills]);
  const needsReference = METHODS_NEEDING_REFERENCE.includes(method);

  async function save() {
    const problems: Record<string, string> = {};
    if (value <= 0) problems.amount = 'Enter the amount received';
    else if (value > due) problems.amount = `Only ${inr(due)} is due`;
    if (needsReference && !reference.trim()) problems.reference = 'Reference is required';
    if (!paidOn) problems.paidOn = 'Pick a date';
    else if (paidOn > today) problems.paidOn = 'Pick today or an earlier date';
    setErrors(problems);
    if (Object.keys(problems).length) return;

    setSaving(true);
    const result = await takePaymentAction({ studentId, amount: value, method, reference, paidOn, note });
    if (!result.ok) {
      setSaving(false);
      setErrors(result.fields ?? {});
      toast.error(result.error);
      return;
    }
    toast.success(`${inr(result.data.amount)} received`);
    // The button stays busy until the receipt opens, so a second tap cannot save twice.
    router.push(`/centre/fees/receipts/${result.data.id}`);
  }

  return (
    <>
      <Card className="mb-5 overflow-hidden">
        <Table className="!min-w-[520px]">
          <thead>
            <tr>
              <Th>Bill</Th>
              <Th>Due date</Th>
              <Th className="text-right">Balance</Th>
              <Th className="text-right">This payment</Th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => {
              const part = spread.get(bill.id) ?? 0;
              return (
                <Tr key={bill.id}>
                  <Td>
                    <span className="font-semibold text-ink-900">{bill.title}</span>
                    <span className="block text-xs text-ink-500">{bill.invoiceNo}</span>
                  </Td>
                  <Td className={`whitespace-nowrap ${bill.dueDate < today ? 'font-semibold text-accent-600' : ''}`}>{formatDate(bill.dueDate)}</Td>
                  <Td className="tabular text-right">{inr(bill.total - bill.paid)}</Td>
                  <Td className={`tabular text-right font-semibold ${part ? 'text-mint-700' : 'text-ink-300'}`}>{part ? inr(part) : '0'}</Td>
                </Tr>
              );
            })}
            <tr>
              <Td colSpan={2} className="text-right font-semibold">
                Total due
              </Td>
              <Td className="tabular text-right text-base font-bold text-accent-600">{inr(due)}</Td>
              <Td className="tabular text-right text-base font-bold">{inr(Math.min(value, due))}</Td>
            </tr>
          </tbody>
        </Table>
        <p className="border-t border-ink-100 px-4 py-2.5 text-sm text-ink-500">The oldest bill is paid first.</p>
      </Card>

      <Card>
        <CardBody>
          <FormGrid>
            <Field label="Amount received" required error={errors.amount} hint={value > 0 && value < due ? `${inr(due - value)} will stay due` : undefined}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={due}
                value={amount}
                invalid={!!errors.amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular text-lg font-bold"
              />
            </Field>
            <Field label="Paid by" required>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABELS[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reference" required={needsReference} error={errors.reference} hint={REFERENCE_HINT[method]}>
              <Input value={reference} invalid={!!errors.reference} maxLength={80} onChange={(e) => setReference(e.target.value)} />
            </Field>
            <Field label="Date received" required error={errors.paidOn}>
              <Input type="date" value={paidOn} max={today} invalid={!!errors.paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </Field>
            <Field label="Note" className="sm:col-span-2" hint="Optional. Prints on the receipt.">
              <Input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </FormGrid>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
            <LoadingButton size="lg" loading={saving} onClick={save}>
              Save and show receipt
            </LoadingButton>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
