import { CheckCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrintSetup } from '@/components/school/daily-print-head';
import { SchoolLetterhead } from '@/components/school/letterhead';
import { PrintButton } from '@/components/ui/client';
import { Badge, Card, CardHeader, PageHeader } from '@/components/ui/core';
import { ROLE_LABELS } from '@/components/dash/nav';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { formatDate, formatDateTime } from '@/lib/date';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { circularReaders, getCircular } from '@/server/office/circulars';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { CircularFormButton, DeleteCircular, MarkRead } from '../circular-tools';

export const metadata: Metadata = { title: 'Staff circular' };

export default async function CircularPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const { id } = await params;
  const found = await getCircular(session, id);
  if (!found) notFound();
  const { row, readAt } = found;
  const office = isOffice(session);
  const readers = office ? await circularReaders(session, row.id) : [];
  const read = readers.filter((r) => r.readAt).length;

  return (
    <>
      <PrintSetup />
      <PageHeader
        title={row.title}
        back={{ href: '/admin/circulars', label: t('Staff circulars') }}
        actions={
          <>
            <PrintButton />
            {office ? <CircularFormButton circular={row} /> : null}
            {isAdmin(session) ? <DeleteCircular id={row.id} /> : null}
          </>
        }
      />
      <div className={office ? 'grid gap-4 xl:grid-cols-[1.6fr_1fr]' : ''}>
        <Card className="print-plain mx-auto w-full max-w-3xl p-5 sm:p-8">
          <SchoolLetterhead />
          <p className="tabular mt-4 text-right text-sm text-ink-700">{t('Date: {date}', { date: formatDate(row.publishOn) })}</p>
          <h1 className="mt-2 text-center text-xl font-bold text-ink-900">{row.title}</h1>
          <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">{t('Circular to all teachers and staff')}</p>
          {row.body ? <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-ink-900">{row.body}</p> : null}
          {row.attachment ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.attachment} alt="" className="mt-5 max-h-[640px] w-full rounded-xl border border-ink-200 object-contain" />
          ) : null}
          <div className="mt-14 flex justify-end text-xs text-ink-800">
            <span className="border-t border-ink-500 px-6 pt-1">{t('Head of the institution')}</span>
          </div>
          <div className="no-print mt-6 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-5">
            {readAt ? (
              <Badge tone="green">
                <CheckCheck size={14} /> {t('You read this on {date}', { date: formatDateTime(readAt) })}
              </Badge>
            ) : (
              <MarkRead id={row.id} />
            )}
          </div>
        </Card>
        {office ? (
          <Card className="no-print">
            <CardHeader title={t('Who has read it')} description={t('{n} of {total}', { n: read, total: readers.length })} />
            <ul className="divide-y divide-ink-100 px-5 pb-3 pt-2">
              {readers.map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink-900">{person.name}</span>
                    <span className="block text-xs text-ink-500">{t(ROLE_LABELS[person.role])}</span>
                  </span>
                  {person.readAt ? (
                    <span className="text-right text-xs text-mint-700">{formatDateTime(person.readAt)}</span>
                  ) : (
                    <Badge tone="amber">{t('Not read')}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </>
  );
}
