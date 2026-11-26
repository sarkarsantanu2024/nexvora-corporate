import { PencilLine } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, EmptyState, LinkButton, Notice, PageHeader } from '@/components/ui/core';
import { sectionLabel } from '@/config/school';
import { DASH_ROLES, requireSession } from '@/lib/auth';
import { formatDate } from '@/lib/date';
import { getLang } from '@/lib/lang';
import { getT } from '@/lib/t';
import { getMarksSheet, marksChoices } from '@/server/exams/service';
import { requirePlan } from '@/server/platform';
import { isOffice } from '@/server/school/access';
import { readSearch, type Search } from '../../_ui/bits';
import { subjectName } from '../_parts/labels';
import { ChoicePicker, MarksGrid } from './marks-grid';

export const metadata: Metadata = { title: 'Enter marks' };

export default async function MarksPage({ searchParams }: { searchParams: Search }) {
  const session = await requireSession(DASH_ROLES);
  await requirePlan('platinum');
  const t = await getT();
  const lang = await getLang();
  const query = await readSearch(searchParams);
  const choices = await marksChoices(session, { exam: query.exam, section: query.section });
  const paper = choices.papers.find((row) => row.id === query.paper) ?? choices.papers.find((row) => row.entered < row.total) ?? choices.papers[0] ?? null;
  const sheet = paper && choices.section ? await getMarksSheet(session, paper.id, choices.section.id) : null;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/exams', label: t('Exams and results') }}
        title={t('Enter marks')}
        description={t('Type each mark and press Enter for the next boy. Marks save by themselves.')}
      />

      {!choices.exam ? (
        <Card>
          <EmptyState
            icon={<PencilLine size={26} />}
            title={t('No exam is open for marks')}
            text={isOffice(session) ? t('Open an exam from its page so marks can be entered.') : t('When the office opens an exam, your papers show here.')}
            action={<LinkButton href="/admin/exams" variant="secondary">{t('See exams')}</LinkButton>}
          />
        </Card>
      ) : (
        <>
          <ChoicePicker
            exam={choices.exam.id}
            section={choices.section?.id ?? ''}
            paper={paper?.id ?? ''}
            exams={choices.exams.map((row) => ({ value: row.id, label: row.name }))}
            sections={choices.sections.map((row) => ({ value: row.id, label: sectionLabel(row, lang) }))}
            papers={choices.papers.map((row) => ({ value: row.id, label: `${subjectName(row, lang)} (${row.entered}/${row.total})` }))}
          />
          {!choices.sections.length ? (
            <Card>
              <EmptyState title={t('No classes to enter marks for')} text={t('Your subjects in each class are set by the office in Classes and subjects. Ask the office if a class is missing.')} />
            </Card>
          ) : !sheet ? (
            <Card>
              <EmptyState title={t('No papers for this class')} text={isOffice(session) ? t('Set up the papers of this exam first.') : t('You do not teach a subject of this exam in this class.')} />
            </Card>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-lg font-bold text-ink-900">
                  {sectionLabel(sheet.section, lang)} · {subjectName(sheet.paper, lang)}
                </h2>
                <p className="tabular text-sm text-ink-600">
                  {t('Full marks {full}, pass marks {pass}', { full: sheet.paper.fullMarks, pass: sheet.paper.passMarks })}
                  {sheet.paper.examDate ? ` · ${formatDate(sheet.paper.examDate)}` : ''}
                </p>
              </div>
              {sheet.locked ? <Notice tone="green" className="mb-3">{t('Results are published. Marks are locked.')}</Notice> : null}
              {!sheet.students.length ? (
                <Card>
                  <EmptyState title={t('No students in this class yet')} />
                </Card>
              ) : (
                <MarksGrid
                  key={`${sheet.paper.id}:${sheet.section.id}`}
                  paperId={sheet.paper.id}
                  sectionId={sheet.section.id}
                  fullMarks={sheet.paper.fullMarks}
                  passMarks={sheet.paper.passMarks}
                  locked={sheet.locked}
                  students={sheet.students.map((row) => ({ id: row.id, rollNo: row.rollNo, name: lang === 'bn' && row.nameBn ? row.nameBn : row.name, marks: row.marks, absent: row.absent }))}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
