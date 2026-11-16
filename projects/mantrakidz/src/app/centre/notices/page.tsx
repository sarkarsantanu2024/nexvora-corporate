import { Megaphone, Pin } from 'lucide-react';
import type { Metadata } from 'next';
import { Badge, Card, CardHeader, EmptyState, PageHeader } from '@/components/ui/core';
import { requireCentre } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { listCirculars, listNotices } from '@/server/centre/money/notices';
import { AddNoticeButton, NoticeActions } from './notice-ui';

export const metadata: Metadata = { title: 'Notices' };

export default async function NoticesPage() {
  const ctx = await requireCentre();
  const [notices, circulars] = await Promise.all([listNotices(ctx), listCirculars(ctx)]);
  const today = todayIST();

  return (
    <div className="animate-fade-up">
      <PageHeader title="Notices" description="Notices to this centre's parents. They show in the parent corner; share one on WhatsApp too." actions={<AddNoticeButton today={today} />} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-3 lg:col-span-2">
          {notices.length ? (
            notices.map((notice) => {
              const expired = !!notice.expiresOn && notice.expiresOn < today;
              const upcoming = notice.publishOn > today;
              return (
                <Card key={notice.id} className={`p-5 ${expired ? 'opacity-70' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {notice.pinned ? (
                          <Badge tone="brand">
                            <Pin size={12} /> Pinned
                          </Badge>
                        ) : null}
                        {expired ? <Badge>Expired</Badge> : upcoming ? <Badge tone="blue">Goes out {formatDate(notice.publishOn)}</Badge> : <Badge tone="green">Showing to parents</Badge>}
                      </div>
                      <h2 className="mt-2 text-lg font-bold text-ink-900">{notice.title}</h2>
                      {notice.body ? <p className="mt-1 whitespace-pre-line text-[15px] text-ink-600">{notice.body}</p> : null}
                      <p className="mt-2 text-xs text-ink-500">
                        {formatDate(notice.publishOn)}
                        {notice.eventDate ? ` · Event on ${formatDate(notice.eventDate)}` : ''}
                        {notice.expiresOn ? ` · Shows till ${formatDate(notice.expiresOn)}` : ''}
                      </p>
                    </div>
                    <NoticeActions
                      today={today}
                      notice={{
                        id: notice.id,
                        title: notice.title,
                        body: notice.body,
                        pinned: notice.pinned,
                        eventDate: notice.eventDate ?? '',
                        publishOn: notice.publishOn,
                        expiresOn: notice.expiresOn ?? '',
                      }}
                      shareText={[`*${notice.title}*`, notice.body, `- ${ctx.centre.name}`].filter(Boolean).join('\n\n')}
                    />
                  </div>
                </Card>
              );
            })
          ) : (
            <Card>
              <EmptyState
                icon={<Megaphone size={26} />}
                title="No notices yet"
                text="Tell parents about a holiday, a meeting or an event. The notice shows in their login and can be shared on WhatsApp."
                action={<AddNoticeButton today={today} />}
              />
            </Card>
          )}
        </div>

        <Card className="min-w-0 self-start">
          <CardHeader title="From head office" description="Circulars to centres. Read only." />
          <div className="mt-3 divide-y divide-ink-100">
            {circulars.length ? (
              circulars.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
                    {c.pinned ? <Pin size={14} className="text-brand-600" /> : null}
                    {c.title}
                  </p>
                  {c.body ? <p className="mt-1 whitespace-pre-line text-sm text-ink-600">{c.body}</p> : null}
                  <p className="mt-1.5 text-xs text-ink-500">{formatDate(c.publishOn)}</p>
                </div>
              ))
            ) : (
              <p className="px-5 pb-5 pt-2 text-sm text-ink-500">Nothing from head office at the moment.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
