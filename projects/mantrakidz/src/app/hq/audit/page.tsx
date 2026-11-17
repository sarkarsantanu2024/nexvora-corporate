import { History } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { listAudit } from '@/server/hq/admin';
import { centreOptions } from '@/server/hq/centres';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { DateParam } from '../_ui/date-param';

export const metadata: Metadata = { title: 'Activity log' };

const kindLabel = (kind: string) => kind.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default async function AuditPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(['hq_admin']);
  const params = await readSearch(searchParams);
  const [data, centres] = await Promise.all([listAudit(session, params), centreOptions()]);
  const filtered = Boolean(params.centre || params.user || params.action || params.from || params.to);

  return (
    <>
      <PageHeader title={t('Activity log')} description={t('Who changed what, and when: money, children, centres, logins and the website. Entries cannot be edited or removed.')} />

      <FilterBar>
        <UrlSelect
          param="centre"
          label={t('Centre')}
          options={[{ value: '', label: t('Head office and all centres') }, { value: 'hq', label: t('Head office only') }, ...centres.map((centre) => ({ value: centre.id, label: centre.name }))]}
        />
        <UrlSelect param="user" label={t('Person')} options={[{ value: '', label: t('Everyone') }, ...data.people.filter((p) => p.id).map((p) => ({ value: p.id as string, label: p.name || t('No name') }))]} />
        <UrlSelect param="action" label={t('Kind of change')} options={[{ value: '', label: t('Every kind') }, ...data.kinds.map((kind) => ({ value: kind, label: kindLabel(kind) }))]} />
        <DateParam param="from" label={t('From')} value={params.from ?? ''} max={data.today} />
        <span className="text-sm text-ink-500">{t('to')}</span>
        <DateParam param="to" label={t('To')} value={params.to ?? ''} max={data.today} />
        {filtered ? (
          <Link href="/hq/audit" className={buttonClass('ghost', 'sm')}>
            {t('Clear')}
          </Link>
        ) : null}
      </FilterBar>

      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('When')}</Th>
                  <Th>{t('Who')}</Th>
                  <Th>{t('What')}</Th>
                  <Th>{t('Centre')}</Th>
                  <Th>{t('Kind')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(({ row, centreName }) => (
                  <Tr key={row.id}>
                    <Td className="whitespace-nowrap text-ink-600">{formatDateTime(row.createdAt)}</Td>
                    <Td className="whitespace-nowrap font-semibold text-ink-900">{row.userName || t('System')}</Td>
                    <Td className="min-w-[260px]">{row.summary || <span className="text-ink-400">{t('No description')}</span>}</Td>
                    <Td className="whitespace-nowrap">{centreName ?? <span className="text-ink-400">{t('Head office')}</span>}</Td>
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
          <EmptyState icon={<History size={26} />} title={filtered ? t('Nothing matches these filters') : t('No activity yet')} text={filtered ? t('Widen the dates or clear a filter.') : t('Every change that matters is recorded here as it happens.')} />
        )}
      </Card>
    </>
  );
}
