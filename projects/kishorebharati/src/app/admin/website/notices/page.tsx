import type { Metadata } from 'next';
import { NoticesManager } from '@/components/cms/notices-manager';
import { PageHeader } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { listNotices, noticeStatus } from '@/server/cms/gallery';

export const metadata: Metadata = { title: 'Notices and events' };

export default async function NoticesPage() {
  const t = await getT();
  await requireSession(TEAM_ROLES);
  const today = todayIST();
  const notices = await listNotices();
  return (
    <>
      <PageHeader title={t('Notices and events')} description={t('What visitors should know this week: holidays, offers, events. Shown on the public website.')} />
      <NoticesManager
        today={today}
        notices={notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          body: notice.body,
          image: notice.image,
          pinned: notice.pinned,
          eventDate: notice.eventDate,
          publishOn: notice.publishOn,
          expiresOn: notice.expiresOn,
          status: noticeStatus(notice, today),
        }))}
      />
    </>
  );
}
