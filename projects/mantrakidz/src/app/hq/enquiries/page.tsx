import { Mail, MessageSquareText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, SearchInput, UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, Notice, PageHeader, StatusBadge, TabLinks, Table, Td, Th, Tr, statusLabel } from '@/components/ui/core';
import { ENQUIRY_STAGES } from '@/db/schema';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { ageLabel, formatDate, formatDateTime, todayIST } from '@/lib/date';
import { listEnquiries, listMessages } from '@/server/hq/admin';
import { centreOptions } from '@/server/hq/centres';
import { ContactLinks, FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { AssignEnquiry, HandledButton } from './enquiry-tools';

export const metadata: Metadata = { title: 'Enquiries' };

export default async function EnquiriesPage({ searchParams }: { searchParams: Search }) {
  await requireSession(HQ_ROLES);
  const params = await readSearch(searchParams);
  const tab = params.tab === 'messages' ? 'messages' : 'admissions';
  const [enquiries, messages, centres] = await Promise.all([
    listEnquiries(tab === 'admissions' ? { q: params.q, centre: params.centre, stage: params.stage, page: params.page } : {}),
    listMessages(tab === 'messages' ? { show: params.show, page: params.page } : {}),
    centreOptions(),
  ]);
  const stageTotal = ENQUIRY_STAGES.reduce((sum, stage) => sum + enquiries.stages[stage], 0);
  const keep = { q: params.q, centre: params.centre };
  const assignable = centres.filter((centre) => centre.status === 'active' || centre.status === 'onboarding').map((centre) => ({ id: centre.id, name: centre.name }));

  return (
    <>
      <PageHeader title="Enquiries" description="Admission enquiries of every centre, and messages sent from the website's contact form." />

      <TabLinks
        active={tab}
        tabs={[
          { key: 'admissions', label: 'Admission enquiries', href: '/hq/enquiries', count: enquiries.unassigned || undefined },
          { key: 'messages', label: 'Contact messages', href: '/hq/enquiries?tab=messages', count: messages.open || undefined },
        ]}
      />

      {tab === 'admissions' ? (
        <>
          {enquiries.unassigned > 0 && params.centre !== 'none' ? (
            <Notice tone="amber" className="mb-4">
              {enquiries.unassigned} {enquiries.unassigned === 1 ? 'enquiry has' : 'enquiries have'} no centre yet.{' '}
              <Link href="/hq/enquiries?centre=none" className="font-bold underline">
                Assign {enquiries.unassigned === 1 ? 'it' : 'them'} to a centre
              </Link>
              , so someone calls the parent.
            </Notice>
          ) : null}

          <div className="no-print mb-4 flex flex-wrap gap-2">
            {[{ key: '', label: 'All', n: stageTotal }, ...ENQUIRY_STAGES.map((stage) => ({ key: stage as string, label: statusLabel(stage), n: enquiries.stages[stage] }))].map((item) => (
              <Link
                key={item.key || 'all'}
                href={`/hq/enquiries${query({ ...keep, stage: item.key })}`}
                scroll={false}
                className={cn(
                  'rounded-xl border px-3.5 py-2 text-sm transition',
                  (params.stage ?? '') === item.key ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                )}
              >
                <span className="font-medium">{item.label}</span> <span className="tabular ml-1 font-bold">{item.n}</span>
              </Link>
            ))}
          </div>

          <FilterBar>
            <SearchInput placeholder="Search child, parent or mobile" />
            <UrlSelect
              param="centre"
              label="Centre"
              options={[{ value: '', label: 'All centres' }, { value: 'none', label: 'No centre yet' }, ...centres.map((centre) => ({ value: centre.id, label: centre.name }))]}
            />
          </FilterBar>

          <Card>
            {enquiries.rows.length ? (
              <>
                <Table>
                  <thead>
                    <tr>
                      <Th>Child</Th>
                      <Th>Parent</Th>
                      <Th>Centre</Th>
                      <Th>Stage</Th>
                      <Th>Follow-up</Th>
                      <Th>Received</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.rows.map(({ row, centreName, programmeName }) => (
                      <Tr key={row.id}>
                        <Td>
                          <span className="font-semibold text-ink-900">{row.childName}</span>
                          <p className="text-xs text-ink-500">{[programmeName, ageLabel(row.dob)].filter(Boolean).join(' · ') || 'Programme not chosen'}</p>
                        </Td>
                        <Td>
                          {row.parentName}
                          <p className="tabular text-xs text-ink-500">{row.phone}</p>
                        </Td>
                        <Td>{row.centreId ? centreName : <AssignEnquiry id={row.id} centres={assignable} />}</Td>
                        <Td>
                          <StatusBadge status={row.stage} />
                        </Td>
                        <Td className="whitespace-nowrap">{row.nextFollowUp ? formatDate(row.nextFollowUp) : <span className="text-ink-400">Not set</span>}</Td>
                        <Td className="whitespace-nowrap">
                          {formatDate(todayIST(row.createdAt))}
                          <p className="text-xs capitalize text-ink-500">{row.source}</p>
                        </Td>
                        <Td className="text-right">
                          <ContactLinks phone={row.phone} />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination page={enquiries.page} pageSize={enquiries.pageSize} total={enquiries.total} />
              </>
            ) : (
              <EmptyState
                icon={<MessageSquareText size={26} />}
                title={params.q || params.centre || params.stage ? 'No enquiries match' : 'No admission enquiries yet'}
                text={
                  params.q || params.centre || params.stage
                    ? 'Try another stage, centre or search.'
                    : 'Enquiries from the website and those the centres enter show here. Each centre works its own; head office watches the numbers and assigns the ones with no centre.'
                }
              />
            )}
          </Card>
          <p className="mt-3 text-sm text-ink-500">The centre follows up each enquiry from its own screens. To work one yourself, open the centre from Centres.</p>
        </>
      ) : (
        <>
          <FilterBar>
            <UrlSelect
              param="show"
              label="Show"
              options={[
                { value: '', label: 'Waiting for a reply' },
                { value: 'handled', label: 'Handled' },
                { value: 'all', label: 'All messages' },
              ]}
            />
          </FilterBar>
          {messages.rows.length ? (
            <div className="max-w-4xl space-y-3">
              {messages.rows.map(({ row, centreName }) => (
                <Card key={row.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">
                        {row.name} {row.handled ? <Badge tone="green" className="ml-1">Handled</Badge> : <Badge tone="amber" className="ml-1">Waiting</Badge>}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-500">
                        {[row.phone, row.email, centreName ? `about ${centreName}` : ''].filter(Boolean).join(' · ')} · {formatDateTime(row.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ContactLinks phone={row.phone} email={row.email} waText={`Hello ${row.name}, this is Mantra Kidz. Thank you for writing to us.`} />
                      <HandledButton id={row.id} handled={row.handled} />
                    </div>
                  </div>
                  {row.subject ? <p className="mt-3 text-[15px] font-semibold text-ink-800">{row.subject}</p> : null}
                  <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">{row.message}</p>
                </Card>
              ))}
              <Pagination page={messages.page} pageSize={messages.pageSize} total={messages.total} />
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<Mail size={26} />}
                title={params.show ? 'No messages here' : 'No messages waiting'}
                text="Messages from the contact form of the website show here. Reply by call, WhatsApp or email, then mark the message handled."
              />
            </Card>
          )}
        </>
      )}
    </>
  );
}
