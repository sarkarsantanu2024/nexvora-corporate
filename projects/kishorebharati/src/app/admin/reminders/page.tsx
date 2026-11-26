import { Send } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagination, UrlSelect } from '@/components/ui/client';
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from '@/components/ui/core';
import { OUTBOX_STATUSES, type OutboxStatus } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { waLink } from '@/lib/wa';
import { isAdmin } from '@/server/admin/shared';
import { requirePlan } from '@/server/platform';
import { REMINDER_KINDS, kindOf } from '@/server/reminders/kinds';
import { fillQueue, listQueue } from '@/server/reminders/service';
import { FilterBar, query, readSearch, type Search } from '../_ui/bits';
import { CheckNow, DismissReminder, ReopenReminder, SendReminder } from './reminder-tools';

export const metadata: Metadata = { title: 'Reminders' };

const TAB_LABELS: Record<OutboxStatus, string> = { waiting: 'Waiting', sent: 'Sent', dismissed: 'Set aside' };

export default async function RemindersPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('panel');
  const params = await readSearch(searchParams);
  // Anything that fell due since the last daily run shows at once, also on a machine with no daily job.
  await fillQueue().catch((error) => console.error('[reminders] fill', error));
  const data = await listQueue({ status: params.status, kind: params.kind, page: params.page });

  return (
    <>
      <PageHeader
        title={t('Reminders')}
        description={t('WhatsApp messages that are due today. Press Send: your own WhatsApp opens with the message ready. Nothing goes out by itself.')}
        actions={<CheckNow />}
      />

      <div className="no-print mb-4 flex flex-wrap gap-2">
        {OUTBOX_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/reminders${query({ status: status === 'waiting' ? '' : status, kind: params.kind })}`}
            scroll={false}
            className={cn(
              'rounded-xl border px-3.5 py-2 text-sm transition',
              data.status === status ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
            )}
          >
            <span className="font-medium">{t(TAB_LABELS[status])}</span> <span className="tabular ml-1 font-bold">{data.counts[status]}</span>
          </Link>
        ))}
      </div>

      {REMINDER_KINDS.length > 1 ? (
        <FilterBar>
          <UrlSelect param="kind" label={t('Kind')} options={[{ value: '', label: t('All kinds') }, ...REMINDER_KINDS.map((kind) => ({ value: kind.key, label: t(kind.label) }))]} />
        </FilterBar>
      ) : null}

      <Card>
        {data.rows.length ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t('To')}</Th>
                  <Th>{t('Message')}</Th>
                  <Th>{data.status === 'waiting' ? t('Due') : t('Done')}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const kind = kindOf(row.kind);
                  return (
                    <Tr key={row.id}>
                      <Td>
                        {row.href ? (
                          <Link href={row.href} className="font-semibold text-ink-900 hover:text-brand-700">
                            {row.toName || row.phone}
                          </Link>
                        ) : (
                          <span className="font-semibold text-ink-900">{row.toName || row.phone}</span>
                        )}
                        <p className="tabular text-xs text-ink-500">{row.phone}</p>
                        {kind ? <Badge tone="neutral" className="mt-1">{t(kind.label)}</Badge> : null}
                      </Td>
                      <Td className="min-w-[260px] max-w-xl">
                        <p className="whitespace-pre-line text-sm text-ink-700">{row.body}</p>
                      </Td>
                      <Td className="whitespace-nowrap text-sm">
                        {data.status === 'waiting' ? (
                          formatDate(row.dueOn)
                        ) : (
                          <>
                            {row.doneAt ? formatDateTime(row.doneAt) : ''}
                            <p className="text-xs text-ink-500">{row.doneByName === 'Not needed any more' ? t('Not needed any more') : row.doneByName}</p>
                          </>
                        )}
                      </Td>
                      <Td className="whitespace-nowrap text-right">
                        {data.status === 'waiting' ? (
                          <span className="inline-flex items-center gap-1">
                            <SendReminder id={row.id} href={waLink(row.phone, row.body)} />
                            <DismissReminder id={row.id} />
                          </span>
                        ) : (
                          <ReopenReminder id={row.id} />
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} />
          </>
        ) : (
          <EmptyState
            icon={<Send size={26} />}
            title={data.status === 'waiting' ? t('Nothing to send right now') : t('Nothing here yet')}
            text={
              data.status === 'waiting'
                ? t('When something is due (a reply to a new enquiry, for example), the message waits here for you to send.')
                : t('Reminders you send or set aside are kept here for {days} days.', { days: 60 })
            }
            action={
              isAdmin(session) && data.status === 'waiting' ? (
                <Link href="/admin/settings#reminders" className="font-semibold text-brand-700 hover:underline">
                  {t('Change which reminders are made')}
                </Link>
              ) : undefined
            }
          />
        )}
      </Card>
    </>
  );
}
