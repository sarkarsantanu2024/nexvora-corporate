import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrintSetup } from '@/components/school/daily-print-head';
import { SchoolLetterhead } from '@/components/school/letterhead';
import { PrintButton } from '@/components/ui/client';
import { Card, PageHeader } from '@/components/ui/core';
import { SCHOOL, gradeLabel } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { MEETING_KIND_LABELS, timeText } from '@/server/office/labels';
import { getMeeting } from '@/server/office/meetings';
import { requirePlan } from '@/server/platform';
import { DeleteMeeting, MeetingFormButton } from '../meeting-tools';

export const metadata: Metadata = { title: 'Meeting' };

/** The minutes, on the school letterhead, ready to print and sign. */
export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const lang = await getLang();
  const { id } = await params;
  const row = await getMeeting(session, id);
  if (!row) notFound();
  const kind = t(MEETING_KIND_LABELS[row.kind]);
  const when = [formatDate(row.day), row.time ? timeText(row.time) : '', row.venue].filter(Boolean).join(', ');

  const block = (label: string, text: string) =>
    text ? (
      <section className="mt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">{label}</h2>
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-900">{text}</p>
      </section>
    ) : null;

  return (
    <>
      <PrintSetup />
      <PageHeader
        title={row.title || kind}
        back={{ href: '/admin/meetings', label: t('Meetings') }}
        actions={
          <>
            <PrintButton />
            <MeetingFormButton meeting={row} grades={SCHOOL.grades.map((grade) => ({ grade, label: gradeLabel(grade, lang) }))} />
            {isAdmin(session) ? <DeleteMeeting id={row.id} /> : null}
          </>
        }
      />
      <Card className="print-plain mx-auto max-w-3xl p-5 sm:p-8">
        <SchoolLetterhead />
        <h1 className="mt-5 text-center text-xl font-bold text-ink-900">{t('Minutes of the meeting')}</h1>
        <p className="text-center text-sm text-ink-700">
          {kind}
          {row.grade !== null ? `, ${gradeLabel(row.grade, lang)}` : ''}
        </p>
        {row.title ? <p className="mt-1 text-center font-semibold text-ink-900">{row.title}</p> : null}
        <p className="tabular mt-1 text-center text-sm text-ink-600">{when}</p>
        {block(t('Present'), row.attendees)}
        {block(t('Agenda'), row.agenda)}
        {block(t('Resolutions and minutes'), row.minutes)}
        {!row.minutes ? <p className="no-print mt-5 text-sm text-sun-700">{t('The minutes are not written yet. Use Edit to add them after the meeting.')}</p> : null}
        {row.attachment ? (
          <section className="mt-5 break-inside-avoid">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">{t('Photo of the signed minutes')}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.attachment} alt="" className="mt-2 max-h-[480px] rounded-xl border border-ink-200 object-contain" />
          </section>
        ) : null}
        <div className="mt-16 flex justify-between gap-6 text-xs text-ink-800">
          <span className="border-t border-ink-500 px-6 pt-1">{t('Secretary')}</span>
          <span className="border-t border-ink-500 px-6 pt-1">{t('President')}</span>
        </div>
      </Card>
    </>
  );
}
