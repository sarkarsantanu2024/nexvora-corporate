import { Megaphone, Pin } from 'lucide-react';
import type { Metadata } from 'next';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { formatDate, todayIST } from '@/lib/date';
import { listCirculars } from '@/server/hq/admin';
import { centreOptions } from '@/server/hq/centres';
import { isAdmin } from '@/server/hq/shared';
import { CircularForm, DeleteCircular, PinCircular } from './circular-tools';

export const metadata: Metadata = { title: 'Circulars' };

export default async function CircularsPage() {
  const session = await requireSession(HQ_ROLES);
  const [rows, centres] = await Promise.all([listCirculars(), centreOptions()]);
  const today = todayIST();
  const options = centres.map((centre) => ({ id: centre.id, name: centre.name }));

  return (
    <>
      <PageHeader
        title="Circulars"
        description="Notices from head office to the centres: timetables, policy changes, things to send in."
        actions={<CircularForm centres={options} today={today} />}
      />

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Megaphone size={26} />}
            title="No circulars yet"
            text="Write to all centres at once, or to one centre."
            action={<CircularForm centres={options} today={today} />}
          />
        </Card>
      ) : (
        <div className="max-w-4xl animate-fade-up space-y-4">
          {rows.map(({ row, centreName }) => {
            const expired = Boolean(row.expiresOn && row.expiresOn < today);
            const upcoming = row.publishOn > today;
            return (
              <Card key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold text-ink-900">{row.title}</h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {row.pinned ? (
                        <Badge tone="brand">
                          <Pin size={12} /> Pinned
                        </Badge>
                      ) : null}
                      <Badge tone={row.centreId ? 'blue' : 'neutral'}>{row.centreId ? (centreName ?? 'One centre') : 'All centres'}</Badge>
                      {expired ? <Badge tone="neutral">No longer shown</Badge> : upcoming ? <Badge tone="amber">Shows from {formatDate(row.publishOn)}</Badge> : <Badge tone="green">Showing now</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <PinCircular id={row.id} pinned={row.pinned} />
                    <CircularForm
                      centres={options}
                      today={today}
                      circular={{ id: row.id, title: row.title, body: row.body, centreId: row.centreId, pinned: row.pinned, publishOn: row.publishOn, expiresOn: row.expiresOn }}
                    />
                    {isAdmin(session) ? <DeleteCircular id={row.id} title={row.title} /> : null}
                  </div>
                </div>
                {row.body ? <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">{row.body}</p> : null}
                <p className="mt-3 text-xs text-ink-500">
                  From {formatDate(row.publishOn)}
                  {row.expiresOn ? ` to ${formatDate(row.expiresOn)}` : ', no last day'}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
