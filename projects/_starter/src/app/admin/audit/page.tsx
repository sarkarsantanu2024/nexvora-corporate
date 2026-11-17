import { History } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, UrlDate, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { ADMIN_ONLY, requireSession } from '@/lib/auth';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { listAudit } from '@/server/admin/service';
import { FilterBar, readSearch, type Search } from '../_ui/bits';

export const metadata: Metadata = { title: 'Activity log' };

const kindLabel = (kind: string) => kind.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default async function AuditPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(ADMIN_ONLY);
  const params = await readSearch(searchParams);
  const data = await listAudit(session, params);
  const filtered = Boolean(params.user || params.action || params.from || params.to);

  return (
    <>
      <PageHeader title={t('Activity log')} description={t('Who changed what, and when: enquiries, logins, settings and the website. Entries cannot be edited or removed.')} />

      <FilterBar>
        <UrlSelect param="user" label={t('Person')} options={[{ value: '', label: t('Everyone') }, ...data.people.filter((p) => p.id).map((p) => ({ value: p.id as string, label: p.name || t('No name') }))]} />
        <UrlSelect param="action" label={t('Kind of change')} options={[{ value: '', label: t('Every kind') }, ...data.kinds.map((kind) => ({ value: kind, label: kindLabel(kind) }))]} />
        {/* On a phone the two dates move into the filter sheet with the dropdowns, so the word between them goes too. */}
        <UrlDate param="from" label={t('From')} max={data.today} />
        <span className="text-sm text-ink-500 max-sm:hidden">{t('to')}</span>
        <UrlDate param="to" label={t('To')} max={data.today} />
        {filtered ? (
          <Link href="/admin/audit" className={buttonClass('ghost', 'sm')}>
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
                  <Th>{t('Kind')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id}>
                    <Td className="whitespace-nowrap text-ink-600">{formatDateTime(row.createdAt)}</Td>
                    <Td className="whitespace-nowrap font-semibold text-ink-900">{row.userName || t('System')}</Td>
                    <Td className="min-w-[260px]">{row.summary || <span className="text-ink-400">{t('No description')}</span>}</Td>
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
