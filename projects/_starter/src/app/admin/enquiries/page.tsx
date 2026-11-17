import { MessageSquareText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, StatusBadge, Table, Td, Th, Tr } from '@/components/ui/core';
import { ENQUIRY_STATUSES } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { STATUS_LABELS } from '@/server/enquiries/constants';
import { listEnquiries } from '@/server/enquiries/service';
import { ContactLinks, FilterBar, query, readSearch, type Search } from '../_ui/bits';

export const metadata: Metadata = { title: 'Enquiries' };

export default async function EnquiriesPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  await requireSession(TEAM_ROLES);
  const params = await readSearch(searchParams);
  const data = await listEnquiries({ q: params.q, status: params.status, page: params.page });
  const all = ENQUIRY_STATUSES.reduce((sum, status) => sum + data.counts[status], 0);
  const filtered = Boolean(params.q || params.status);

  return (
    <>
      <PageHeader title={t('Enquiries')} description={t('Messages sent from the contact form of the website. Reply by call, WhatsApp or email, then mark the enquiry contacted or closed.')} />

      <div className="no-print mb-4 flex flex-wrap gap-2">
        {[{ key: '', label: t('All'), n: all }, ...ENQUIRY_STATUSES.map((status) => ({ key: status as string, label: t(STATUS_LABELS[status]), n: data.counts[status] }))].map((item) => (
          <Link
            key={item.key || 'all'}
            href={`/admin/enquiries${query({ q: params.q, status: item.key })}`}
            scroll={false}
            className={cn(
              'rounded-xl border px-3.5 py-2 text-sm transition',
              (params.status ?? '') === item.key ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
            )}
          >
            <span className="font-medium">{item.label}</span> <span className="tabular ml-1 font-bold">{item.n}</span>
          </Link>
        ))}
      </div>

      <FilterBar>
        <SearchInput placeholder={t('Search name, mobile, email or subject')} />
      </FilterBar>

      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('From')}</Th>
                  <Th>{t('Message')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th>{t('Received')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <Link href={`/admin/enquiries/${row.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {row.name}
                      </Link>
                      <p className="tabular text-xs text-ink-500">{[row.phone, row.email].filter(Boolean).join(' · ')}</p>
                    </Td>
                    <Td className="min-w-[240px] max-w-md">
                      {row.subject ? <p className="truncate font-medium text-ink-800">{row.subject}</p> : null}
                      <p className="line-clamp-2 text-sm text-ink-600">{row.message}</p>
                    </Td>
                    <Td>
                      <StatusBadge status={row.status} label={t(STATUS_LABELS[row.status])} />
                    </Td>
                    <Td className="whitespace-nowrap">{formatDateTime(row.createdAt)}</Td>
                    <Td className="text-right">
                      <ContactLinks phone={row.phone} email={row.email} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<MessageSquareText size={26} />}
            title={filtered ? t('No enquiries match') : t('No enquiries yet')}
            text={filtered ? t('Try another status or search.') : t('When a visitor fills in the contact form on the website, the message shows here with the name and mobile number.')}
            action={filtered ? undefined : <Link href="/contact" className="font-semibold text-brand-700 hover:underline">{t('See the contact page')}</Link>}
          />
        )}
      </Card>
    </>
  );
}
