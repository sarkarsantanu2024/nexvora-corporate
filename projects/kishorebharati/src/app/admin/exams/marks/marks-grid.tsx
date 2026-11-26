'use client';

import { CheckCircle2, CloudOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Field, Select } from '@/components/ui/core';
import { useToast } from '@/components/ui/client';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { saveMarksAction } from '@/server/exams/actions';

type Option = { value: string; label: string };

/** Exam, class and paper. Changing one starts the ones after it afresh. */
export function ChoicePicker({ exam, section, paper, exams, sections, papers }: { exam: string; section: string; paper: string; exams: Option[]; sections: Option[]; papers: Option[] }) {
  const t = useT();
  const router = useRouter();
  const go = (next: { exam: string; section?: string; paper?: string }) => {
    const params = new URLSearchParams({ exam: next.exam });
    if (next.section) params.set('section', next.section);
    if (next.paper) params.set('paper', next.paper);
    router.push(`/admin/exams/marks?${params.toString()}`, { scroll: false });
  };
  return (
    <div className="no-print mb-4 grid gap-3 sm:grid-cols-3">
      <Field label={t('Exam')}>
        <Select value={exam} onChange={(e) => go({ exam: e.target.value })}>
          {exams.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('Class')}>
        <Select value={section} onChange={(e) => go({ exam, section: e.target.value })} disabled={!sections.length}>
          {sections.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('Paper')}>
        <Select value={paper} onChange={(e) => go({ exam, section, paper: e.target.value })} disabled={!papers.length}>
          {papers.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

type Student = { id: string; rollNo: number; name: string; marks: number | null; absent: boolean };
type Cell = { text: string; absent: boolean };
type Status = 'idle' | 'saving' | 'retry' | 'error';

const sameCell = (a: Cell, b: Cell) => a.absent === b.absent && (a.absent || a.text === b.text);
const draftKey = (paperId: string, sectionId: string) => `exam-marks:${paperId}:${sectionId}`;

/** How long after the last key before an autosave, and before trying again when the network failed. */
const AUTOSAVE_MS = 1200;
const RETRY_MS = 5000;

/**
 * One paper for one section, made for a phone: a number keypad, Enter moves
 * to the next boy, an Absent button on each row. Changes save by themselves
 * in small batches. Anything not yet saved is also kept on this device, so a
 * dropped connection or a closed tab loses nothing; it is sent when the
 * screen is opened again or the connection comes back.
 */
export function MarksGrid({
  paperId,
  sectionId,
  fullMarks,
  passMarks,
  locked,
  students,
}: {
  paperId: string;
  sectionId: string;
  fullMarks: number;
  passMarks: number;
  locked: boolean;
  students: Student[];
}) {
  const t = useT();
  const toast = useToast();
  const initial = useMemo(() => Object.fromEntries(students.map((row) => [row.id, { text: row.marks === null ? '' : String(row.marks), absent: row.absent }])) as Record<string, Cell>, [students]);
  const [cells, setCells] = useState<Record<string, Cell>>(initial);
  const [saved, setSaved] = useState<Record<string, Cell>>(initial);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const cellsRef = useRef(cells);
  const savedRef = useRef(saved);
  const busy = useRef(false);
  const again = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const storageKey = draftKey(paperId, sectionId);
  cellsRef.current = cells;

  const problem = useCallback(
    (cell: Cell): string | null => {
      if (cell.absent || cell.text === '') return null;
      const n = Number(cell.text);
      if (!Number.isInteger(n) || n < 0) return t('Whole marks only');
      if (n > fullMarks) return t('More than the full marks ({full})', { full: fullMarks });
      return null;
    },
    [fullMarks, t],
  );

  const flush = useCallback(async (): Promise<void> => {
    if (locked) return;
    if (busy.current) {
      again.current = true;
      return;
    }
    window.clearTimeout(timer.current);
    const current = cellsRef.current;
    const base = savedRef.current;
    const batch = students.filter((row) => current[row.id] && !sameCell(current[row.id], base[row.id]) && !problem(current[row.id]));
    if (!batch.length) {
      setStatus('idle');
      return;
    }
    busy.current = true;
    setStatus('saving');
    const sent = Object.fromEntries(batch.map((row) => [row.id, current[row.id]]));
    try {
      const result = await saveMarksAction(
        paperId,
        sectionId,
        batch.map((row) => ({ studentId: row.id, absent: sent[row.id].absent, marks: sent[row.id].absent || sent[row.id].text === '' ? null : Number(sent[row.id].text) })),
      );
      if (result.ok) {
        savedRef.current = { ...savedRef.current, ...sent };
        setSaved(savedRef.current);
        setServerErrors((errors) => Object.fromEntries(Object.entries(errors).filter(([id]) => !(id in sent))));
        setStatus('idle');
      } else {
        setServerErrors(result.fields ?? {});
        toast.error(t(result.error));
        setStatus('error');
      }
    } catch {
      // No answer from the server: keep everything and try again shortly.
      setStatus('retry');
      timer.current = window.setTimeout(() => void flushRef.current(), RETRY_MS);
    } finally {
      busy.current = false;
      if (again.current) {
        again.current = false;
        void flushRef.current();
      }
    }
  }, [locked, paperId, problem, sectionId, students, t, toast]);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const schedule = (ms = AUTOSAVE_MS) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flushRef.current(), ms);
  };

  // Bring back what this device had not saved yet, then send it.
  useEffect(() => {
    try {
      if (locked) {
        localStorage.removeItem(storageKey);
        return;
      }
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const drafts = JSON.parse(raw) as Record<string, Cell>;
      const restore = Object.fromEntries(Object.entries(drafts).filter(([id, cell]) => initial[id] && typeof cell?.text === 'string' && !sameCell(cell, initial[id])));
      if (!Object.keys(restore).length) {
        localStorage.removeItem(storageKey);
        return;
      }
      setCells((current) => ({ ...current, ...restore }));
      cellsRef.current = { ...cellsRef.current, ...restore };
      toast.success(t('{n} marks typed earlier on this phone were not saved. Saving them now.', { n: Object.keys(restore).length }));
      schedule(300);
    } catch {
      // Storage may be blocked; autosave still works.
    }
    // Runs once for this paper and section (the grid is keyed by both).
  }, [storageKey]);

  // Keep unsaved changes on the device.
  const pending = students.filter((row) => !sameCell(cells[row.id], saved[row.id]));
  useEffect(() => {
    try {
      const unsaved = Object.entries(cells).filter(([id, cell]) => saved[id] && !sameCell(cell, saved[id]));
      if (!unsaved.length) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(unsaved)));
    } catch {
      // Ignore: storage full or blocked.
    }
  }, [cells, saved, storageKey]);

  // Send when the connection comes back; warn before closing with unsaved marks; save on leaving the screen.
  useEffect(() => {
    const online = () => void flushRef.current();
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('online', online);
      window.clearTimeout(timer.current);
      void flushRef.current();
    };
  }, []);
  const hasPending = pending.length > 0;
  useEffect(() => {
    if (!hasPending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasPending]);

  const change = (id: string, next: Cell) => {
    setCells((current) => ({ ...current, [id]: next }));
    cellsRef.current = { ...cellsRef.current, [id]: next };
    setServerErrors((errors) => {
      if (!(id in errors)) return errors;
      const copy = { ...errors };
      delete copy[id];
      return copy;
    });
    schedule();
  };

  const next = (index: number) => {
    const target = inputs.current.slice(index + 1).find((input) => input && !input.disabled);
    if (target) {
      target.focus();
      target.select();
    } else {
      inputs.current[index]?.blur();
    }
    schedule(300);
  };

  const entered = students.filter((row) => cells[row.id].absent || cells[row.id].text !== '').length;
  const invalid = students.filter((row) => problem(cells[row.id])).length;

  return (
    <>
      <Card>
        <ol className="divide-y divide-ink-100">
          {students.map((row, index) => {
            const cell = cells[row.id];
            const error = problem(cell) ?? (serverErrors[row.id] ? t(serverErrors[row.id]) : null);
            const low = !cell.absent && cell.text !== '' && !error && Number(cell.text) < passMarks;
            const unsaved = !sameCell(cell, saved[row.id]);
            return (
              <li key={row.id} className="px-3 py-2 sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="tabular w-6 shrink-0 text-right text-sm font-semibold text-ink-500">{row.rollNo}</span>
                  <label htmlFor={`m-${row.id}`} className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink-900">
                    {row.name}
                  </label>
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', unsaved ? 'bg-sun-500' : 'bg-transparent')} aria-hidden />
                  <input
                    id={`m-${row.id}`}
                    ref={(element) => {
                      inputs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    enterKeyHint="next"
                    autoComplete="off"
                    maxLength={4}
                    disabled={locked || cell.absent}
                    value={cell.absent ? '' : cell.text}
                    placeholder={cell.absent ? t('AB') : ''}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `e-${row.id}` : undefined}
                    onChange={(e) => change(row.id, { text: e.target.value.replace(/\D/g, ''), absent: false })}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => schedule(300)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        next(index);
                      }
                    }}
                    className={cn(
                      'control tabular h-11 w-16 shrink-0 px-1 sm:w-[4.5rem] text-center text-lg font-semibold',
                      error && 'control-invalid',
                      low && 'text-accent-700',
                      cell.absent && 'placeholder:text-ink-500',
                    )}
                  />
                  <button
                    type="button"
                    aria-pressed={cell.absent}
                    aria-label={t('Absent')}
                    title={t('Absent')}
                    disabled={locked}
                    onClick={() => change(row.id, { text: '', absent: !cell.absent })}
                    className={cn(
                      'h-11 w-11 shrink-0 rounded-xl border text-xs font-semibold transition disabled:opacity-60 sm:w-[4.25rem]',
                      cell.absent ? 'border-accent-500 bg-accent-500 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                    )}
                  >
                    <span className="sm:hidden">{t('AB')}</span>
                    <span className="max-sm:hidden">{t('Absent')}</span>
                  </button>
                </div>
                {error ? (
                  <p id={`e-${row.id}`} className="mt-1 pl-9 text-sm font-medium text-accent-600">
                    {error}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Card>

      {!locked ? (
        <div className="sticky bottom-[calc(1rem+var(--dash-bottom))] z-10 mt-3">
          <Card className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 shadow-lg">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              {status === 'saving' ? (
                <>
                  <Loader2 size={18} className="animate-spin text-brand-700" /> <span className="font-medium text-ink-700">{t('Saving...')}</span>
                </>
              ) : status === 'retry' ? (
                <>
                  <CloudOff size={18} className="text-accent-600" /> <span className="font-medium text-accent-700">{t('No connection. Kept on this phone, will try again.')}</span>
                </>
              ) : pending.length ? (
                <span className="font-medium text-sun-700">
                  {invalid ? t('Correct the marks in red') : t('{n} not saved yet', { n: pending.length })}
                </span>
              ) : (
                <>
                  <CheckCircle2 size={18} className="text-mint-600" /> <span className="font-medium text-mint-700">{t('All saved')}</span>
                </>
              )}
              <span className="tabular text-ink-500">· {t('{done} of {total} entered', { done: entered, total: students.length })}</span>
            </div>
            {pending.length && status !== 'saving' ? (
              <Button size="sm" onClick={() => void flush()} disabled={pending.length === invalid}>
                {t('Save now')}
              </Button>
            ) : null}
          </Card>
        </div>
      ) : null}
    </>
  );
}
