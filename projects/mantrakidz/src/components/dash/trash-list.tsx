/** The table of a Trash screen, for a school and for head office alike. Server component. */
import { Trash2 } from 'lucide-react';
import { Badge, Card, EmptyState, Table, Td, Th, Tr } from '@/components/ui/core';
import type { ActionResult } from '@/lib/api';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { TrashActions } from './trash-actions';

type Row = { kind: string; id: string; title: string; detail: string; deletedAt: Date; canPurge: boolean };
type TrashCall = (kind: string, id: string) => Promise<ActionResult<string | null>>;

export async function TrashList({ rows, labels, restore, purge }: { rows: Row[]; labels: Record<string, string>; restore: TrashCall; purge?: TrashCall }) {
  const t = await getT();
  return (
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
                  <Badge tone="neutral">{t(labels[row.kind] ?? row.kind)}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-sm">{formatDateTime(row.deletedAt)}</Td>
                <Td className="whitespace-nowrap text-right">
                  <TrashActions kind={row.kind} id={row.id} name={row.title} canPurge={row.canPurge} restore={restore} purge={purge} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState icon={<Trash2 size={26} />} title={t('The Trash is empty')} text={t('When something is deleted, it comes here first, so a mistake can be undone.')} />
      )}
    </Card>
  );
}
