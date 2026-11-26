'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { PaymentMethod } from '@/db/schema';
import { deleteExpenseAction, saveExpenseAction } from '@/server/money/actions';
import { METHODS, METHOD_LABELS } from '@/server/money/labels';
import { useAction } from '../_ui/use-action';

type Form = { id: string; category: string; description: string; amount: string; spentOn: string; paidTo: string; method: PaymentMethod };

/** "Add expense" (no `initial`) or the pencil on a row (with `initial`): the form in a drawer. */
export function ExpenseButton({ categories, today, initial }: { categories: string[]; today: string; initial?: Form }) {
  const t = useT();
  const blank: Form = { id: '', category: categories[0] ?? 'Other', description: '', amount: '', spentOn: today, paidTo: '', method: 'cash' };
  const [form, setForm] = useState<Form | null>(null);
  const save = useAction(saveExpenseAction, { success: initial ? t('Expense changed') : t('Expense added'), onDone: () => setForm(null) });
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);

  return (
    <>
      {initial ? (
        <Button variant="secondary" size="sm" aria-label={t('Change')} onClick={() => setForm(initial)}>
          <Pencil size={15} />
        </Button>
      ) : (
        <Button onClick={() => setForm(blank)}>
          <Plus size={18} /> {t('Add expense')}
        </Button>
      )}
      <Drawer
        open={form !== null}
        onClose={() => !save.busy && setForm(null)}
        title={initial ? t('Change expense') : t('Add expense')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)} disabled={save.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => form && save.run({ ...form, amount: Number(form.amount || 0) })}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        {form ? (
          <div className="space-y-4">
            <Field label={t('Category')} required error={err('category')}>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </Select>
            </Field>
            <FormGrid>
              <Field label={t('Amount in rupees')} required error={err('amount')}>
                <Input type="number" inputMode="numeric" min={1} value={form.amount} invalid={!!save.fields.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label={t('Date')} required error={err('spentOn')}>
                <Input type="date" max={today} value={form.spentOn} invalid={!!save.fields.spentOn} onChange={(e) => setForm({ ...form, spentOn: e.target.value })} />
              </Field>
              <Field label={t('Paid to')} error={err('paidTo')}>
                <Input value={form.paidTo} maxLength={120} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} />
              </Field>
              <Field label={t('Paid by')} required>
                <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {t(METHOD_LABELS[m])}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormGrid>
            <Field label={t('Details')} hint={t('Optional: bill number, what was bought or mended')} error={err('description')}>
              <Input value={form.description} maxLength={200} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

export function DeleteExpense({ id, label }: { id: string; label: string }) {
  const t = useT();
  const remove = useAction(deleteExpenseAction, { success: t('Moved to the Trash') });
  return (
    <ConfirmButton
      size="sm"
      aria-label={t('Delete')}
      title={t('Delete {label}?', { label })}
      text={t('It goes to the Trash and leaves every total. An admin can bring it back from the Trash.')}
      confirmLabel={t('Delete')}
      onConfirm={async () => void (await remove.run(id))}
    >
      <Trash2 size={15} />
    </ConfirmButton>
  );
}
