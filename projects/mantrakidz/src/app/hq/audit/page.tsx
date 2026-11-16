import { History } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { formatDateTime } from '@/lib/date';
import { listAudit } from '@/server/hq/admin';
import { centreOptions } from '@/server/hq/centres';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { DateParam } from '../_ui/date-param';

export const metadata: Metadata = { title: 'Activity log' };

const kindLabel = (kind: string) => kind.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default async function AuditPage({ searchParams }: { searchParams: Search }) {
  const session = await requireSession(['hq_admin']);
  const params = await readSearch(searchParams);
  const [data, centres] = await Promise.all([listAudit(session, params), centreOptions()]);
  const filtered = Boolean(params.centre || params.user || params.action || params.from || params.to);

  return (
    <>
      <PageHeader title="Activity log" description="Who changed what, and when: money, children, centres, logins and the website. Entries cannot be edited or removed." />

      <FilterBar>
        <UrlSelect
          param="centre"
          label="Centre"
          options={[{ value: '', label: 'Head office and all centres' }, { value: 'hq', label: 'Head office only' }, ...centres.map((centre) => ({ value: centre.id, label: centre.name }))]}
        />
        <UrlSelect param="user" label="Person" options={[{ value: '', label: 'Everyone' }, ...data.people.filter((p) => p.id).map((p) => ({ value: p.id as string, label: p.name || 'No name' }))]} />
        <UrlSelect param="action" label="Kind of change" options={[{ value: '', label: 'Every kind' }, ...data.kinds.map((kind) => ({ value: kind, label: kindLabel(kind) }))]} />
        <DateParam param="from" label="From" value={params.from ?? ''} max={data.today} />
        <span className="text-sm text-ink-500">to</span>
        <DateParam param="to" label="To" value={params.to ?? ''} max={data.today} />
        {filtered ? (
          <Link href="/hq/audit" className={buttonClass('ghost', 'sm')}>
            Clear
          </Link>
        ) : null}
      </FilterBar>

      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Who</Th>
                  <Th>What</Th>
                  <Th>Centre</Th>
                  <Th>Kind</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(({ row, centreName }) => (
                  <Tr key={row.id}>
                    <Td className="whitespace-nowrap text-ink-600">{formatDateTime(row.createdAt)}</Td>
                    <Td className="whitespace-nowrap font-semibold text-ink-900">{row.userName || 'System'}</Td>
                    <Td className="min-w-[260px]">{row.summary || <span className="text-ink-400">No description</span>}</Td>
                    <Td className="whitespace-nowrap">{centreName ?? <span className="text-ink-400">Head office</span>}</Td>
                    <Td>
                      <code className="rounded-md bg-ink-100 px-1.5 py-0.5 text-xs text-ink-700">{row.action}</code>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState icon={<History size={26} />} title={filtered ? 'Nothing matches these filters' : 'No activity yet'} text={filtered ? 'Widen the dates or clear a filter.' : 'Every change that matters is recorded here as it happens.'} />
        )}
      </Card>
    </>
  );
}
