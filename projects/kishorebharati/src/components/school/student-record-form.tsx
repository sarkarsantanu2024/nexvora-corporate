'use client';

/**
 * Add an achievement, a discipline note or a health check-up for a student.
 * Used on the Student records screen (pick the student first) and on a
 * student's own page (the student is given). Office only.
 */
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton, useToast } from '@/components/ui/client';
import { Avatar, Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { sectionLabel } from '@/config/school';
import { STUDENT_RECORD_KINDS, type StudentRecordKind } from '@/db/schema';
import { todayIST } from '@/lib/date';
import { addRecordAction, deleteRecordAction } from '@/server/office/actions';
import { LEVELS, LEVEL_LABELS, RECORD_KIND_LABELS, bmi } from '@/server/office/labels';
import { StudentPicker, type PickedStudent } from './student-picker';

type Values = Record<string, string | boolean>;
const BLANK: Record<StudentRecordKind, Values> = {
  achievement: { competition: '', level: 'school', position: '', note: '' },
  discipline: { incident: '', action: '', guardianInformed: false, note: '' },
  health: { heightCm: '', weightKg: '', vision: '', dental: '', remarks: '' },
};

export function RecordFormButton({ student: given, kind: startKind = 'achievement', label }: { student?: { id: string; name: string }; kind?: StudentRecordKind; label?: string }) {
  const t = useT();
  const lang = useUiLang();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickedStudent | null>(null);
  const [kind, setKind] = useState<StudentRecordKind>(startKind);
  const [day, setDay] = useState(todayIST());
  const [values, setValues] = useState<Values>(BLANK[startKind]);
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const student = given ?? (picked ? { id: picked.id, name: picked.name } : null);
  const set = (key: string, value: string | boolean) => setValues((current) => ({ ...current, [key]: value }));
  const err = (key: string) => (fields[`data.${key}`] ? t(fields[`data.${key}`]) : undefined);

  const start = () => {
    setKind(startKind);
    setValues(BLANK[startKind]);
    setDay(todayIST());
    setPicked(null);
    setFields({});
    setOpen(true);
  };

  async function save() {
    if (!student) return;
    setBusy(true);
    setFields({});
    try {
      const result = await addRecordAction({ studentId: student.id, kind, day, data: values });
      if (!result.ok) {
        setFields(result.fields ?? {});
        toast.error(t(result.error));
        return;
      }
      toast.success(t('Record saved'));
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t('Could not reach the server. Check the connection and try again.'));
    } finally {
      setBusy(false);
    }
  }

  const index = bmi(Number(values.heightCm) || null, Number(values.weightKg) || null);
  const text = (key: string) => String(values[key] ?? '');

  return (
    <>
      <Button size={given ? 'sm' : 'md'} variant={given ? 'secondary' : 'primary'} onClick={start}>
        <Plus size={given ? 16 : 18} /> {label ?? t('Add record')}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('Add record')}
        description={student?.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={busy} disabled={!student} onClick={save}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          {given ? null : picked ? (
            <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-3">
              <Avatar name={picked.name} src={picked.photo} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{picked.name}</p>
                <p className="truncate text-xs text-ink-500">
                  {picked.grade !== null ? sectionLabel({ grade: picked.grade, name: picked.sectionName ?? '', stream: picked.stream ?? '', shift: picked.shift ?? 'day' }, lang) : picked.admissionNo}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>
                {t('Change')}
              </Button>
            </div>
          ) : (
            <Field label={t('Student')} required>
              <StudentPicker onPick={setPicked} autoFocus />
            </Field>
          )}
          <FormGrid>
            <Field label={t('Kind of record')}>
              <Select
                value={kind}
                onChange={(e) => {
                  const next = e.target.value as StudentRecordKind;
                  setKind(next);
                  setValues(BLANK[next]);
                  setFields({});
                }}
              >
                {STUDENT_RECORD_KINDS.map((option) => (
                  <option key={option} value={option}>
                    {t(RECORD_KIND_LABELS[option])}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Date')} error={fields.day ? t(fields.day) : undefined}>
              <Input type="date" value={day} max={todayIST()} onChange={(e) => setDay(e.target.value)} />
            </Field>
          </FormGrid>

          {kind === 'achievement' ? (
            <>
              <Field label={t('Competition')} required error={err('competition')}>
                <Input value={text('competition')} placeholder={t('Inter-school football, science quiz')} onChange={(e) => set('competition', e.target.value)} />
              </Field>
              <FormGrid>
                <Field label={t('Level')} error={err('level')}>
                  <Select value={text('level')} onChange={(e) => set('level', e.target.value)}>
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {t(LEVEL_LABELS[level])}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('Position')}>
                  <Input value={text('position')} placeholder={t('First, runner-up, took part')} onChange={(e) => set('position', e.target.value)} />
                </Field>
              </FormGrid>
              <Field label={t('Note')}>
                <Textarea value={text('note')} onChange={(e) => set('note', e.target.value)} />
              </Field>
            </>
          ) : kind === 'discipline' ? (
            <>
              <Field label={t('What happened')} required error={err('incident')}>
                <Textarea value={text('incident')} onChange={(e) => set('incident', e.target.value)} />
              </Field>
              <Field label={t('Action taken')}>
                <Textarea value={text('action')} onChange={(e) => set('action', e.target.value)} />
              </Field>
              <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-700">
                <input type="checkbox" className="h-5 w-5 accent-brand-700" checked={values.guardianInformed === true} onChange={(e) => set('guardianInformed', e.target.checked)} />
                {t('Guardian informed')}
              </label>
            </>
          ) : (
            <>
              <FormGrid className="grid-cols-3 sm:grid-cols-3">
                <Field label={t('Height (cm)')} error={err('heightCm')}>
                  <Input inputMode="decimal" value={text('heightCm')} onChange={(e) => set('heightCm', e.target.value.replace(/[^0-9.]/g, ''))} />
                </Field>
                <Field label={t('Weight (kg)')} error={err('weightKg')}>
                  <Input inputMode="decimal" value={text('weightKg')} onChange={(e) => set('weightKg', e.target.value.replace(/[^0-9.]/g, ''))} />
                </Field>
                <Field label={t('BMI')}>
                  <Input value={index ?? ''} readOnly tabIndex={-1} className="bg-ink-50" />
                </Field>
              </FormGrid>
              <FormGrid>
                <Field label={t('Vision')}>
                  <Input value={text('vision')} placeholder="6/6" onChange={(e) => set('vision', e.target.value)} />
                </Field>
                <Field label={t('Teeth')}>
                  <Input value={text('dental')} onChange={(e) => set('dental', e.target.value)} />
                </Field>
              </FormGrid>
              <Field label={t('Remarks')}>
                <Textarea value={text('remarks')} onChange={(e) => set('remarks', e.target.value)} />
              </Field>
            </>
          )}
        </div>
      </Drawer>
    </>
  );
}

export function DeleteRecordButton({ id }: { id: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  return (
    <ConfirmButton
      size="sm"
      variant="ghost"
      className="w-9 px-0"
      aria-label={t('Remove')}
      title={t('Remove this record?')}
      confirmLabel={t('Remove')}
      onConfirm={async () => {
        const result = await deleteRecordAction(id);
        if (!result.ok) toast.error(t(result.error));
        else {
          toast.success(t('Removed'));
          router.refresh();
        }
      }}
    >
      <Trash2 size={15} />
    </ConfirmButton>
  );
}
