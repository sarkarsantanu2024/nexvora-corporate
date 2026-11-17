import { CalendarClock, Handshake, KanbanSquare, List, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, StatusBadge, TabLinks, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { FRANCHISE_STAGES } from '@/db/schema';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDate, todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { LEAD_SOURCES, STAGE_LABELS, sourceLabel } from '@/server/hq/constants';
import { hqPeople, leadBoard, leadStageCounts, listLeads, type LeadRow } from '@/server/hq/leads';
import { ContactLinks, ExportLink, FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { LeadForm } from './lead-form';

export const metadata: Metadata = { title: 'Franchise leads' };

async function FollowUp({ lead, today }: { lead: LeadRow; today: string }) {
  const t = await getT();
  if (!lead.nextFollowUp) return <span className="text-ink-400">{t('Not set')}</span>;
  const late = lead.nextFollowUp < today && lead.stage !== 'onboarded' && lead.stage !== 'lost';
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap', late ? 'font-semibold text-accent-600' : 'text-ink-700')}>
      <CalendarClock size={14} /> {lead.nextFollowUp === today ? t('Today') : formatDate(lead.nextFollowUp)}
    </span>
  );
}

export default async function LeadsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  await requireSession(HQ_ROLES);
  const params = await readSearch(searchParams);
  const view = params.view === 'table' ? 'table' : 'board';
  const filters = { q: params.q, stage: params.stage, source: params.source, page: params.page };
  const today = todayIST();

  const [counts, people, board, table] = await Promise.all([
    leadStageCounts(filters),
    hqPeople(),
    view === 'board' ? leadBoard(filters) : null,
    view === 'table' ? listLeads(filters) : null,
  ]);
  const all = FRANCHISE_STAGES.reduce((sum, stage) => sum + counts[stage], 0);
  const keep = { q: params.q, source: params.source };
  const filtered = Boolean(params.q || params.source || params.stage);

  return (
    <>
      <PageHeader
        title={t('Franchise leads')}
        description={t('People who asked about opening a Mantra Kidz centre. Website enquiries arrive here as New.')}
        actions={
          <>
            <ExportLink href={`/hq/leads/export${query({ ...keep, stage: view === 'table' ? params.stage : '' })}`} />
            <LeadForm people={people} />
          </>
        }
      />

      <FilterBar>
        <SearchInput placeholder={t('Search name, mobile or city')} />
        <UrlSelect param="source" label={t('Source')} options={[{ value: '', label: t('All sources') }, ...LEAD_SOURCES.map((source) => ({ value: source, label: t(sourceLabel(source)) }))]} />
        <div className="ml-auto inline-flex rounded-xl border border-ink-200 bg-white p-1">
          {(['board', 'table'] as const).map((mode) => (
            <Link
              key={mode}
              href={`/hq/leads${query({ ...keep, view: mode === 'table' ? 'table' : '' })}`}
              scroll={false}
              aria-current={view === mode ? 'page' : undefined}
              className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold', view === mode ? 'bg-brand-700 text-white' : 'text-ink-600 hover:bg-ink-50')}
            >
              {mode === 'board' ? <KanbanSquare size={16} /> : <List size={16} />} {mode === 'board' ? t('Board') : t('Table')}
            </Link>
          ))}
        </div>
      </FilterBar>

      {all === 0 ? (
        <Card>
          <EmptyState
            icon={<Handshake size={26} />}
            title={filtered ? t('No leads match') : t('No franchise leads yet')}
            text={filtered ? t('Try a different search or source.') : t('Enquiries from the franchise page of the website land here. You can also add someone who called or walked in.')}
            action={filtered ? <Link href="/hq/leads" className={buttonClass('secondary')}>{t('Clear filters')}</Link> : <LeadForm people={people} />}
          />
        </Card>
      ) : board ? (
        <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-3">
            {FRANCHISE_STAGES.map((stage) => {
              const cards = board.rows.filter((lead) => lead.stage === stage);
              return (
                <section key={stage} className="flex w-[272px] shrink-0 flex-col rounded-2xl bg-ink-100/70 p-2.5" aria-label={t(STAGE_LABELS[stage])}>
                  <header className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
                    <StatusBadge status={stage} label={t(STAGE_LABELS[stage])} />
                    <span className="tabular text-sm font-bold text-ink-600">{counts[stage]}</span>
                  </header>
                  <div className="space-y-2">
                    {cards.map((lead) => (
                      <Link key={lead.id} href={`/hq/leads/${lead.id}`} className="block rounded-xl border border-ink-200/70 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
                        <p className="truncate font-semibold text-ink-900">{lead.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink-500">
                          <MapPin size={13} className="shrink-0" /> {lead.city || t('City not given')}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                          <FollowUp lead={lead} today={today} />
                          <span className="truncate text-ink-500">{lead.assignedName ?? t('Unassigned')}</span>
                        </div>
                      </Link>
                    ))}
                    {cards.length === 0 ? <p className="px-2 py-6 text-center text-sm text-ink-400">{t('None')}</p> : null}
                    {counts[stage] > cards.length ? (
                      <Link href={`/hq/leads${query({ ...keep, view: 'table', stage })}`} className="block px-2 py-1.5 text-center text-sm font-semibold text-brand-700 hover:underline">
                        {t('See all {n}', { n: counts[stage] })}
                      </Link>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : table ? (
        <>
          <TabLinks
            active={params.stage || 'all'}
            tabs={[
              { key: 'all', label: t('All'), count: all, href: `/hq/leads${query({ ...keep, view: 'table' })}` },
              ...FRANCHISE_STAGES.map((stage) => ({ key: stage, label: t(STAGE_LABELS[stage]), count: counts[stage], href: `/hq/leads${query({ ...keep, view: 'table', stage })}` })),
            ]}
          />
          <Card>
            {table.rows.length ? (
              <>
                <Table>
                  <thead>
                    <tr>
                      <Th>{t('Name')}</Th>
                      <Th>{t('City')}</Th>
                      <Th>{t('Stage')}</Th>
                      <Th>{t('Follow-up')}</Th>
                      <Th>{t('Assigned to')}</Th>
                      <Th>{t('Source')}</Th>
                      <Th>{t('Received')}</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((lead) => (
                      <Tr key={lead.id}>
                        <Td>
                          <Link href={`/hq/leads/${lead.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                            {lead.name}
                          </Link>
                          <p className="tabular text-xs text-ink-500">{lead.phone}</p>
                        </Td>
                        <Td>{lead.city || <span className="text-ink-400">{t('Not given')}</span>}</Td>
                        <Td>
                          <StatusBadge status={lead.stage} label={t(STAGE_LABELS[lead.stage])} />
                        </Td>
                        <Td>
                          <FollowUp lead={lead} today={today} />
                        </Td>
                        <Td>{lead.assignedName ?? <span className="text-ink-400">{t('Unassigned')}</span>}</Td>
                        <Td>{t(sourceLabel(lead.source))}</Td>
                        <Td className="whitespace-nowrap">{formatDate(todayIST(lead.createdAt))}</Td>
                        <Td className="text-right">
                          <ContactLinks phone={lead.phone} />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination page={table.page} pageSize={table.pageSize} total={table.total} />
              </>
            ) : (
              <EmptyState title={t('No leads at this stage')} text={t('Pick another stage, or clear the search.')} />
            )}
          </Card>
        </>
      ) : null}
    </>
  );
}
