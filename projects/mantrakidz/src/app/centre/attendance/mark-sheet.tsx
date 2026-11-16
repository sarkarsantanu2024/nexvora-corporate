'use client';

/** The daily marking sheets: one for the children of a class, one for staff. */
import { CalendarOff, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Avatar, Button, Notice } from '@/components/ui/core';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/date';
import { markHolidayAction, saveAttendanceAction, saveStaffAttendanceAction } from '@/server/centre/children/actions';
import { MARKS, type Mark } from '@/server/centre/children/constants';

const LABEL: Record<Mark, string> = { present: 'Present', absent: 'Absent', leave: 'Leave' };
const ON: Record<Mark, string> = {
  present: 'border-mint-500 bg-mint-500 text-white',
  absent: 'border-accent-500 bg-accent-500 text-white',
  leave: 'border-sun-500 bg-sun-500 text-white',
};

type Person = { id: string; name: string; sub: string; photo?: string; status: Mark | null };

/** Three large buttons per person; the whole row is easy to hit with a thumb. */
function MarkList({ people, marks, onMark }: { people: Person[]; marks: Record<string, Mark | null>; onMark: (id: string, mark: Mark) => void }) {
  return (
    <ul className="divide-y divide-ink-100">
      {people.map((person) => (
        <li key={person.id} className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar name={person.name} src={person.photo || null} size={40} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{person.name}</p>
              <p className="tabular truncate text-xs text-ink-500">{person.sub}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-[19rem]" role="group" aria-label={`Attendance for ${person.name}`}>
            {MARKS.map((mark) => (
              <button
                key={mark}
                type="button"
                aria-pressed={marks[person.id] === mark}
                onClick={() => onMark(person.id, mark)}
                className={cn(
                  'h-12 rounded-xl border-2 text-[15px] font-bold transition active:scale-[.97]',
                  marks[person.id] === mark ? ON[mark] : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                )}
              >
                {LABEL[mark]}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function useMarks(people: Person[]) {
  const initial = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p.status])) as Record<string, Mark | null>, [people]);
  const [marks, setMarks] = useState(initial);
  const tally = { present: 0, absent: 0, leave: 0, unmarked: 0 };
  for (const person of people) tally[marks[person.id] ?? 'unmarked'] += 1;
  const dirty = people.some((p) => marks[p.id] !== initial[p.id]);
  return {
    marks,
    tally,
    dirty,
    mark: (id: string, mark: Mark) => setMarks((m) => ({ ...m, [id]: mark })),
    allPresent: () => setMarks(Object.fromEntries(people.map((p) => [p.id, 'present' as const]))),
  };
}

function Tally({ tally }: { tally: { present: number; absent: number; leave: number; unmarked: number } }) {
  return (
    <p className="tabular flex flex-wrap gap-x-3 gap-y-0.5 text-sm font-semibold">
      <span className="text-mint-700">{tally.present} present</span>
      <span className="text-accent-700">{tally.absent} absent</span>
      <span className="text-sun-700">{tally.leave} leave</span>
      {tally.unmarked ? <span className="text-ink-500">{tally.unmarked} not marked</span> : null}
    </p>
  );
}

function MarkedBy({ by, at }: { by: string; at: Date | null }) {
  if (!at) return <p className="text-sm text-ink-500">Not marked yet.</p>;
  return (
    <p className="text-sm text-ink-500">
      Last saved by {by || 'someone'}, {formatDateTime(at)}
    </p>
  );
}

export function MarkSheet({
  day,
  batch,
  people,
  markedBy,
  markedAt,
  isHoliday,
}: {
  day: string;
  batch: { id: string; name: string };
  people: Person[];
  markedBy: string;
  markedAt: Date | null;
  isHoliday: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { marks, tally, dirty, mark, allPresent } = useMarks(people);
  const [saving, setSaving] = useState(false);
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [holidayBusy, setHolidayBusy] = useState<'class' | 'centre' | null>(null);

  async function save() {
    const list = people.flatMap((p) => (marks[p.id] ? [{ studentId: p.id, status: marks[p.id]! }] : []));
    setSaving(true);
    const result = await saveAttendanceAction({ day, batchId: batch.id, marks: list });
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    toast.success(`Attendance saved for ${batch.name}`);
    router.refresh();
  }

  async function holiday(scope: 'class' | 'centre') {
    setHolidayBusy(scope);
    const result = await markHolidayAction({ day, batchId: scope === 'class' ? batch.id : null });
    setHolidayBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(scope === 'class' ? `Holiday marked for ${batch.name}` : 'Holiday marked for the whole centre');
    setHolidayOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <div>
          <h2 className="text-base font-bold text-ink-900">
            {batch.name}, {formatDate(day)}
          </h2>
          <MarkedBy by={markedBy} at={markedAt} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setHolidayOpen(true)}>
            <CalendarOff size={16} /> Holiday
          </Button>
          <Button variant="secondary" size="sm" onClick={allPresent}>
            <Check size={16} /> Mark all present
          </Button>
        </div>
      </div>
      {isHoliday ? (
        <Notice className="mx-4 mb-3 sm:mx-5">This day is marked as a holiday for this class. To change that, mark the children below and save.</Notice>
      ) : null}
      <div className="border-t border-ink-100">
        <MarkList people={people} marks={marks} onMark={mark} />
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
        <Tally tally={tally} />
        <LoadingButton loading={saving} disabled={!dirty || tally.unmarked === people.length} onClick={save}>
          Save attendance
        </LoadingButton>
      </div>

      <Modal open={holidayOpen} onClose={() => !holidayBusy && setHolidayOpen(false)} title={`Holiday on ${formatDate(day)}`} description="Children are marked H for the day. It does not count as present or absent." size="sm">
        <div className="grid gap-2">
          <LoadingButton variant="secondary" loading={holidayBusy === 'class'} disabled={holidayBusy !== null} onClick={() => holiday('class')}>
            Only {batch.name}
          </LoadingButton>
          <LoadingButton loading={holidayBusy === 'centre'} disabled={holidayBusy !== null} onClick={() => holiday('centre')}>
            The whole centre
          </LoadingButton>
        </div>
      </Modal>
    </>
  );
}

export function StaffSheet({ day, people, markedBy, markedAt }: { day: string; people: Person[]; markedBy: string; markedAt: Date | null }) {
  const router = useRouter();
  const toast = useToast();
  const { marks, tally, dirty, mark, allPresent } = useMarks(people);
  const [saving, setSaving] = useState(false);

  async function save() {
    const list = people.flatMap((p) => (marks[p.id] ? [{ staffId: p.id, status: marks[p.id]! }] : []));
    setSaving(true);
    const result = await saveStaffAttendanceAction({ day, marks: list });
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    toast.success('Staff attendance saved');
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <div>
          <h2 className="text-base font-bold text-ink-900">Staff, {formatDate(day)}</h2>
          <MarkedBy by={markedBy} at={markedAt} />
        </div>
        <Button variant="secondary" size="sm" onClick={allPresent}>
          <Check size={16} /> Mark all present
        </Button>
      </div>
      <div className="border-t border-ink-100">
        <MarkList people={people} marks={marks} onMark={mark} />
      </div>
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
        <Tally tally={tally} />
        <LoadingButton loading={saving} disabled={!dirty || tally.unmarked === people.length} onClick={save}>
          Save staff attendance
        </LoadingButton>
      </div>
    </>
  );
}
