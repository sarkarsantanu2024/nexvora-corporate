import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SchoolLetterhead } from '@/components/school/letterhead';
import { PrintSetup } from '@/components/school/daily-print-head';
import { PrintButton } from '@/components/ui/client';
import { Card, PageHeader } from '@/components/ui/core';
import { sectionLabel } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { timeText } from '@/server/office/labels';
import { getGatePass } from '@/server/office/visitors';
import { requirePlan } from '@/server/platform';

export const metadata: Metadata = { title: 'Gate pass' };

/** The slip: two copies on one sheet, one for the gate and one kept in the office. */
export default async function GatePassSlip({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const { id } = await params;
  const row = await getGatePass(session, id);
  if (!row) notFound();
  const pass = row.pass;
  const klass = row.grade !== null ? sectionLabel({ grade: row.grade, name: row.sectionName ?? '', stream: row.stream ?? '', shift: row.shift ?? 'day' }, lang) : '';

  const copy = async (label: string) => (
    <Card className="print-plain break-inside-avoid p-5 print:border print:border-ink-400 print:p-4">
      <SchoolLetterhead compact />
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-ink-900">{t('Gate pass')}</h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</span>
      </div>
      <dl className="mt-2 grid grid-cols-[8.5rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-ink-500">{t('Pass number')}</dt>
        <dd className="tabular font-semibold text-ink-900">{pass.serialNo}</dd>
        <dt className="text-ink-500">{t('Date and time')}</dt>
        <dd className="tabular text-ink-900">
          {formatDate(pass.day)}, {timeText(pass.time)}
        </dd>
        <dt className="text-ink-500">{t('Student')}</dt>
        <dd className="font-semibold text-ink-900">{row.studentName}</dd>
        <dt className="text-ink-500">{t('Class')}</dt>
        <dd className="text-ink-900">
          {klass}
          {row.rollNo ? `, ${t('Roll {n}', { n: row.rollNo })}` : ''}
        </dd>
        <dt className="text-ink-500">{t('Taken by')}</dt>
        <dd className="text-ink-900">{[pass.guardianName, pass.guardianRelation].filter(Boolean).join(', ')}</dd>
        {pass.guardianPhone ? (
          <>
            <dt className="text-ink-500">{t('Mobile')}</dt>
            <dd className="tabular text-ink-900">{pass.guardianPhone}</dd>
          </>
        ) : null}
        <dt className="text-ink-500">{t('Reason')}</dt>
        <dd className="text-ink-900">{pass.reason}</dd>
        <dt className="text-ink-500">{t('Allowed by')}</dt>
        <dd className="text-ink-900">{pass.approvedBy}</dd>
      </dl>
      <div className="mt-10 flex justify-between gap-4 text-xs text-ink-700">
        <span className="border-t border-ink-500 px-3 pt-1">{t('Guardian')}</span>
        <span className="border-t border-ink-500 px-3 pt-1">{t('Head of the institution')}</span>
      </div>
    </Card>
  );

  return (
    <>
      <PrintSetup />
      <PageHeader title={t('Gate pass')} back={{ href: '/admin/visitors?tab=passes', label: t('Gate passes') }} actions={<PrintButton />} />
      <div className="mx-auto grid max-w-3xl gap-4 print:max-w-none print:gap-6">
        {await copy(t('For the gate'))}
        <div className="hidden border-t border-dashed border-ink-400 print:block" />
        {await copy(t('Office copy'))}
      </div>
    </>
  );
}
