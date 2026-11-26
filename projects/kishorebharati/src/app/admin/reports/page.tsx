import type { Metadata } from 'next';
import { PrintButton, UrlSelect } from '@/components/ui/client';
import { BarsChart, Donut } from '@/components/ui/charts';
import { Card, CardBody, CardHeader, EmptyState, PageHeader, Stat, Table, Td, Th, Tr } from '@/components/ui/core';
import { ADMIN_ONLY, requireSession } from '@/lib/auth';
import { currentPeriod, lastPeriods, periodLabel, todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { METHOD_LABELS } from '@/server/money/labels';
import { duesByClass, incomeVsExpense, rangeFrom, statement } from '@/server/money/reports';
import { requirePlan } from '@/server/platform';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { SchoolPrintHeader } from '../fees/print-header';
import { classOf } from '../fees/shared';

export const metadata: Metadata = { title: 'Reports' };

export default async function ReportsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(ADMIN_ONLY);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const range = rangeFrom({ month: params.month, year: params.year });
  const [trend, sheet, dues] = await Promise.all([incomeVsExpense(session, 12), statement(session, range), duesByClass(session)]);
  const thisYear = Number(todayIST().slice(0, 4));
  const rangeLabel = range.kind === 'year' ? t('The year {year}', { year: range.label }) : periodLabel(range.label);

  return (
    <>
      <div className="no-print">
        <PageHeader title={t('Reports')} description={t('Money in and money out, fees by head, and dues by class. Print the statement or save it as a PDF.')} actions={<PrintButton label={t('Print statement')} />} />
      </div>

      <section className="no-print mb-6 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Stat label={t('Collected this month')} value={inr(trend[trend.length - 1]?.collected ?? 0)} tone="green" />
          <Stat label={t('Spent this month')} value={inr(trend[trend.length - 1]?.spent ?? 0)} tone="amber" />
          <Stat label={t('Dues today')} value={inr(dues.total)} hint={t('{n} students', { n: dues.students })} tone={dues.total > 0 ? 'red' : 'green'} href="/admin/fees?tab=dues" />
          <Stat label={t('Past due date')} value={inr(dues.overdue)} tone={dues.overdue > 0 ? 'red' : 'green'} href="/admin/fees?tab=dues&sort=age" />
        </div>

        <Card>
          <CardHeader title={t('Income and expenses, last 12 months')} />
          <CardBody>
            <BarsChart
              money
              data={trend.map((row) => ({ label: periodLabel(row.period).slice(0, 3), collected: row.collected, spent: row.spent }))}
              series={[
                { key: 'collected', name: t('Collected') },
                { key: 'spent', name: t('Spent') },
              ]}
            />
          </CardBody>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2 [&>*]:min-w-0">
          <Card>
            <CardHeader title={t('Collection by fee head')} description={rangeLabel} />
            <CardBody>
              {sheet.income.length ? <Donut money data={sheet.income.map((row) => ({ name: row.name || t('Other'), value: row.amount }))} centerLabel={t('Collected')} /> : <p className="text-sm text-ink-500">{t('Nothing collected in this time.')}</p>}
            </CardBody>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title={t('Dues by class')} description={t('As of today')} />
            <div className="mt-3">
              {dues.rows.length ? (
                <Table>
                  <thead>
                    <tr>
                      <Th>{t('Class')}</Th>
                      <Th className="text-right">{t('Students')}</Th>
                      <Th className="text-right">{t('Past due date')}</Th>
                      <Th className="text-right">{t('Total due')}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {dues.rows.map((row) => (
                      <Tr key={row.sectionId ?? 'none'}>
                        <Td>{classOf(row, lang) || t('No class this year')}</Td>
                        <Td className="tabular text-right">{row.students}</Td>
                        <Td className="tabular text-right">{inr(row.overdue)}</Td>
                        <Td className="tabular text-right font-semibold">{inr(row.due)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <EmptyState title={t('No dues')} text={t('Every bill is paid.')} />
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* The statement: what prints. */}
      <section>
        <FilterBar>
          <span className="text-sm font-semibold text-ink-700">{t('Income and expense statement')}</span>
          <UrlSelect param="month" label={t('Month')} options={[{ value: '', label: t('This month') }, ...lastPeriods(24).reverse().filter((m) => m !== currentPeriod()).map((m) => ({ value: m, label: periodLabel(m) }))]} />
          <UrlSelect param="year" label={t('Whole year')} options={[{ value: '', label: t('Not a whole year') }, ...[thisYear, thisYear - 1, thisYear - 2].map((y) => ({ value: String(y), label: String(y) }))]} />
        </FilterBar>

        <Card className="print-plain">
          <CardBody>
            <SchoolPrintHeader title={t('Income and expense statement')} sub={rangeLabel} />
            <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
              <div>
                <p className="mb-2 font-bold text-ink-900">{t('Income: fees collected')}</p>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {sheet.income.map((row) => (
                      <tr key={row.name} className="border-b border-ink-100">
                        <td className="py-1.5 pr-3">{row.name || t('Other')}</td>
                        <td className="tabular py-1.5 text-right">{inr(row.amount)}</td>
                      </tr>
                    ))}
                    {!sheet.income.length ? (
                      <tr>
                        <td className="py-1.5 text-ink-400" colSpan={2}>
                          {t('Nothing collected in this time.')}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="border-t-2 border-ink-900 font-bold">
                      <td className="py-2">{t('Total income')}</td>
                      <td className="tabular py-2 text-right">{inr(sheet.collection)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-ink-500">
                  {sheet.methods
                    .filter((m) => m.amount > 0)
                    .map((m) => `${t(METHOD_LABELS[m.method])} ${inr(m.amount)}`)
                    .join(' · ')}
                </p>
              </div>
              <div>
                <p className="mb-2 font-bold text-ink-900">{t('Expenses')}</p>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {sheet.expenses.map((row) => (
                      <tr key={row.category} className="border-b border-ink-100">
                        <td className="py-1.5 pr-3">{t(row.category)}</td>
                        <td className="tabular py-1.5 text-right">{inr(row.amount)}</td>
                      </tr>
                    ))}
                    {!sheet.expenses.length ? (
                      <tr>
                        <td className="py-1.5 text-ink-400" colSpan={2}>
                          {t('Nothing spent in this time.')}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="border-t-2 border-ink-900 font-bold">
                      <td className="py-2">{t('Total expenses')}</td>
                      <td className="tabular py-2 text-right">{inr(sheet.expenseTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-ink-200 px-4 py-3">
              <p className="font-bold text-ink-900">{sheet.balance >= 0 ? t('Income over expenses') : t('Expenses over income')}</p>
              <p className={`tabular font-display text-2xl font-bold ${sheet.balance >= 0 ? 'text-mint-700' : 'text-accent-600'}`}>{inr(Math.abs(sheet.balance))}</p>
            </div>
            <p className="mt-3 text-xs text-ink-500">{t('Void receipts and expenses in the Trash are left out. Library fines are not in this statement.')}</p>
            <div className="mt-12 hidden justify-between text-sm print:flex">
              <p className="border-t border-ink-400 pt-1">{t('Prepared by')}</p>
              <p className="border-t border-ink-400 pt-1">{t('Head of school')}</p>
            </div>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
