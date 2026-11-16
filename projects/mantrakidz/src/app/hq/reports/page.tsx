import { BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrintButton } from '@/components/ui/client';
import { Card, CardHeader, EmptyState, PageHeader, TabLinks, Table, Td, Th, Tr } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { addMonths, currentPeriod, formatDate, periodRange, todayIST } from '@/lib/date';
import { parseRange } from '@/server/hq/reports';
import { DateParam } from '../_ui/date-param';
import { ExportLink, FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { REPORTS, buildReport, show, type ReportKey } from './columns';

export const metadata: Metadata = { title: 'Reports' };

/** Ready-made date ranges, so the usual questions are one click. */
function quickRanges() {
  const today = todayIST();
  const period = currentPeriod();
  const last = addMonths(period, -1);
  const [y, m] = today.split('-').map(Number);
  const fyStart = `${m >= 4 ? y : y - 1}-04-01`;
  return [
    { label: 'This month', from: `${period}-01`, to: today },
    { label: 'Last month', ...periodRange(last) },
    { label: 'Last 3 months', from: `${addMonths(period, -2)}-01`, to: today },
    { label: 'This financial year', from: fyStart, to: today },
  ];
}

export default async function ReportsPage({ searchParams }: { searchParams: Search }) {
  await requireSession(HQ_ROLES);
  const params = await readSearch(searchParams);
  const tab: ReportKey = REPORTS.some((r) => r.key === params.tab) ? (params.tab as ReportKey) : 'centres';
  const range = parseRange(params);
  const report = await buildReport(tab, range);
  const keep = { from: params.from, to: params.to };
  const empty = report.rows.length === 0;

  return (
    <>
      <PageHeader
        title="Reports"
        description="The whole network for the dates you choose. Each report can be printed or taken to Excel."
        actions={
          <>
            <ExportLink href={`/hq/reports/export${query({ tab, from: range.from, to: range.to })}`} />
            <PrintButton />
          </>
        }
      />

      <TabLinks active={tab} tabs={REPORTS.map((r) => ({ key: r.key, label: r.label, href: `/hq/reports${query({ ...keep, tab: r.key === 'centres' ? '' : r.key })}` }))} />

      <FilterBar>
        <DateParam param="from" label="From" value={range.from} max={todayIST()} />
        <span className="text-sm text-ink-500">to</span>
        <DateParam param="to" label="To" value={range.to} max={todayIST()} />
        <span className="mx-1 hidden h-6 w-px bg-ink-200 sm:block" />
        {quickRanges().map((quick) => (
          <Link
            key={quick.label}
            href={`/hq/reports${query({ tab: tab === 'centres' ? '' : tab, from: quick.from, to: quick.to })}`}
            scroll={false}
            className={cn(
              'rounded-xl border px-3 py-2 text-sm font-medium transition',
              quick.from === range.from && quick.to === range.to ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
            )}
          >
            {quick.label}
          </Link>
        ))}
      </FilterBar>

      <Card>
        <CardHeader title={`${report.title}, ${formatDate(range.from)} to ${formatDate(range.to)}`} description={report.note} className="pb-4" />
        {empty ? (
          <EmptyState icon={<BarChart3 size={26} />} title="Nothing to report yet" text="Once there are centres, their figures show here." />
        ) : (
          <Table>
            <thead>
              <tr>
                {report.columns.map((column) => (
                  <Th key={column.header} className={column.text ? undefined : 'text-right'}>
                    {column.header}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row, index) => (
                <Tr key={index}>
                  {report.columns.map((column) => {
                    const value = column.value(row);
                    return (
                      <Td
                        key={column.header}
                        className={cn('whitespace-nowrap', !column.text && 'tabular text-right', column.header === 'Centre' && 'font-semibold text-ink-900', typeof value === 'number' && value < 0 && 'text-accent-600')}
                      >
                        {show(column, row)}
                      </Td>
                    );
                  })}
                </Tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-ink-50/60 font-bold text-ink-900">
                {report.columns.map((column) => (
                  <Td key={column.header} className={column.text ? 'whitespace-nowrap' : 'tabular whitespace-nowrap text-right'}>
                    {show(column, report.totals)}
                  </Td>
                ))}
              </tr>
            </tfoot>
          </Table>
        )}
      </Card>
    </>
  );
}
