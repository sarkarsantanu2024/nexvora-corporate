import { Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import { UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { currentPeriod, formatDate, lastPeriods, periodLabel, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { expenseCategories, listExpenses } from '@/server/money/expenses';
import { METHOD_LABELS } from '@/server/money/labels';
import { requirePlan } from '@/server/platform';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { DeleteExpense, ExpenseButton } from './expense-form';

export const metadata: Metadata = { title: 'Expenses' };

export default async function ExpensesPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const [data, categories] = await Promise.all([listExpenses(session, { month: params.month, category: params.category }), expenseCategories()]);
  const months = lastPeriods(24).reverse();
  const today = todayIST();
  // A category that was removed from Settings still shows for the old entries.
  const allCategories = [...new Set([...categories, ...data.byCategory.map((c) => c.category)])];

  return (
    <>
      <PageHeader
        title={t('Expenses')}
        description={t('What the school spends from its own funds. A deleted entry goes to the Trash and leaves every total.')}
        actions={<ExpenseButton categories={categories} today={today} />}
      />

      <FilterBar>
        <UrlSelect param="month" label={t('Month')} options={months.map((m) => ({ value: m === currentPeriod() ? '' : m, label: periodLabel(m) }))} />
        <UrlSelect param="category" label={t('Category')} options={[{ value: '', label: t('All categories') }, ...allCategories.map((c) => ({ value: c, label: t(c) }))]} />
      </FilterBar>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">{t('Spent in {month}', { month: periodLabel(data.month) })}</p>
          <p className="tabular mt-1 font-display text-2xl font-bold text-brand-900">{inr(data.total)}</p>
        </Card>
        <Card className="p-4 sm:col-span-2">
          <p className="text-sm font-medium text-ink-500">{t('By category')}</p>
          {data.byCategory.length ? (
            <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {data.byCategory.map((c) => (
                <li key={c.category}>
                  <span className="text-ink-600">{t(c.category)}</span> <span className="tabular font-bold text-ink-900">{inr(c.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-ink-400">{t('Nothing yet')}</p>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        {data.rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t('Date')}</Th>
                <Th>{t('Category')}</Th>
                <Th>{t('Details')}</Th>
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
                  <Td className="font-medium">{t(row.category)}</Td>
                  <Td className="max-w-xs">{row.description}</Td>
                  <Td>{row.paidTo}</Td>
                  <Td>{t(METHOD_LABELS[row.method])}</Td>
                  <Td className="tabular text-right font-semibold">{inr(row.amount)}</Td>
                  <Td>
                    <div className="no-print flex justify-end gap-2">
                      <ExpenseButton
                        categories={allCategories}
                        today={today}
                        initial={{ id: row.id, category: row.category, description: row.description, amount: String(row.amount), spentOn: row.spentOn, paidTo: row.paidTo, method: row.method }}
                      />
                      <DeleteExpense id={row.id} label={`${t(row.category)}, ${inr(row.amount)}`} />
                    </div>
                  </Td>
                </Tr>
              ))}
              {params.category ? (
                <tr>
                  <Td colSpan={5} className="text-right font-semibold">
                    {t('Total shown')}
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
            title={t('No expenses in {month}', { month: periodLabel(data.month) })}
            text={t('Write down each payment the school makes: the electricity bill, a repair, register books. The monthly total shows here and in Reports.')}
            action={<ExpenseButton categories={categories} today={today} />}
          />
        )}
      </Card>
    </>
  );
}
