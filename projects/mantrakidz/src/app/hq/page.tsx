import { BadgeIndianRupee, Building2, CalendarClock, GraduationCap, Handshake, MessageSquareText, TriangleAlert, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BarsChart, Donut } from '@/components/ui/charts';
import { Badge, Card, CardBody, CardHeader, EmptyState, LinkButton, PageHeader, Stat, StatusBadge } from '@/components/ui/core';
import { CountUp } from '@/components/ui/motion';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { formatDate, formatDateTime, periodLabel, todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { getOverview } from '@/server/hq/overview';
import { ContactLinks } from './_ui/bits';

export const metadata: Metadata = { title: 'Overview' };

export default async function OverviewPage() {
  const t = await getT();
  await requireSession(HQ_ROLES);
  const data = await getOverview();
  const { tiles } = data;
  const month = periodLabel(data.period);
  const today = todayIST();

  return (
    <>
      <PageHeader title={t('Overview')} description={t('Every centre at a glance. Money figures are for {month} unless a card says otherwise.', { month })} />

      <div className="grid animate-fade-up grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <Stat label={t('Active centres')} value={<CountUp value={tiles.activeCentres} />} hint={t('{totalCentres} in all', { totalCentres: tiles.totalCentres })} icon={<Building2 size={18} />} href="/hq/centres" />
        <Stat label={t('Children on roll')} value={<CountUp value={tiles.childrenOnRoll} />} hint={t('Across all centres')} icon={<GraduationCap size={18} />} tone="green" href="/hq/reports" />
        <Stat label={t('Fee collected')} value={<CountUp value={tiles.collectedThisMonth} prefix="₹" />} hint={month} icon={<Wallet size={18} />} tone="blue" href="/hq/reports" />
        <Stat
          label={t('Royalty outstanding')}
          value={<CountUp value={tiles.royaltyOutstanding} prefix="₹" />}
          hint={t('Raised and not yet received')}
          icon={<BadgeIndianRupee size={18} />}
          tone={tiles.royaltyOutstanding > 0 ? 'red' : 'green'}
          href="/hq/royalty"
        />
        <Stat label={t('New franchise leads')} value={<CountUp value={tiles.leadsThisWeek} />} hint={t('In the last 7 days')} icon={<Handshake size={18} />} tone="amber" href="/hq/leads" />
        <Stat
          label={t('Admission enquiries waiting')}
          value={<CountUp value={tiles.enquiriesWaiting} />}
          hint={t('Not yet contacted by a centre')}
          icon={<MessageSquareText size={18} />}
          tone="violet"
          href="/hq/enquiries?stage=new"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="xl:col-span-2">
          <CardHeader title={t('Fee collection, last 6 months')} description={t('All centres together. Cancelled receipts are left out.')} />
          <CardBody>
            <BarsChart data={data.collectionByMonth} series={[{ key: 'collected', name: t('Collected') }]} money />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('Children by programme')} />
          <CardBody>
            {data.childrenByProgramme.length ? (
              <Donut data={data.childrenByProgramme} centerLabel={t('children')} height={280} />
            ) : (
              <EmptyState title={t('No children on roll yet')} text={t('Once centres admit children, the split by programme shows here.')} />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader title={t('Collection by centre, {month}', { month })} action={<LinkButton href="/hq/reports" variant="ghost" size="sm">{t('Full report')}</LinkButton>} />
          <CardBody>
            {data.centreComparison.length ? (
              <BarsChart data={data.centreComparison} series={[{ key: 'collected', name: t('Collected'), color: '#2ec4a0' }]} money height={260} />
            ) : (
              <EmptyState title={t('No active centres')} text={t('Activate a centre to compare collections here.')} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('Centres needing attention')} description={t('Overdue royalty, agreements ending, no collection, attendance not marked.')} />
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
            <EmptyState title={t('Nothing needs attention')} text={t('No active centre has overdue royalty, an agreement ending soon, a month without collection or unmarked attendance.')} />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader title={t('Franchise follow-ups due')} description={t('Today or overdue')} action={<LinkButton href="/hq/leads" variant="ghost" size="sm">{t('All leads')}</LinkButton>} />
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
                      {lead.city || t('City not given')} · <StatusBadge t={t} status={lead.stage} />
                    </p>
                  </div>
                  <span className={lead.nextFollowUp && lead.nextFollowUp < today ? 'text-sm font-semibold text-accent-600' : 'text-sm font-medium text-ink-600'}>
                    {lead.nextFollowUp === today ? t('Today') : formatDate(lead.nextFollowUp)}
                  </span>
                  <ContactLinks phone={lead.phone} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('No follow-ups due')} text={t('Leads with a follow-up date of today or earlier show here.')} />
          )}
        </Card>

        <Card>
          <CardHeader title={t('Latest activity')} />
          {data.activity.length ? (
            <ul className="mt-3 divide-y divide-ink-100">
              {data.activity.map((entry) => (
                <li key={entry.id} className="px-5 py-3">
                  <p className="text-[15px] text-ink-800">{entry.summary || entry.action}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {entry.userName || t('System')} · {formatDateTime(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('No activity yet')} text={t('Changes made by head office and the centres are listed here.')} />
          )}
        </Card>
      </div>
    </>
  );
}
