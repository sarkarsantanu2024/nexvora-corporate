'use client';

/** Head of school: the times of each period, and when each class goes home. */
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { LoadingButton } from '@/components/ui/client';
import { Button, Field, Input } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { saveTimetableSettingsAction } from '@/server/timetable/actions';
import type { PeriodTime, TimetableSettings } from '@/server/timetable/defaults';
import { useAction } from '../_ui/use-action';

function PeriodList({ label, list, onChange, errors, prefix }: { label: string; list: PeriodTime[]; onChange: (next: PeriodTime[]) => void; errors: Record<string, string>; prefix: string }) {
  const t = useT();
  const change = (index: number, key: keyof PeriodTime, value: string) => onChange(list.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink-700">{label}</p>
      <ol className="space-y-2">
        {list.map((item, index) => {
          const error = errors[`${prefix}.${index}`];
          return (
            <li key={index}>
              <div className="flex items-center gap-2">
                <span className="tabular w-20 shrink-0 text-sm text-ink-600">{t('Period {n}', { n: index + 1 })}</span>
                <Input type="time" value={item.start} onChange={(e) => change(index, 'start', e.target.value)} aria-label={t('Starts')} className="w-auto min-w-0 flex-1" invalid={Boolean(error)} />
                <span className="text-ink-400">–</span>
                <Input type="time" value={item.end} onChange={(e) => change(index, 'end', e.target.value)} aria-label={t('Ends')} className="w-auto min-w-0 flex-1" invalid={Boolean(error)} />
                <Button variant="ghost" size="sm" className="w-9 shrink-0 px-0" aria-label={t('Remove')} disabled={list.length <= 1} onClick={() => onChange(list.filter((_, i) => i !== index))}>
                  <Trash2 size={16} />
                </Button>
              </div>
              {error ? <p className="mt-1 text-sm font-medium text-accent-600">{t(error)}</p> : null}
            </li>
          );
        })}
      </ol>
      <Button
        variant="secondary"
        size="sm"
        className="mt-2"
        disabled={list.length >= 12}
        onClick={() => {
          const last = list[list.length - 1];
          onChange([...list, { start: last?.end ?? '10:50', end: last?.end ?? '11:30' }]);
        }}
      >
        <Plus size={16} /> {t('Add a period')}
      </Button>
    </div>
  );
}

export function PeriodForm({ initial, grades }: { initial: TimetableSettings; grades: { grade: number; label: string }[] }) {
  const t = useT();
  const [values, setValues] = useState<TimetableSettings>(initial);
  const save = useAction(saveTimetableSettingsAction, { success: t('Period times saved') });
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <PeriodList label={t('Monday to Friday')} list={values.weekday} onChange={(weekday) => setValues((v) => ({ ...v, weekday }))} errors={save.fields} prefix="weekday" />
        <PeriodList label={t('Saturday')} list={values.saturday} onChange={(saturday) => setValues((v) => ({ ...v, saturday }))} errors={save.fields} prefix="saturday" />
      </div>
      <div>
        <p className="mb-1 text-sm font-semibold text-ink-700">{t('When each class goes home')}</p>
        <p className="mb-3 text-sm text-ink-500">{t('A class gets only the periods that end by this time.')}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {grades.map((item) => (
            <Field key={item.grade} label={item.label}>
              <Input type="time" value={values.classEnds[String(item.grade)] ?? ''} onChange={(e) => setValues((v) => ({ ...v, classEnds: { ...v.classEnds, [String(item.grade)]: e.target.value } }))} />
            </Field>
          ))}
          <Field label={t('Saturday, every class')} error={save.fields.saturdayEnds && t(save.fields.saturdayEnds)}>
            <Input type="time" value={values.saturdayEnds} onChange={(e) => setValues((v) => ({ ...v, saturdayEnds: e.target.value }))} />
          </Field>
        </div>
      </div>
      <div className="flex justify-end">
        <LoadingButton loading={save.busy} onClick={() => save.run(values)}>
          {t('Save period times')}
        </LoadingButton>
      </div>
    </div>
  );
}
