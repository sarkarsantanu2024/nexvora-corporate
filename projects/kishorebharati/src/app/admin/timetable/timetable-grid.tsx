'use client';

/**
 * A week of the timetable: a grid (days down, periods across) on a laptop and
 * on paper, one card per day on a phone. When `edit` is given, a tap on a
 * cell opens the cell editor (office only).
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Notice, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { setSlotAction } from '@/server/timetable/actions';

export type GridCell = { title: string; sub: string; subjectId?: string | null; staffId?: string | null; room?: string };
export type GridDay = { day: number; periods: { start: string; end: string }[] };
type Option = { id: string; label: string };

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const clock = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`;
};

export function TimetableGrid({
  days,
  cells,
  edit,
  today,
}: {
  days: GridDay[];
  /** 'day:period' → what is in the cell. */
  cells: Record<string, GridCell>;
  edit?: { sectionId: string; subjects: Option[]; teachers: Option[]; sectionNames: Record<string, string>; suggested: Record<string, string> };
  /** 1 Monday … 6 Saturday, to mark today on a phone. */
  today?: number;
}) {
  const t = useT();
  const [open, setOpen] = useState<{ day: number; period: number } | null>(null);
  const most = Math.max(0, ...days.map((d) => d.periods.length));
  const weekday = days.find((d) => d.day === 1) ?? days[0];

  const cellButton = (day: number, period: number, compact: boolean) => {
    const cell = cells[`${day}:${period}`];
    const body = cell ? (
      <>
        <span className={cn('block font-semibold text-ink-900', compact && 'truncate')}>{cell.title}</span>
        {cell.sub ? <span className={cn('block text-xs text-ink-500', compact && 'truncate')}>{cell.sub}</span> : null}
      </>
    ) : (
      <span className="text-ink-300">{edit ? '+' : '–'}</span>
    );
    if (!edit) return <div className="min-h-[2.75rem] px-1.5 py-1">{body}</div>;
    return (
      <button type="button" onClick={() => setOpen({ day, period })} className="block min-h-[2.75rem] w-full rounded-lg px-1.5 py-1 text-left transition hover:bg-brand-50">
        {body}
      </button>
    );
  };

  return (
    <>
      {/* laptop and paper */}
      <div className="hidden overflow-x-auto lg:block print:block">
        <table className="w-full table-fixed border-collapse text-sm print:text-[10px]">
          <thead>
            <tr>
              <th className="w-24 border border-ink-200 bg-ink-50 px-2 py-2 text-left text-xs font-semibold text-ink-600">{t('Day')}</th>
              {Array.from({ length: most }, (_, i) => (
                <th key={i} className="border border-ink-200 bg-ink-50 px-1.5 py-1.5 text-center text-xs font-semibold text-ink-600">
                  {t('Period {n}', { n: i + 1 })}
                  {weekday?.periods[i] ? (
                    <span className="tabular block font-normal text-ink-400">
                      {clock(weekday.periods[i].start)}–{clock(weekday.periods[i].end)}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day}>
                <th scope="row" className="border border-ink-200 bg-ink-50/60 px-2 py-1.5 text-left text-sm font-semibold text-ink-800">
                  {t(DAY_NAMES[d.day])}
                </th>
                {Array.from({ length: most }, (_, i) =>
                  i < d.periods.length ? (
                    <td key={i} className="border border-ink-200 p-0.5 align-top">
                      {cellButton(d.day, i + 1, true)}
                    </td>
                  ) : (
                    <td key={i} className="border border-ink-200 bg-ink-100/70" />
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {days.some((d) => d.day === 6) ? (
          <p className="tabular mt-2 text-xs text-ink-500">
            {t('Saturday periods: {times}', { times: (days.find((d) => d.day === 6)?.periods ?? []).map((p) => `${clock(p.start)}–${clock(p.end)}`).join(', ') })}
          </p>
        ) : null}
      </div>

      {/* phone: one card per day, today first */}
      <div className="space-y-3 lg:hidden print:hidden">
        {[...days].sort((a, b) => (a.day === today ? -1 : b.day === today ? 1 : a.day - b.day)).map((d) => (
          <section key={d.day} className={cn('rounded-xl border bg-white', d.day === today ? 'border-brand-300' : 'border-ink-200')}>
            <h3 className="flex items-center justify-between border-b border-ink-100 px-3 py-2 text-sm font-bold text-ink-900">
              {t(DAY_NAMES[d.day])}
              {d.day === today ? <span className="rounded-full bg-brand-100 px-2 text-xs font-semibold text-brand-800">{t('Today')}</span> : null}
            </h3>
            <ul className="divide-y divide-ink-100">
              {d.periods.map((p, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-1">
                  <span className="tabular w-16 shrink-0 text-xs text-ink-500">
                    <span className="block font-semibold text-ink-700">{t('Period {n}', { n: i + 1 })}</span>
                    {clock(p.start)}
                  </span>
                  <div className="min-w-0 flex-1">{cellButton(d.day, i + 1, false)}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {edit && open ? <CellEditor key={`${open.day}:${open.period}`} at={open} cell={cells[`${open.day}:${open.period}`]} edit={edit} onClose={() => setOpen(null)} dayName={t(DAY_SHORT[open.day])} /> : null}
    </>
  );
}

function CellEditor({
  at,
  cell,
  edit,
  onClose,
  dayName,
}: {
  at: { day: number; period: number };
  cell?: GridCell;
  edit: NonNullable<Parameters<typeof TimetableGrid>[0]['edit']>;
  onClose: () => void;
  dayName: string;
}) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(cell?.subjectId ?? '');
  const [staffId, setStaffId] = useState(cell?.staffId ?? '');
  const [room, setRoom] = useState(cell?.room ?? '');
  const [busy, setBusy] = useState(false);
  const [clash, setClash] = useState('');

  async function save(values: { subjectId: string; staffId: string; room: string }, confirmClash = false) {
    setBusy(true);
    try {
      const result = await setSlotAction({ sectionId: edit.sectionId, day: at.day, period: at.period, subjectId: values.subjectId || null, staffId: values.staffId || null, room: values.room, confirmClash });
      if (!result.ok) {
        if (result.fields?.clash) return setClash(edit.sectionNames[result.fields.clash] ?? t('another class'));
        return void toast.error(t(result.error));
      }
      toast.success(result.data.cleared ? t('Period cleared') : t('Period saved'));
      router.refresh();
      onClose();
    } catch {
      toast.error(t('Could not reach the server. Check the connection and try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={t('{day}, period {n}', { day: dayName, n: at.period })}
      footer={
        <>
          {cell ? (
            <Button variant="danger" disabled={busy} onClick={() => save({ subjectId: '', staffId: '', room: '' })}>
              {t('Clear')}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          {clash ? (
            <LoadingButton variant="accent" loading={busy} onClick={() => save({ subjectId, staffId, room }, true)}>
              {t('Save anyway')}
            </LoadingButton>
          ) : (
            <LoadingButton loading={busy} disabled={!subjectId && !staffId} onClick={() => save({ subjectId, staffId, room })}>
              {t('Save')}
            </LoadingButton>
          )}
        </>
      }
    >
      <FormGrid>
        <Field label={t('Subject')}>
          <Select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setClash('');
              // The teacher who teaches this subject here, if the office has said so.
              const teacher = edit.suggested[e.target.value];
              if (teacher && !staffId) setStaffId(teacher);
            }}
          >
            <option value="">{t('No subject')}</option>
            {edit.subjects.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('Teacher')}>
          <Select
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setClash('');
            }}
          >
            <option value="">{t('No teacher')}</option>
            {edit.teachers.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('Room (if not the usual one)')} className="sm:col-span-2">
          <Input value={room} onChange={(e) => setRoom(e.target.value)} maxLength={40} />
        </Field>
      </FormGrid>
      {clash ? (
        <Notice tone="amber" className="mt-4">
          {t('This teacher already has {section} in this period. Save anyway only for a combined class.', { section: clash })}
        </Notice>
      ) : null}
    </Modal>
  );
}
