import { FileText, Table2 } from 'lucide-react';
import type { Metadata } from 'next';
import { Badge, Card, EmptyState, LinkButton, Notice, PageHeader, Stat, Table, Td, Th, Tr } from '@/components/ui/core';
import { PrintButton } from '@/components/ui/client';
import { sectionLabel } from '@/config/school';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { getSetting } from '@/server/admin/shared';
import { EXAM_STATUS_LABELS } from '@/server/exams/constants';
import { getSectionResults, listExams, resultSections } from '@/server/exams/service';
import { requirePlan } from '@/server/platform';
import { readSearch, type Search } from '../../_ui/bits';
import { pct, subjectName } from '../_parts/labels';
import { CsvButton, UrlPickers } from '../_parts/pickers';
import { PrintHeader } from '../_parts/print-header';
import { RemarkButton } from './remark-button';

export const metadata: Metadata = { title: 'Results' };

export default async function ResultsPage({ searchParams }: { searchParams: Search }) {
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const t = await getT();
  const lang = await getLang();
  const query = await readSearch(searchParams);
  const exams = (await listExams(session)).exams.filter((row) => row.status !== 'draft');
  const exam = exams.find((row) => row.id === query.exam) ?? exams.find((row) => row.status === 'published') ?? exams[0] ?? null;
  const { sections } = exam ? await resultSections(session, exam.id) : { sections: [] };
  const section = sections.find((row) => row.id === query.section) ?? sections[0] ?? null;
  const data = exam && section ? await getSectionResults(session, exam.id, section.id) : null;
  const school = await getSetting('school');

  const name = (student: { name: string; nameBn: string }) => (lang === 'bn' && student.nameBn ? student.nameBn : student.name);
  const markText = (entry: { marks: number | null; absent: boolean } | undefined) => (!entry ? '–' : entry.absent ? t('AB') : String(entry.marks ?? ''));
  const resultWord = (passed: boolean, any: boolean) => (!any ? '–' : passed ? t('Passed') : t('Not passed'));

  const ranked = data?.rows.filter((row) => row.result.rank !== null) ?? [];
  const passedCount = ranked.filter((row) => row.result.passed).length;
  const average = ranked.length ? Math.round((ranked.reduce((sum, row) => sum + (row.result.percent ?? 0), 0) / ranked.length) * 10) / 10 : null;

  const csv = data
    ? [
        [t('Roll'), t('Name'), t('Admission no'), ...data.papers.map((paper) => `${subjectName(paper, lang)} (${paper.fullMarks})`), t('Total'), t('Full marks'), t('Percentage'), t('Grade'), t('Result'), t('Rank'), t('Remark')],
        ...data.rows.map(({ student, result, remark }) => [
          student.rollNo,
          name(student),
          student.admissionNo,
          ...data.papers.map((paper) => markText(result.papers.get(paper.id))),
          result.papers.size ? result.total : '',
          result.papers.size ? result.full : '',
          result.percent ?? '',
          result.grade,
          resultWord(result.passed, result.papers.size > 0),
          result.rank ?? '',
          remark,
        ]),
        [t('Highest'), '', '', ...data.papers.map((paper) => data.highest.get(paper.id) ?? ''), '', '', '', '', '', '', ''],
      ]
    : [];

  return (
    <>
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } }'}</style>
      <PageHeader
        back={{ href: '/admin/exams', label: t('Exams and results') }}
        title={t('Results')}
        description={t('Marks of every boy in a class, with total, percentage, grade and rank. Equal percentages share a rank.')}
        actions={
          data ? (
            <>
              <CsvButton filename={`${data.exam.name} ${sectionLabel(data.section)}.csv`} rows={csv} />
              <PrintButton />
              <LinkButton href={`/admin/exams/report-cards?section=${data.section.id}`} variant="secondary">
                <FileText size={16} /> {t('Report cards')}
              </LinkButton>
            </>
          ) : undefined
        }
      />

      {!exams.length ? (
        <Card>
          <EmptyState icon={<Table2 size={26} />} title={t('No results yet')} text={t('Results show here once an exam is open for marks.')} action={<LinkButton href="/admin/exams" variant="secondary">{t('See exams')}</LinkButton>} />
        </Card>
      ) : (
        <>
          <UrlPickers
            path="/admin/exams/results"
            pickers={[
              { param: 'exam', label: t('Exam'), value: exam?.id ?? '', options: exams.map((row) => ({ value: row.id, label: `${row.name} · ${t(EXAM_STATUS_LABELS[row.status])}` })) },
              { param: 'section', label: t('Class'), value: section?.id ?? '', options: sections.map((row) => ({ value: row.id, label: sectionLabel(row, lang) })) },
            ]}
          />

          {!section ? (
            <Card>
              <EmptyState title={t('No class to show')} text={t('Only the class teacher and the office can see the whole class. Your own papers are on Enter marks.')} />
            </Card>
          ) : data ? (
            <>
              <PrintHeader school={school} title={`${data.exam.name} · ${t('Results')}`} subtitle={sectionLabel(data.section, lang)} />
              {data.exam.status === 'open' ? <Notice tone="amber" className="no-print mb-4">{t('Marks are still being entered. These results are not final.')}</Notice> : null}

              <div className="no-print mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label={t('Boys')} value={data.rows.length} />
                <Stat label={t('With marks')} value={ranked.length} />
                <Stat label={t('Passed')} value={`${passedCount}/${ranked.length}`} tone="green" />
                <Stat label={t('Class average')} value={pct(average)} />
              </div>

              <Card className="print-plain">
                {data.papers.length ? (
                  <Table className="print:min-w-0 print:text-xs">
                    <thead>
                      <tr>
                        <Th>{t('Name')}</Th>
                        {data.papers.map((paper) => (
                          <Th key={paper.id} className="text-center">
                            {subjectName(paper, lang)} ({paper.fullMarks})
                          </Th>
                        ))}
                        <Th className="text-right">{t('Total')}</Th>
                        <Th className="text-right">%</Th>
                        <Th>{t('Grade')}</Th>
                        <Th>{t('Result')}</Th>
                        <Th className="text-right">{t('Rank')}</Th>
                        <Th className="no-print">{t('Remark')}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map(({ student, result, remark }) => (
                        <Tr key={student.id}>
                          <Td className="font-medium">
                            <span className="tabular text-ink-500">{student.rollNo}.</span> {name(student)}
                          </Td>
                          {data.papers.map((paper) => {
                            const entry = result.papers.get(paper.id);
                            return (
                              <Td key={paper.id} className={`tabular text-center ${entry && !entry.passed ? 'font-semibold text-accent-700' : ''}`}>
                                {markText(entry)}
                              </Td>
                            );
                          })}
                          <Td className="tabular text-right font-semibold">{result.papers.size ? `${result.total}/${result.full}` : '–'}</Td>
                          <Td className="tabular text-right">{pct(result.percent)}</Td>
                          <Td>{result.grade ? <Badge tone="brand">{result.grade}</Badge> : '–'}</Td>
                          <Td>
                            {result.papers.size ? <Badge tone={result.passed ? 'green' : 'red'}>{resultWord(result.passed, true)}</Badge> : '–'}
                          </Td>
                          <Td className="tabular text-right font-bold">{result.rank ?? '–'}</Td>
                          <Td className="no-print">
                            <span className="inline-flex items-center gap-1">
                              {remark ? <span className="line-clamp-1 max-w-[12rem] text-sm text-ink-600">{remark}</span> : null}
                              <RemarkButton examId={data.exam.id} studentId={student.id} name={name(student)} remark={remark} />
                            </span>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-ink-50/60 font-semibold">
                        <Td>{t('Highest')}</Td>
                        {data.papers.map((paper) => (
                          <Td key={paper.id} data-label={subjectName(paper, lang)} className="tabular text-center">
                            {data.highest.get(paper.id) ?? '–'}
                          </Td>
                        ))}
                        <Td colSpan={6} />
                      </tr>
                    </tfoot>
                  </Table>
                ) : (
                  <EmptyState title={t('No papers for this class')} text={t('Set up the papers of this exam first.')} />
                )}
              </Card>
              <p className="mt-3 text-sm text-ink-500">{t('AB = absent. A dash means no marks for that paper (an optional subject not taken, or not entered yet). Marks in red are below the pass marks.')}</p>
            </>
          ) : null}
        </>
      )}
    </>
  );
}
