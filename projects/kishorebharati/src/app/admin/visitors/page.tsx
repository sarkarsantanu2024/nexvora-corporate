import { DoorOpen, Printer, TicketCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DailyPrintHead } from '@/components/school/daily-print-head';
import { Pagination, PrintButton, SearchInput, UrlDate } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, TabLinks, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { sectionLabel } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { isDay } from '@/server/daily/shared';
import { timeText } from '@/server/office/labels';
import { listGatePasses, listVisitors } from '@/server/office/visitors';
import { requirePlan } from '@/server/platform';
import { FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { AddVisitorButton, DeleteVisitor, GatePassButton, MarkOut } from './visitor-tools';

export const metadata: Metadata = { title: 'Visitors' };

export default async function VisitorsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const params = await readSearch(searchParams);
  const tab = params.tab === 'passes' ? 'passes' : 'visitors';
  const today = todayIST();
  // A day is always chosen unless "all" is asked for, so the gate sees today's book first.
  if (!params.day && !params.q && params.all !== '1') redirect(`/admin/visitors${query({ tab: tab === 'passes' ? 'passes' : undefined, day: today })}`);
  const day = isDay(params.day) ? params.day : undefined;
  const filtered = Boolean(params.q || day);

  return (
    <>
      <PageHeader
        title={t('Visitors and gate passes')}
        description={tab === 'visitors' ? t('The visitor book at the gate: who came, to meet whom, and when they left.') : t('A boy let out before the bell, with who took him and who allowed it.')}
        actions={
          <>
            {/* Printing is a desk job; on a phone the add button keeps the heading row. */}
            <span className="max-sm:hidden">
              <PrintButton />
            </span>
            {tab === 'visitors' ? <AddVisitorButton /> : <GatePassButton />}
          </>
        }
      />
      <TabLinks
        active={tab}
        tabs={[
          { key: 'visitors', label: t('Visitor book'), href: `/admin/visitors?day=${day ?? today}` },
          { key: 'passes', label: t('Gate passes'), href: `/admin/visitors?tab=passes&day=${day ?? today}` },
        ]}
      />
      <FilterBar>
        <SearchInput placeholder={tab === 'visitors' ? t('Search name, mobile or purpose') : t('Search student, guardian or pass number')} />
        <UrlDate param="day" label={t('Day')} max={today} />
        {day ? (
          <Link href={`/admin/visitors${query({ tab: tab === 'passes' ? 'passes' : undefined, all: 1 })}`} className="text-sm font-semibold text-brand-700 hover:underline">
            {t('All days')}
          </Link>
        ) : null}
      </FilterBar>
      <DailyPrintHead title={tab === 'visitors' ? t('Visitor book') : t('Gate passes')} subtitle={day ? formatDate(day) : undefined} />
      {tab === 'visitors' ? await visitorList() : await passList()}
    </>
  );

  async function visitorList() {
    const data = await listVisitors(session, { day, q: params.q, page: params.page });
    return (
      <Card className="print:border-0 print:shadow-none">
        {data.inside ? (
          <p className="no-print border-b border-ink-100 px-5 py-3 text-sm font-semibold text-sun-700">
            {data.inside === 1 ? t('1 visitor is inside now') : t('{n} visitors are inside now', { n: data.inside })}
          </p>
        ) : null}
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Visitor')}</Th>
                  <Th>{t('To meet')}</Th>
                  <Th>{t('Purpose')}</Th>
                  <Th>{t('In')}</Th>
                  <Th>{t('Out')}</Th>
                  <Th className="no-print" />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <p className="font-semibold text-ink-900">{row.name}</p>
                      <p className="tabular text-xs text-ink-500">{[row.phone, day ? '' : formatDate(row.day)].filter(Boolean).join(' · ')}</p>
                    </Td>
                    <Td>{row.whomToMeet}</Td>
                    <Td className="max-w-xs">{row.purpose}</Td>
                    <Td className="tabular whitespace-nowrap">{timeText(row.inTime)}</Td>
                    <Td className="tabular whitespace-nowrap">
                      {row.outTime ? timeText(row.outTime) : row.day === today ? <MarkOut id={row.id} /> : <Badge tone="amber">{t('Not written')}</Badge>}
                    </Td>
                    <Td className="no-print text-right">{isAdmin(session) ? <DeleteVisitor id={row.id} name={row.name} /> : null}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<DoorOpen size={26} />}
            title={filtered ? t('No visitors match') : t('No visitors yet')}
            text={t('Write each visitor at the gate: name, mobile, whom they came to meet and why. Mark them out when they leave.')}
          />
        )}
      </Card>
    );
  }

  async function passList() {
    const data = await listGatePasses(session, { day, q: params.q, page: params.page });
    return (
      <Card className="print:border-0 print:shadow-none">
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('Pass')}</Th>
                  <Th>{t('Student')}</Th>
                  <Th>{t('Taken by')}</Th>
                  <Th>{t('Reason')}</Th>
                  <Th>{t('Allowed by')}</Th>
                  <Th className="no-print" />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <Tr key={row.pass.id}>
                    <Td>
                      <p className="tabular font-semibold text-ink-900">{row.pass.serialNo}</p>
                      <p className="tabular text-xs text-ink-500">
                        {formatDate(row.pass.day)}, {timeText(row.pass.time)}
                      </p>
                    </Td>
                    <Td>
                      <p className="font-medium text-ink-900">{row.studentName}</p>
                      <p className="text-xs text-ink-500">
                        {row.grade !== null ? sectionLabel({ grade: row.grade, name: row.sectionName ?? '', stream: row.stream ?? '', shift: row.shift ?? 'day' }, lang) : row.admissionNo}
                        {row.rollNo ? `, ${t('Roll {n}', { n: row.rollNo })}` : ''}
                      </p>
                    </Td>
                    <Td>
                      <p>{row.pass.guardianName}</p>
                      <p className="tabular text-xs text-ink-500">{[row.pass.guardianRelation, row.pass.guardianPhone].filter(Boolean).join(' · ')}</p>
                    </Td>
                    <Td className="max-w-xs">{row.pass.reason}</Td>
                    <Td>{row.pass.approvedBy}</Td>
                    <Td className="no-print text-right">
                      <Link href={`/admin/visitors/pass/${row.pass.id}`} className={buttonClass('secondary', 'sm')}>
                        <Printer size={15} /> {t('Slip')}
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<TicketCheck size={26} />}
            title={filtered ? t('No gate passes match') : t('No gate passes yet')}
            text={t('When a guardian takes a boy home early, write a gate pass and print the slip for the gate.')}
          />
        )}
      </Card>
    );
  }
}
