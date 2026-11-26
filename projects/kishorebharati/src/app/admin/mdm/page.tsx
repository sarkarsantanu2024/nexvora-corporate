import { CalendarOff, UtensilsCrossed } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DailyPrintHead, PrintSetup } from '@/components/school/daily-print-head';
import { PrintButton, UrlDate } from '@/components/ui/client';
import { Card, CardHeader, EmptyState, LinkButton, Notice, PageHeader, TabLinks } from '@/components/ui/core';
import { SCHOOL, gradeLabel } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { currentPeriod, formatDate, periodLabel, todayIST, weekday } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { isDay, isMonth } from '@/server/daily/shared';
import { UNIT_LABELS, WEEKDAY_LABELS, qtyText } from '@/server/office/labels';
import { loadMdmDay, mdmMonth } from '@/server/office/mdm';
import { officeSettings } from '@/server/office/shared';
import { requirePlan } from '@/server/platform';
import { FilterBar, readSearch, type Search } from '../_ui/bits';
import { MdmDayForm, MdmSettingsForm } from './mdm-forms';

export const metadata: Metadata = { title: 'Mid-day meal' };

type Tab = 'day' | 'month' | 'settings';

export default async function MdmPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const params = await readSearch(searchParams);
  const admin = isAdmin(session);
  const tab: Tab = params.tab === 'month' ? 'month' : params.tab === 'settings' && admin ? 'settings' : 'day';
  const today = todayIST();
  const day = isDay(params.day) && params.day <= today ? params.day : today;
  const month = isMonth(params.month) && params.month <= currentPeriod() ? params.month : currentPeriod();
  // The pickers read the URL, so the chosen default is put into it.
  if (tab === 'day' && params.day !== day) redirect(`/admin/mdm?day=${day}`);
  if (tab === 'month' && params.month !== month) redirect(`/admin/mdm?tab=month&month=${month}`);

  return (
    <>
      {tab === 'month' ? <PrintSetup landscape /> : null}
      <PageHeader
        title={t('Mid-day meal')}
        description={
          tab === 'day'
            ? t('Fill in once a day after the meal: who was present, who ate, and the rice and other stock used.')
            : tab === 'month'
              ? t('The register for the whole month, with the stock account, ready to print.')
              : t('The menu of each weekday, the classes that get the meal and the stock items.')
        }
        actions={tab === 'month' ? <PrintButton /> : undefined}
      />
      <TabLinks
        active={tab}
        tabs={[
          { key: 'day', label: t('Daily entry'), href: `/admin/mdm?day=${day}` },
          { key: 'month', label: t('Month register'), href: `/admin/mdm?tab=month&month=${day.slice(0, 7)}` },
          ...(admin ? [{ key: 'settings', label: t('Menu and stock items'), href: '/admin/mdm?tab=settings' }] : []),
        ]}
      />
      {tab === 'day' ? <DayTab day={day} session={session} /> : tab === 'month' ? <MonthTab month={month} session={session} lang={lang} /> : <SettingsTab />}
    </>
  );
}

async function DayTab({ day, session }: { day: string; session: Awaited<ReturnType<typeof requireSession>> }) {
  const t = await getT();
  const lang = await getLang();
  const data = await loadMdmDay(session, day);
  return (
    <>
      <FilterBar>
        <UrlDate param="day" label={t('Day')} max={todayIST()} />
        <span className="text-sm font-semibold text-ink-700">
          {t(WEEKDAY_LABELS[weekday(day)])}, {formatDate(day)}
        </span>
      </FilterBar>
      {data.closed ? (
        <Card>
          <EmptyState
            icon={<CalendarOff size={26} />}
            title={data.closed.reason === 'sunday' ? t('Sunday: no mid-day meal') : t('Holiday: {name}', { name: data.closed.title })}
            text={t('The register is not filled on a day the school is shut. Pick another day.')}
          />
        </Card>
      ) : !data.classes.length ? (
        <Card>
          <EmptyState
            icon={<UtensilsCrossed size={26} />}
            title={t('No class is set to get the mid-day meal')}
            text={t('The head of school chooses the classes under Menu and stock items.')}
          />
        </Card>
      ) : (
        <MdmDayForm
          key={`${day}-${data.saved}`}
          data={data}
          labels={Object.fromEntries(data.classes.map((row) => [row.grade, gradeLabel(row.grade, lang)]))}
        />
      )}
    </>
  );
}

