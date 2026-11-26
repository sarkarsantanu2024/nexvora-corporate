import { Trash2 } from 'lucide-react';
import type { Metadata } from 'next';
import { UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { ADMIN_ONLY, requireSession } from '@/lib/auth';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { TRASH_KINDS, listTrash } from '@/server/trash/service';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { TrashActions } from './trash-tools';

export const metadata: Metadata = { title: 'Trash' };

export default async function TrashPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(ADMIN_ONLY);
  const params = await readSearch(searchParams);
  const kind = TRASH_KINDS.some((item) => item.kind === params.kind) ? params.kind : undefined;
  const rows = await listTrash(session, kind);
  const labelOf = (key: string) => t(TRASH_KINDS.find((item) => item.kind === key)?.label ?? key);

  return (
    <>
      <PageHeader title={t('Trash')} description={t('What was deleted stays here until you bring it back or remove it for good.')} />

      {TRASH_KINDS.length > 1 ? (
        <FilterBar>
          <UrlSelect param="kind" label={t('Kind')} options={[{ value: '', label: t('All kinds') }, ...TRASH_KINDS.map((item) => ({ value: item.kind, label: t(item.label) }))]} />
        </FilterBar>
      ) : null}

      <Card>
        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>{t('Record')}</Th>
                <Th>{t('Kind')}</Th>
                <Th>{t('Deleted')}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Tr key={`${row.kind}-${row.id}`}>
                  <Td>
                    <p className="font-semibold text-ink-900">{row.title}</p>
                    {row.detail ? <p className="line-clamp-1 max-w-md text-sm text-ink-500">{row.detail}</p> : null}
                  </Td>
                  <Td>
                    <Badge tone="neutral">{labelOf(row.kind)}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-sm">{formatDateTime(row.deletedAt)}</Td>
                  <Td className="whitespace-nowrap text-right">
                    <TrashActions kind={row.kind} id={row.id} name={row.title} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={<Trash2 size={26} />} title={t('The Trash is empty')} text={t('When something is deleted, it comes here first, so a mistake can be undone.')} />
        )}
      </Card>
    </>
  );
}
