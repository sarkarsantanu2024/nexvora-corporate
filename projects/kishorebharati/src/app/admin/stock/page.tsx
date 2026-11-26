import { Boxes } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DailyPrintHead, PrintSetup } from '@/components/school/daily-print-head';
import { Pagination, PrintButton, SearchInput, UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, TabLinks, Table, Td, Th, Tr } from '@/components/ui/core';
import { ASSET_SOURCES } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { ASSET_CATEGORIES, ASSET_CONDITION_LABELS, ASSET_SOURCE_LABELS, CONDITION_TONES, UNIT_LABELS } from '@/server/office/labels';
import { listAssets, stockRegister } from '@/server/office/stock';
import { requirePlan } from '@/server/platform';
import { FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { AssetFormButton } from './stock-tools';

export const metadata: Metadata = { title: 'Stock register' };

export default async function StockPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const tab = params.tab === 'register' ? 'register' : 'list';
  const filters = { q: params.q, category: params.category, source: params.source };
  const list = await listAssets(session, { ...filters, page: params.page });
  const categories = [...new Set([...ASSET_CATEGORIES, ...list.categories])];
  const filtered = Boolean(params.q || params.category || params.source);

  return (
    <>
      {tab === 'register' ? <PrintSetup landscape /> : null}
      <PageHeader
        title={t('Stock register')}
        description={t('Furniture, lab equipment, computers, sports goods and other things the school owns, where they are and what they are worth.')}
        actions={
          <>
            {tab === 'register' ? (
              <span className="max-sm:hidden">
                <PrintButton />
              </span>
            ) : null}
            <AssetFormButton categories={categories} />
          </>
        }
      />
      <TabLinks
        active={tab}
        tabs={[
          { key: 'list', label: t('Items'), href: `/admin/stock${query(filters)}` },
          { key: 'register', label: t('Register to print'), href: `/admin/stock${query({ ...filters, tab: 'register' })}` },
        ]}
      />
      <FilterBar>
        <SearchInput placeholder={t('Search item, room or note')} />
        <UrlSelect param="category" label={t('Category')} options={[{ value: '', label: t('All categories') }, ...categories.map((c) => ({ value: c, label: t(c) }))]} />
        <UrlSelect param="source" label={t('Source')} options={[{ value: '', label: t('All sources') }, ...ASSET_SOURCES.map((s) => ({ value: s, label: t(ASSET_SOURCE_LABELS[s]) }))]} />
      </FilterBar>
      {tab === 'list' ? (
        <Card>
          {list.rows.length ? (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>{t('Item')}</Th>
                    <Th className="text-right">{t('Quantity')}</Th>
                    <Th>{t('Room')}</Th>
                    <Th>{t('Condition')}</Th>
                    <Th>{t('Source')}</Th>
                    <Th className="text-right">{t('Value')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((row) => (
                    <Tr key={row.id}>
                      <Td>
                        <Link href={`/admin/stock/${row.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                          {row.name}
                        </Link>
                        <p className="text-xs text-ink-500">{t(row.category)}</p>
                      </Td>
                      <Td className="tabular text-right">
                        {row.quantity} {t(UNIT_LABELS[row.unit] ?? row.unit)}
                        {row.damaged ? <span className="block text-xs text-accent-600">{t('{n} damaged', { n: row.damaged })}</span> : null}
                      </Td>
                      <Td>{row.location}</Td>
                      <Td>
                        <Badge tone={CONDITION_TONES[row.condition]}>{t(ASSET_CONDITION_LABELS[row.condition])}</Badge>
                      </Td>
                      <Td>{t(ASSET_SOURCE_LABELS[row.source])}</Td>
                      <Td className="tabular text-right">{row.value ? inr(row.value) : ''}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <Pagination page={list.page} pageSize={list.pageSize} total={list.total} />
            </>
          ) : (
            <EmptyState
              icon={<Boxes size={26} />}
              title={filtered ? t('No items match') : t('The stock register is empty')}
              text={t('Add each thing the school owns once: benches, almirahs, microscopes, computers, footballs. Then write every item received, issued or written off.')}
              action={filtered ? undefined : <AssetFormButton categories={categories} />}
            />
          )}
        </Card>
      ) : (
        await register()
      )}
    </>
  );

  async function register() {
    const data = await stockRegister(session, filters);
    return (
      <>
        <DailyPrintHead title={t('Stock register')} subtitle={t('As on {date}', { date: formatDate(todayIST()) })} />
        <Card className="print:border-0 print:shadow-none">
          <Table className="print:text-[10px]">
            <thead>
              <tr>
                <Th>{t('No.')}</Th>
                <Th>{t('Item')}</Th>
                <Th>{t('Category')}</Th>
                <Th className="text-right">{t('Quantity')}</Th>
                <Th className="text-right">{t('Damaged')}</Th>
                <Th>{t('Room')}</Th>
                <Th>{t('Condition')}</Th>
                <Th>{t('Bought on')}</Th>
                <Th>{t('Source')}</Th>
                <Th className="text-right">{t('Value')}</Th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, index) => (
                <Tr key={row.id}>
                  <Td className="tabular">{index + 1}</Td>
                  <Td className="font-medium text-ink-900">{row.name}</Td>
                  <Td>{t(row.category)}</Td>
                  <Td className="tabular text-right">
                    {row.quantity} {t(UNIT_LABELS[row.unit] ?? row.unit)}
                  </Td>
                  <Td className="tabular text-right">{row.damaged || ''}</Td>
                  <Td>{row.location}</Td>
                  <Td>{t(ASSET_CONDITION_LABELS[row.condition])}</Td>
                  <Td className="whitespace-nowrap">{formatDate(row.purchasedOn)}</Td>
                  <Td>{t(ASSET_SOURCE_LABELS[row.source])}</Td>
                  <Td className="tabular text-right">{row.value ? inr(row.value) : ''}</Td>
                </Tr>
              ))}
              <Tr className="font-bold">
                <Td colSpan={9}>{t('Total value')}</Td>
                <Td className="tabular text-right">{inr(data.value)}</Td>
              </Tr>
            </tbody>
          </Table>
          {!data.rows.length ? <EmptyState icon={<Boxes size={26} />} title={t('The stock register is empty')} /> : null}
        </Card>
        <div className="mt-10 hidden justify-between text-xs text-ink-800 print:flex">
          <span className="border-t border-ink-500 px-6 pt-1">{t('Checked by')}</span>
          <span className="border-t border-ink-500 px-6 pt-1">{t('Head of the institution')}</span>
        </div>
      </>
    );
  }
}
