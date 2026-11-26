import { CalendarCheck, CalendarOff, CircleCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PrintButton, UrlDate, UrlSelect } from '@/components/ui/client';
import { Card, EmptyState, LinkButton, Notice, PageHeader, TabLinks } from '@/components/ui/core';
import { DailyPrintHead, PrintSetup } from '@/components/school/daily-print-head';
import { sectionLabel } from '@/config/school';
import type { Section } from '@/db/schema';
import { DASH_ROLES, requireSession, type Session } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { currentPeriod, formatDate, periodLabel, todayIST, weekday } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { LETTER, dayBoard, loadRegister, monthlyRegister } from '@/server/attendance/service';
import { STAFF_LETTER, staffMonthly, staffSheet } from '@/server/attendance/staff';
import { isDay, isMonth, visibleSections } from '@/server/daily/shared';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { readSearch, type Search } from '../_ui/bits';
import { RegisterSheet, StaffSheet } from './register-sheet';

export const metadata: Metadata = { title: 'Attendance' };

type Tab = 'mark' | 'month' | 'staff' | 'staffmonth';

export default async function AttendancePage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const params = await readSearch(searchParams);
  const office = isOffice(session);
  const tab: Tab = params.tab === 'month' ? 'month' : office && (params.tab === 'staff' || params.tab === 'staffmonth') ? params.tab : 'mark';
  const today = todayIST();
  const visible = await visibleSections(session);

  // The pickers read the URL, so the chosen defaults are put into it.
  const day = isDay(params.day) && params.day <= today ? params.day : today;
  const month = isMonth(params.month) && params.month <= currentPeriod() ? params.month : currentPeriod();
  const sectionId = visible.sections.some((row) => row.id === params.section) ? params.section : (visible.sections[0]?.id ?? '');
  const wanted: Record<string, string> =
    tab === 'mark' ? { day, section: sectionId } : tab === 'month' ? { tab, month, section: sectionId } : tab === 'staff' ? { tab, day } : { tab, month };
  const same = Object.entries(wanted).every(([key, value]) => !value || params[key] === value) && (params.tab ?? 'mark') === tab;
  if (!same) redirect(`/admin/attendance?${new URLSearchParams(Object.entries(wanted).filter(([, value]) => value))}`);

  const label = (section: Section) => sectionLabel(section, lang);
  const sectionOptions = visible.sections.map((row) => ({ value: row.id, label: label(row) }));
  const printable = tab === 'month' || tab === 'staffmonth';

  return (
    <>
      {printable ? <PrintSetup landscape /> : null}
      <PageHeader
        title={t('Attendance')}
        description={
          tab === 'mark'
            ? t('Take the register once a day. Saving again for the same day corrects it.')
            : tab === 'month'
              ? t('A class for the whole month, ready to print.')
              : tab === 'staff'
                ? t('Who came to work today.')
                : t('Staff attendance for the whole month, ready to print.')
        }
        actions={printable ? <PrintButton /> : undefined}
      />
      <TabLinks
        active={tab}
        tabs={[
          { key: 'mark', label: t('Register'), href: `/admin/attendance?day=${day}${sectionId ? `&section=${sectionId}` : ''}` },
          { key: 'month', label: t('Monthly register'), href: `/admin/attendance?tab=month&month=${day.slice(0, 7)}${sectionId ? `&section=${sectionId}` : ''}` },
          ...(office
            ? [
                { key: 'staff', label: t('Staff attendance'), href: `/admin/attendance?tab=staff&day=${day}` },
                { key: 'staffmonth', label: t('Staff monthly sheet'), href: `/admin/attendance?tab=staffmonth&month=${day.slice(0, 7)}` },
              ]
            : []),
        ]}
      />

      {tab === 'staff' ? (
        <StaffDay session={session} day={day} today={today} />
      ) : tab === 'staffmonth' ? (
        <StaffMonth session={session} month={month} />
      ) : !visible.sections.length ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck size={26} />}
            title={office ? t('No classes this year yet') : t('You have no class yet')}
            text={office ? t('The register is taken class by class. Add the sections of this year first.') : t('The office makes you class teacher of a section, or gives you subjects to teach. Then your classes show here.')}
            action={office ? <LinkButton href="/admin/classes">{t('Go to Classes and subjects')}</LinkButton> : undefined}
          />
        </Card>
      ) : tab === 'mark' ? (
        <>
          {office ? <Board session={session} day={day} today={today} sectionId={sectionId} lang={lang} /> : null}
          {!office && visible.sections.length > 1 ? (
            <div className="no-print mb-3 flex flex-wrap gap-2">
              {visible.sections.map((row) => (
                <Link
                  key={row.id}
                  href={`/admin/attendance?day=${day}&section=${row.id}`}
                  scroll={false}
                  className={cn('inline-flex h-11 items-center rounded-xl border px-3.5 text-sm font-semibold', row.id === sectionId ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700')}
                >
                  {label(row)}
                </Link>
              ))}
            </div>
          ) : null}
          <div className="filter-bar no-print mb-4 flex flex-wrap items-center gap-2">
            <UrlDate param="day" label={t('Date')} max={today} />
            <UrlSelect param="section" label={t('Class')} options={sectionOptions} />
          </div>
          <Mark session={session} day={day} sectionId={sectionId} label={label} />
        </>
      ) : (
        <>
          <div className="filter-bar no-print mb-4 flex flex-wrap items-center gap-2">
            <UrlDate param="month" type="month" label={t('Month')} max={currentPeriod()} />
            <UrlSelect param="section" label={t('Class')} options={sectionOptions} />
          </div>
          <Month session={session} month={month} sectionId={sectionId} label={label} />
        </>
      )}
    </>
  );
}

