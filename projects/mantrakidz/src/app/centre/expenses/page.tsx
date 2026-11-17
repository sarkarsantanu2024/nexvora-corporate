import { Banknote, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, LinkButton, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { currentPeriod, formatDate, periodLabel, todayIST } from '@/lib/date';
import { inr, percent } from '@/lib/money';
import { getT } from '@/lib/t';
import { listExpenses } from '@/server/centre/money/expenses';
import { EXPENSE_CATEGORIES, METHOD_LABELS } from '@/server/centre/money/labels';
import { UrlPick } from '../fees/pickers';
import { AddExpenseButton, ExpenseRowActions } from './expense-form';

export const metadata: Metadata = { title: 'Expenses' };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string; category?: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  if (!canManageCentre(ctx.session)) redirect('/centre');
  const params = await searchParams;
  const data = await listExpenses(ctx, params);
  const label = periodLabel(data.month);
  const today = todayIST();
  // Categories on file that are not in the fixed list (older entries) still need to be filterable.
  const categories = [...new Set([...EXPENSE_CATEGORIES, ...data.byCategory.map((c) => c.category)])];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={t('Expenses')}
        description={t('What the school spends: rent, salaries, bills and supplies.')}
        actions={
          <>
            <AddExpenseButton today={today} />
            <LinkButton href={`/centre/expenses/salaries?month=${data.month}`} variant="secondary">
              <Banknote size={18} /> {t('Pay salaries')}
            </LinkButton>
          </>
        }
      />

      <div className="no-print mb-4 filter-bar flex flex-wrap items-center gap-2">
        <UrlPick param="month" type="month" fallback={currentPeriod()} max={currentPeriod()} label={t('Month')} />
        <UrlSelect param="category" label={t('Category')} options={[{ value: '', label: t('All categories') }, ...categories.map((c) => ({ value: c, label: t(c) }))]} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-1 lg:order-2">
          <div className="border-b border-ink-100 px-5 py-4">
            <p className="text-sm font-medium text-ink-500">{t('Spent in {label}', { label })}</p>
            <p className="tabular mt-1 font-display text-[28px] font-bold leading-none text-ink-900">{inr(data.total)}</p>
          </div>
          {data.byCategory.length ? (
            <ul className="divide-y divide-ink-100">
              {data.byCategory.map((c) => (
                <li key={c.category}>
                  <Link
                    href={`/centre/expenses?month=${data.month}${data.category === c.category ? '' : `&category=${encodeURIComponent(c.category)}`}`}
                    className={`block px-5 py-3 transition hover:bg-brand-50/50 ${data.category === c.category ? 'bg-brand-50' : ''}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[15px] font-medium text-ink-800">{t(c.category)}</span>
                      <span className="tabular font-semibold text-ink-900">{inr(c.amount)}</span>
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <span className="block h-full rounded-full bg-brand-600" style={{ width: `${percent(c.amount, data.total)}%` }} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-ink-500">{t('Nothing spent in {label} yet.', { label })}</p>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          {data.rows.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>{t('Date')}</Th>
                  <Th>{t('Category')}</Th>
                  <Th>{t('Paid to')}</Th>
                  <Th>{t('Method')}</Th>
                  <Th className="text-right">{t('Amount')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id}>
                    <Td className="whitespace-nowrap">{formatDate(row.spentOn)}</Td>
                    <Td>
                      <span className="font-semibold text-ink-900">{t(row.category)}</span>
                      {row.description ? <span className="block text-xs text-ink-500">{row.description}</span> : null}
                    </Td>
                    <Td>{row.paidTo}</Td>
                    <Td>{t(METHOD_LABELS[row.method])}</Td>
                    <Td className="tabular text-right font-semibold">{inr(row.amount)}</Td>
                    <Td>
                      <ExpenseRowActions
                        today={today}
                        expense={{
                          id: row.id,
                          category: row.category,
                          description: row.description,
                          amount: row.amount,
                          spentOn: row.spentOn,
                          paidTo: row.paidTo,
                          method: row.method,
                          isSalary: Boolean(row.staffId),
                        }}
                      />
                    </Td>
                  </Tr>
                ))}
                {data.category ? (
                  <tr>
                    <Td colSpan={4} className="text-right font-semibold">
                      {t('{category} in {label}', { category: t(data.category), label })}
                    </Td>
                    <Td className="tabular text-right text-base font-bold">{inr(data.shownTotal)}</Td>
                    <Td />
                  </tr>
                ) : null}
              </tbody>
            </Table>
          ) : (
            <EmptyState
              icon={<Wallet size={26} />}
              title={data.category ? t('No {category} expense in {label}', { category: t(data.category), label }) : t('No expenses in {label}', { label })}
              text={t("Write down every rupee the school spends, so the month's surplus is the real one.")}
              action={<AddExpenseButton today={today} />}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
