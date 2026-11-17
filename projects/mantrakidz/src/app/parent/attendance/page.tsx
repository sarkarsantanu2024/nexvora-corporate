import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, EmptyState, Meter, PageHeader, buttonClass } from '@/components/ui/core';
import type { AttendanceStatus } from '@/db/schema';
import { cn } from '@/lib/cn';
import { requireSession } from '@/lib/auth';
import { addMonths, currentPeriod, periodLabel, todayIST, weekday } from '@/lib/date';
import { getT } from '@/lib/t';
import { listChildren, monthAttendance } from '@/server/parent/service';

export const metadata: Metadata = { title: 'Attendance' };

const MARK: Record<AttendanceStatus, { label: string; cell: string; dot: string }> = {
  present: { label: 'Present', cell: 'bg-mint-100 text-mint-700', dot: 'bg-mint-500' },
  absent: { label: 'Absent', cell: 'bg-accent-100 text-accent-700', dot: 'bg-accent-500' },
  leave: { label: 'Leave', cell: 'bg-sun-100 text-sun-700', dot: 'bg-sun-500' },
  holiday: { label: 'Holiday', cell: 'bg-ink-100 text-ink-500', dot: 'bg-ink-300' },
};
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default async function ParentAttendance({ searchParams }: { searchParams: Promise<{ child?: string; month?: string }> }) {
  const t = await getT();
  const session = await requireSession(['parent']);
  const params = await searchParams;
  const children = await listChildren(session);

  if (!children.length) {
    return (
      <div className="animate-fade-up">
        <PageHeader title={t('Attendance')} />
        <Card>
          <EmptyState icon={<CalendarCheck size={26} />} title={t('No child is linked to this login yet')} text={t('Please ask the centre office to link your child to your mobile number.')} />
        </Card>
      </div>
    );
  }

  // Only a child from the parent's own list is ever looked up; an unknown id falls back to the first child.
  const child = children.find((c) => c.id === params.child) ?? children[0];
  const data = await monthAttendance(session, child.id, params.month);
  const today = todayIST();
  const days = Number(data.to.slice(8));
  const blanks = weekday(data.from);
  const prev = addMonths(data.period, -1);
  const next = addMonths(data.period, 1);
  const link = (month: string, childId = child.id) => `/parent/attendance?child=${childId}&month=${month}`;

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('Attendance')} description={t('Each school day as the class teacher marked it.')} />

      {children.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {children.map((c) => (
            <Link key={c.id} href={link(data.period, c.id)} className={buttonClass(c.id === child.id ? 'primary' : 'secondary', 'sm')}>
              {c.name}
            </Link>
          ))}
        </div>
      ) : null}

      <Card className="mx-auto max-w-xl overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-3 py-3">
          <Link href={link(prev)} aria-label={t('Previous month')} className={buttonClass('ghost', 'sm')}>
            <ChevronLeft size={18} />
          </Link>
          <p className="font-display text-lg font-bold text-ink-900">{periodLabel(data.period)}</p>
          {next <= currentPeriod() ? (
            <Link href={link(next)} aria-label={t('Next month')} className={buttonClass('ghost', 'sm')}>
              <ChevronRight size={18} />
            </Link>
          ) : (
            <span className="w-9" />
          )}
        </div>

        <div className="px-4 py-4">
          {data.marked ? (
            <div className="mb-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-ink-600">
                  {t('Present {present} of {marked} school days', { present: data.counts.present, marked: data.marked })}
                </p>
                <p className="tabular font-display text-2xl font-bold text-ink-900">{data.percent}%</p>
              </div>
              <Meter value={data.percent} tone={data.percent >= 85 ? 'green' : data.percent >= 70 ? 'amber' : 'red'} className="mt-1.5" />
            </div>
          ) : (
            <p className="mb-4 text-sm text-ink-500">{t('No attendance was marked for {name} in this month.', { name: child.name })}</p>
          )}

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEK.map((name) => (
              <p key={name} className="pb-1 text-xs font-semibold uppercase text-ink-400">
                {t(name)}
              </p>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const day = `${data.period}-${String(i + 1).padStart(2, '0')}`;
              const mark = data.marks[day];
              return (
                <div
                  key={day}
                  title={mark ? t(MARK[mark].label) : undefined}
                  className={cn(
                    'tabular grid aspect-square place-items-center rounded-xl text-sm font-semibold',
                    mark ? MARK[mark].cell : 'text-ink-400',
                    day === today && 'ring-2 ring-brand-500',
                  )}
                >
                  {i + 1}
                  {mark ? <span className="sr-only">{t(MARK[mark].label)}</span> : null}
                </div>
              );
            })}
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-600">
            {(Object.keys(MARK) as AttendanceStatus[]).map((status) => (
              <li key={status} className="flex items-center gap-1.5">
                <span className={cn('h-3 w-3 rounded-full', MARK[status].dot)} />
                {t(MARK[status].label)} <span className="tabular font-semibold text-ink-900">{data.counts[status]}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
