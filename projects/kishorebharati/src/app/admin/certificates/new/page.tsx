import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardBody, CardHeader, Notice, PageHeader } from '@/components/ui/core';
import { sectionLabel } from '@/config/school';
import { CERTIFICATE_KINDS, type CertificateKind } from '@/db/schema';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { inr } from '@/lib/money';
import { getT } from '@/lib/t';
import { certificateDraft } from '@/server/certificates/service';
import { requirePlan } from '@/server/platform';
import { CERTIFICATE_LABELS, STUDENT_STATUS_LABELS } from '@/server/students/constants';
import { readSearch, type Search } from '../../_ui/bits';
import { IssueForm, PickStudent } from './issue-form';

export const metadata: Metadata = { title: 'Issue certificate' };

export default async function NewCertificatePage({ searchParams }: { searchParams: Search }) {
  const t = await getT();
  const lang = await getLang();
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const params = await readSearch(searchParams);
  const kind: CertificateKind = (CERTIFICATE_KINDS as readonly string[]).includes(params.kind) ? (params.kind as CertificateKind) : 'tc';
  const draft = params.student ? await certificateDraft(session, params.student) : null;

  return (
    <>
      <PageHeader title={t('Issue certificate')} back={{ href: '/admin/certificates', label: t('Certificates') }} />
      {!draft ? (
        <Card className="mx-auto max-w-2xl">
          <CardHeader title={t('Whose certificate?')} description={t('Find the student by name, admission number or mobile.')} />
          <CardBody>
            <PickStudent kind={kind} />
          </CardBody>
        </Card>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/admin/students/${draft.student.id}`} className="text-lg font-bold text-ink-900 hover:text-brand-700">
                  {draft.student.name}
                </Link>
                <p className="text-sm text-ink-500">
                  {[
                    draft.student.admissionNo,
                    draft.latest ? `${sectionLabel({ grade: draft.latest.grade, name: draft.latest.sectionName, stream: draft.latest.stream, shift: draft.latest.shift }, lang)} (${draft.latest.yearName})` : '',
                    t(STUDENT_STATUS_LABELS[draft.student.status]),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <Link href={`/admin/certificates/new?kind=${kind}`} className="text-sm font-semibold text-brand-700 hover:underline">
                {t('Another student')}
              </Link>
            </CardBody>
          </Card>
          {draft.dues > 0 ? <Notice tone="amber">{t('Fees of {amount} are still unpaid.', { amount: inr(draft.dues) })}</Notice> : null}
          {draft.issued.length ? (
            <Notice tone="blue">
              {t('Already issued')}:{' '}
              {draft.issued.map((c, i) => (
                <span key={c.id}>
                  {i ? ', ' : ''}
                  <Link href={`/admin/certificates/${c.id}`} className="font-semibold underline">
                    {t(CERTIFICATE_LABELS[c.kind])} {c.serialNo}
                  </Link>{' '}
                  ({formatDate(c.issuedOn)})
                </span>
              ))}
            </Notice>
          ) : null}
          <IssueForm
            studentId={draft.student.id}
            initialKind={kind}
            today={draft.today}
            onRoll={draft.student.status === 'active'}
            dues={draft.dues}
            latestGrade={draft.latest?.grade ?? null}
          />
        </div>
      )}
    </>
  );
}
