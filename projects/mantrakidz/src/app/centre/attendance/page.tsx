import { CalendarCheck, CircleCheck, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PrintButton, UrlDate, UrlSelect } from '@/components/ui/client';
import { buttonClass, Card, EmptyState, LinkButton, PageHeader, TabLinks } from '@/components/ui/core';
import { canManageCentre, requireCentre } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { currentPeriod, formatDate, periodLabel, todayIST, weekday } from '@/lib/date';
import { getT } from '@/lib/t';
import { attendanceSheet, dayProgress, monthlyRegister, pickBatchId, staffSheet } from '@/server/centre/children/attendance';
import { batchOptions } from '@/server/centre/children/batches';
import { ATTENDANCE_LETTER, MARKS, type Mark } from '@/server/centre/children/constants';
import type { Ctx } from '@/server/centre/children/shared';
import { MarkSheet, StaffSheet } from './mark-sheet';

export const metadata: Metadata = { title: 'Attendance' };

type Search = { tab?: string; day?: string; batch?: string; month?: string };

const isDay = (value: string | undefined): value is string => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(value!));
const isMonth = (value: string | undefined): value is string => /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? '');
const asMark = (status: string | null): Mark | null => MARKS.find((m) => m === status) ?? null;

const LETTER_STYLE = { present: 'text-mint-700', absent: 'bg-accent-50 font-bold text-accent-700', leave: 'bg-sun-50 font-bold text-sun-700', holiday: 'text-ink-400' } as const;

export default async function AttendancePage({ searchParams }: { searchParams: Promise<Search> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const params = await searchParams;
  const manager = canManageCentre(ctx.session);
  const tab = params.tab === 'register' ? 'register' : params.tab === 'staff' && manager ? 'staff' : 'daily';
  const today = todayIST();
  const classes = await batchOptions(ctx);

  // The date and class pickers read the URL, so the defaults are put into it.
  const day = isDay(params.day) && params.day <= today ? params.day : today;
  const month = isMonth(params.month) && params.month <= currentPeriod() ? params.month : currentPeriod();
  const batchId = pickBatchId(params.batch, classes);
  const wanted: Search =
    tab === 'daily' ? { day, batch: batchId } : tab === 'register' ? { tab, month, batch: batchId } : { tab, day };
  const query = new URLSearchParams(Object.entries(wanted).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const same = [...query.keys()].every((key) => params[key as keyof Search] === query.get(key)) && (params.tab ?? 'daily') === tab;
  if (!same) redirect(`/centre/attendance?${query}`);

  const classOptions = classes.map((c) => ({ value: c.id, label: c.isCurrentYear ? c.name : `${c.name} (${c.yearName})` }));
  const noClasses = classes.length === 0;

  return (
    <>
      <style>{'@media print { @page { size: A4 landscape; margin: 8mm; } [class*="lg:pl-64"] { padding-left: 0 !important; } main { padding: 0 !important; max-width: none !important; } }'}</style>
      <PageHeader
        title={t('Attendance')}
        description={tab === 'daily' ? t('Mark each class once a day. Saving again for the same day corrects it.') : tab === 'register' ? t('The month at a glance, ready to print.') : t('Who came to work.')}
        actions={
          tab === 'register' && batchId ? (
            <>
              <a href={`/centre/attendance/export?month=${month}&batch=${batchId}`} className={buttonClass('secondary')}>
                <Download size={17} /> {t('CSV')}
              </a>
              <PrintButton />
            </>
          ) : undefined
        }
      />
      <TabLinks
        active={tab}
        tabs={[
          { key: 'daily', label: t('Mark attendance'), href: `/centre/attendance?day=${day}${batchId ? `&batch=${batchId}` : ''}` },
          { key: 'register', label: t('Monthly register'), href: `/centre/attendance?tab=register&month=${day.slice(0, 7)}${batchId ? `&batch=${batchId}` : ''}` },
          ...(manager ? [{ key: 'staff', label: t('Staff'), href: `/centre/attendance?tab=staff&day=${day}` }] : []),
        ]}
      />

      {noClasses && tab !== 'staff' ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck size={26} />}
            title={t('No classes yet')}
            text={t('Attendance is taken class by class. Add a class and admit children into it first.')}
            action={<LinkButton href="/centre/batches">{t('Go to Classes')}</LinkButton>}
          />
        </Card>
      ) : tab === 'daily' ? (
        <Daily ctx={ctx} day={day} batchId={batchId} today={today} classOptions={classOptions} />
      ) : tab === 'register' ? (
        <Register ctx={ctx} month={month} batchId={batchId} classOptions={classOptions} />
      ) : (
        <Staff ctx={ctx} day={day} today={today} />
      )}
    </>
  );
}

