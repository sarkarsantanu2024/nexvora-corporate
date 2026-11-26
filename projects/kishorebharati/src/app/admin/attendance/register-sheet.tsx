'use client';

/**
 * The register: the most used screen of the whole app, mostly on a teacher's
 * phone. Everyone starts present; a tap on a name marks the boy absent (tap
 * again for present), the small buttons give late or leave. One Save sends
 * the whole register in a single request.
 */
import { Check, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Button, Notice } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import type { AttendanceStatus, StaffAttendanceStatus } from '@/db/schema';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/date';
import { saveRegisterAction, saveStaffAttendanceAction } from '@/server/attendance/actions';

const STUDENT_MARKS: AttendanceStatus[] = ['present', 'absent', 'late', 'leave'];
const STUDENT_SHORT: Record<AttendanceStatus, string> = { present: 'P', absent: 'A', late: 'L', leave: 'LV' };
const STUDENT_WORD: Record<AttendanceStatus, string> = { present: 'Present', absent: 'Absent', late: 'Late', leave: 'Leave' };
const ON: Record<string, string> = {
  present: 'border-mint-500 bg-mint-500 text-white',
  absent: 'border-accent-500 bg-accent-500 text-white',
  late: 'border-sky-500 bg-sky-500 text-white',
  leave: 'border-sun-500 bg-sun-500 text-white',
  half_day: 'border-sky-500 bg-sky-500 text-white',
  duty: 'border-brand-600 bg-brand-600 text-white',
};

export type SheetRow = { studentId: string; name: string; rollNo: number; status: AttendanceStatus | null; absentBefore: boolean };

function MarkedLine({ markedAt, markedBy }: { markedAt: string | null; markedBy: string }) {
  const t = useT();
  return (
    <p className="text-sm text-ink-500">
      {markedAt ? t('Last saved by {name}, {at}', { name: markedBy || t('someone'), at: formatDateTime(markedAt) }) : t('Not taken yet. Everyone is present until you mark otherwise.')}
    </p>
  );
}

