import { BadgeIndianRupee, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Card, EmptyState, Notice, PageHeader, Stat, StatusBadge, Table, Td, Th, Tr, buttonClass } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { currentPeriod, formatDate, periodLabel, todayIST } from '@/lib/date';
import { inr } from '@/lib/money';
import { period as periodSchema } from '@/lib/validators';
import { waLink } from '@/lib/wa';
import { lastFinishedPeriod, listRoyalty, royaltyOutstanding, type RoyaltyRow } from '@/server/hq/royalty';
import { getSetting, isAdmin, royaltyRateLabel } from '@/server/hq/shared';
import { ExportLink, FilterBar, NUM, readSearch, type Search } from '../_ui/bits';
import { MonthPicker, RaiseRoyalty, RecordPayment } from './royalty-tools';

export const metadata: Metadata = { title: 'Royalty' };

function reminder(row: RoyaltyRow, orgName: string) {
  const text = `Dear ${row.ownerName || 'Sir/Madam'}, the royalty of ${inr(row.balance)} for ${periodLabel(row.period)} (${row.centreName}) ${
    row.overdue ? `was due on ${formatDate(row.dueDate)} and is still pending` : `is due on ${formatDate(row.dueDate)}`
  }. Kindly arrange the payment. Thank you, ${orgName} head office.`;
  return waLink(row.ownerPhone, text);
}

export default async function RoyaltyPage({ searchParams }: { searchParams: Search }) {
  const session = await requireSession(HQ_ROLES);
  const params = await readSearch(searchParams);
  const period = periodSchema.safeParse(params.period).success && params.period <= currentPeriod() ? params.period : lastFinishedPeriod();
  const [data, outstanding, org] = await Promise.all([listRoyalty(period), royaltyOutstanding(), getSetting('org')]);
  const label = periodLabel(period);
  const admin = isAdmin(session);
  const today = todayIST();

  return (
    <>
      <PageHeader
        title="Royalty"
        description="What each franchise centre owes head office for a month, worked out from that month's fee collection."
        actions={
          <>
            {data.rows.length ? <ExportLink href={`/hq/royalty/export?period=${period}`} /> : null}
            {data.canRaise ? <RaiseRoyalty period={period} label={label} alreadyRaised={data.rows.length > 0 && data.notRaised.length === 0} /> : null}
          </>
        }
      />

      <FilterBar>
        <MonthPicker value={period} max={currentPeriod()} />
        <span className="text-sm text-ink-500">Showing {label}</span>
      </FilterBar>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label={`Raised, ${label}`} value={inr(data.totals.amount)} hint={`On collection of ${inr(data.totals.basis)}`} />
        <Stat label={`Received, ${label}`} value={inr(data.totals.paid)} tone="green" />
        <Stat label={`Balance, ${label}`} value={inr(data.totals.balance)} tone={data.totals.balance > 0 ? 'amber' : 'green'} />
        <Stat label="Outstanding, all months" value={inr(outstanding)} tone={outstanding > 0 ? 'red' : 'green'} hint="Every centre, every month" />
      </div>

      {!data.canRaise ? (
        <Notice className="mb-4">{label} is not over yet. Royalty is raised after the month ends, on that month&apos;s fee collection.</Notice>
      ) : data.notRaised.length && data.rows.length ? (
        <Notice tone="amber" className="mb-4">
          Not yet raised for {label}: {data.notRaised.map((centre) => centre.name).join(', ')}. Press &quot;Raise royalty&quot; to add them. Centres already billed are not touched.
        </Notice>
      ) : null}

      <Card>
        {data.rows.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Centre</Th>
                <Th className="text-right">Collection</Th>
                <Th>Rate</Th>
                <Th className="text-right">Royalty</Th>
                <Th className="text-right">Paid</Th>
                <Th className="text-right">Balance</Th>
                <Th>Status</Th>
                <Th>Due</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => {
                const wa = row.balance > 0 ? reminder(row, org.name) : '';
                return (
                  <Tr key={row.id}>
                    <Td className="min-w-[180px]">
                      <Link href={`/hq/royalty/statement/${row.centreId}`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {row.centreName}
                      </Link>
                      <p className="tabular text-xs text-ink-500">{row.centreCode}</p>
                    </Td>
                    <Td className={NUM}>{inr(row.basisAmount)}</Td>
                    <Td className="whitespace-nowrap">{royaltyRateLabel(row.royaltyType, row.royaltyValue)}</Td>
                    <Td className={`${NUM} font-semibold`}>{inr(row.amount)}</Td>
                    <Td className={NUM}>{inr(row.paid)}</Td>
                    <Td className={`${NUM} font-semibold ${row.balance > 0 ? 'text-accent-600' : ''}`}>{inr(row.balance)}</Td>
                    <Td>
                      <StatusBadge status={row.status} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatDate(row.dueDate)}
                      {row.overdue ? (
                        <span className="block">
                          <Badge tone="red">Overdue</Badge>
                        </span>
                      ) : null}
                    </Td>
                    <Td>
                      <span className="no-print flex items-center justify-end gap-1.5">
                        {wa ? (
                          <a href={wa} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm', 'w-9 px-0 text-mint-700')} title="Send a reminder on WhatsApp" aria-label="Send a reminder on WhatsApp">
                            <MessageCircle size={16} />
                          </a>
                        ) : null}
                        {admin && row.balance > 0 ? <RecordPayment invoiceId={row.id} centre={row.centreName} month={label} balance={row.balance} today={today} /> : null}
                      </span>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-ink-50/60 font-bold text-ink-900">
                <Td>Total</Td>
                <Td className={NUM}>{inr(data.totals.basis)}</Td>
                <Td />
                <Td className={NUM}>{inr(data.totals.amount)}</Td>
                <Td className={NUM}>{inr(data.totals.paid)}</Td>
                <Td className={NUM}>{inr(data.totals.balance)}</Td>
                <Td colSpan={3} />
              </tr>
            </tfoot>
          </Table>
        ) : (
          <EmptyState
            icon={<BadgeIndianRupee size={26} />}
            title={`No royalty raised for ${label}`}
            text={
              data.canRaise
                ? data.notRaised.length
                  ? `Raising it makes one royalty bill for each of the ${data.notRaised.length} active franchise ${data.notRaised.length === 1 ? 'centre' : 'centres'}, from the fee they collected in ${label}.`
                  : 'There is no active franchise centre to bill. Company-owned centres pay no royalty.'
                : 'Pick a month that is over to raise its royalty.'
            }
            action={data.canRaise && data.notRaised.length ? <RaiseRoyalty period={period} label={label} alreadyRaised={false} /> : undefined}
          />
        )}
      </Card>
      {admin ? null : <p className="mt-3 text-sm text-ink-500">Only a head office admin can record or cancel royalty payments.</p>}
    </>
  );
}
