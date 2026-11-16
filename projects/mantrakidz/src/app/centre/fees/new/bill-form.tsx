'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Button, Card, CardBody, Field, FormGrid, Input, Textarea } from '@/components/ui/core';
import { inr } from '@/lib/money';
import { createBillAction } from '@/server/centre/money/actions';

type Head = { id: string; name: string; amount: number };
type Line = { key: number; feeHeadId: string; description: string; amount: string };

let nextKey = 1;

export function BillForm({ studentId, heads, today, manager }: { studentId: string; heads: Head[]; today: string; manager: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [dueDate, setDueDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const subtotal = lines.reduce((sum, line) => sum + Math.max(0, Math.floor(Number(line.amount) || 0)), 0);
  const off = manager ? Math.max(0, Math.floor(Number(discount) || 0)) : 0;
  const total = subtotal - off;

  const addHead = (head: Head) => {
    setLines((list) => [...list, { key: nextKey++, feeHeadId: head.id, description: head.name, amount: String(head.amount) }]);
    // The first fee head picked names the bill, which is right for the usual admission bill.
    setTitle((current) => current || head.name);
  };
  const addBlank = () => setLines((list) => [...list, { key: nextKey++, feeHeadId: '', description: '', amount: '' }]);
  const change = (key: number, patch: Partial<Line>) => setLines((list) => list.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  async function save() {
    const problems: Record<string, string> = {};
    if (!title.trim()) problems.title = 'Say what the bill is for';
    if (!lines.length) problems.lines = 'Add at least one line';
    else if (lines.some((line) => !line.description.trim() || !(Number(line.amount) > 0))) problems.lines = 'Every line needs a description and an amount';
    if (off > subtotal) problems.discount = 'More than the bill amount';
    if (off > 0 && !discountReason.trim()) problems.discountReason = 'Reason is required';
    if (!dueDate) problems.dueDate = 'Pick a date';
    setErrors(problems);
    if (Object.keys(problems).length) return;

    setSaving(true);
    const result = await createBillAction({
      studentId,
      title,
      lines: lines.map((line) => ({ feeHeadId: line.feeHeadId, description: line.description, amount: Math.floor(Number(line.amount)) })),
      discount: off,
      discountReason: off > 0 ? discountReason : '',
      dueDate,
      notes,
    });
    if (!result.ok) {
      setSaving(false);
      setErrors(result.fields ?? {});
      toast.error(result.error);
      return;
    }
    toast.success(`Bill ${result.data.invoiceNo} raised`);
    router.push(`/centre/fees/bills/${result.data.id}`);
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <Field label="What the bill is for" required error={errors.title}>
          <Input value={title} invalid={!!errors.title} maxLength={120} placeholder="Admission" onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-700">
            Lines<span className="text-accent-500"> *</span>
          </p>
          {lines.length ? (
            <ul className="mb-3 space-y-2">
              {lines.map((line) => (
                <li key={line.key} className="flex items-start gap-2">
                  <Input
                    aria-label="Description"
                    placeholder="Description"
                    value={line.description}
                    maxLength={160}
                    onChange={(e) => change(line.key, { description: e.target.value })}
                    className="min-w-0 flex-1"
                  />
                  <Input
                    aria-label="Amount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Amount"
                    value={line.amount}
                    onChange={(e) => change(line.key, { amount: e.target.value })}
                    className="tabular w-28 shrink-0 text-right"
                  />
                  <button
                    type="button"
                    aria-label="Remove line"
                    onClick={() => setLines((list) => list.filter((item) => item.key !== line.key))}
                    className="grid h-11 w-10 shrink-0 place-items-center rounded-xl text-ink-500 hover:bg-accent-50 hover:text-accent-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {heads.map((head) => (
              <Button key={head.id} variant="secondary" size="sm" onClick={() => addHead(head)}>
                <Plus size={15} /> {head.name} · {inr(head.amount)}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={addBlank}>
              <Plus size={15} /> Other charge
            </Button>
          </div>
          {errors.lines ? <p className="mt-1.5 text-sm font-medium text-accent-600">{errors.lines}</p> : null}
        </div>

        <FormGrid>
          {manager ? (
            <>
              <Field label="Discount in rupees" error={errors.discount} hint="Optional">
                <Input type="number" inputMode="numeric" min={0} value={discount} invalid={!!errors.discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
              <Field label="Reason for the discount" required={off > 0} error={errors.discountReason}>
                <Input value={discountReason} invalid={!!errors.discountReason} maxLength={200} placeholder="Sibling discount" onChange={(e) => setDiscountReason(e.target.value)} />
              </Field>
            </>
          ) : null}
          <Field label="Due date" required error={errors.dueDate}>
            <Input type="date" value={dueDate} min={today} invalid={!!errors.dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Note" hint="Optional" className={manager ? '' : 'sm:col-span-1'}>
            <Textarea rows={1} className="min-h-[46px]" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </FormGrid>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
          <p className="text-sm text-ink-500">
            Bill total
            <span className="tabular ml-2 font-display text-2xl font-bold text-ink-900">{inr(Math.max(0, total))}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
            <LoadingButton loading={saving} onClick={save}>
              Raise bill
            </LoadingButton>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