type ClassOptions = { value: string; label: string }[];

async function Daily({ ctx, day, batchId, today, classOptions }: { ctx: Ctx; day: string; batchId: string; today: string; classOptions: ClassOptions }) {
  const t = await getT();
  const [sheet, progress] = await Promise.all([attendanceSheet(ctx, { day, batchId }), dayProgress(ctx, day)]);
  const pending = progress.filter((p) => p.marked < p.children);
  

  return (
    <>
      {progress.length ? (
        <Card className="mb-4 animate-fade-up p-4">
          <p className={cn('mb-2.5 flex items-center gap-2 text-sm font-semibold', pending.length ? 'text-sun-700' : 'text-mint-700')}>
            {pending.length ? (
              day === today ? t('Not marked yet today: {classes}', { classes: pending.map((p) => p.name).join(', ') }) : t('Not marked yet on {date}: {classes}', { date: formatDate(day), classes: pending.map((p) => p.name).join(', ') })
            ) : (
              <>
                <CircleCheck size={17} /> {day === today ? t('Every class is marked today') : t('Every class is marked on {date}', { date: formatDate(day) })}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {progress.map((p) => {
              const done = p.marked >= p.children;
              return (
                <Link
                  key={p.id}
                  href={`/centre/attendance?day=${day}&batch=${p.id}`}
                  scroll={false}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition',
                    p.id === batchId ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                  )}
                >
                  {p.name}
                  <span className={cn('tabular rounded-full px-1.5 text-xs', done ? 'bg-mint-100 text-mint-700' : p.marked ? 'bg-sun-100 text-sun-700' : 'bg-ink-100 text-ink-600')}>
                    {p.marked}/{p.children}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : null}

      <div className="mb-4 filter-bar flex flex-wrap items-center gap-2">
        <UrlDate param="day" label={t('Date')} max={today} />
        <UrlSelect param="batch" label={t('Class')} options={classOptions} />
        {weekday(day) === 0 ? <span className="text-sm font-medium text-ink-500">{t('This is a Sunday.')}</span> : null}
      </div>

      <Card className="animate-fade-up">
        {sheet.rows.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck size={26} />}
            title={t('No children in {name} on this date', { name: sheet.batch.name })}
            text={t('Children appear here once they are admitted into this class, from their admission date.')}
            action={<LinkButton href="/centre/students/new">{t('Admit a child')}</LinkButton>}
          />
        ) : (
          <MarkSheet
            key={`${day}-${batchId}-${sheet.markedAt?.getTime() ?? 0}`}
            day={day}
            batch={sheet.batch}
            markedBy={sheet.markedBy}
            markedAt={sheet.markedAt}
            isHoliday={sheet.isHoliday}
            people={sheet.rows.map((r) => ({ id: r.studentId, name: r.name, sub: r.admissionNo, photo: r.photo, status: asMark(r.status) }))}
          />
        )}
      </Card>
    </>
  );
}

async function Register({ ctx, month, batchId, classOptions }: { ctx: Ctx; month: string; batchId: string; classOptions: ClassOptions }) {
  const t = await getT();
  const register = await monthlyRegister(ctx, { period: month, batchId });
  const line = 'border border-ink-200';
  const cell = `${line} text-center`;

  return (
    <>
      <div className="no-print mb-4 filter-bar flex flex-wrap items-center gap-2">
        <UrlDate param="month" type="month" label={t('Month')} max={currentPeriod()} />
        <UrlSelect param="batch" label={t('Class')} options={classOptions} />
      </div>
      <Card className="print-plain animate-fade-up overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {register.batch.name}, {periodLabel(month)}
          </h2>
          <p className="text-sm text-ink-500">
            {t('{name}. P present, A absent, L leave, H holiday. The percent is days present out of days the school was open.', { name: ctx.centre.name })}
          </p>
        </div>
        {register.rows.length === 0 ? (
          <EmptyState title={t('No children in this class for that month')} text={t('Pick another class or month.')} />
        ) : (
          <div className="scrollbar-thin overflow-x-auto print:overflow-visible">
            <table className="tabular w-full border-collapse text-xs print:text-[9px]">
              <thead>
                <tr>
                  <th className={cn(line, 'sticky left-0 z-10 min-w-[9.5rem] bg-ink-50 px-2 py-1.5 text-left font-semibold text-ink-700 print:static print:min-w-0')}>{t('Child')}</th>
                  {register.days.map((d) => {
                    const weekend = weekday(d) === 0 || weekday(d) === 6;
                    return (
                      <th key={d} className={cn(cell, 'w-7 min-w-[1.75rem] py-1 font-semibold print:min-w-0', weekend ? 'bg-ink-200/70 text-ink-500' : 'bg-ink-50 text-ink-700')}>
                        {Number(d.slice(8))}
                        <span className="block text-[9px] font-normal leading-none text-ink-400 print:text-[7px]">{'SMTWTFS'[weekday(d)]}</span>
                      </th>
                    );
                  })}
                  {['P', 'A', 'L', '%'].map((h) => (
                    <th key={h} className={cn(cell, 'min-w-[2rem] bg-ink-50 px-1 py-1 font-semibold text-ink-700 print:min-w-0')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {register.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className={cn(line,'sticky left-0 z-10 bg-white px-2 py-1.5 text-left font-semibold text-ink-900 print:static')}>
                      <Link href={`/centre/students/${row.id}?tab=attendance`} className="block max-w-[11rem] truncate hover:text-brand-700">
                        {row.name}
                      </Link>
                      {row.status !== 'active' ? <span className="font-normal text-ink-400">{t('left')}</span> : null}
                    </th>
                    {row.marks.map((status, i) => {
                      const d = register.days[i];
                      const weekend = weekday(d) === 0 || weekday(d) === 6;
                      return (
                        <td key={d} className={cn(cell, 'py-1', weekend && 'bg-ink-100', status && LETTER_STYLE[status])}>
                          {status ? ATTENDANCE_LETTER[status] : ''}
                        </td>
                      );
                    })}
                    <td className={cn(cell, 'px-1 font-semibold text-mint-700')}>{row.present}</td>
                    <td className={cn(cell, 'px-1 font-semibold text-accent-700')}>{row.absent}</td>
                    <td className={cn(cell, 'px-1 font-semibold text-sun-700')}>{row.leave}</td>
                    <td className={cn(cell, 'px-1 font-bold text-ink-900')}>{row.present + row.absent + row.leave ? `${row.percent}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

async function Staff({ ctx, day, today }: { ctx: Ctx; day: string; today: string }) {
  const t = await getT();
  const sheet = await staffSheet(ctx, { day });
  return (
    <>
      <div className="mb-4 filter-bar flex flex-wrap items-center gap-2">
        <UrlDate param="day" label={t('Date')} max={today} />
      </div>
      <Card className="animate-fade-up">
        {sheet.rows.length === 0 ? (
          <EmptyState icon={<CalendarCheck size={26} />} title={t('No staff on the list for this date')} text={t('Add your teachers and helpers under Staff.')} action={<LinkButton href="/centre/staff">{t('Go to Staff')}</LinkButton>} />
        ) : (
          <StaffSheet
            key={`${day}-${sheet.markedAt?.getTime() ?? 0}`}
            day={day}
            markedBy={sheet.markedBy}
            markedAt={sheet.markedAt}
            people={sheet.rows.map((r) => ({ id: r.staffId, name: r.name, sub: t(r.roleTitle), status: asMark(r.status) }))}
          />
        )}
      </Card>
    </>
  );
}
