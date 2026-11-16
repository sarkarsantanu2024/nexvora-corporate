import type { Metadata } from 'next';
import { NoticesManager } from '@/components/cms/notices-manager';
import { PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { listNotices, noticeStatus } from '@/server/cms/gallery';

export const metadata: Metadata = { title: 'Notices and events' };

export default async function NoticesPage() {
  await requireSession(HQ_ROLES);
  const today = todayIST();
  const notices = await listNotices();
  return (
    <>
      <PageHeader title="Notices and events" description="What visitors and parents should know this week: holidays, admissions, events. Shown on the public website." />
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
