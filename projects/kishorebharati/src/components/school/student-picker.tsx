'use client';

/**
 * Find a student by name, admission number or mobile and pick him. Used by
 * Certificates and Government schemes. Office only (the search refuses others).
 */
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { sectionLabel } from '@/config/school';
import type { Shift, Stream } from '@/db/schema';
import { cn } from '@/lib/cn';
import { findStudentsAction } from '@/server/students/actions';

export type PickedStudent = {
  id: string;
  name: string;
  admissionNo: string;
  photo: string;
  status: string;
  grade: number | null;
  sectionName: string | null;
  stream: Stream | null;
  shift: Shift | null;
  rollNo: number | null;
};

export function StudentPicker({ onPick, autoFocus }: { onPick: (student: PickedStudent) => void; autoFocus?: boolean }) {
  const t = useT();
  const lang = useUiLang();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<PickedStudent[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setRows([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      setBusy(true);
      const result = await findStudentsAction(q);
      setBusy(false);
      if (result.ok) setRows(result.data);
    }, 300);
  }, [q]);

  return (
    <div>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(event) => setQ(event.target.value)}
          placeholder={t('Name, admission number or mobile')}
          aria-label={t('Find a student')}
          className="control pl-10"
        />
      </div>
      {q.trim().length >= 2 ? (
        <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-ink-200">
          {rows.length ? (
            rows.map((row) => (
              <li key={row.id} className="border-b border-ink-100 last:border-b-0">
                <button type="button" onClick={() => onPick(row)} className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-50/60 active:bg-brand-50')}>
                  <Avatar name={row.name} src={row.photo} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink-900">{row.name}</span>
                    <span className="block truncate text-xs text-ink-500">
                      {[row.admissionNo, row.grade !== null ? sectionLabel({ grade: row.grade, name: row.sectionName ?? '', stream: row.stream ?? '', shift: row.shift ?? 'day' }, lang) : '', row.rollNo ? t('Roll {n}', { n: row.rollNo }) : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-ink-500">{busy ? t('Searching') : t('No student found')}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