export function RegisterSheet({
  day,
  sectionId,
  title,
  rows,
  canMark,
  markedAt,
  markedBy,
  previousDay,
}: {
  day: string;
  sectionId: string;
  title: string;
  rows: SheetRow[];
  canMark: boolean;
  markedAt: string | null;
  markedBy: string;
  previousDay: string | null;
}) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const initial = useMemo(() => Object.fromEntries(rows.map((row) => [row.studentId, row.status ?? 'present'])) as Record<string, AttendanceStatus>, [rows]);
  const [marks, setMarks] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const changed = rows.some((row) => marks[row.studentId] !== initial[row.studentId]);
  const dirty = !markedAt || changed;

  const tally = { present: 0, absent: 0, late: 0, leave: 0 };
  for (const row of rows) tally[marks[row.studentId]]++;
  const absentBefore = rows.filter((row) => row.absentBefore);

  const set = (id: string, status: AttendanceStatus) => setMarks((current) => ({ ...current, [id]: status }));
  const toggle = (id: string) => set(id, marks[id] === 'present' ? 'absent' : 'present');

  async function save() {
    setSaving(true);
    setFailed(false);
    try {
      const result = await saveRegisterAction({ sectionId, day, marks: rows.map((row) => ({ studentId: row.studentId, status: marks[row.studentId] })) });
      if (!result.ok) {
        toast.error(t(result.error));
        return;
      }
      toast.success(t('Register saved: {present} present, {absent} absent', { present: result.data.present + result.data.late, absent: result.data.absent }));
      router.refresh();
    } catch {
      // A dropped connection: nothing was lost on the phone, so saving again is enough.
      setFailed(true);
      toast.error(t('Could not reach the server. Check the connection and try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-ink-900">
            {title}, {formatDate(day)}
          </h2>
          <MarkedLine markedAt={markedAt} markedBy={markedBy} />
        </div>
        {canMark ? (
          <div className="flex gap-2">
            {changed ? (
              <Button variant="ghost" size="sm" onClick={() => setMarks(initial)}>
                <RotateCcw size={15} /> {t('Undo changes')}
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" onClick={() => setMarks(Object.fromEntries(rows.map((row) => [row.studentId, 'present'])) as Record<string, AttendanceStatus>)}>
              <Check size={16} /> {t('All present')}
            </Button>
          </div>
        ) : null}
      </div>

      {!canMark ? <Notice className="mx-4 mb-3 sm:mx-5">{t('Only the class teacher or the office can take this register. You can see it.')}</Notice> : null}
      {absentBefore.length && previousDay ? (
        <Notice tone="amber" className="mx-4 mb-3 sm:mx-5">
          {t('Absent on {date}: {names}', { date: formatDate(previousDay), names: absentBefore.map((row) => `${row.rollNo}. ${row.name}`).join(', ') })}
        </Notice>
      ) : null}
      {canMark ? <p className="px-4 pb-2 text-xs text-ink-500 sm:px-5">{t('Tap a name to mark absent. P present, A absent, L late, LV leave.')}</p> : null}

      <ul className="divide-y divide-ink-100 border-t border-ink-100">
        {rows.map((row) => {
          const status = marks[row.studentId];
          return (
            <li key={row.studentId} className={cn('flex items-center gap-2 px-3 py-2 sm:px-5', status === 'absent' && 'bg-accent-50/60')}>
              <button
                type="button"
                disabled={!canMark}
                onClick={() => toggle(row.studentId)}
                className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 rounded-xl text-left disabled:cursor-default"
                aria-label={t('{name}: {status}. Tap to change.', { name: row.name, status: t(STUDENT_WORD[status]) })}
              >
                <span className={cn('tabular grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold', status === 'absent' ? 'bg-accent-500 text-white' : 'bg-ink-100 text-ink-700')}>{row.rollNo}</span>
                <span className="min-w-0">
                  <span className={cn('block truncate font-semibold', status === 'absent' ? 'text-accent-700' : 'text-ink-900')}>{row.name}</span>
                  {row.absentBefore ? <span className="block text-xs font-medium text-sun-700">{t('Absent last time')}</span> : null}
                </span>
              </button>
              <div className="flex shrink-0 gap-1" role="group" aria-label={t('Attendance for {name}', { name: row.name })}>
                {STUDENT_MARKS.map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    disabled={!canMark}
                    aria-pressed={status === mark}
                    title={t(STUDENT_WORD[mark])}
                    onClick={() => set(row.studentId, mark)}
                    className={cn(
                      'h-11 w-9 rounded-lg border-2 text-xs font-bold transition active:scale-95 disabled:cursor-default sm:w-11 sm:text-sm',
                      status === mark ? ON[mark] : 'border-ink-200 bg-white text-ink-500',
                      !canMark && status !== mark && 'opacity-40',
                    )}
                  >
                    {STUDENT_SHORT[mark]}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-[var(--dash-bottom)] z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
        <p className="tabular flex flex-wrap gap-x-3 gap-y-0.5 text-sm font-semibold">
          <span className="text-mint-700">{t('{n} present', { n: tally.present + tally.late })}</span>
          <span className="text-accent-700">{t('{n} absent', { n: tally.absent })}</span>
          {tally.late ? <span className="text-sky-700">{t('{n} late', { n: tally.late })}</span> : null}
          {tally.leave ? <span className="text-sun-700">{t('{n} on leave', { n: tally.leave })}</span> : null}
        </p>
        {canMark ? (
          <LoadingButton size="lg" loading={saving} disabled={!dirty && !failed} onClick={save} className="max-sm:flex-1">
            {failed ? t('Try saving again') : markedAt ? t('Save changes') : t('Save register')}
          </LoadingButton>
        ) : null}
      </div>
    </>
  );
}

/* ───────────── staff ───────────── */

const STAFF_MARKS: StaffAttendanceStatus[] = ['present', 'absent', 'leave', 'half_day', 'duty'];
const STAFF_WORD: Record<StaffAttendanceStatus, string> = { present: 'Present', absent: 'Absent', leave: 'Leave', half_day: 'Half day', duty: 'On duty' };

export type StaffRow = { id: string; name: string; designation: string; status: StaffAttendanceStatus | null };

export function StaffSheet({ day, rows, markedAt, markedBy }: { day: string; rows: StaffRow[]; markedAt: string | null; markedBy: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const initial = useMemo(() => Object.fromEntries(rows.map((row) => [row.id, row.status ?? 'present'])) as Record<string, StaffAttendanceStatus>, [rows]);
  const [marks, setMarks] = useState(initial);
  const [saving, setSaving] = useState(false);
  const changed = rows.some((row) => marks[row.id] !== initial[row.id]);
  const counts: Record<StaffAttendanceStatus, number> = { present: 0, absent: 0, leave: 0, half_day: 0, duty: 0 };
  for (const row of rows) counts[marks[row.id]]++;

  async function save() {
    setSaving(true);
    try {
      const result = await saveStaffAttendanceAction({ day, marks: rows.map((row) => ({ staffId: row.id, status: marks[row.id] })) });
      if (!result.ok) return void toast.error(t(result.error));
      toast.success(t('Staff attendance saved'));
      router.refresh();
    } catch {
      toast.error(t('Could not reach the server. Check the connection and try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <div>
          <h2 className="text-base font-bold text-ink-900">{t('Staff, {date}', { date: formatDate(day) })}</h2>
          <MarkedLine markedAt={markedAt} markedBy={markedBy} />
        </div>
        <Button variant="secondary" size="sm" onClick={() => setMarks(Object.fromEntries(rows.map((row) => [row.id, 'present'])) as Record<string, StaffAttendanceStatus>)}>
          <Check size={16} /> {t('All present')}
        </Button>
      </div>
      <ul className="divide-y divide-ink-100 border-t border-ink-100">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink-900">{row.name}</p>
              <p className="truncate text-xs text-ink-500">{t(row.designation)}</p>
            </div>
            <div className="grid grid-cols-5 gap-1 sm:w-[26rem]" role="group" aria-label={t('Attendance for {name}', { name: row.name })}>
              {STAFF_MARKS.map((mark) => (
                <button
                  key={mark}
                  type="button"
                  aria-pressed={marks[row.id] === mark}
                  onClick={() => setMarks((current) => ({ ...current, [row.id]: mark }))}
                  className={cn('h-11 rounded-lg border-2 px-0.5 text-[11px] font-bold leading-tight transition active:scale-95 sm:text-xs', marks[row.id] === mark ? ON[mark] : 'border-ink-200 bg-white text-ink-500')}
                >
                  {t(STAFF_WORD[mark])}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="sticky bottom-[var(--dash-bottom)] z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
        <p className="tabular flex flex-wrap gap-x-3 text-sm font-semibold">
          <span className="text-mint-700">{t('{n} present', { n: counts.present })}</span>
          <span className="text-accent-700">{t('{n} absent', { n: counts.absent })}</span>
          {counts.leave ? <span className="text-sun-700">{t('{n} on leave', { n: counts.leave })}</span> : null}
          {counts.half_day ? <span className="text-sky-700">{t('{n} half day', { n: counts.half_day })}</span> : null}
          {counts.duty ? <span className="text-brand-700">{t('{n} on duty', { n: counts.duty })}</span> : null}
        </p>
        <LoadingButton size="lg" loading={saving} disabled={Boolean(markedAt) && !changed} onClick={save} className="max-sm:flex-1">
          {markedAt ? t('Save changes') : t('Save staff attendance')}
        </LoadingButton>
      </div>
    </>
  );
}
