'use client';

import { CalendarPlus, Eye, Tags } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ConfirmButton, LoadingButton, useToast } from '@/components/ui/client';
import { Card, CardBody, CardHeader, EmptyState, Field, FormGrid, Input, LinkButton, Notice, Select, Table, Td, Th, Tr } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { SCHOOL, gradeLabel } from '@/config/school';
import type { FeeKind } from '@/db/schema';
import { inr } from '@/lib/money';
import { useRouter } from 'next/navigation';
import { previewRunAction, runBillsAction } from '@/server/money/actions';
import { FEE_KIND_LABELS, billPeriodLabel } from '@/server/money/labels';

type Head = { id: string; name: string; kind: FeeKind; fromGrade: number; toGrade: number; amount: number };
type Preview = { students: number; toCreate: number; toAddTo: number; amount: number; alreadyBilled: number; noFee: number; cancelled: number; byGrade: { grade: number; students: number; amount: number }[] };

/**
 * Pick the year (or a month), the classes and the fee heads, see what would
 * be raised, then raise it. Nothing is written until "Raise bills".
 */
export function RunForm({ heads, year, month, today, dueDate: initialDue }: { heads: Head[]; year: string; month: string; today: string; dueDate: string }) {
  const t = useT();
  const lang = useUiLang();
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState<'year' | 'month'>('year');
  const [yearValue, setYearValue] = useState(year);
  const [monthValue, setMonthValue] = useState(month);
  const [fromGrade, setFromGrade] = useState(String(SCHOOL.grades[0]));
  const [toGrade, setToGrade] = useState(String(SCHOOL.grades[SCHOOL.grades.length - 1]));
  const [dueDate, setDueDate] = useState(initialDue);
  const [picked, setPicked] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const grade = (g: number) => gradeLabel(g, lang === 'bn' ? 'bn' : 'en');
  const offered = heads.filter((head) => (kind === 'year' ? head.kind !== 'monthly' : head.kind === 'monthly'));
  const period = kind === 'year' ? yearValue : monthValue;
  const thisYear = Number(today.slice(0, 4));
  const input = () => ({ period, fromGrade: Number(fromGrade), toGrade: Number(toGrade), headIds: picked.filter((id) => offered.some((head) => head.id === id)), dueDate });
  const changed = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPreview(null);
  };

  async function look() {
    setBusy(true);
    const result = await previewRunAction(input());
    setBusy(false);
    if (!result.ok) {
      setErrors(Object.fromEntries(Object.entries(result.fields ?? {}).map(([key, message]) => [key, t(message)])));
      toast.error(t(result.error));
      return;
    }
    setErrors({});
    setPreview(result.data);
  }

  if (!heads.length) {
    return (
      <Card>
        <EmptyState
          icon={<Tags size={26} />}
          title={t('Add the fee heads first')}
          text={t('A bill is made only from fee heads: what the school charges and for which classes, as set by the government.')}
          action={<LinkButton href="/admin/fees?tab=heads">{t('Fee heads')}</LinkButton>}
        />
      </Card>
    );
  }

  const work = preview ? preview.toCreate + preview.toAddTo : 0;
  const label = billPeriodLabel(period);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title={t('What to bill')} />
        <CardBody className="space-y-4">
          <div role="group" aria-label={t('Bill for')} className="inline-flex rounded-xl border border-ink-200 p-1">
            {(['year', 'month'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={kind === option}
                onClick={() => changed(setKind)(option)}
                className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold transition ${kind === option ? 'bg-brand-700 text-white' : 'text-ink-700 hover:bg-ink-50'}`}
              >
                {option === 'year' ? t('Yearly bill') : t('Monthly bill')}
              </button>
            ))}
          </div>
          <FormGrid>
            {kind === 'year' ? (
              <Field label={t('Year')} required error={errors.period}>
                <Select value={yearValue} onChange={(e) => changed(setYearValue)(e.target.value)}>
                  {[thisYear + 1, thisYear, thisYear - 1].map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label={t('Month')} required error={errors.period}>
                <Input type="month" value={monthValue} onChange={(e) => changed(setMonthValue)(e.target.value)} />
              </Field>
            )}
            <Field label={t('Due date')} required error={errors.dueDate}>
              <Input type="date" min={today} value={dueDate} onChange={(e) => changed(setDueDate)(e.target.value)} />
            </Field>
            <Field label={t('From class')} required error={errors.fromGrade}>
              <Select value={fromGrade} onChange={(e) => changed(setFromGrade)(e.target.value)}>
                {SCHOOL.grades.map((g) => (
                  <option key={g} value={g}>
                    {grade(g)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('To class')} required>
              <Select value={toGrade} onChange={(e) => changed(setToGrade)(e.target.value)}>
                {SCHOOL.grades.map((g) => (
                  <option key={g} value={g}>
                    {grade(g)}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-ink-700">{t('Fee heads')}</legend>
            {offered.length ? (
              <ul className="overflow-hidden rounded-xl border border-ink-200">
                {offered.map((head) => (
                  <li key={head.id} className="border-b border-ink-100 last:border-b-0">
                    <label className="flex cursor-pointer items-center gap-3 px-3.5 py-3 text-[15px] active:bg-ink-50">
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded accent-brand-700"
                        checked={picked.includes(head.id)}
                        onChange={() => changed(setPicked)(picked.includes(head.id) ? picked.filter((p) => p !== head.id) : [...picked, head.id])}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink-900">{head.name}</span>
                        <span className="block text-xs text-ink-500">
                          {t(FEE_KIND_LABELS[head.kind])} · {head.fromGrade === head.toGrade ? grade(head.fromGrade) : t('{from} to {to}', { from: grade(head.fromGrade), to: grade(head.toGrade) })}
                        </span>
                      </span>
                      <span className="tabular shrink-0 font-bold text-ink-900">{inr(head.amount)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <Notice tone="amber">{kind === 'year' ? t('There is no fee head charged once a year or one time.') : t('There is no fee head charged every month.')}</Notice>
            )}
            {errors.headIds ? <p className="mt-1 text-sm font-medium text-accent-600">{errors.headIds}</p> : null}
          </fieldset>

          <div className="flex justify-end">
            <LoadingButton variant="secondary" loading={busy} disabled={!input().headIds.length} onClick={look}>
              <Eye size={18} /> {t('See what will be raised')}
            </LoadingButton>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t('Before you raise')} />
        <CardBody>
          {preview ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('New bills')}</dt>
                  <dd className="tabular font-display text-2xl font-bold text-ink-900">{preview.toCreate}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Bills that get a new line')}</dt>
                  <dd className="tabular font-display text-2xl font-bold text-ink-900">{preview.toAddTo}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Amount in all')}</dt>
                  <dd className="tabular font-display text-2xl font-bold text-ink-900">{inr(preview.amount)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('Already billed')}</dt>
                  <dd className="tabular font-display text-2xl font-bold text-ink-900">{preview.alreadyBilled}</dd>
                </div>
              </dl>
              {preview.noFee ? <Notice tone="amber">{t('{n} students on roll have none of these fee heads for their class and are left out.', { n: preview.noFee })}</Notice> : null}
              {preview.cancelled ? <Notice tone="amber">{t('{n} students have a cancelled bill for {period} and are left out.', { n: preview.cancelled, period: label })}</Notice> : null}
              {preview.byGrade.length ? (
                <Table>
                  <thead>
                    <tr>
                      <Th>{t('Class')}</Th>
                      <Th className="text-right">{t('Students')}</Th>
                      <Th className="text-right">{t('Amount')}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.byGrade.map((row) => (
                      <Tr key={row.grade}>
                        <Td>{grade(row.grade)}</Td>
                        <Td className="tabular text-right">{row.students}</Td>
                        <Td className="tabular text-right font-semibold">{inr(row.amount)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              ) : null}
              <div className="flex justify-end">
                <ConfirmButton
                  variant="primary"
                  size="lg"
                  danger={false}
                  disabled={work === 0}
                  title={t('Raise the bills for {period}?', { period: label })}
                  text={t('{n} students will be billed {amount} in all. A student who already has this bill gets only the fee heads not on it yet.', { n: work, amount: inr(preview.amount) })}
                  confirmLabel={t('Raise bills')}
                  onConfirm={async () => {
                    const result = await runBillsAction(input());
                    if (!result.ok) {
                      toast.error(t(result.error));
                      return;
                    }
                    toast.success(t('{created} new bills, {added} bills with a new line', { created: result.data.created, added: result.data.added }));
                    setPreview(null);
                    router.push(`/admin/fees?tab=bills&period=${period}`);
                  }}
                >
                  <CalendarPlus size={18} /> {work === 0 ? t('Nothing to raise') : t('Raise bills')}
                </ConfirmButton>
              </div>
            </div>
          ) : (
            <p className="text-[15px] text-ink-500">
              {t('Pick the year, the classes and the fee heads, then press "See what will be raised". Nothing is saved until you raise the bills.')}{' '}
              <Link href="/admin/fees?tab=heads" className="font-semibold text-brand-700 hover:underline">
                {t('Fee heads')}
              </Link>
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
