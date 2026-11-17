'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Badge, Card, Field, Input, Select, Table, Td, Th, Tr } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { PaymentMethod } from '@/db/schema';
import { formatDate } from '@/lib/date';
import { inr } from '@/lib/money';
import { paySalariesAction } from '@/server/centre/money/actions';
import { METHODS, METHOD_LABELS } from '@/server/centre/money/labels';

type Row = {
  id: string;
  name: string;
  roleTitle: string;
  monthlySalary: number;
  paid: { id: string; amount: number; spentOn: string; method: PaymentMethod } | null;
};

export function SalaryForm({ month, label, today, rows, paidTotal }: { month: string; label: string; today: string; rows: Row[]; paidTotal: number }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const pending = rows.filter((row) => !row.paid);
  const [picked, setPicked] = useState<Record<string, boolean>>(() => Object.fromEntries(pending.filter((r) => r.monthlySalary > 0).map((r) => [r.id, true])));
  const [amounts, setAmounts] = useState<Record<string, string>>(() => Object.fromEntries(pending.map((r) => [r.id, String(r.monthlySalary || '')])));
  const [paidOn, setPaidOn] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>('bank');
  const [saving, setSaving] = useState(false);

  const chosen = pending.filter((row) => picked[row.id]);
  const total = chosen.reduce((sum, row) => sum + Math.max(0, Math.floor(Number(amounts[row.id]) || 0)), 0);

  async function pay() {
    if (chosen.some((row) => !(Number(amounts[row.id]) > 0))) {
      toast.error(t('Enter an amount for every staff member you have ticked'));
      return;
    }
    setSaving(true);
    const result = await paySalariesAction({ month, paidOn, method, items: chosen.map((row) => ({ staffId: row.id, amount: Math.floor(Number(amounts[row.id])) })) });
    setSaving(false);
    if (!result.ok) {
      toast.error(t(result.error));
      router.refresh();
      return;
    }
    toast.success(t('{total} paid to {count} staff for {label}', { total: inr(result.data.total), count: result.data.count, label }));
    setPicked({});
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <thead>
          <tr>
            <Th className="w-10" />
            <Th>{t('Staff')}</Th>
            <Th className="text-right">{t('Monthly salary')}</Th>
            <Th>{label}</Th>
            <Th className="text-right">{t('Pay now')}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Tr key={row.id}>
              <Td>
                {row.paid ? null : (
                  <input
                    type="checkbox"
                    aria-label={t('Pay {name}', { name: row.name })}
                    className="h-5 w-5 rounded accent-brand-700"
                    checked={!!picked[row.id]}
                    onChange={(e) => setPicked({ ...picked, [row.id]: e.target.checked })}
                  />
                )}
              </Td>
              <Td>
                <span className="font-semibold text-ink-900">{row.name}</span>
                <span className="block text-xs text-ink-500">{t(row.roleTitle)}</span>
              </Td>
              <Td className="tabular text-right">{inr(row.monthlySalary)}</Td>
              <Td>
                {row.paid ? (
                  <>
                    <Badge tone="green">{t('Paid {amount}', { amount: inr(row.paid.amount) })}</Badge>
                    <span className="mt-0.5 block text-xs text-ink-500">
                      {formatDate(row.paid.spentOn)} · {t(METHOD_LABELS[row.paid.method])}
                    </span>
                  </>
                ) : (
                  <Badge tone="amber">{t('Not paid')}</Badge>
                )}
              </Td>
              <Td className="text-right">
                {row.paid ? null : (
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    aria-label={t('Amount for {name}', { name: row.name })}
                    value={amounts[row.id] ?? ''}
                    disabled={!picked[row.id]}
                    onChange={(e) => setAmounts({ ...amounts, [row.id]: e.target.value })}
                    className="tabular ml-auto w-28 text-right"
                  />
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-ink-100 bg-ink-50/50 p-4">
        {pending.length ? (
          <>
            <div className="flex flex-wrap gap-3">
              <Field label={t('Paid on')}>
                <Input type="date" value={paidOn} max={today} onChange={(e) => setPaidOn(e.target.value)} className="w-auto" />
              </Field>
              <Field label={t('Paid by')}>
                <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="w-auto">
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {t(METHOD_LABELS[m])}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-ink-500">
                {t('{n} staff', { n: chosen.length })}
                <span className="tabular ml-2 font-display text-xl font-bold text-ink-900">{inr(total)}</span>
              </p>
              <LoadingButton size="lg" loading={saving} disabled={!chosen.length || !paidOn} onClick={pay}>
                {t('Pay salaries')}
              </LoadingButton>
            </div>
          </>
        ) : (
          <p className="text-[15px] font-medium text-mint-700">
            {t('Everyone is paid for {label}: {paidTotal} in all.', { label, paidTotal: inr(paidTotal) })}
          </p>
        )}
      </div>
    </Card>
  );
}
