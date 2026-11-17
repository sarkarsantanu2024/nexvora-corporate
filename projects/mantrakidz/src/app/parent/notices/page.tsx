import { CalendarDays, Megaphone, Pin } from 'lucide-react';
import type { Metadata } from 'next';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getT } from '@/lib/t';
import { listNotices } from '@/server/parent/service';

export const metadata: Metadata = { title: 'Notices' };

export default async function ParentNotices() {
  const t = await getT();
  const session = await requireSession(['parent']);
  const notices = await listNotices(session);

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('Notices')} description={t("From your child's centre and from head office.")} />
      <div className="mx-auto max-w-2xl space-y-3">
        {notices.length ? (
          notices.map((notice) => (
            <Card key={notice.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                {notice.pinned ? (
                  <Badge tone="brand">
                    <Pin size={12} /> {t('Important')}
                  </Badge>
                ) : null}
                <Badge tone={notice.centreId ? 'neutral' : 'violet'}>{notice.centreId ? notice.centreName : t('Head office')}</Badge>
                <span className="text-xs text-ink-500">{formatDate(notice.publishOn)}</span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-ink-900">{notice.title}</h2>
              {notice.body ? <p className="mt-1 whitespace-pre-line text-[15px] text-ink-600">{notice.body}</p> : null}
              {notice.eventDate ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sun-50 px-2.5 py-1 text-sm font-semibold text-sun-700">
                  <CalendarDays size={15} /> {formatDate(notice.eventDate)}
                </p>
              ) : null}
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState icon={<Megaphone size={26} />} title={t('No notices right now')} text={t('Holidays, meetings and events from the centre show here.')} />
          </Card>
        )}
      </div>
    </div>
  );
}
