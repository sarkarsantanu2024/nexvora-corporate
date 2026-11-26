import { Image as ImageIcon, Megaphone, MessageSquareText, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardHeader, EmptyState, LinkButton, PageHeader, Stat, StatusBadge } from '@/components/ui/core';
import { SuggestionList } from '@/components/dash/suggestions';
import { CountUp } from '@/components/ui/motion';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { getOverview } from '@/server/admin/service';
import { isAdmin } from '@/server/admin/shared';
import { STATUS_LABELS } from '@/server/enquiries/constants';
import { listSuggestions } from '@/server/suggestions';
import { ContactLinks } from './_ui/bits';

export const metadata: Metadata = { title: 'Overview' };

export default async function OverviewPage() {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  const [data, suggestions] = await Promise.all([getOverview(), listSuggestions(session, t)]);
  const { tiles } = data;

  return (
    <>
      <PageHeader title={t('Overview')} description={t('What is waiting for you, and what is on the website right now.')} />

      <div className="grid animate-fade-up grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat
          label={t('New enquiries')}
          value={<CountUp value={tiles.newEnquiries} />}
          hint={t('{n} in all', { n: tiles.enquiries })}
          icon={<MessageSquareText size={18} />}
          tone={tiles.newEnquiries > 0 ? 'amber' : 'green'}
          href="/admin/enquiries?status=new"
        />
        <Stat label={t('Notices')} value={<CountUp value={tiles.notices} />} hint={t('On the notice board')} icon={<Megaphone size={18} />} tone="blue" href="/admin/website/notices" />
        <Stat label={t('Gallery photos')} value={<CountUp value={tiles.photos} />} hint={t('In the photo gallery')} icon={<ImageIcon size={18} />} tone="violet" href="/admin/website/gallery" />
        <Stat label={t('Team logins')} value={<CountUp value={tiles.users} />} hint={t('Active')} icon={<Users size={18} />} href={isAdmin(session) ? '/admin/users' : undefined} />
      </div>

      <SuggestionList items={suggestions} title={t('What to do next')} className="mt-6" />

      <div className="mt-6 grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader
            title={t('Latest enquiries')}
            description={t('Sent from the contact form of the website')}
            action={
              <LinkButton href="/admin/enquiries" variant="ghost" size="sm">
                {t('All enquiries')}
              </LinkButton>
            }
          />
          {data.latest.length ? (
            <ul className="mt-3 divide-y divide-ink-100">
              {data.latest.map((enquiry) => (
                <li key={enquiry.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/enquiries/${enquiry.id}`} className="block truncate font-semibold text-ink-900 hover:text-brand-700">
                      {enquiry.name}
                    </Link>
                    <p className="truncate text-sm text-ink-500">{enquiry.subject || enquiry.message}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{formatDateTime(enquiry.createdAt)}</p>
                  </div>
                  <StatusBadge status={enquiry.status} label={t(STATUS_LABELS[enquiry.status])} />
                  <ContactLinks phone={enquiry.phone} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<MessageSquareText size={26} />} title={t('No enquiries yet')} text={t('When a visitor fills in the contact form on the website, the message shows here.')} />
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
            <EmptyState title={t('No activity yet')} text={t('Changes made by the team are listed here.')} />
          )}
        </Card>
      </div>
    </>
  );
}
