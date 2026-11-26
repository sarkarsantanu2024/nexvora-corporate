import { FileText, X } from 'lucide-react';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, LinkButton, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { addMonths, currentPeriod, formatDate, lastPeriods, periodLabel, todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import type { Session } from '@/lib/session-token';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { getStudentCard, listBills, listSections, type BillFilter } from '@/server/money/bills';
import { BILL_STATUS_LABELS } from '@/server/money/labels';
import { FilterBar } from '../_ui/bits';
import { billName, classOf } from './shared';

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'due', label: 'Not fully paid' },
  { value: 'overdue', label: 'Past due date' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Part paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Three figures in a row above a list. */
export function Totals({ items }: { items: { label: string; value: number; tone?: 'red' | 'green' }[] }) {
  return (
    <dl className="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-3 py-3 sm:px-4">
          <dt className="truncate text-xs font-semibold uppercase tracking-wide text-ink-400">{item.label}</dt>
          <dd className={`tabular mt-0.5 font-display text-base font-bold sm:text-xl ${item.tone === 'red' ? 'text-accent-600' : item.tone === 'green' ? 'text-mint-700' : 'text-ink-900'}`}>{inr(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export async function BillsTab({ session, filter }: { session: Session; filter: BillFilter }) {
  const t = await getT();
  const lang = await getLang();
  const [data, sections, student] = await Promise.all([listBills(session, filter), listSections(), filter.student ? getStudentCard(session, filter.student) : null]);
  const today = todayIST();
  const thisYear = Number(today.slice(0, 4));
  const periods = [String(thisYear + 1), String(thisYear), String(thisYear - 1), addMonths(currentPeriod(), 1), ...lastPeriods(12).reverse()];
  const filtered = Boolean(filter.q || filter.status || filter.period || filter.section || filter.student);

  return (
    <>
      {student ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-800">
          {t('Bills of')} <span className="font-bold">{student.name}</span>
          <span className="text-brand-600">{student.admissionNo}</span>
          <Link href="/admin/fees?tab=bills" className="ml-auto inline-flex items-center gap-1 font-semibold hover:underline">
            <X size={15} /> {t('Show all students')}
          </Link>
        </div>
      ) : null}

      <FilterBar>
        <SearchInput placeholder={t('Student, admission no or bill no')} />
        <UrlSelect param="period" label={t('Year or month')} options={[{ value: '', label: t('All years and months') }, ...periods.map((p) => ({ value: p, label: p.length === 4 ? p : periodLabel(p) }))]} />
        <UrlSelect param="status" label={t('Status')} options={STATUS_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))} />
        <UrlSelect param="section" label={t('Class')} options={[{ value: '', label: t('All classes') }, ...sections.map((row) => ({ value: row.id, label: classOf({ grade: row.grade, sectionName: row.name, stream: row.stream, shift: row.shift }, lang) }))]} />
      </FilterBar>

      <Card className="overflow-hidden">
        {data.count ? (
          <>
            <Totals
              items={[
                { label: t('Billed'), value: data.totals.billed },
                { label: t('Received'), value: data.totals.received, tone: 'green' },
                { label: t('Balance'), value: data.totals.balance, tone: data.totals.balance > 0 ? 'red' : undefined },
              ]}
            />
            <Table>
              <thead>
                <tr>
                  <Th>{t('Bill')}</Th>
                  <Th>{t('Student')}</Th>
                  <Th>{t('For')}</Th>
                  <Th>{t('Due date')}</Th>
                  <Th className="text-right">{t('Amount')}</Th>
                  <Th className="text-right">{t('Received')}</Th>
                  <Th className="text-right">{t('Balance')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const open = row.status === 'unpaid' || row.status === 'partial';
                  const late = open && row.dueDate < today;
                  return (
                    <Tr key={row.id}>
                      <Td>
                        <Link href={`/admin/fees/bills/${row.id}`} className="tabular whitespace-nowrap font-semibold text-brand-700 hover:underline">
                          {row.invoiceNo}
                        </Link>
                      </Td>
                      <Td>
                        <span className="font-medium text-ink-900">{row.studentName}</span>
                        <span className="block text-xs text-ink-500">{[classOf(row, lang), row.admissionNo].filter(Boolean).join(' · ')}</span>
                      </Td>
                      <Td>{billName(row, t)}</Td>
                      <Td className={`whitespace-nowrap ${late ? 'font-semibold text-accent-600' : ''}`}>{formatDate(row.dueDate)}</Td>
                      <Td className="tabular text-right">{inr(row.total)}</Td>
                      <Td className="tabular text-right">{inr(row.paid)}</Td>
                      <Td className="tabular text-right font-semibold">{row.status === 'cancelled' ? '' : inr(row.total - row.paid)}</Td>
                      <Td>
                        <StatusBadge status={row.status} label={t(BILL_STATUS_LABELS[row.status])} />
                      </Td>
                      <Td className="text-right">
                        {open ? (
                          <LinkButton href={`/admin/fees/collect?student=${row.studentId}`} size="sm" variant="secondary">
                            {t('Take payment')}
                          </LinkButton>
                        ) : null}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.count} />
          </>
        ) : (
          <EmptyState
            icon={<FileText size={26} />}
            title={filtered ? t('No bills match') : t('No bills yet')}
            text={filtered ? t('Try another year, status or name.') : t('A bill says what a student owes. Raise the yearly bill for every class in one go from Bill run, or a single bill from New bill.')}
            action={
              filtered ? (
                <LinkButton href="/admin/fees?tab=bills" variant="secondary">
                  {t('Clear filters')}
                </LinkButton>
              ) : isAdmin(session) ? (
                <LinkButton href="/admin/fees/run">{t('Bill run')}</LinkButton>
              ) : (
                <LinkButton href="/admin/fees/new">{t('New bill')}</LinkButton>
              )
            }
          />
        )}
      </Card>
    </>
  );
}
