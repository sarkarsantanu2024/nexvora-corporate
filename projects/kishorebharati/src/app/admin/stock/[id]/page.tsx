import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge, Card, CardBody, CardHeader, Detail, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { ASSET_CATEGORIES, ASSET_CONDITION_LABELS, ASSET_SOURCE_LABELS, CONDITION_TONES, MOVEMENT_LABELS, UNIT_LABELS } from '@/server/office/labels';
import { getAsset } from '@/server/office/stock';
import { requirePlan } from '@/server/platform';
import { AssetFormButton, DeleteAsset, MovementButton } from '../stock-tools';

export const metadata: Metadata = { title: 'Stock register' };

const SIGN: Record<string, string> = { received: '+', returned: '+', issued: '−', written_off: '−', damaged: '' };

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const { id } = await params;
  const found = await getAsset(session, id);
  if (!found) notFound();
  const { row, movements } = found;
  const unit = t(UNIT_LABELS[row.unit] ?? row.unit);

  return (
    <>
      <PageHeader
        title={row.name}
        back={{ href: '/admin/stock', label: t('Stock register') }}
        actions={
          <>
            <AssetFormButton asset={row} categories={ASSET_CATEGORIES} />
            <MovementButton asset={row} />
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardBody>
            <p className="tabular font-display text-3xl font-bold text-ink-900">
              {row.quantity} <span className="text-lg font-semibold text-ink-500">{unit}</span>
            </p>
            {row.damaged ? <p className="mt-1 text-sm font-semibold text-accent-600">{t('{n} damaged', { n: row.damaged })}</p> : null}
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <Detail label={t('Category')} empty={t('Not added')}>{t(row.category)}</Detail>
              <Detail label={t('Room')} empty={t('Not added')}>{row.location}</Detail>
              <Detail label={t('Condition')}>
                <Badge tone={CONDITION_TONES[row.condition]}>{t(ASSET_CONDITION_LABELS[row.condition])}</Badge>
              </Detail>
              <Detail label={t('Source')}>{t(ASSET_SOURCE_LABELS[row.source])}</Detail>
              <Detail label={t('Bought on')} empty={t('Not added')}>{formatDate(row.purchasedOn)}</Detail>
              <Detail label={t('Value')} empty={t('Not added')}>{row.value ? inr(row.value) : ''}</Detail>
              {row.note ? <Detail label={t('Note')} className="col-span-2">{row.note}</Detail> : null}
            </dl>
            {isAdmin(session) ? (
              <div className="mt-5 border-t border-ink-100 pt-4">
                <DeleteAsset id={row.id} name={row.name} />
              </div>
            ) : null}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('Movements')} description={t('Every item received, issued, returned, damaged or written off.')} />
          {movements.length ? (
            <div className="p-2 sm:p-4">
              <Table>
                <thead>
                  <tr>
                    <Th>{t('Date')}</Th>
                    <Th>{t('What happened')}</Th>
                    <Th className="text-right">{t('Quantity')}</Th>
                    <Th>{t('From or to')}</Th>
                    <Th>{t('Written by')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <Tr key={m.id}>
                      <Td className="whitespace-nowrap">{formatDate(m.day)}</Td>
                      <Td>{t(MOVEMENT_LABELS[m.kind])}</Td>
                      <Td className="tabular text-right font-semibold">
                        {SIGN[m.kind]}
                        {m.quantity}
                      </Td>
                      <Td>
                        {m.party ? t(m.party) : ''}
                        {m.note ? <p className="text-xs text-ink-500">{m.note === 'Opening entry' ? t('Opening entry') : m.note}</p> : null}
                      </Td>
                      <Td className="text-sm text-ink-600">{m.createdByName}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <EmptyState title={t('No movements yet')} text={t('Write each time some are received, issued, returned, damaged or written off.')} />
          )}
        </Card>
      </div>
    </>
  );
}
