'use client';

/** One row per student: what happened this year, and his class next year. */
import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Button, Card, Select, Table, Td, Th, Tr } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { Stream, YearResult } from '@/db/schema';
import { runPromotionAction } from '@/server/students/actions';
import { RESULT_LABELS } from '@/server/students/constants';
import { useAction } from '../../_ui/use-action';

type Result = 'promoted' | 'detained' | 'passed' | 'left';
type NextSection = { id: string; grade: number; label: string; name: string; stream: Stream };
type Row = { studentId: string; name: string; admissionNo: string; rollNo: number; result: YearResult; placedIn: string };

export function PromoteForm({
  sectionId,
  grade,
  stream,
  name,
  nextGrade,
  boardGrade,
  nextYear,
  nextSections,
  rows,
}: {
  sectionId: string;
  grade: number;
  stream: Stream;
  name: string;
  nextGrade: number | null;
  boardGrade: boolean;
  nextYear: string;
  nextSections: NextSection[];
  rows: Row[];
}) {
  const t = useT();
  const results: Result[] = [nextGrade !== null ? 'promoted' : null, 'detained', boardGrade ? 'passed' : null, 'left'].filter(Boolean) as Result[];

  /** Where a student goes by default: the same section letter (and stream) in the class the result leads to. */
  const targetsFor = (result: Result) => {
    if (result === 'promoted') return nextSections.filter((s) => s.grade === nextGrade);
    if (result === 'detained') return nextSections.filter((s) => s.grade === grade);
    if (result === 'passed') return nextSections.filter((s) => s.grade > grade);
    return [];
  };
  const defaultTarget = (result: Result) => {
    if (result === 'passed' || result === 'left') return '';
    const options = targetsFor(result);
    return (options.find((s) => s.name === name && (!stream || s.stream === stream)) ?? options.find((s) => s.name === name) ?? options[0])?.id ?? '';
  };
  const defaultResult = (): Result => (nextGrade === null || boardGrade ? 'passed' : 'promoted');

  const [plan, setPlan] = useState(() =>
    Object.fromEntries(
      rows.map((row) => {
        const result = (row.result || defaultResult()) as Result;
        return [row.studentId, { result, target: row.placedIn || (row.result ? '' : defaultTarget(result)) }];
      }),
    ) as Record<string, { result: Result; target: string }>,
  );
  const [done, setDone] = useState<string>('');
  const save = useAction(runPromotionAction, {
    success: t('Saved'),
    onDone: (data) => setDone(t('{promoted} promoted, {detained} detained, {passed} passed, {left} left. {placed} new places in {year}.', { ...data, year: nextYear })),
  });

  const setResult = (id: string, result: Result) => setPlan((p) => ({ ...p, [id]: { result, target: defaultTarget(result) } }));
  const setTarget = (id: string, target: string) => setPlan((p) => ({ ...p, [id]: { ...p[id], target } }));
  const setAll = (result: Result) => setPlan(Object.fromEntries(rows.map((row) => [row.studentId, { result, target: defaultTarget(result) }])));

  return (
    <Card>
      <div className="no-print flex flex-wrap items-center gap-2 px-4 pt-4">
        <span className="text-sm font-semibold text-ink-600">{t('Mark everyone')}:</span>
        {results.map((result) => (
          <Button key={result} variant="secondary" size="sm" onClick={() => setAll(result)}>
            {t(RESULT_LABELS[result])}
          </Button>
        ))}
      </div>
      <Table className="mt-3">
        <thead>
          <tr>
            <Th>{t('Roll')}</Th>
            <Th>{t('Student')}</Th>
            <Th>{t('Result')}</Th>
            <Th>{t('Class in {year}', { year: nextYear })}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const item = plan[row.studentId];
            const options = targetsFor(item.result);
            return (
              <Tr key={row.studentId}>
                <Td className="tabular">{row.rollNo}</Td>
                <Td>
                  <p className="font-semibold text-ink-900">{row.name}</p>
                  <p className="tabular text-xs text-ink-500">{row.admissionNo}</p>
                </Td>
                <Td>
                  <Select aria-label={t('Result')} value={item.result} onChange={(e) => setResult(row.studentId, e.target.value as Result)} className="min-w-[9rem]">
                    {results.map((result) => (
                      <option key={result} value={result}>
                        {t(RESULT_LABELS[result])}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  {item.result === 'left' ? (
                    <span className="text-sm text-ink-500">{t('No class next year')}</span>
                  ) : (
                    <Select aria-label={t('Class in {year}', { year: nextYear })} value={item.target} onChange={(e) => setTarget(row.studentId, e.target.value)} className="min-w-[11rem]">
                      {item.result === 'passed' ? <option value="">{t('Passed out')}</option> : <option value="">{t('Choose')}</option>}
                      {options.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <p className="text-sm text-ink-600">{done}</p>
        <LoadingButton
          loading={save.busy}
          onClick={() => save.run(sectionId, { rows: rows.map((row) => ({ studentId: row.studentId, result: plan[row.studentId].result, targetSectionId: plan[row.studentId].target || null })) })}
        >
          {t('Save the year end')}
        </LoadingButton>
      </div>
    </Card>
  );
}
