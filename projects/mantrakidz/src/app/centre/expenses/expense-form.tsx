'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { PaymentMethod } from '@/db/schema';
import { inr } from '@/lib/money';
import { deleteExpenseAction, saveExpenseAction } from '@/server/centre/money/actions';
import { EXPENSE_CATEGORIES, METHODS, METHOD_LABELS, SALARY_CATEGORY } from '@/server/centre/money/labels';

export type ExpenseRow = {
  id: string;
  category: string;
  description: string;
  amount: number;
  spentOn: string;
  paidTo: string;
  method: PaymentMethod;
  isSalary: boolean;
};

function ExpenseDrawer({ open, onClose, expense, today }: { open: boolean; onClose: () => void; expense?: ExpenseRow; today: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [category, setCategory] = useState(expense?.category ?? '');
  const [description, setDescription] = useState(expense?.description ?? '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [spentOn, setSpentOn] = useState(expense?.spentOn ?? today);
  const [paidTo, setPaidTo] = useState(expense?.paidTo ?? '');
  const [method, setMethod] = useState<PaymentMethod>(expense?.method ?? 'cash');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Salaries are added from "Pay salaries"; an old category not in the list is kept selectable.
  const options = [...EXPENSE_CATEGORIES.filter((c) => c !== SALARY_CATEGORY), ...(expense && !EXPENSE_CATEGORIES.some((c) => c === expense.category) ? [expense.category] : [])];

  async function save() {
    setSaving(true);
    const result = await saveExpenseAction({ id: expense?.id ?? '', category, description, amount: Number(amount || 0), spentOn, paidTo, method });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast.error(t(result.error));
      return;
    }
    toast.success(expense ? t('Expense changed') : t('Expense added'));
    if (!expense) {
      setCategory('');
      setDescription('');
      setAmount('');
      setPaidTo('');
    }
    setErrors({});
    onClose();
    router.refresh();
  }

  return (
    <Drawer
      open={open}
      onClose={() => !saving && onClose()}
      title={expense ? t('Change expense') : t('Add expense')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('Cancel')}
          </Button>
          <LoadingButton loading={saving} onClick={save}>
            {t('Save')}
          </LoadingButton>
        </>
      }
    >
      <div className="space-y-4">
        {expense?.isSalary ? (
          <Field label={t('Category')}>
            <Input value={t(SALARY_CATEGORY)} disabled />
          </Field>
        ) : (
          <Field label={t('Category')} required error={errors.category && t(errors.category)}>
            <Select value={category} invalid={!!errors.category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t('Choose a category')}</option>
              {options.map((c) => (
                <option key={c} value={c}>
                  {t(c)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t('What it was for')} error={errors.description && t(errors.description)}>
          <Input value={description} invalid={!!errors.description} maxLength={200} placeholder={t('Chart paper, crayons')} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <FormGrid>
          <Field label={t('Amount in rupees')} required error={errors.amount && t(errors.amount)}>
            <Input type="number" inputMode="numeric" min={1} value={amount} invalid={!!errors.amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t('Date')} required error={errors.spentOn && t(errors.spentOn)}>
            <Input type="date" value={spentOn} max={today} invalid={!!errors.spentOn} onChange={(e) => setSpentOn(e.target.value)} />
          </Field>
          <Field label={t('Paid to')} error={errors.paidTo && t(errors.paidTo)}>
            <Input value={paidTo} invalid={!!errors.paidTo} maxLength={120} placeholder={t('Shop or person')} onChange={(e) => setPaidTo(e.target.value)} />
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
        </FormGrid>
      </div>
    </Drawer>
  );
}

export function AddExpenseButton({ today }: { today: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} /> {t('Add expense')}
      </Button>
      <ExpenseDrawer open={open} onClose={() => setOpen(false)} today={today} />
    </>
  );
}

export function ExpenseRowActions({ expense, today }: { expense: ExpenseRow; today: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex justify-end gap-1.5">
      <Button variant="secondary" size="sm" aria-label={t('Change')} onClick={() => setOpen(true)}>
        <Pencil size={15} />
      </Button>
      <ConfirmButton
        size="sm"
        aria-label={t('Remove')}
        title={t('Remove this expense?')}
        text={t("{category}, {amount}. It will no longer count in the month's expenses.", { category: t(expense.category), amount: inr(expense.amount) }) + (expense.isSalary ? ` ${t('The staff member will show as not paid for that month.')}` : '')}
        confirmLabel={t('Remove')}
        onConfirm={async () => {
          const result = await deleteExpenseAction(expense.id);
          if (!result.ok) {
            toast.error(t(result.error));
            return;
          }
          toast.success(t('Expense removed'));
          router.refresh();
        }}
      >
        <Trash2 size={15} />
      </ConfirmButton>
      {/* Mounted only while open, so the form always starts from the row as it is now. */}
      {open ? <ExpenseDrawer open onClose={() => setOpen(false)} expense={expense} today={today} /> : null}
    </div>
  );
}
