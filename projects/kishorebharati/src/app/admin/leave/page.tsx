import { CalendarOff } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DailyPrintHead, PrintSetup } from '@/components/school/daily-print-head';
import { Pagination, PrintButton, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, PageHeader, StatusBadge, TabLinks, Table, Td, Th, Tr } from '@/components/ui/core';
import { LEAVE_STATUSES } from '@/db/schema';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDate, todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { leaveBalances, leaveTypes, listLeaves, staffChoices } from '@/server/leave/service';
import { LEAVE_STATUS_LABELS } from '@/server/office/labels';
import { requirePlan } from '@/server/platform';
import { isOffice, staffOf } from '@/server/school/access';
import { FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { ApplyLeaveButton, CancelLeave, DecideLeave, LeaveTypesForm } from './leave-tools';

export const metadata: Metadata = { title: 'Staff leave' };

type Tab = 'requests' | 'balance' | 'types';

export default async function LeavePage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const admin = isAdmin(session);
  const office = isOffice(session);
  const tab: Tab = params.tab === 'balance' ? 'balance' : params.tab === 'types' && admin ? 'types' : 'requests';
  const thisYear = Number(todayIST().slice(0, 4));
  // This year first: with no year in the address the picker shows the first option.
  const years = [thisYear, thisYear + 1, thisYear - 1, thisYear - 2].map(String);
  const year = years.includes(params.year) ? params.year : String(thisYear);

  const [types, choices, me] = await Promise.all([leaveTypes(), staffChoices(session), staffOf(session)]);
  const typeName = (key: string) => t(types.find((type) => type.key === key)?.name ?? key);
  const linked = office || Boolean(me);

  return (
    <>
      {tab === 'balance' ? <PrintSetup landscape /> : null}
      <PageHeader
        title={t('Staff leave')}
        description={office ? t('Leave applications of teachers and staff. The head of school approves or rejects them.') : t('Apply for leave and see what is left for the year.')}
        actions={
          <>
            {tab === 'balance' ? (
              <span className="max-sm:hidden">
                <PrintButton />
              </span>
            ) : null}
            {tab !== 'types' && linked ? <ApplyLeaveButton office={office} staff={choices} types={types.map((type) => ({ key: type.key, name: t(type.name) }))} /> : null}
          </>
        }
      />
      <TabLinks
        active={tab}
        tabs={[
          { key: 'requests', label: t('Applications'), href: `/admin/leave${query({ year })}` },
          { key: 'balance', label: office ? t('Leave balance') : t('My balance'), href: `/admin/leave${query({ tab: 'balance', year })}` },
          ...(admin ? [{ key: 'types', label: t('Leave types'), href: '/admin/leave?tab=types' }] : []),
        ]}
      />
      {!linked ? (
        <Card>
          <EmptyState icon={<CalendarOff size={26} />} title={t('Your login is not linked to a staff member. Ask the office.')} />
        </Card>
      ) : tab === 'requests' ? (
        <Requests params={params} year={year} years={years} typeName={typeName} staffOptions={choices} />
      ) : tab === 'balance' ? (
        <Balances year={year} years={years} />
      ) : (
        <LeaveTypesForm initial={types} />
      )}
    </>
  );

  async function Requests({
    params,
    year,
    years,
    typeName,
    staffOptions,
  }: {
    params: Record<string, string>;
    year: string;
    years: string[];
    typeName: (key: string) => string;
    staffOptions: { id: string; name: string }[];
  }) {
    const data = await listLeaves(session, { status: params.status, staff: params.staff, year, page: params.page });
    const all = LEAVE_STATUSES.reduce((sum, status) => sum + data.counts[status], 0);
    return (
      <>
        <div className="no-print mb-4 flex flex-wrap gap-2">
          {[{ key: '', label: t('All'), n: all }, ...LEAVE_STATUSES.map((status) => ({ key: status as string, label: t(LEAVE_STATUS_LABELS[status]), n: data.counts[status] }))].map((item) => (
            <Link
              key={item.key || 'all'}
              href={`/admin/leave${query({ year, staff: params.staff, status: item.key })}`}
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
          <UrlSelect param="year" label={t('Year')} options={years.map((value) => ({ value, label: value }))} />
          {office ? <UrlSelect param="staff" label={t('Staff member')} options={[{ value: '', label: t('Everyone') }, ...staffOptions.map((row) => ({ value: row.id, label: row.name }))]} /> : null}
        </FilterBar>
        <Card>
          {data.rows.length ? (
            <>
              <Table>
                <thead>
                  <tr>
                    {office ? <Th>{t('Staff member')}</Th> : null}
                    <Th>{t('Leave')}</Th>
                    <Th>{t('Days')}</Th>
                    <Th>{t('Reason')}</Th>
                    <Th>{t('Status')}</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map(({ leave, staffName, designation }) => (
                    <Tr key={leave.id}>
                      {office ? (
                        <Td>
                          <p className="font-semibold text-ink-900">{staffName}</p>
                          <p className="text-xs text-ink-500">{designation ? t(designation) : ''}</p>
                        </Td>
                      ) : null}
                      <Td>
                        <p className="font-medium text-ink-900">{typeName(leave.leaveType)}</p>
                        <p className="whitespace-nowrap text-xs text-ink-500">
                          {leave.fromDate === leave.toDate ? formatDate(leave.fromDate) : t('{from} to {to}', { from: formatDate(leave.fromDate), to: formatDate(leave.toDate) })}
                        </p>
                      </Td>
                      <Td className="tabular">{leave.days}</Td>
                      <Td className="max-w-xs">
                        <p className="line-clamp-2 text-sm text-ink-700">{leave.reason}</p>
                        {leave.decisionNote ? <p className="text-xs text-ink-500">{leave.decisionNote}</p> : null}
                      </Td>
                      <Td>
                        <StatusBadge status={leave.status} label={t(LEAVE_STATUS_LABELS[leave.status])} />
                        {leave.decidedByName ? <p className="mt-0.5 text-xs text-ink-500">{leave.decidedByName}</p> : null}
                      </Td>
                      <Td className="text-right">
                        <span className="inline-flex flex-wrap justify-end gap-1.5">
                          {admin && leave.status === 'pending' ? <DecideLeave id={leave.id} name={staffName} /> : null}
                          {leave.status === 'pending' || (admin && leave.status === 'approved') ? <CancelLeave id={leave.id} /> : null}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
            </>
          ) : (
            <EmptyState
              icon={<CalendarOff size={26} />}
              title={params.status || params.staff ? t('No leave matches') : t('No leave in {year}', { year })}
              text={t('Apply for leave from the button at the top. The head of school sees it at once.')}
            />
          )}
        </Card>
      </>
    );
  }

  async function Balances({ year, years }: { year: string; years: string[] }) {
    const data = await leaveBalances(session, year);
    return (
      <>
        <FilterBar>
          <UrlSelect param="year" label={t('Year')} options={years.map((value) => ({ value, label: value }))} />
        </FilterBar>
        <DailyPrintHead title={t('Leave account of the staff')} subtitle={year} />
        <Card className="print:border-0 print:shadow-none">
          <Table className="print:text-[10px]">
            <thead>
              <tr>
                <Th>{t('Staff member')}</Th>
                {data.types.map((type) => (
                  <Th key={type.key} className="text-center">
                    {t(type.name)}
                    <span className="block text-[10px] font-medium normal-case text-ink-400">{type.quota ? t('{n} days a year', { n: type.quota }) : t('No fixed limit')}</span>
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.people.map((person) => (
                <Tr key={person.id}>
                  <Td>
                    <p className="font-semibold text-ink-900">{person.name}</p>
                    <p className="text-xs text-ink-500">{person.designation ? t(person.designation) : ''}</p>
                  </Td>
                  {person.balances.map((balance) => (
                    <Td key={balance.key} className="tabular text-center">
                      <span className="font-semibold text-ink-900">{balance.approved}</span>
                      {balance.left !== null ? <span className="text-ink-500"> / {balance.quota}</span> : null}
                      {balance.left !== null ? <span className={cn('block text-xs', balance.left === 0 ? 'text-accent-600' : 'text-mint-700')}>{t('{n} left', { n: balance.left })}</span> : null}
                      {balance.pending ? <span className="block text-xs text-sun-700">{t('{n} waiting', { n: balance.pending })}</span> : null}
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <p className="mt-2 text-xs text-ink-500">{t('Days taken (approved) out of the yearly quota. Sundays and holidays are not counted.')}</p>
      </>
    );
  }
}
