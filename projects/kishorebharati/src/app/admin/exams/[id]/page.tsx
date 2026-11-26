import { ListPlus, Table2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Card, CardHeader, EmptyState, LinkButton, Meter, Notice, PageHeader, StatusBadge, TabLinks, Table, Td, Th, Tr } from '@/components/ui/core';
import { gradeLabel, hasStreams, sectionLabel, SCHOOL } from '@/config/school';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { isAdmin } from '@/server/admin/shared';
import { EXAM_STATUS_LABELS } from '@/server/exams/constants';
import { getExam, getProgress } from '@/server/exams/service';
import { requirePlan } from '@/server/platform';
import { readSearch, type Search } from '../../_ui/bits';
import { gradeRange, subjectName } from '../_parts/labels';
import { DeleteExam, ExamFormButton, PaperEditButton, SetupPapersButton, StatusActions } from '../exam-tools';

export const metadata: Metadata = { title: 'Exam' };

export default async function ExamPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  const session = await requireSession(TEAM_ROLES);
  await requirePlan('platinum');
  const t = await getT();
  const lang = await getLang();
  const { id } = await params;
  const query = await readSearch(searchParams);
  const data = await getExam(session, id).catch(() => null);
  if (!data) notFound();
  const { exam, papers, sections } = data;
  const progress = exam.status === 'draft' ? null : await getProgress(session, exam.id);
  const short = progress ? progress.sections.flatMap((row) => row.cells).filter((cell) => !cell.complete).length : 0;
  const tab = query.tab === 'papers' || !progress ? 'papers' : 'progress';
  const locked = exam.status === 'published';
  const grades = SCHOOL.grades.filter((grade) => grade >= exam.fromGrade && grade <= exam.toGrade);

  return (
    <>
      <PageHeader
        back={{ href: '/admin/exams', label: t('Exams and results') }}
        title={exam.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={exam.status} label={t(EXAM_STATUS_LABELS[exam.status])} />
            <span>
              {gradeRange(exam.fromGrade, exam.toGrade, lang, t('to'))}
              {exam.startsOn ? ` · ${formatDate(exam.startsOn)}${exam.endsOn && exam.endsOn !== exam.startsOn ? ` – ${formatDate(exam.endsOn)}` : ''}` : ''}
            </span>
          </span>
        }
        actions={
          <>
            <StatusActions id={exam.id} name={exam.name} status={exam.status} isAdmin={isAdmin(session)} short={short} />
            {!locked ? <ExamFormButton exam={exam} /> : null}
            {isAdmin(session) && exam.status === 'draft' ? <DeleteExam id={exam.id} name={exam.name} /> : null}
          </>
        }
      />

      {locked ? <Notice tone="green" className="mb-4">{t('Results are published. Parents can see them and marks are locked.')}</Notice> : null}
      {exam.status === 'draft' && papers.length ? <Notice className="mb-4">{t('Check the papers below, then open the exam so teachers can enter marks.')}</Notice> : null}

      {progress ? (
        <TabLinks
          active={tab}
          tabs={[
            { key: 'progress', href: `/admin/exams/${exam.id}`, label: t('Marks entered'), count: short || undefined },
            { key: 'papers', href: `/admin/exams/${exam.id}?tab=papers`, label: t('Papers'), count: papers.length },
          ]}
        />
      ) : null}

      {tab === 'progress' && progress ? (
        progress.sections.length ? (
          <div className="grid gap-4 2xl:grid-cols-2">
            {progress.sections.map(({ section, cells }) => {
              const done = cells.filter((cell) => cell.complete).length;
              return (
                <Card key={section.id}>
                  <CardHeader
                    title={sectionLabel(section, lang)}
                    description={t('{done} of {total} papers complete', { done, total: cells.length })}
                    action={
                      <LinkButton href={`/admin/exams/results?exam=${exam.id}&section=${section.id}`} size="sm" variant="secondary">
                        <Table2 size={15} /> {t('Results')}
                      </LinkButton>
                    }
                  />
                  <div className="p-2 sm:p-3">
                    <Table>
                      <thead>
                        <tr>
                          <Th>{t('Subject')}</Th>
                          <Th>{t('Entered')}</Th>
                          <Th>{t('Teacher')}</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {cells.map((cell) => (
                          <Tr key={cell.paperId}>
                            <Td className="font-medium">
                              {exam.status === 'open' ? (
                                <Link href={`/admin/exams/marks?exam=${exam.id}&section=${section.id}&paper=${cell.paperId}`} className="hover:text-brand-700">
                                  {subjectName(cell.paper, lang)}
                                </Link>
                              ) : (
                                subjectName(cell.paper, lang)
                              )}
                            </Td>
                            <Td>
                              <div className="flex min-w-[8rem] items-center gap-2">
                                <Meter value={cell.entered} max={cell.total} tone={cell.complete ? 'green' : cell.entered ? 'amber' : 'red'} className="flex-1" />
                                <span className="tabular text-sm">
                                  {cell.entered}/{cell.total}
                                </span>
                              </div>
                            </Td>
                            <Td className={cell.complete ? 'text-ink-500' : 'font-medium text-accent-700'}>
                              {cell.teacher || <span className="text-ink-400">{t('No teacher set')}</span>}
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <EmptyState title={t('No students in these classes yet')} text={t('Add students to the sections of these classes, then their marks can be entered.')} />
          </Card>
        )
      ) : papers.length ? (
        <>
          {!locked ? (
            <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-500">{t('Each paper has its own full and pass marks. One total per paper.')}</p>
              <SetupPapersButton id={exam.id} hasHs={grades.some(hasStreams)} primary={false} />
            </div>
          ) : null}
          <div className="grid gap-4 2xl:grid-cols-2">
            {grades.map((grade) => {
              const own = papers.filter((paper) => paper.grade === grade);
              const sectionCount = sections.filter((row) => row.grade === grade).length;
              return (
                <Card key={grade}>
                  <CardHeader title={gradeLabel(grade, lang)} description={t('{n} sections', { n: sectionCount })} />
                  <div className="p-2 sm:p-3">
                    {own.length ? (
                      <Table>
                        <thead>
                          <tr>
                            <Th>{t('Subject')}</Th>
                            <Th>{t('Full marks')}</Th>
                            <Th>{t('Pass marks')}</Th>
                            <Th>{t('Date')}</Th>
                            <Th />
                          </tr>
                        </thead>
                        <tbody>
                          {own.map((paper) => (
                            <Tr key={paper.id}>
                              <Td className="font-medium">
                                {subjectName(paper, lang)}{' '}
                                {paper.subjectStream ? <Badge tone="blue">{t(paper.subjectStream === 'science' ? 'Science' : 'Arts')}</Badge> : null}{' '}
                                {paper.subjectOptional ? <Badge>{t('Optional')}</Badge> : null}
                              </Td>
                              <Td className="tabular">{paper.fullMarks}</Td>
                              <Td className="tabular">{paper.passMarks}</Td>
                              <Td className="whitespace-nowrap">{paper.examDate ? formatDate(paper.examDate) : '–'}</Td>
                              <Td className="text-right">
                                <PaperEditButton paper={paper} label={`${gradeLabel(grade, lang)} · ${subjectName(paper, lang)}`} locked={locked} />
                              </Td>
                            </Tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="px-3 py-4 text-sm text-ink-500">{t('No papers for this class')}</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={<ListPlus size={26} />}
            title={t('No papers yet')}
            text={t('Set up papers adds one for every subject of every class in this exam, with the full and pass marks you give.')}
            action={<SetupPapersButton id={exam.id} hasHs={grades.some(hasStreams)} primary />}
          />
        </Card>
      )}
    </>
  );
}
