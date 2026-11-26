import { FileCheck2, PencilLine, Table2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, EmptyState, LinkButton, Meter, PageHeader, StatusBadge } from '@/components/ui/core';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { EXAM_STATUS_LABELS } from '@/server/exams/constants';
import { getGradeScale, listExams } from '@/server/exams/service';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { gradeRange } from './_parts/labels';
import { ExamFormButton, GradeScaleButton } from './exam-tools';

export const metadata: Metadata = { title: 'Exams and results' };

export default async function ExamsPage() {
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const t = await getT();
  const lang = await getLang();
  const office = isOffice(session);
  const [{ year, exams }, scale] = await Promise.all([listExams(session), getGradeScale()]);
  const nextSort = exams.reduce((max, exam) => Math.max(max, exam.sort), 0) + 1;

  return (
    <>
      <PageHeader
        title={t('Exams and results')}
        description={
          office
            ? t('Set up each exam of {year}, open it for marks, then publish the results for parents.', { year: year.name })
            : t('Enter marks for the subjects you teach while an exam is open.')
        }
        actions={
          office ? (
            <>
              {isAdmin(session) ? <GradeScaleButton scale={scale} /> : null}
              <ExamFormButton nextSort={nextSort} />
            </>
          ) : (
            <LinkButton href="/admin/exams/marks">
              <PencilLine size={16} /> {t('Enter marks')}
            </LinkButton>
          )
        }
      />

      {exams.length ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {office ? (
                    <Link href={`/admin/exams/${exam.id}`} className="font-display text-lg font-bold text-ink-900 hover:text-brand-700">
                      {exam.name}
                    </Link>
                  ) : (
                    <p className="font-display text-lg font-bold text-ink-900">{exam.name}</p>
                  )}
                  <p className="text-sm text-ink-500">
                    {gradeRange(exam.fromGrade, exam.toGrade, lang, t('to'))}
                    {exam.startsOn ? ` · ${formatDate(exam.startsOn)}${exam.endsOn && exam.endsOn !== exam.startsOn ? ` – ${formatDate(exam.endsOn)}` : ''}` : ''}
                  </p>
                </div>
                <StatusBadge status={exam.status} label={t(EXAM_STATUS_LABELS[exam.status])} />
              </div>
              {office ? (
                <p className="mt-3 text-sm text-ink-600">{exam.papers ? t('{n} papers', { n: exam.papers }) : t('No papers yet')}</p>
              ) : null}
              {exam.progress && exam.progress.total ? (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-sm text-ink-600">
                    <span>{t('Marks entered')}</span>
                    <span className="tabular font-semibold">
                      {exam.progress.done}/{exam.progress.total}
                    </span>
                  </div>
                  <Meter value={exam.progress.done} max={exam.progress.total} tone={exam.progress.done === exam.progress.total ? 'green' : 'amber'} />
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2 pt-1">
                {exam.status === 'open' ? (
                  <LinkButton href={`/admin/exams/marks?exam=${exam.id}`} size="sm">
                    <PencilLine size={15} /> {t('Enter marks')}
                  </LinkButton>
                ) : null}
                {exam.status !== 'draft' ? (
                  <LinkButton href={`/admin/exams/results?exam=${exam.id}`} size="sm" variant="secondary">
                    <Table2 size={15} /> {t('Results')}
                  </LinkButton>
                ) : null}
                {office ? (
                  <LinkButton href={`/admin/exams/${exam.id}`} size="sm" variant="ghost">
                    {t('Papers and progress')}
                  </LinkButton>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<FileCheck2 size={26} />}
            title={office ? t('No exams for {year} yet', { year: year.name }) : t('No exam is open for marks')}
            text={office ? t('Add the first exam of the year, such as the First Summative. Then set up its papers and open it for marks.') : t('When the office opens an exam, your papers show here.')}
            action={office ? <ExamFormButton nextSort={1} /> : undefined}
          />
        </Card>
      )}

      {office || exams.some((exam) => exam.status === 'published') ? (
        <p className="mt-6 text-sm text-ink-500">
          <Link href="/admin/exams/report-cards" className="font-semibold text-brand-700 hover:underline">
            {t('Report cards')}
          </Link>{' '}
          · {t('Every published exam of the year side by side, one page for each boy.')}
        </p>
      ) : null}
    </>
  );
}
