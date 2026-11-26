import { Megaphone, Pin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { listCirculars } from '@/server/office/circulars';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { readSearch, type Search } from '../_ui/bits';
import { CircularFormButton } from './circular-tools';

export const metadata: Metadata = { title: 'Staff circulars' };

export default async function CircularsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const office = isOffice(session);
  const data = await listCirculars(session, { page: params.page });
  const today = todayIST();

  return (
    <>
      <PageHeader
        title={t('Staff circulars')}
        description={office ? t('Notices for teachers and staff only. See who has read each one.') : t('Notices from the head of school and the office. Open each one and say you have read it.')}
        actions={office ? <CircularFormButton /> : undefined}
      />
      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Circular')}</Th>
                  <Th>{t('Date')}</Th>
                  <Th>{office ? t('Read by') : t('Status')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(({ circular, reads, readAt }) => (
                  <Tr key={circular.id}>
                    <Td className="min-w-[220px]">
                      <Link href={`/admin/circulars/${circular.id}`} className="inline-flex items-center gap-1.5 font-semibold text-ink-900 hover:text-brand-700">
                        {circular.pinned ? <Pin size={14} className="text-brand-600" /> : null}
                        {circular.title}
                      </Link>
                      {circular.body ? <p className="line-clamp-1 text-sm text-ink-500">{circular.body}</p> : null}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatDate(circular.publishOn)}
                      {office && circular.publishOn > today ? <p className="text-xs text-sun-700">{t('Not up yet')}</p> : null}
                      {office && circular.expiresOn && circular.expiresOn < today ? <p className="text-xs text-ink-400">{t('Taken down')}</p> : null}
                    </Td>
                    <Td>
                      {office ? (
                        <span className="tabular text-sm">{t('{n} of {total}', { n: reads, total: data.readers })}</span>
                      ) : readAt ? (
                        <Badge tone="green">{t('Read')}</Badge>
                      ) : (
                        <Badge tone="amber">{t('Not read')}</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<Megaphone size={26} />}
            title={t('No circulars yet')}
            text={office ? t('Post a notice for the staff room: duty charts, meetings, orders from the department. Teachers see it in their dashboard.') : t('Circulars from the office show here.')}
            action={office ? <CircularFormButton /> : undefined}
          />
        )}
      </Card>
    </>
  );
}
