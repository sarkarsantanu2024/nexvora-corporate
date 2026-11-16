import { BadgeIndianRupee, Building2, CalendarClock, GraduationCap, Handshake, MessageSquareText, TriangleAlert, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BarsChart, Donut } from '@/components/ui/charts';
import { Badge, Card, CardBody, CardHeader, EmptyState, LinkButton, PageHeader, Stat, StatusBadge } from '@/components/ui/core';
import { CountUp } from '@/components/ui/motion';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { formatDate, formatDateTime, periodLabel, todayIST } from '@/lib/date';
import { getOverview } from '@/server/hq/overview';
import { ContactLinks } from './_ui/bits';

export const metadata: Metadata = { title: 'Overview' };

export default async function OverviewPage() {
  await requireSession(HQ_ROLES);
  const data = await getOverview();
  const { tiles } = data;
  const month = periodLabel(data.period);
  const today = todayIST();

  return (
    <>
      <PageHeader title="Overview" description={`Every centre at a glance. Money figures are for ${month} unless a card says otherwise.`} />

      <div className="grid animate-fade-up grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <Stat label="Active centres" value={<CountUp value={tiles.activeCentres} />} hint={`${tiles.totalCentres} in all`} icon={<Building2 size={18} />} href="/hq/centres" />
        <Stat label="Children on roll" value={<CountUp value={tiles.childrenOnRoll} />} hint="Across all centres" icon={<GraduationCap size={18} />} tone="green" href="/hq/reports" />
        <Stat label="Fee collected" value={<CountUp value={tiles.collectedThisMonth} prefix="₹" />} hint={month} icon={<Wallet size={18} />} tone="blue" href="/hq/reports" />
        <Stat
          label="Royalty outstanding"
          value={<CountUp value={tiles.royaltyOutstanding} prefix="₹" />}
          hint="Raised and not yet received"
          icon={<BadgeIndianRupee size={18} />}
          tone={tiles.royaltyOutstanding > 0 ? 'red' : 'green'}
          href="/hq/royalty"
        />
        <Stat label="New franchise leads" value={<CountUp value={tiles.leadsThisWeek} />} hint="In the last 7 days" icon={<Handshake size={18} />} tone="amber" href="/hq/leads" />
        <Stat
          label="Admission enquiries waiting"
          value={<CountUp value={tiles.enquiriesWaiting} />}
          hint="Not yet contacted by a centre"
          icon={<MessageSquareText size={18} />}
          tone="violet"
          href="/hq/enquiries?stage=new"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader title="Fee collection, last 6 months" description="All centres together. Cancelled receipts are left out." />
          <CardBody>
            <BarsChart data={data.collectionByMonth} series={[{ key: 'collected', name: 'Collected' }]} money />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Children by programme" />
          <CardBody>
            {data.childrenByProgramme.length ? (
              <Donut data={data.childrenByProgramme} centerLabel="children" height={280} />
            ) : (
              <EmptyState title="No children on roll yet" text="Once centres admit children, the split by programme shows here." />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader title={`Collection by centre, ${month}`} action={<LinkButton href="/hq/reports" variant="ghost" size="sm">Full report</LinkButton>} />
          <CardBody>
            {data.centreComparison.length ? (
              <BarsChart data={data.centreComparison} series={[{ key: 'collected', name: 'Collected', color: '#2ec4a0' }]} money height={260} />
            ) : (
              <EmptyState title="No active centres" text="Activate a centre to compare collections here." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Centres needing attention" description="Overdue royalty, agreements ending, no collection, attendance not marked." />
          {data.attention.length ? (
            <ul className="mt-3 divide-y divide-ink-100">
              {data.attention.map((item) => (
                <li key={item.centreId} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sun-100 text-sun-700">
                    <TriangleAlert size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/hq/centres/${item.centreId}`} className="font-semibold text-ink-900 hover:text-brand-700">
                      {item.centreName}
                    </Link>
                    <div className="mt-1.5 flex min-w-0 flex-wrap gap-1.5">
                      {item.reasons.map((reason) => (
                        <Badge key={reason.text} tone={reason.tone} className="rounded-lg text-left">
                          {reason.text}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing needs attention" text="No active centre has overdue royalty, an agreement ending soon, a month without collection or unmarked attendance." />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader title="Franchise follow-ups due" description="Today or overdue" action={<LinkButton href="/hq/leads" variant="ghost" size="sm">All leads</LinkButton>} />
          {data.followUps.length ? (
            <ul className="mt-3 divide-y divide-ink-100">
              {data.followUps.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <CalendarClock size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/hq/leads/${lead.id}`} className="block truncate font-semibold text-ink-900 hover:text-brand-700">
                      {lead.name}
                    </Link>
                    <p className="truncate text-sm text-ink-500">
                      {lead.city || 'City not given'} · <StatusBadge status={lead.stage} />
                    </p>
                  </div>
                  <span className={lead.nextFollowUp && lead.nextFollowUp < today ? 'text-sm font-semibold text-accent-600' : 'text-sm font-medium text-ink-600'}>
                    {lead.nextFollowUp === today ? 'Today' : formatDate(lead.nextFollowUp)}
                  </span>
                  <ContactLinks phone={lead.phone} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No follow-ups due" text="Leads with a follow-up date of today or earlier show here." />
          )}
        </Card>

        <Card>
          <CardHeader title="Latest activity" />
          {data.activity.length ? (
            <ul className="mt-3 divide-y divide-ink-100">
              {data.activity.map((entry) => (
                <li key={entry.id} className="px-5 py-3">
                  <p className="text-[15px] text-ink-800">{entry.summary || entry.action}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {entry.userName || 'System'} · {formatDateTime(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No activity yet" text="Changes made by head office and the centres are listed here." />
          )}
        </Card>
      </div>
    </>
  );
}