async function MonthTab({ month, session, lang }: { month: string; session: Awaited<ReturnType<typeof requireSession>>; lang: 'en' | 'bn' | 'hi' }) {
  const t = await getT();
  const data = await mdmMonth(session, month);
  const short = (grade: number) => (lang === 'bn' ? gradeLabel(grade, 'bn').replace(' শ্রেণি', '') : String(grade));
  return (
    <>
      <FilterBar>
        <UrlDate param="month" type="month" label={t('Month')} max={currentPeriod()} />
      </FilterBar>
      <DailyPrintHead title={t('Mid-day meal register')} subtitle={periodLabel(month)} />
      {data.missing ? (
        <Notice tone="amber" className="no-print mb-4">
          {data.missing === 1 ? t('1 school day of this month is not filled yet.') : t('{n} school days of this month are not filled yet.', { n: data.missing })}
        </Notice>
      ) : null}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
        {[
          [t('School days'), data.schoolDays],
          [t('Days served'), data.daysServed],
          [t('Meals served'), data.meals],
          [t('Classes'), data.grades.length],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4 print:border-ink-300 print:p-2 print:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
            <p className="tabular mt-1 text-2xl font-bold text-ink-900 print:text-lg">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-4 print:border-0 print:shadow-none">
        <CardHeader title={t('Day by day')} className="print:hidden" />
        <div className="scrollbar-thin overflow-x-auto p-2 sm:p-4 print:p-0">
          <table className="w-full min-w-[640px] border-collapse text-xs tabular print:min-w-0 print:text-[9px]">
            <thead>
              <tr className="bg-ink-50">
                <th rowSpan={2} className="border border-ink-200 px-1.5 py-1 text-left">{t('Date')}</th>
                <th rowSpan={2} className="border border-ink-200 px-1.5 py-1 text-left">{t('Menu')}</th>
                {data.grades.map((grade) => (
                  <th key={grade} colSpan={2} className="border border-ink-200 px-1.5 py-1">
                    {short(grade)}
                  </th>
                ))}
                <th colSpan={2} className="border border-ink-200 px-1.5 py-1">{t('Total')}</th>
                <th rowSpan={2} className="border border-ink-200 px-1.5 py-1">{t('Cooks')}</th>
              </tr>
              <tr className="bg-ink-50">
                {[...data.grades, 0].map((grade) => (
                  <PresentAteHeads key={grade} present={t('Present')} ate={t('Ate')} />
                ))}
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <tr key={line.day} className={cn(line.shut && 'bg-ink-50 text-ink-400', !line.shut && !line.saved && 'bg-sun-50')}>
                  <td className="whitespace-nowrap border border-ink-200 px-1.5 py-1">{formatDate(line.day)}</td>
                  {line.shut ? (
                    <td colSpan={2 + data.grades.length * 2 + 2} className="border border-ink-200 px-1.5 py-1 text-center">
                      {line.shut === 'Sunday' ? t('Sunday') : line.shut}
                    </td>
                  ) : (
                    <>
                      <td className="border border-ink-200 px-1.5 py-1">{line.saved ? line.menu : <span className="text-sun-700">{t('Not filled')}</span>}</td>
                      {line.perGrade.map((cell, index) => (
                        <CellPair key={data.grades[index]} present={cell?.present} ate={cell?.ate} />
                      ))}
                      <CellPair present={line.saved ? line.totalPresent : undefined} ate={line.saved ? line.totalAte : undefined} strong />
                      <td className="border border-ink-200 px-1.5 py-1 text-center">{line.cooksPresent ?? ''}</td>
                    </>
                  )}
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={2} className="border border-ink-200 px-1.5 py-1">{t('Meals in the month')}</td>
                {data.classTotals.map((row) => (
                  <td key={row.grade} colSpan={2} className="border border-ink-200 px-1.5 py-1 text-center">
                    {row.meals}
                  </td>
                ))}
                <td colSpan={2} className="border border-ink-200 px-1.5 py-1 text-center">{data.meals}</td>
                <td className="border border-ink-200" />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
        <Card className="print:border-0 print:shadow-none">
          <CardHeader title={t('Class-wise summary')} />
          <div className="p-3 sm:p-4">
            <table className="w-full border-collapse text-sm tabular print:text-[10px]">
              <thead>
                <tr className="bg-ink-50 text-left text-xs text-ink-500">
                  <th className="border border-ink-200 px-2 py-1.5">{t('Class')}</th>
                  <th className="border border-ink-200 px-2 py-1.5 text-right">{t('Days served')}</th>
                  <th className="border border-ink-200 px-2 py-1.5 text-right">{t('Meals')}</th>
                </tr>
              </thead>
              <tbody>
                {data.classTotals.map((row) => (
                  <tr key={row.grade}>
                    <td className="border border-ink-200 px-2 py-1.5">{gradeLabel(row.grade, lang)}</td>
                    <td className="border border-ink-200 px-2 py-1.5 text-right">{row.daysServed}</td>
                    <td className="border border-ink-200 px-2 py-1.5 text-right">{row.meals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="print:border-0 print:shadow-none">
          <CardHeader title={t('Stock account')} />
          <div className="p-3 sm:p-4">
            <table className="w-full border-collapse text-sm tabular print:text-[10px]">
              <thead>
                <tr className="bg-ink-50 text-left text-xs text-ink-500">
                  <th className="border border-ink-200 px-2 py-1.5">{t('Item')}</th>
                  <th className="border border-ink-200 px-2 py-1.5 text-right">{t('Opening')}</th>
                  <th className="border border-ink-200 px-2 py-1.5 text-right">{t('Received')}</th>
                  <th className="border border-ink-200 px-2 py-1.5 text-right">{t('Used')}</th>
                  <th className="border border-ink-200 px-2 py-1.5 text-right">{t('Closing')}</th>
                </tr>
              </thead>
              <tbody>
                {data.stock.map((row) => (
                  <tr key={row.item}>
                    <td className="border border-ink-200 px-2 py-1.5">
                      {row.item} <span className="text-xs text-ink-500">({t(UNIT_LABELS[row.unit] ?? row.unit)})</span>
                    </td>
                    <td className="border border-ink-200 px-2 py-1.5 text-right">{qtyText(row.opening)}</td>
                    <td className="border border-ink-200 px-2 py-1.5 text-right">{qtyText(row.received)}</td>
                    <td className="border border-ink-200 px-2 py-1.5 text-right">{qtyText(row.used)}</td>
                    <td className={cn('border border-ink-200 px-2 py-1.5 text-right font-semibold', row.closing < 0 && 'text-accent-600')}>{qtyText(row.closing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div className="mt-10 hidden justify-between text-xs text-ink-800 print:flex">
        <span className="border-t border-ink-500 px-6 pt-1">{t('Teacher in charge of mid-day meal')}</span>
        <span className="border-t border-ink-500 px-6 pt-1">{t('Head of the institution')}</span>
      </div>
      <div className="no-print mt-4 flex justify-end">
        <LinkButton variant="secondary" href={`/admin/exports/download?kind=mdm&month=${month}`} prefetch={false}>
          {t('Download for Excel')}
        </LinkButton>
      </div>
    </>
  );
}

function PresentAteHeads({ present, ate }: { present: string; ate: string }) {
  return (
    <>
      <th className="border border-ink-200 px-1 py-0.5 text-[10px] font-semibold">{present}</th>
      <th className="border border-ink-200 px-1 py-0.5 text-[10px] font-semibold">{ate}</th>
    </>
  );
}

function CellPair({ present, ate, strong }: { present?: number; ate?: number; strong?: boolean }) {
  return (
    <>
      <td className={cn('border border-ink-200 px-1 py-1 text-center', strong && 'font-semibold')}>{present ?? ''}</td>
      <td className={cn('border border-ink-200 px-1 py-1 text-center', strong && 'font-semibold')}>{ate ?? ''}</td>
    </>
  );
}

async function SettingsTab() {
  const lang = await getLang();
  const settings = await officeSettings();
  return (
    <MdmSettingsForm
      initial={settings}
      grades={SCHOOL.grades.map((grade) => ({ grade, label: gradeLabel(grade, lang) }))}
    />
  );
}
