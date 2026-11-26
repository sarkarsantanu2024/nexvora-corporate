import { FileDown, Sheet, UtensilsCrossed, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { DailyPrintHead, PrintSetup } from '@/components/school/daily-print-head';
import { PrintButton, UrlDate, UrlSelect } from '@/components/ui/client';
import { Card, CardHeader, PageHeader, buttonClass } from '@/components/ui/core';
import { SCHOOL, gradeLabel } from '@/config/school';
import { CATEGORIES } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { currentPeriod, periodLabel } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { isMonth } from '@/server/daily/shared';
import { PORTAL_COLUMNS, enrolmentStatement } from '@/server/office/exports';
import { requirePlan } from '@/server/platform';
import { query, readSearch, type Search } from '../_ui/bits';

export const metadata: Metadata = { title: 'Exports' };

function Download({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className={buttonClass('primary', 'md')}>
      <FileDown size={18} /> {label}
    </a>
  );
}

function Box({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children: ReactNode }) {
  return (
    <Card className="no-print flex flex-col">
      <CardHeader title={<span className="inline-flex items-center gap-2">{icon} {title}</span>} description={text} />
      <div className="mt-auto flex flex-wrap items-center gap-2 p-5">{children}</div>
    </Card>
  );
}

export default async function ExportsPage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const params = await readSearch(searchParams);
  const grade = SCHOOL.grades.includes(Number(params.grade)) ? params.grade : '';
  const month = isMonth(params.month) && params.month <= currentPeriod() ? params.month : currentPeriod();
  // The month picker reads the address, so the month is put into it.
  if (params.month !== month) redirect(`/admin/exports${query({ grade, month })}`);
  const statement = await enrolmentStatement(session);

  return (
    <>
      <PrintSetup landscape />
      <PageHeader title={t('Exports')} description={t('Spreadsheets for Banglar Shiksha, UDISE+ and the mid-day meal returns. They open in Excel.')} actions={<PrintButton label={t('Print the enrolment statement')} />} />
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Box icon={<Users size={18} />} title={t('Student list for the portals')} text={t('Every student on the roll, in the column order of Banglar Shiksha and UDISE+: {columns}.', { columns: PORTAL_COLUMNS.slice(0, 4).join(', ') + ' …' })}>
          <UrlSelect param="grade" label={t('Class')} options={[{ value: '', label: t('All classes') }, ...SCHOOL.grades.map((g) => ({ value: String(g), label: gradeLabel(g, lang) }))]} />
          <Download href={`/admin/exports/download${query({ kind: 'students', grade })}`} label={t('Download')} />
        </Box>
        <Box icon={<Sheet size={18} />} title={t('Enrolment statement')} text={t('Boys and girls of each social category in each class, with the totals. Shown below, ready to print.')}>
          <Download href="/admin/exports/download?kind=enrolment" label={t('Download')} />
        </Box>
        <Box icon={<UtensilsCrossed size={18} />} title={t('Mid-day meal figures')} text={t('A line a day with the meals of each class, then the stock account of the month.')}>
          <UrlDate param="month" type="month" label={t('Month')} max={currentPeriod()} />
          <Download href={`/admin/exports/download${query({ kind: 'mdm', month })}`} label={t('Download {month}', { month: periodLabel(month) })} />
        </Box>
      </div>

      <DailyPrintHead title={t('Enrolment statement')} subtitle={t('School year {year}', { year: statement.year })} />
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:hidden" title={t('Enrolment statement')} description={t('School year {year}', { year: statement.year })} />
        <div className="scrollbar-thin overflow-x-auto p-2 sm:p-4 print:p-0">
          <table className="w-full min-w-[720px] border-collapse text-sm tabular print:min-w-0 print:text-[10px]">
            <thead>
              <tr className="bg-ink-50">
                <th rowSpan={2} className="border border-ink-200 px-2 py-1.5 text-left">{t('Class')}</th>
                {CATEGORIES.map((c) => (
                  <th key={c} colSpan={2} className="border border-ink-200 px-2 py-1.5">
                    {c}
                  </th>
                ))}
                <th colSpan={3} className="border border-ink-200 px-2 py-1.5">{t('Total')}</th>
              </tr>
              <tr className="bg-ink-50 text-xs">
                {CATEGORIES.map((c) => (
                  <BoysGirls key={c} boys={t('Boys')} girls={t('Girls')} />
                ))}
                <BoysGirls boys={t('Boys')} girls={t('Girls')} />
                <th className="border border-ink-200 px-2 py-1">{t('All')}</th>
              </tr>
            </thead>
            <tbody>
              {[...statement.lines, statement.totals].map((line) => (
                <tr key={line.grade} className={line.grade === 0 ? 'bg-ink-50 font-bold' : ''}>
                  <td className="whitespace-nowrap border border-ink-200 px-2 py-1.5">{line.grade === 0 ? t('Total') : gradeLabel(line.grade, lang)}</td>
                  {CATEGORIES.map((c) => (
                    <Pair key={c} a={line.cells[c].boys} b={line.cells[c].girls} />
                  ))}
                  <Pair a={line.boys} b={line.girls} />
                  <td className="border border-ink-200 px-2 py-1.5 text-center font-semibold">{line.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-10 hidden justify-end text-xs text-ink-800 print:flex">
        <span className="border-t border-ink-500 px-6 pt-1">{t('Head of the institution')}</span>
      </div>
    </>
  );
}

function BoysGirls({ boys, girls }: { boys: string; girls: string }) {
  return (
    <>
      <th className="border border-ink-200 px-2 py-1 font-semibold">{boys}</th>
      <th className="border border-ink-200 px-2 py-1 font-semibold">{girls}</th>
    </>
  );
}

function Pair({ a, b }: { a: number; b: number }) {
  return (
    <>
      <td className="border border-ink-200 px-2 py-1.5 text-center">{a}</td>
      <td className="border border-ink-200 px-2 py-1.5 text-center">{b}</td>
    </>
  );
}
