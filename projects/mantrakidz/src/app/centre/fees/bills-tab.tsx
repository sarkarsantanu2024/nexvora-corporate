import { FileText, X } from 'lucide-react';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, LinkButton, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { canManageCentre } from '@/lib/auth';
import { addMonths, currentPeriod, formatDate, lastPeriods, periodLabel, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { getChild, listBills, listClasses, type BillFilter } from '@/server/centre/money/bills';
import type { Ctx } from '@/server/centre/money/shared';

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'due', label: 'Not fully paid' },
  { value: 'overdue', label: 'Past due date' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Part paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function Totals({ items }: { items: { label: string; value: number; tone?: 'red' | 'green' }[] }) {
  return (
    <dl className="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{item.label}</dt>
          <dd className={`tabular mt-0.5 font-display text-lg font-bold sm:text-xl ${item.tone === 'red' ? 'text-accent-600' : item.tone === 'green' ? 'text-mint-700' : 'text-ink-900'}`}>
            {inr(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export async function BillsTab({ ctx, filter }: { ctx: Ctx; filter: BillFilter }) {
  const [data, classes, child] = await Promise.all([listBills(ctx, filter), listClasses(ctx), filter.student ? getChild(ctx, filter.student) : null]);
  const today = todayIST();
  const manager = canManageCentre(ctx.session);
  const months = [addMonths(currentPeriod(), 1), ...lastPeriods(12).reverse()];
  const filtered = Boolean(filter.q || filter.status || filter.month || filter.batch || filter.student);

  return (
    <>
      {child ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-800">
          Bills of
          <Link href={`/centre/students/${child.id}`} className="font-bold hover:underline">
            {child.name}
          </Link>
          <span className="text-brand-600">{child.admissionNo}</span>
          <Link href="/centre/fees" className="ml-auto inline-flex items-center gap-1 font-semibold hover:underline">
            <X size={15} /> Show all children
          </Link>
        </div>
      ) : null}

      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Child, admission no or bill no" />
        <UrlSelect param="month" label="Month" options={[{ value: '', label: 'All months' }, ...months.map((m) => ({ value: m, label: periodLabel(m) }))]} />
        <UrlSelect param="status" label="Status" options={STATUS_OPTIONS} />
        <UrlSelect param="batch" label="Class" options={[{ value: '', label: 'All classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} />
      </div>

      <Card className="overflow-hidden">
        {data.count ? (
          <>
            <Totals
              items={[
                { label: 'Billed', value: data.totals.billed },
                { label: 'Received', value: data.totals.received, tone: 'green' },
                { label: 'Balance', value: data.totals.balance, tone: data.totals.balance > 0 ? 'red' : undefined },
              ]}
            />
            <Table>
              <thead>
                <tr>
                  <Th>Bill</Th>
                  <Th>Child</Th>
                  <Th>For</Th>
                  <Th>Due</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Received</Th>
                  <Th className="text-right">Balance</Th>
                  <Th>Status</Th>
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
                        <Link href={`/centre/fees/bills/${row.id}`} className="whitespace-nowrap font-semibold text-brand-700 hover:underline">
                          {row.invoiceNo}
                        </Link>
                      </Td>
                      <Td>
                        <Link href={`/centre/students/${row.studentId}`} className="font-medium text-ink-900 hover:underline">
                          {row.studentName}
                        </Link>
                        <span className="block text-xs text-ink-500">{row.batchName ?? 'No class'}</span>
                      </Td>
                      <Td>{row.title}</Td>
                      <Td className={`whitespace-nowrap ${late ? 'font-semibold text-accent-600' : ''}`}>{formatDate(row.dueDate)}</Td>
                      <Td className="tabular text-right">{inr(row.total)}</Td>
                      <Td className="tabular text-right">{inr(row.paid)}</Td>
                      <Td className="tabular text-right font-semibold">{row.status === 'cancelled' ? '' : inr(row.total - row.paid)}</Td>
                      <Td>
                        <StatusBadge status={row.status} label={row.status === 'partial' ? 'Part paid' : undefined} />
                      </Td>
                      <Td className="text-right">
                        {open ? (
                          <LinkButton href={`/centre/fees/collect?student=${row.studentId}`} size="sm" variant="secondary">
                            Take payment
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
            title={filtered ? 'No bills match' : 'No bills yet'}
            text={
              filtered
                ? 'Try another month, status or name.'
                : 'A bill says what a child owes. Raise the monthly bills for every child in one go, or a single bill for an admission.'
            }
            action={
              filtered ? (
                <LinkButton href="/centre/fees" variant="secondary">
                  Clear filters
                </LinkButton>
              ) : manager ? (
                <LinkButton href="/centre/fees/run">Raise monthly bills</LinkButton>
              ) : (
                <LinkButton href="/centre/fees/new">New bill</LinkButton>
              )
            }
          />
        )}
      </Card>
    </>
  );
}
