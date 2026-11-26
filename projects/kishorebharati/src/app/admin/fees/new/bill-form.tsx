'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Button, Card, CardBody, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { inr } from '@/lib/money';
import { createBillAction } from '@/server/money/actions';
import { useAction } from '../../_ui/use-action';

type Line = { feeHeadId: string; description: string; amount: string };

/** A one-off bill: what it is for, its lines (from a fee head or written in), and the due date. */
export function BillForm({ studentId, heads, today, dueDate: initialDue }: { studentId: string; heads: { id: string; name: string; amount: number }[]; today: string; dueDate: string }) {
  const t = useT();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<Line[]>([{ feeHeadId: '', description: '', amount: '' }]);
  const [dueDate, setDueDate] = useState(initialDue);
  const [notes, setNotes] = useState('');
  const save = useAction(createBillAction, { success: (data) => t('Bill {invoiceNo} raised', { invoiceNo: data.invoiceNo }), onDone: (data) => router.push(`/admin/fees/bills/${data.id}`) });
  const total = lines.reduce((sum, line) => sum + Math.max(0, Math.floor(Number(line.amount) || 0)), 0);
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  const setLine = (index: number, patch: Partial<Line>) => setLines((list) => list.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  return (
    <Card>
      <CardBody className="space-y-4">
        <Field label={t('What the bill is for')} required error={err('title')}>
          <Input value={title} maxLength={120} invalid={!!save.fields.title} placeholder={t('Duplicate identity card')} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-ink-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_auto] sm:items-end">
              <Field label={t('Fee head')}>
                <Select
                  value={line.feeHeadId}
                  onChange={(e) => {
                    const head = heads.find((h) => h.id === e.target.value);
                    setLine(index, { feeHeadId: e.target.value, ...(head ? { description: head.name, amount: String(head.amount) } : {}) });
                  }}
                >
                  <option value="">{t('Written in')}</option>
                  {heads.map((head) => (
                    <option key={head.id} value={head.id}>
                      {head.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('Description')} required error={err(`lines.${index}.description`)}>
                <Input value={line.description} maxLength={160} onChange={(e) => setLine(index, { description: e.target.value })} />
              </Field>
              <Field label={t('Amount')} required error={err(`lines.${index}.amount`)}>
                <Input type="number" inputMode="numeric" min={1} value={line.amount} onChange={(e) => setLine(index, { amount: e.target.value })} />
              </Field>
              <Button variant="ghost" aria-label={t('Remove line')} disabled={lines.length === 1} onClick={() => setLines((list) => list.filter((_, i) => i !== index))}>
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" disabled={lines.length >= 20} onClick={() => setLines((list) => [...list, { feeHeadId: '', description: '', amount: '' }])}>
            <Plus size={16} /> {t('Add a line')}
          </Button>
        </div>

        <FormGrid>
          <Field label={t('Due date')} required error={err('dueDate')}>
            <Input type="date" min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label={t('Note')} hint={t('Optional')}>
            <Input value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </FormGrid>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
          <p className="text-sm text-ink-600">
            {t('Total')}: <span className="tabular font-display text-xl font-bold text-ink-900">{inr(total)}</span>
          </p>
          <LoadingButton
            size="lg"
            loading={save.busy}
            onClick={() =>
              save.run({ studentId, title, dueDate, notes, lines: lines.map((line) => ({ feeHeadId: line.feeHeadId, description: line.description, amount: Number(line.amount || 0) })) })
            }
          >
            {t('Raise bill')}
          </LoadingButton>
        </div>
      </CardBody>
    </Card>
  );
}
