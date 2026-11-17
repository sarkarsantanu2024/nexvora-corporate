import { BellRing, MessageCircle, MessageSquareText, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, StatusBadge, TabLinks, Table, Td, Th, Tr } from '@/components/ui/core';
import { ENQUIRY_STAGES } from '@/db/schema';
import { requireCentre } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { ageLabel, formatDate, todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { telLink, waLink } from '@/lib/wa';
import { listProgrammes } from '@/server/centre/children/batches';
import { ENQUIRY_SOURCES, sourceLabel, STAGE_LABELS } from '@/server/centre/children/constants';
import { listEnquiries } from '@/server/centre/children/enquiries';
import { EnquiryFormButton } from './enquiry-form';

export const metadata: Metadata = { title: 'Admission enquiries' };

type Search = { stage?: string; q?: string; source?: string; due?: string; page?: string };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const params = await searchParams;
  const due = params.due === '1';
  const [data, programmes] = await Promise.all([
    listEnquiries(ctx, { stage: params.stage, q: params.q, source: params.source, due, page: Number(params.page) || 1 }),
    listProgrammes(),
  ]);

  // Tab and toggle links keep the other filters and go back to page one.
  const href = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ stage: params.stage, q: params.q, source: params.source, due: params.due, ...changes })) {
      if (value) next.set(key, value);
    }
    const query = next.toString();
    return query ? `/centre/enquiries?${query}` : '/centre/enquiries';
  };
  const sources = [...new Set([...ENQUIRY_SOURCES, ...data.sources])];
  const filtered = Boolean(params.q || params.source || due || params.stage);

  return (
    <>
      <PageHeader
        title={t('Admission enquiries')}
        description={t('Parents who asked about admission, from the website, a phone call or a visit. Follow each one up until the child is admitted.')}
        actions={<EnquiryFormButton programmes={programmes} today={data.today} />}
      />

      <TabLinks
        active={params.stage && data.counts[params.stage as keyof typeof data.counts] !== undefined ? params.stage : 'all'}
        tabs={[
          { key: 'all', label: t('All'), count: data.all, href: href({ stage: '' }) },
          ...ENQUIRY_STAGES.map((stage) => ({ key: stage, label: t(STAGE_LABELS[stage]), count: data.counts[stage], href: href({ stage }) })),
        ]}
      />

      <div className="mb-4 filter-bar flex flex-wrap items-center gap-2">
        <SearchInput placeholder={t('Search child, parent or mobile')} />
        <UrlSelect param="source" label={t('Source')} options={[{ value: '', label: t('All sources') }, ...sources.map((s) => ({ value: s, label: t(sourceLabel(s)) }))]} />
        <Link
          href={href({ due: due ? '' : '1' })}
          scroll={false}
          aria-pressed={due}
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-[15px] font-semibold transition',
            due ? 'border-accent-200 bg-accent-50 text-accent-700' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
          )}
        >
          <BellRing size={17} /> {t('Follow-ups due')}
          <span className={cn('rounded-full px-1.5 text-xs', due ? 'bg-accent-100' : data.dueCount ? 'bg-accent-100 text-accent-700' : 'bg-ink-100 text-ink-600')}>{data.dueCount}</span>
        </Link>
      </div>

      <Card className="animate-fade-up overflow-hidden">
        {data.rows.length === 0 ? (
          <EmptyState
            icon={<MessageSquareText size={26} />}
            title={filtered ? t('No enquiries match') : t('No enquiries yet')}
            text={
              filtered
                ? t('Try another stage, or clear the search and filters.')
                : t('Enquiries from the website arrive here on their own. Add the ones that come by phone or at the gate.')
            }
            action={filtered ? undefined : <EnquiryFormButton programmes={programmes} today={data.today} />}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Child')}</Th>
                  <Th>{t('Parent')}</Th>
                  <Th>{t('Source')}</Th>
                  <Th>{t('Stage')}</Th>
                  <Th>{t('Next follow-up')}</Th>
                  <Th>{t('Asked on')}</Th>
                  <Th className="text-right">{t('Contact')}</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const open = row.stage !== 'admitted' && row.stage !== 'lost';
                  const overdue = open && row.nextFollowUp !== null && row.nextFollowUp <= data.today;
                  return (
                    <Tr key={row.id}>
                      <Td>
                        <Link href={`/centre/enquiries/${row.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                          {row.childName}
                        </Link>
                        <p className="text-xs text-ink-500">{[row.programmeName, ageLabel(row.dob)].filter(Boolean).join(', ') || t('Programme not chosen')}</p>
                      </Td>
                      <Td>
                        {row.parentName}
                        <p className="tabular text-xs text-ink-500">{row.phone}</p>
                      </Td>
                      <Td>{t(sourceLabel(row.source))}</Td>
                      <Td>
                        <StatusBadge status={row.stage} label={t(STAGE_LABELS[row.stage])} />
                        {row.stage === 'visit_scheduled' && row.visitOn ? <p className="mt-0.5 text-xs text-ink-500">{t('Visit {visitOn}', { visitOn: formatDate(row.visitOn) })}</p> : null}
                      </Td>
                      <Td className={cn('whitespace-nowrap', overdue && 'font-semibold text-accent-700')}>
                        {open && row.nextFollowUp ? formatDate(row.nextFollowUp) : <span className="text-ink-400">{t('None')}</span>}
                        {overdue ? <p className="text-xs font-medium">{row.nextFollowUp === data.today ? t('Today') : t('Overdue')}</p> : null}
                      </Td>
                      <Td className="whitespace-nowrap text-ink-600">{formatDate(todayIST(row.createdAt))}</Td>
                      <Td>
                        <div className="flex justify-end gap-1">
                          <a href={telLink(row.phone)} aria-label={t('Call {parentName}', { parentName: row.parentName })} className="grid h-10 w-10 place-items-center rounded-xl text-brand-700 hover:bg-brand-50">
                            <Phone size={18} />
                          </a>
                          <a
                            href={waLink(row.phone, `Hello ${row.parentName}, this is ${ctx.centre.name}. Thank you for your enquiry about admission for ${row.childName}.`)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t('WhatsApp {parentName}', { parentName: row.parentName })}
                            className="grid h-10 w-10 place-items-center rounded-xl text-mint-700 hover:bg-mint-50"
                          >
                            <MessageCircle size={18} />
                          </a>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        )}
      </Card>
    </>
  );
}
