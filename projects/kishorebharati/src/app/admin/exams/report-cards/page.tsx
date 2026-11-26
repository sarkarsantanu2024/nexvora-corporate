import { FileText } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, EmptyState, LinkButton, PageHeader } from '@/components/ui/core';
import { PrintButton } from '@/components/ui/client';
import { gradeLabel, sectionLabel, STREAM_LABELS } from '@/config/school';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { getReportCards, reportCardSections, type ReportCard } from '@/server/exams/service';
import { requirePlan } from '@/server/platform';
import { readSearch, type Search } from '../../_ui/bits';
import { pct } from '../_parts/labels';
import { UrlPickers } from '../_parts/pickers';
import { PrintHeader } from '../_parts/print-header';

export const metadata: Metadata = { title: 'Report cards' };

export default async function ReportCardsPage({ searchParams }: { searchParams: Search }) {
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const t = await getT();
  const lang = await getLang();
  const query = await readSearch(searchParams);
  const sections = await reportCardSections(session);
  const section = sections.find((row) => row.id === query.section) ?? sections[0] ?? null;
  const all = section ? await getReportCards(session, section.id) : null;
  const data = all && query.student ? { ...all, cards: all.cards.filter((card) => card.student.id === query.student) } : all;

  const studentName = (student: { name: string; nameBn: string }) => (lang === 'bn' && student.nameBn ? student.nameBn : student.name);
  const l = lang === 'bn' ? 'bn' : 'en';
  type Column = ReportCard['exams'][number];
  const footRows: { label: string; value: (column: Column) => string }[] = [
    { label: t('Total'), value: (c) => (c.result.papers.size ? `${c.result.total}/${c.result.full}` : '–') },
    { label: t('Percentage'), value: (c) => pct(c.result.percent) },
    { label: t('Grade'), value: (c) => c.result.grade || '–' },
    { label: t('Result'), value: (c) => (!c.result.papers.size ? '–' : c.result.passed ? t('Passed') : t('Not passed')) },
    { label: t('Rank in class'), value: (c) => (c.result.rank ? t('{rank} of {n}', { rank: c.result.rank, n: c.ranked }) : '–') },
  ];

  return (
    <>
      <style>{'@media print { @page { size: A4 portrait; margin: 12mm; } }'}</style>
      <PageHeader
        back={{ href: '/admin/exams', label: t('Exams and results') }}
        title={t('Report cards')}
        description={t('Every published exam of the year side by side, one page for each boy. Print the whole class or one boy.')}
        actions={data?.cards.length && data.exams.length ? <PrintButton label={data.cards.length > 1 ? t('Print {n} report cards', { n: data.cards.length }) : t('Print')} /> : undefined}
      />

      {!section ? (
        <Card>
          <EmptyState icon={<FileText size={26} />} title={t('No class to show')} text={t('Only the class teacher and the office can print report cards.')} />
        </Card>
      ) : (
        <>
          <UrlPickers
            path="/admin/exams/report-cards"
            pickers={[
              { param: 'section', label: t('Class'), value: section.id, options: sections.map((row) => ({ value: row.id, label: sectionLabel(row, lang) })) },
              {
                param: 'student',
                label: t('Boy'),
                value: query.student ?? '',
                options: [{ value: '', label: t('Whole class') }, ...(all?.cards ?? []).map((card) => ({ value: card.student.id, label: `${card.student.rollNo}. ${studentName(card.student)}` }))],
              },
            ]}
          />

          {!data || !data.exams.length ? (
            <Card>
              <EmptyState
                icon={<FileText size={26} />}
                title={t('No published results for this class yet')}
                text={t('Report cards show the exams whose results are published.')}
                action={<LinkButton href="/admin/exams" variant="secondary">{t('See exams')}</LinkButton>}
              />
            </Card>
          ) : !data.cards.length ? (
            <Card>
              <EmptyState title={t('No students in this class yet')} />
            </Card>
          ) : (
            <div className="space-y-6 print:space-y-0">
              {data.cards.map((card) => (
                <Card key={card.student.id} className="print-plain break-after-page overflow-hidden p-4 sm:p-6 print:break-inside-avoid">
                  <PrintHeader school={data.school} screen title={t('Progress report')} subtitle={t('School year {year}', { year: data.year.name })} />

                  <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                    {[
                      [t('Name'), studentName(card.student)],
                      [t('Class'), gradeLabel(data.section.grade, lang) + (data.section.stream ? ` (${STREAM_LABELS[data.section.stream][l]})` : '')],
                      [t('Section'), data.section.name],
                      [t('Roll no'), String(card.student.rollNo)],
                      [t('Admission no'), card.student.admissionNo],
                      [t("Father's name"), card.student.fatherName || '–'],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-xs font-semibold text-ink-500">{label}</dt>
                        <dd className="truncate font-medium text-ink-900">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="scrollbar-thin overflow-x-auto">
                    <table className="w-full border-collapse text-sm print:text-xs">
                      <thead>
                        <tr className="bg-ink-50">
                          <th className="border border-ink-300 px-2 py-1.5 text-left font-semibold">{t('Subject')}</th>
                          {card.exams.map((exam) => (
                            <th key={exam.id} colSpan={2} className="border border-ink-300 px-2 py-1.5 text-center font-semibold">
                              {exam.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.subjects.map((subject) => (
                          <tr key={subject.id}>
                            <td className="border border-ink-300 px-2 py-1 font-medium">{lang === 'bn' && subject.nameBn ? subject.nameBn : subject.name}</td>
                            {card.exams.map((exam) => {
                              const paper = data.papers.find((row) => row.examId === exam.id && row.subjectId === subject.id);
                              const entry = paper ? exam.result.papers.get(paper.id) : undefined;
                              return [
                                <td key={`${exam.id}-m`} className={`tabular border border-ink-300 px-2 py-1 text-center ${entry && !entry.passed ? 'font-semibold text-accent-700' : ''}`}>
                                  {!paper || !entry ? '–' : entry.absent ? t('AB') : `${entry.marks}/${paper.fullMarks}`}
                                </td>,
                                <td key={`${exam.id}-g`} className="border border-ink-300 px-2 py-1 text-center">
                                  {entry && !entry.absent ? entry.grade : ''}
                                </td>,
                              ];
                            })}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="font-semibold">
                        {footRows.map((row) => (
                          <tr key={row.label} className="bg-ink-50/60">
                            <td className="border border-ink-300 px-2 py-1">{row.label}</td>
                            {card.exams.map((exam) => (
                              <td key={exam.id} colSpan={2} className="tabular border border-ink-300 px-2 py-1 text-center">
                                {row.value(exam)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-ink-700">{t('Attendance this year')}: </span>
                      {card.attendance && card.attendance.days
                        ? t('{present} of {days} days ({percent})', { present: card.attendance.present + card.attendance.late, days: card.attendance.days, percent: pct(card.attendance.percent) })
                        : t('Not recorded')}
                    </p>
                    <p>
                      <span className="font-semibold text-ink-700">{t("Class teacher's remark")}: </span>
                      {card.remark || '–'}
                    </p>
                  </div>

                  <div className="mt-14 grid grid-cols-3 gap-4 text-center text-xs text-ink-700 print:mt-20">
                    {[
                      [t('Class teacher'), data.classTeacher],
                      [t('Headmaster'), ''],
                      [t('Guardian'), ''],
                    ].map(([label, who]) => (
                      <div key={label}>
                        <div className="border-t border-ink-400 pt-1 font-semibold">{label}</div>
                        {who ? <div className="text-ink-500">{who}</div> : null}
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-[11px] text-ink-500">{t('AB = absent. Grades: {scale}', { scale: data.scale.map((band) => `${band.grade} ${band.min}%+`).join(', ') })}</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
