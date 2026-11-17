import type { Metadata } from 'next';
import { NotificationList } from '@/components/dash/notifications';
import { PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { hqNotifications } from '@/server/notifications';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const t = await getT();
  await requireSession(HQ_ROLES);
  const items = await hqNotifications(t);
  return (
    <>
      <PageHeader title={t('Notifications')} description={t('What needs you today. Each one goes away by itself once it is dealt with.')} />
      <div className="max-w-3xl">
        <NotificationList items={items} />
      </div>
    </>
  );
}
