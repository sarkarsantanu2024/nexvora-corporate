import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { SchoolLetterhead } from '@/components/school/letterhead';
import { PrintButton } from '@/components/ui/client';
import { Card, Notice, PageHeader } from '@/components/ui/core';
import { gradeLabel, sectionLabel } from '@/config/school';
import type { Shift, Stream } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate, formatDateTime } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { getCertificate } from '@/server/certificates/service';
import { requirePlan } from '@/server/platform';
import { CERTIFICATE_LABELS } from '@/server/students/constants';
import { VoidCertificate } from './void-certificate';

export const metadata: Metadata = { title: 'Certificate' };

/** What was printed, as stored at issue (see issueCertificate). */
type Printed = {
  name: string;
  nameBn: string;
  fatherName: string;
  motherName: string;
  admissionNo: string;
  portalId: string;
  category: string;
  dob: string;
  dobWords: string;
  admittedOn: string;
  admittedGrade: number | null;
  grade: number | null;
  sectionName: string;
  stream: Stream;
  shift: Shift;
  rollNo: number | null;
  yearName: string;
  remarks: string;
  leftOn?: string;
  reason?: string;
  promoted?: 'yes' | 'no' | 'na';
  promotedTo?: string;
  duesCleared?: boolean;
  conduct?: string;
  fromOn?: string;
  toOn?: string;
  purpose?: string;
};

