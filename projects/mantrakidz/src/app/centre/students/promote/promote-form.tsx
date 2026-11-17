'use client';

/** Tick the children, choose where they go, look at the preview, then apply. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingButton, Modal, useToast } from '@/components/ui/client';
import { Avatar, Button, Card, CardBody, CardHeader, Field, Input, Notice, Select } from '@/components/ui/core';
import { rich } from '@/i18n/rich';
import { useT } from '@/components/ui/lang';
import { cn } from '@/lib/cn';
import { ageLabel } from '@/lib/date';
import { promoteStudentsAction } from '@/server/centre/children/actions';

type Child = { id: string; name: string; admissionNo: string; dob: string | null; photo: string };
type Target = { id: string; name: string; programmeName: string; yearName: string; capacity: number; filled: number };

export function PromoteForm({ from, students, targets, today }: { from: { id: string; name: string; yearName: string }; students: Child[]; targets: Target[]; today: string }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(students.map((s) => s.id)));
  const [mode, setMode] = useState<'move' | 'pass_out'>('move');
  const [toBatchId, setToBatchId] = useState('');
  const [leftOn, setLeftOn] = useState(today);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const target = targets.find((t) => t.id === toBatchId);
  const moving = students.filter((s) => ticked.has(s.id));
  const staying = students.length - moving.length;
  const ready = moving.length > 0 && (mode === 'pass_out' || Boolean(target));
  const overflow = mode === 'move' && target ? target.filled + moving.length - target.capacity : 0;

  const toggle = (id: string) =>
    setTicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function apply() {
    setSaving(true);
    const result = await promoteStudentsAction({ fromBatchId: from.id, studentIds: moving.map((s) => s.id), mode, toBatchId: mode === 'move' ? toBatchId : null, leftOn });
    setSaving(false);
    if (!result.ok) return toast.error(t(result.error));
    toast.success(mode === 'move' ? t('{moved} moved to {toName}', { moved: result.data.moved, toName: result.data.toName }) : t('{moved} marked as passed out', { moved: result.data.moved }));
    router.push(mode === 'move' ? `/centre/students?batch=${toBatchId}` : '/centre/students?status=passed_out');
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader
          title={t('Children in {name}', { name: from.name })}
          description={t('{n} ticked, {staying} staying', { n: moving.length, staying })}
          action={
            <Button variant="ghost" size="sm" onClick={() => setTicked(moving.length === students.length ? new Set() : new Set(students.map((s) => s.id)))}>
              {moving.length === students.length ? t('Untick all') : t('Tick all')}
            </Button>
          }
        />
        <ul className="mt-3 divide-y divide-ink-100 border-t border-ink-100">
          {students.map((student) => (
            <li key={student.id}>
              <label className={cn('flex min-h-[56px] cursor-pointer items-center gap-3 px-5 py-2.5 transition', ticked.has(student.id) ? 'bg-brand-50/50' : 'hover:bg-ink-50')}>
                <input type="checkbox" checked={ticked.has(student.id)} onChange={() => toggle(student.id)} className="h-5 w-5 shrink-0 rounded border-ink-300 accent-brand-700" />
                <Avatar name={student.name} src={student.photo || null} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink-900">{student.name}</span>
                  <span className="tabular block text-xs text-ink-500">
                    {student.admissionNo}
                    {student.dob ? `, ${ageLabel(student.dob, today)}` : ''}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title={t('Where do the ticked children go')} />
        <CardBody className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { value: 'move', title: t('Move to another class'), text: t('They go up to the class you choose.') },
                { value: 'pass_out', title: t('Passed out'), text: t('For UKG children leaving for big school.') },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn('flex cursor-pointer gap-3 rounded-xl border p-3.5 transition', mode === option.value ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300')}
              >
                <input type="radio" name="mode" checked={mode === option.value} onChange={() => setMode(option.value)} className="mt-1 h-4 w-4 accent-brand-700" />
                <span>
                  <span className="block font-semibold text-ink-900">{option.title}</span>
                  <span className="block text-sm text-ink-500">{option.text}</span>
                </span>
              </label>
            ))}
          </div>

          {mode === 'move' ? (
            <Field label={t('Move to')} required hint={t('The class decides the programme and the academic year.')}>
              <Select value={toBatchId} onChange={(event) => setToBatchId(event.target.value)}>
                <option value="">{t('Choose a class')}</option>
                {targets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t('{name} ({programmeName}, {yearName}): {filled} of {capacity} seats filled', { name: c.name, programmeName: c.programmeName, yearName: c.yearName, filled: c.filled, capacity: c.capacity })}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label={t('Last day at the centre')} required>
              <Input type="date" value={leftOn} max={today} onChange={(event) => setLeftOn(event.target.value)} />
            </Field>
          )}

          <div className="flex justify-end">
            <Button disabled={!ready} onClick={() => setPreview(true)}>
              {t('Preview')}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={preview}
        onClose={() => !saving && setPreview(false)}
        title={t('Check before applying')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(false)} disabled={saving}>
              {t('Go back')}
            </Button>
            <LoadingButton loading={saving} onClick={apply}>
              {mode === 'move' ? (moving.length === 1 ? t('Move {n} child', { n: moving.length }) : t('Move {n} children', { n: moving.length })) : t('Mark {n} as passed out', { n: moving.length })}
            </LoadingButton>
          </>
        }
      >
        <p className="text-[15px] text-ink-700">
          {mode === 'move' ? (
            <>
              {rich(moving.length === 1 ? t('{n} child moves from {from} ({fromYear}) to {to} ({toProgramme}, {toYear}).') : t('{n} children move from {from} ({fromYear}) to {to} ({toProgramme}, {toYear}).'), {
                n: <strong>{moving.length}</strong>,
                from: <strong>{from.name}</strong>,
                fromYear: from.yearName,
                to: <strong>{target?.name}</strong>,
                toProgramme: target?.programmeName,
                toYear: target?.yearName,
              })}
            </>
          ) : (
            <>
              {rich(moving.length === 1 ? t('{n} child of {from} will be marked as passed out. They stay in your records but leave attendance and monthly bills.') : t('{n} children of {from} will be marked as passed out. They stay in your records but leave attendance and monthly bills.'), { n: <strong>{moving.length}</strong>, from: <strong>{from.name}</strong> })}
            </>
          )}{' '}
          {staying > 0 ? (staying === 1 ? t('{n} not ticked stays in {name}.', { n: staying, name: from.name }) : t('{n} not ticked stay in {name}.', { n: staying, name: from.name })) : t('Nobody stays behind.')}
        </p>
        {overflow > 0 && target ? (
          <Notice tone="amber" className="mt-3">
            {t('{name} has {capacity} seats and already holds {filled}. This move puts it {overflow} over.', { name: target.name, capacity: target.capacity, filled: target.filled, overflow })}
          </Notice>
        ) : null}
        <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-sm text-ink-800 sm:grid-cols-2">
          {moving.map((student) => (
            <li key={student.id} className="truncate">
              {student.name}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
