import { CalendarClock, CircleCheck, ClipboardCheck, FileCheck2, Megaphone, NotebookPen, Paperclip } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardHeader, EmptyState, LinkButton, Notice, PageHeader } from '@/components/ui/core';
import { sectionLabel } from '@/config/school';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { istMinutes } from '@/server/daily/shared';
import { clock } from '@/server/timetable/defaults';
import { myDay } from '@/server/today/service';

export const metadata: Metadata = { title: 'My day' };

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function TodayPage() {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  // The office has its own home, the overview.
  if (session.role !== 'teacher') redirect('/admin');
  const lang = await getLang();
  const day = await myDay(session);
  const now = istMinutes();
  const minutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const pending = day.registers.filter((row) => !row.taken);

  return (
    <>
      <PageHeader title={t('My day')} description={`${t(WEEKDAY[new Date(`${day.today}T00:00:00Z`).getUTCDay()])}, ${formatDate(day.today)}`} />

      {!day.linked ? <Notice tone="amber" className="mb-4">{t('Your login is not linked to the staff list. Ask the office.')}</Notice> : null}
      {day.closed ? (
        <Notice className="mb-4">{day.closed.reason === 'sunday' ? t('Sunday: no school today.') : t('Holiday today: {name}', { name: day.closed.title })}</Notice>
      ) : null}

      {!day.closed && day.registers.length ? (
        <Card className="mb-4">
          <CardHeader title={t('Register')} description={pending.length ? t('Take the register in the first period.') : undefined} />
          <ul className="mt-3 divide-y divide-ink-100">
            {day.registers.map((row) => (
              <li key={row.section.id} className="flex items-center gap-3 px-5 py-3">
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', row.taken ? 'bg-mint-100 text-mint-700' : 'bg-accent-100 text-accent-700')}>
                  {row.taken ? <CircleCheck size={20} /> : <ClipboardCheck size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{sectionLabel(row.section, lang)}</p>
                  <p className="text-sm text-ink-500">{row.taken ? t('Taken today') : t('Not taken yet')}</p>
                </div>
                <LinkButton href={`/admin/attendance?section=${row.section.id}&day=${day.today}`} variant={row.taken ? 'secondary' : 'primary'} size="lg">
                  {row.taken ? t('Open') : t('Take register')}
                </LinkButton>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader
            title={t('My periods today')}
            action={
              <LinkButton href="/admin/timetable?tab=teacher" variant="ghost" size="sm">
                {t('Whole week')}
              </LinkButton>
            }
          />
          {day.periods.length ? (
            <ul className="mt-3 divide-y divide-ink-100">
              {day.periods.map((row) => {
                const live = now >= minutes(row.start) && now < minutes(row.end);
                const over = now >= minutes(row.end);
                return (
                  <li key={`${row.period}-${row.section.id}`} className={cn('flex items-center gap-3 px-5 py-3', live && 'bg-brand-50', over && 'opacity-60')}>
                    <span className="tabular w-20 shrink-0 text-sm">
                      <span className="block font-semibold text-ink-800">{clock(row.start)}</span>
                      <span className="text-xs text-ink-500">{t('Period {n}', { n: row.period })}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-900">{sectionLabel(row.section, lang)}</p>
                      <p className="text-sm text-ink-500">{[(lang === 'bn' && row.subjectBn) || row.subject, row.room].filter(Boolean).join(' · ')}</p>
                    </div>
                    {live ? <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white">{t('Now')}</span> : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={<CalendarClock size={26} />} title={day.closed ? t('No periods today') : t('No periods for you today')} text={day.closed ? undefined : t('When the office puts you in the timetable, your periods show here.')} />
          )}
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/diary" className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 font-semibold text-ink-900 transition hover:border-brand-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-800">
                <NotebookPen size={20} />
              </span>
              {t('Class diary')}
            </Link>
            <Link href="/admin/exams" className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 font-semibold text-ink-900 transition hover:border-brand-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun-100 text-sun-700">
                <FileCheck2 size={20} />
              </span>
              {t('Enter marks')}
            </Link>
          </div>

          <Card>
            <CardHeader title={t('Notices')} />
            {day.notices.length ? (
              <ul className="mt-3 divide-y divide-ink-100">
                {day.notices.map((notice) => (
                  <li key={notice.id} className="px-5 py-3">
                    <p className="font-semibold text-ink-900">{notice.title}</p>
                    {notice.body ? <p className="line-clamp-3 whitespace-pre-line text-sm text-ink-600">{notice.body}</p> : null}
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                      {formatDate(notice.publishOn)}
                      {notice.audience === 'staff' ? <span className="font-semibold text-brand-700">{t('For staff')}</span> : null}
                      {notice.attachment ? (
                        <a href={notice.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                          <Paperclip size={13} /> {t('Attachment')}
                        </a>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<Megaphone size={26} />} title={t('No notices')} text={t('Notices for staff from the office show here.')} />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