function Line({ n, label, children }: { n: number; label: string; children: ReactNode }) {
  return (
    <tr className="align-top">
      <td className="w-8 py-1.5 pr-2 tabular text-ink-600">{n}.</td>
      <td className="w-[45%] py-1.5 pr-3 text-ink-700">{label}</td>
      <td className="border-b border-dotted border-ink-400 py-1.5 font-semibold text-ink-900">{children}</td>
    </tr>
  );
}

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const { id } = await params;
  const found = await getCertificate(session, id);
  if (!found) notFound();
  const { certificate } = found;
  const p = certificate.data as Printed;
  const className = p.grade !== null ? sectionLabel({ grade: p.grade, name: p.sectionName, stream: p.stream, shift: p.shift }, lang) : '';
  const date = (value?: string) => (value ? formatDate(value) : '');
  const signature = (label: string) => (
    <div className="text-center">
      <div className="mx-auto h-12 w-40 border-b border-ink-500" />
      <p className="mt-1 text-sm text-ink-700">{label}</p>
    </div>
  );
  const sentenceValues = { name: p.name, father: p.fatherName || p.motherName, class: className, roll: p.rollNo ?? '', year: p.yearName, dob: date(p.dob), from: date(p.fromOn || p.admittedOn), to: p.toOn ? date(p.toOn) : t('this day'), conduct: p.conduct ?? '' };

  return (
    <>
      <style>{`@media print { .page-header { display: none !important; } .dash-app { padding-left: 0 !important; } main { padding: 0 !important; max-width: none !important; } }`}</style>
      <PageHeader
        title={`${t(CERTIFICATE_LABELS[certificate.kind])} ${certificate.serialNo}`}
        back={{ href: '/admin/certificates', label: t('Certificates') }}
        actions={
          <>
            {isAdmin(session) && !certificate.voidedAt ? <VoidCertificate id={certificate.id} serialNo={certificate.serialNo} /> : null}
            <PrintButton />
          </>
        }
      />
      {certificate.voidedAt ? (
        <Notice tone="red" className="no-print mb-4">
          {t('Void since {when}: {reason}', { when: formatDateTime(certificate.voidedAt), reason: certificate.voidReason })}
        </Notice>
      ) : null}

      <Card className="print-plain relative mx-auto max-w-[210mm] p-6 sm:p-10">
        {certificate.voidedAt ? (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-[64px] font-black uppercase tracking-widest text-accent-500/20" aria-hidden>
            {t('Void')}
          </p>
        ) : null}
        <SchoolLetterhead />
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm text-ink-700">
          <span>
            {t('Serial number')}: <span className="tabular font-semibold text-ink-900">{certificate.serialNo}</span>
          </span>
          <span>
            {t('Date')}: <span className="tabular font-semibold text-ink-900">{formatDate(certificate.issuedOn)}</span>
          </span>
        </div>
        <h2 className="mt-5 text-center font-display text-xl font-bold uppercase tracking-wide text-ink-900 underline underline-offset-4">{t(CERTIFICATE_LABELS[certificate.kind])}</h2>

        {certificate.kind === 'tc' ? (
          <table className="mt-6 w-full text-[14px]">
            <tbody>
              <Line n={1} label={t('Name of the student')}>
                {p.name}
                {p.nameBn ? ` (${p.nameBn})` : ''}
              </Line>
              <Line n={2} label={t("Father's name")}>{p.fatherName}</Line>
              <Line n={3} label={t("Mother's name")}>{p.motherName}</Line>
              <Line n={4} label={t('Date of birth (in figures)')}>{date(p.dob)}</Line>
              <Line n={5} label={t('Date of birth (in words)')}>{p.dobWords}</Line>
              <Line n={6} label={t('Admission number')}>{p.admissionNo}</Line>
              <Line n={7} label={t('Banglar Shiksha ID')}>{p.portalId}</Line>
              <Line n={8} label={t('Category')}>{p.category}</Line>
              <Line n={9} label={t('Date of admission and class')}>
                {[date(p.admittedOn), p.admittedGrade !== null ? gradeLabel(p.admittedGrade, lang) : ''].filter(Boolean).join(', ')}
              </Line>
              <Line n={10} label={t('Class last studied')}>
                {[className, p.yearName].filter(Boolean).join(', ')}
              </Line>
              <Line n={11} label={t('Whether promoted to a higher class')}>
                {p.promoted === 'yes' ? `${t('Yes')}${p.promotedTo ? `, ${p.promotedTo}` : ''}` : p.promoted === 'no' ? t('No') : t('Not applicable')}
              </Line>
              <Line n={12} label={t('Whether all dues are cleared')}>{p.duesCleared ? t('Yes') : t('No')}</Line>
              <Line n={13} label={t('Conduct and character')}>{p.conduct}</Line>
              <Line n={14} label={t('Date of leaving')}>{date(p.leftOn)}</Line>
              <Line n={15} label={t('Reason for leaving')}>{p.reason}</Line>
              <Line n={16} label={t('Remarks')}>{p.remarks}</Line>
            </tbody>
          </table>
        ) : (
          <div className="mt-8 space-y-4 text-[16px] leading-8 text-ink-900">
            {certificate.kind === 'character' ? (
              <p>{t('This is to certify that {name}, son of {father}, was a student of this school from {from} to {to}. As far as is known to me, he bears a good moral character. His conduct was {conduct}.', sentenceValues)}</p>
            ) : (
              <>
                <p>{t('This is to certify that {name}, son of {father}, is a bonafide student of this school, reading in {class}, roll number {roll}, in the school year {year}.', sentenceValues)}</p>
                {p.dob ? <p>{t('His date of birth as per the admission register is {dob}.', sentenceValues)}</p> : null}
                {p.purpose ? <p>{t('This certificate is issued for {purpose}.', { purpose: p.purpose })}</p> : null}
              </>
            )}
            <p className="text-sm text-ink-700">
              {t('Admission number')}: <span className="tabular">{p.admissionNo}</span>
              {p.dobWords && certificate.kind === 'character' ? ` · ${t('Date of birth')}: ${date(p.dob)}` : ''}
            </p>
            {p.remarks ? <p className="text-sm">{p.remarks}</p> : null}
            <p>{t('I wish him every success in life.')}</p>
          </div>
        )}

        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3">
          {certificate.kind === 'tc' ? signature(t('Prepared by')) : <span />}
          {certificate.kind === 'tc' ? signature(t('Checked by')) : <span className="max-sm:hidden" />}
          {signature(t('Headmaster'))}
        </div>
      </Card>
    </>
  );
}