/** The office's view of every section on the day: taken or not, and the share present. */
async function Board({ session, day, today, sectionId, lang }: { session: Session; day: string; today: string; sectionId: string; lang: 'en' | 'bn' | 'hi' }) {
  const t = await getT();
  const board = (await dayBoard(session, day)).filter((row) => row.students > 0);
  if (!board.length) return null;
  const missing = board.filter((row) => !row.marked);
  const marked = board.reduce((sum, row) => sum + row.marked, 0);
  const present = board.reduce((sum, row) => sum + row.present, 0);
  const percent = marked ? Math.round((present * 100) / marked) : null;
  return (
    <Card className="no-print mb-4 p-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className={cn('flex items-center gap-2 text-sm font-semibold', missing.length ? 'text-sun-700' : 'text-mint-700')}>
          {missing.length ? (
            t('{n} of {total} sections not taken {when}', { n: missing.length, total: board.length, when: day === today ? t('today') : formatDate(day) })
          ) : (
            <>
              <CircleCheck size={17} /> {t('Every section is taken')}
            </>
          )}
        </p>
        {percent !== null ? <p className="tabular text-sm font-semibold text-ink-700">{t('{percent}% present in the sections taken', { percent })}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {board.map((row) => (
          <Link
            key={row.section.id}
            href={`/admin/attendance?day=${day}&section=${row.section.id}`}
            scroll={false}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition',
              row.section.id === sectionId ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
            )}
          >
            {sectionLabel(row.section, lang)}
            <span className={cn('tabular rounded-full px-1.5 text-xs', row.marked ? (row.percent !== null && row.percent < 75 ? 'bg-sun-100 text-sun-700' : 'bg-mint-100 text-mint-700') : 'bg-ink-100 text-ink-600')}>
              {row.marked ? `${row.percent}%` : t('not taken')}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

async function Mark({ session, day, sectionId, label }: { session: Session; day: string; sectionId: string; label: (section: Section) => string }) {
  const t = await getT();
  const register = await loadRegister(session, { sectionId, day });
  const title = label(register.section);
  if (register.closed) {
    return (
      <Card>
        <EmptyState
          icon={<CalendarOff size={26} />}
          title={register.closed.reason === 'sunday' ? t('Sunday: no register') : t('Holiday: {name}', { name: register.closed.title })}
          text={t('The school is shut on {date}, so the register is not taken. Pick another date.', { date: formatDate(day) })}
        />
      </Card>
    );
  }
  if (!register.rows.length) {
    return (
      <Card>
        <EmptyState icon={<CalendarCheck size={26} />} title={t('No students in {name}', { name: title })} text={t('Students show here once they are admitted into this section.')} />
      </Card>
    );
  }
  return (
    <Card>
      <RegisterSheet
        key={`${sectionId}-${day}-${register.markedAt?.getTime() ?? 0}`}
        day={day}
        sectionId={sectionId}
        title={title}
        canMark={register.canMark}
        markedAt={register.markedAt ? register.markedAt.toISOString() : null}
        markedBy={register.markedBy}
        previousDay={register.previousDay}
        rows={register.rows.map((row) => ({ studentId: row.studentId, name: row.name, rollNo: row.rollNo, status: row.status, absentBefore: row.absentBefore }))}
      />
    </Card>
  );
}

const CELL_STYLE: Record<string, string> = {
  present: 'text-mint-700',
  late: 'bg-sky-50 font-bold text-sky-700',
  absent: 'bg-accent-50 font-bold text-accent-700',
  leave: 'bg-sun-50 font-bold text-sun-700',
  half_day: 'bg-sky-50 font-bold text-sky-700',
  duty: 'font-bold text-brand-700',
};
const line = 'border border-ink-200';
const cell = `${line} text-center`;

function DayHead({ days, holidays }: { days: string[]; holidays: Map<string, string> }) {
  return (
    <>
      {days.map((d) => {
        const shut = weekday(d) === 0 || holidays.has(d);
        return (
          <th key={d} title={holidays.get(d)} className={cn(cell, 'w-7 min-w-[1.75rem] py-1 font-semibold print:min-w-0', shut ? 'bg-ink-200/70 text-ink-500' : 'bg-ink-50 text-ink-700')}>
            {Number(d.slice(8))}
            <span className="block text-[9px] font-normal leading-none text-ink-400 print:text-[7px]">{'SMTWTFS'[weekday(d)]}</span>
          </th>
        );
      })}
    </>
  );
}

async function Month({ session, month, sectionId, label }: { session: Session; month: string; sectionId: string; label: (section: Section) => string }) {
  const t = await getT();
  const register = await monthlyRegister(session, { sectionId, month });
  const title = `${label(register.section)}, ${periodLabel(register.month)}`;
  return (
    <Card className="print-plain overflow-hidden">
      <DailyPrintHead title={t('Attendance register')} subtitle={title} />
      <div className="px-5 py-4 print:hidden">
        <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
        <p className="text-sm text-ink-500">{t('P present, A absent, L late, LV leave. Grey days are Sundays and holidays. The percent counts late as present.')}</p>
      </div>
      {!register.rows.length ? (
        <EmptyState title={t('No students in this section')} text={t('Pick another section or month.')} />
      ) : (
        <div className="scrollbar-thin overflow-x-auto print:overflow-visible">
          <table className="tabular w-full border-collapse text-xs print:text-[8px]">
            <thead>
              <tr>
                <th className={cn(cell, 'w-8 bg-ink-50 px-1 py-1.5 font-semibold text-ink-700')}>{t('Roll')}</th>
                <th className={cn(line, 'sticky left-0 z-10 min-w-[9rem] bg-ink-50 px-2 py-1.5 text-left font-semibold text-ink-700 print:static print:min-w-0')}>{t('Student')}</th>
                <DayHead days={register.days} holidays={register.holidays} />
                {['P', 'A', 'L', 'LV', '%'].map((h) => (
                  <th key={h} className={cn(cell, 'min-w-[2rem] bg-ink-50 px-1 py-1 font-semibold text-ink-700 print:min-w-0')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {register.rows.map((row) => (
                <tr key={row.studentId}>
                  <td className={cn(cell, 'px-1')}>{row.rollNo}</td>
                  <th scope="row" className={cn(line, 'sticky left-0 z-10 bg-white px-2 py-1 text-left font-semibold text-ink-900 print:static')}>
                    <span className="block max-w-[11rem] truncate print:max-w-none">{row.name}</span>
                    {!row.active ? <span className="font-normal text-ink-400">{t('left')}</span> : null}
                  </th>
                  {row.cells.map((status, i) => {
                    const d = register.days[i];
                    const shut = weekday(d) === 0 || register.holidays.has(d);
                    return (
                      <td key={d} className={cn(cell, 'py-1', shut && 'bg-ink-100', status && CELL_STYLE[status])}>
                        {status ? LETTER[status] : ''}
                      </td>
                    );
                  })}
                  <td className={cn(cell, 'px-1 font-semibold text-mint-700')}>{row.present}</td>
                  <td className={cn(cell, 'px-1 font-semibold text-accent-700')}>{row.absent}</td>
                  <td className={cn(cell, 'px-1 font-semibold text-sky-700')}>{row.late}</td>
                  <td className={cn(cell, 'px-1 font-semibold text-sun-700')}>{row.leave}</td>
                  <td className={cn(cell, 'px-1 font-bold text-ink-900')}>{row.percent ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="px-5 py-3 text-xs text-ink-500">{t('Days the register was taken this month: {n}', { n: register.openDays })}</p>
    </Card>
  );
}

async function StaffDay({ session, day, today }: { session: Session; day: string; today: string }) {
  const t = await getT();
  const sheet = await staffSheet(session, day);
  return (
    <>
      <div className="filter-bar no-print mb-4 flex flex-wrap items-center gap-2">
        <UrlDate param="day" label={t('Date')} max={today} />
      </div>
      {weekday(day) === 0 ? <Notice tone="amber" className="mb-3">{t('This is a Sunday. Mark only those who were on duty.')}</Notice> : null}
      <Card>
        {sheet.rows.length ? (
          <StaffSheet
            key={`${day}-${sheet.markedAt?.getTime() ?? 0}`}
            day={day}
            markedAt={sheet.markedAt ? sheet.markedAt.toISOString() : null}
            markedBy={sheet.markedBy}
            rows={sheet.rows.map((row) => ({ id: row.id, name: row.name, designation: row.designation, status: row.status }))}
          />
        ) : (
          <EmptyState icon={<CalendarCheck size={26} />} title={t('No staff on the list')} text={t('Add teachers and staff first.')} action={<LinkButton href="/admin/staff">{t('Go to Teachers and staff')}</LinkButton>} />
        )}
      </Card>
    </>
  );
}

async function StaffMonth({ session, month }: { session: Session; month: string }) {
  const t = await getT();
  const sheet = await staffMonthly(session, month);
  return (
    <>
      <div className="filter-bar no-print mb-4 flex flex-wrap items-center gap-2">
        <UrlDate param="month" type="month" label={t('Month')} max={currentPeriod()} />
      </div>
      <Card className="print-plain overflow-hidden">
        <DailyPrintHead title={t('Staff attendance')} subtitle={periodLabel(sheet.month)} />
        <div className="px-5 py-4 print:hidden">
          <h2 className="font-display text-lg font-bold text-ink-900">{t('Staff attendance, {month}', { month: periodLabel(sheet.month) })}</h2>
          <p className="text-sm text-ink-500">{t('P present, A absent, L leave, H half day, D on duty.')}</p>
        </div>
        {!sheet.rows.length ? (
          <EmptyState title={t('No staff on the list')} />
        ) : (
          <div className="scrollbar-thin overflow-x-auto print:overflow-visible">
            <table className="tabular w-full border-collapse text-xs print:text-[8px]">
              <thead>
                <tr>
                  <th className={cn(line, 'sticky left-0 z-10 min-w-[10rem] bg-ink-50 px-2 py-1.5 text-left font-semibold text-ink-700 print:static print:min-w-0')}>{t('Name')}</th>
                  <DayHead days={sheet.days} holidays={sheet.holidays} />
                  {['P', 'A', 'L', 'H', 'D'].map((h) => (
                    <th key={h} className={cn(cell, 'min-w-[2rem] bg-ink-50 px-1 py-1 font-semibold text-ink-700 print:min-w-0')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className={cn(line, 'sticky left-0 z-10 bg-white px-2 py-1 text-left font-semibold text-ink-900 print:static')}>
                      <span className="block max-w-[12rem] truncate print:max-w-none">{row.name}</span>
                    </th>
                    {row.cells.map((status, i) => {
                      const d = sheet.days[i];
                      const shut = weekday(d) === 0 || sheet.holidays.has(d);
                      return (
                        <td key={d} className={cn(cell, 'py-1', shut && 'bg-ink-100', status && CELL_STYLE[status])}>
                          {status ? STAFF_LETTER[status] : ''}
                        </td>
                      );
                    })}
                    <td className={cn(cell, 'px-1 font-semibold text-mint-700')}>{row.total.present}</td>
                    <td className={cn(cell, 'px-1 font-semibold text-accent-700')}>{row.total.absent}</td>
                    <td className={cn(cell, 'px-1 font-semibold text-sun-700')}>{row.total.leave}</td>
                    <td className={cn(cell, 'px-1 font-semibold text-sky-700')}>{row.total.half_day}</td>
                    <td className={cn(cell, 'px-1 font-semibold text-brand-700')}>{row.total.duty}</td>
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
