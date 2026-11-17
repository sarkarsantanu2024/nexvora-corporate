import { CalendarCheck, ChevronRight, Megaphone, Pin, ReceiptIndianRupee, Smile } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Avatar, Badge, Card, CardHeader, EmptyState, LinkButton, Meter, PageHeader } from '@/components/ui/core';
import { requireSession } from '@/lib/auth';
import { currentPeriod, formatDate, periodLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { listChildren, listNotices } from '@/server/parent/service';

export const metadata: Metadata = { title: 'Home' };

export default async function ParentHome() {
  const t = await getT();
  const session = await requireSession(['parent']);
  const [children, notices] = await Promise.all([listChildren(session), listNotices(session, 4)]);
  const month = periodLabel(currentPeriod());

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('Hello, {name}', { name: session.name.split(' ')[0] })} description={t("Your child's attendance, fees and notices from the school.")} />

      {children.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <Card key={child.id} className="overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <Avatar name={child.name} src={child.photo} size={60} />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-xl font-bold text-ink-900">{child.name}</h2>
                  <p className="truncate text-sm text-ink-600">
                    {child.batchName ?? child.programmeName ?? t('Class not set')}
                    {child.batchTiming ? ` · ${child.batchTiming}` : ''}
                  </p>
                  <p className="truncate text-sm text-ink-500">{child.centreName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-ink-100 border-t border-ink-100">
                <Link href={`/parent/attendance?child=${child.id}`} className="block p-4 transition hover:bg-brand-50/50">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    <CalendarCheck size={14} /> {t('Attendance, {month}', { month })}
                  </p>
                  {child.attendance.marked ? (
                    <>
                      <p className="tabular mt-1 font-display text-2xl font-bold text-ink-900">{child.attendance.percent}%</p>
                      <Meter value={child.attendance.percent} tone={child.attendance.percent >= 85 ? 'green' : child.attendance.percent >= 70 ? 'amber' : 'red'} className="mt-1.5" />
                      <p className="mt-1.5 text-xs text-ink-500">
                        {t('Present {present} of {marked} days', { present: child.attendance.present, marked: child.attendance.marked })}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-ink-500">{t('Not marked yet this month')}</p>
                  )}
                </Link>
                <Link href="/parent/fees" className="block p-4 transition hover:bg-brand-50/50">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    <ReceiptIndianRupee size={14} /> {t('Fees')}
                  </p>
                  {child.due > 0 ? (
                    <>
                      <p className="tabular mt-1 font-display text-2xl font-bold text-accent-600">{inr(child.due)}</p>
                      <p className="mt-1.5 text-xs text-ink-500">
                        {child.dueBills === 1 ? t('Due on {n} bill. See how to pay', { n: child.dueBills }) : t('Due on {n} bills. See how to pay', { n: child.dueBills })}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 font-display text-2xl font-bold text-mint-700">{t('All paid')}</p>
                      <p className="mt-1.5 text-xs text-ink-500">{t('Nothing due. Thank you.')}</p>
                    </>
                  )}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={<Smile size={26} />} title={t('No child is linked to this login yet')} text={t('Please ask the school office to link your child to your mobile number.')} />
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader
          title={t('Latest notices')}
          action={
            notices.length ? (
              <Link href="/parent/notices" className="inline-flex items-center text-sm font-semibold text-brand-700 hover:underline">
                {t('All notices')} <ChevronRight size={16} />
              </Link>
            ) : null
          }
        />
        {notices.length ? (
          <ul className="mt-3 divide-y divide-ink-100">
            {notices.map((notice) => (
              <li key={notice.id} className="px-5 py-4">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
                  {notice.pinned ? <Pin size={14} className="text-brand-600" /> : null}
                  {notice.title}
                  {notice.centreId ? null : <Badge tone="violet">{t('Head office')}</Badge>}
                </p>
                {notice.body ? <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-ink-600">{notice.body}</p> : null}
                <p className="mt-1.5 text-xs text-ink-500">{formatDate(notice.publishOn)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Megaphone size={26} />} title={t('No notices right now')} text={t('Holidays, meetings and events from the school show here.')} className="py-10" />
        )}
      </Card>

      <div className="mt-5 flex justify-center sm:hidden">
        <LinkButton href="/parent/fees" variant="secondary">
          {t('Bills and receipts')}
        </LinkButton>
      </div>
    </div>
  );
}
