'use client';

/** Forms of Classes and subjects: years, sections, subjects and who teaches what. */
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { SCHOOL, SHIFT_LABELS, STREAM_LABELS, gradeLabel, hasStreams } from '@/config/school';
import type { Shift, Stream, Subject } from '@/db/schema';
import {
  createYearAction,
  deleteSectionAction,
  saveSectionAction,
  saveSubjectAction,
  setAssignmentAction,
  setCurrentYearAction,
  setSubjectActiveAction,
} from '@/server/classes/actions';
import { useAction } from '../_ui/use-action';

type Teacher = { id: string; name: string };

export function YearForm({ suggested, hasCurrent }: { suggested: string; hasCurrent: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggested);
  const [startsOn, setStartsOn] = useState(`${suggested}-01-01`);
  const [endsOn, setEndsOn] = useState(`${suggested}-12-31`);
  const [copySections, setCopy] = useState(true);
  const save = useAction(createYearAction, { success: t('Year added'), onDone: () => setOpen(false) });
  const changeName = (value: string) => {
    setName(value);
    // West Bengal school years run January to December.
    if (/^\d{4}$/.test(value)) {
      setStartsOn(`${value}-01-01`);
      setEndsOn(`${value}-12-31`);
    }
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} /> {t('Add year')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('Add a school year')}
        description={t('Adding a year does not change the current one. Make it current after the year-end promotion.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run({ name, startsOn, endsOn, copySections })}>
              {t('Add year')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Name')} required error={save.fields.name && t(save.fields.name)}>
            <Input value={name} onChange={(e) => changeName(e.target.value)} />
          </Field>
          <FormGrid>
            <Field label={t('Starts on')} error={save.fields.startsOn && t(save.fields.startsOn)}>
              <Input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
            </Field>
            <Field label={t('Ends on')} error={save.fields.endsOn && t(save.fields.endsOn)}>
              <Input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
            </Field>
          </FormGrid>
          {hasCurrent ? (
            <label className="flex items-start gap-3 text-[15px] text-ink-800">
              <input type="checkbox" checked={copySections} onChange={(e) => setCopy(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-700" />
              <span>{t('Copy the sections of the current year, with their class teachers and subject teachers')}</span>
            </label>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

export function MakeCurrent({ id, name }: { id: string; name: string }) {
  const t = useT();
  const save = useAction(setCurrentYearAction, { success: t('Current year changed') });
  return (
    <ConfirmButton
      size="sm"
      danger={false}
      variant="secondary"
      title={t('Make {year} the current year?', { year: name })}
      text={t('Every screen (students, attendance, exams, fees) then works in {year}. Do the year-end promotion of every section first.', { year: name })}
      confirmLabel={t('Make current')}
      onConfirm={async () => void (await save.run(id))}
    >
      {t('Make current')}
    </ConfirmButton>
  );
}

type SectionValues = { grade: number; name: string; stream: Stream; shift: Shift; classTeacherId: string | null; room: string; capacity: number };

export function SectionForm({ yearId, section, teachers }: { yearId: string; section?: SectionValues & { id: string }; teachers: Teacher[] }) {
  const t = useT();
  const lang = useUiLang();
  const l = lang === 'bn' ? 'bn' : 'en';
  const blank = { grade: SCHOOL.grades[0], name: 'A', stream: '' as Stream, shift: SCHOOL.shifts[0], classTeacherId: '', room: '', capacity: '60' };
  const start = () =>
    section ? { ...section, classTeacherId: section.classTeacherId ?? '', capacity: String(section.capacity) } : blank;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(start);
  const save = useAction(saveSectionAction, { success: t('Saved'), onDone: () => setOpen(false) });
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  return (
    <>
      {section ? (
        <Button variant="secondary" size="sm" onClick={() => (setValues(start()), setOpen(true))} aria-label={t('Edit')}>
          <Pencil size={15} />
        </Button>
      ) : (
        <Button onClick={() => (setValues(start()), setOpen(true))}>
          <Plus size={18} /> {t('Add section')}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={section ? t('Edit section') : t('Add section')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton
              loading={save.busy}
              onClick={() =>
                save.run(section?.id ?? null, {
                  yearId,
                  grade: Number(values.grade),
                  name: values.name,
                  stream: hasStreams(Number(values.grade)) ? values.stream : '',
                  shift: values.shift,
                  classTeacherId: values.classTeacherId,
                  room: values.room,
                  capacity: Number(values.capacity),
                })
              }
            >
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormGrid>
            <Field label={t('Class')} required error={err('grade')}>
              <Select value={values.grade} onChange={(e) => set('grade', Number(e.target.value))}>
                {SCHOOL.grades.map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g, lang)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Section')} required error={err('name')} hint={t('A, B, C')}>
              <Input value={values.name} onChange={(e) => set('name', e.target.value)} maxLength={10} />
            </Field>
            {hasStreams(Number(values.grade)) ? (
              <Field label={t('Stream')} required error={err('stream')}>
                <Select value={values.stream} onChange={(e) => set('stream', e.target.value as Stream)}>
                  <option value="">{t('Choose')}</option>
                  {SCHOOL.streams.map((s) => (
                    <option key={s} value={s}>
                      {STREAM_LABELS[s][l]}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            {SCHOOL.shifts.length > 1 ? (
              <Field label={t('Shift')} error={err('shift')}>
                <Select value={values.shift} onChange={(e) => set('shift', e.target.value as Shift)}>
                  {SCHOOL.shifts.map((s) => (
                    <option key={s} value={s}>
                      {SHIFT_LABELS[s][l]}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </FormGrid>
          <Field label={t('Class teacher')} error={err('classTeacherId')}>
            <Select value={values.classTeacherId} onChange={(e) => set('classTeacherId', e.target.value)}>
              <option value="">{t('Not chosen')}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </Select>
          </Field>
          <FormGrid>
            <Field label={t('Room')} error={err('room')}>
              <Input value={values.room} onChange={(e) => set('room', e.target.value)} />
            </Field>
            <Field label={t('Seats')} error={err('capacity')}>
              <Input type="number" inputMode="numeric" min={1} value={values.capacity} onChange={(e) => set('capacity', e.target.value)} />
            </Field>
          </FormGrid>
        </div>
      </Drawer>
    </>
  );
}

export function DeleteSection({ id, label }: { id: string; label: string }) {
  const t = useT();
  const remove = useAction(deleteSectionAction, { success: t('Removed') });
  return (
    <ConfirmButton size="sm" title={t('Remove {name}?', { name: label })} text={t('Only an empty section can be removed.')} confirmLabel={t('Remove')} onConfirm={async () => void (await remove.run(id))} aria-label={t('Remove')}>
      <Trash2 size={15} />
    </ConfirmButton>
  );
}

export function SubjectForm({ subject }: { subject?: Subject }) {
  const t = useT();
  const lang = useUiLang();
  const l = lang === 'bn' ? 'bn' : 'en';
  const first = SCHOOL.grades[0];
  const last = SCHOOL.grades[SCHOOL.grades.length - 1];
  const start = () => ({
    name: subject?.name ?? '',
    nameBn: subject?.nameBn ?? '',
    code: subject?.code ?? '',
    fromGrade: subject?.fromGrade ?? first,
    toGrade: subject?.toGrade ?? last,
    stream: (subject?.stream ?? '') as Stream,
    optional: subject?.optional ?? false,
    sort: String(subject?.sort ?? 0),
  });
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(start);
  const save = useAction(saveSubjectAction, { success: t('Saved'), onDone: () => setOpen(false) });
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => setValues((v) => ({ ...v, [key]: value }));
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  const streamsPossible = hasStreams(Number(values.fromGrade));
  return (
    <>
      {subject ? (
        <Button variant="secondary" size="sm" onClick={() => (setValues(start()), setOpen(true))} aria-label={t('Edit')}>
          <Pencil size={15} />
        </Button>
      ) : (
        <Button onClick={() => (setValues(start()), setOpen(true))}>
          <Plus size={18} /> {t('Add subject')}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={subject ? t('Edit subject') : t('Add subject')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton
              loading={save.busy}
              onClick={() =>
                save.run(subject?.id ?? null, { ...values, fromGrade: Number(values.fromGrade), toGrade: Number(values.toGrade), stream: streamsPossible ? values.stream : '', sort: Number(values.sort) || 0 })
              }
            >
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormGrid>
            <Field label={t('Name')} required error={err('name')}>
              <Input value={values.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label={t('Name in Bengali')} error={err('nameBn')}>
              <Input value={values.nameBn} onChange={(e) => set('nameBn', e.target.value)} lang="bn" />
            </Field>
            <Field label={t('From class')} error={err('fromGrade')}>
              <Select value={values.fromGrade} onChange={(e) => set('fromGrade', Number(e.target.value))}>
                {SCHOOL.grades.map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g, lang)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('To class')} error={err('toGrade')}>
              <Select value={values.toGrade} onChange={(e) => set('toGrade', Number(e.target.value))}>
                {SCHOOL.grades.map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g, lang)}
                  </option>
                ))}
              </Select>
            </Field>
            {streamsPossible ? (
              <Field label={t('Stream')} error={err('stream')}>
                <Select value={values.stream} onChange={(e) => set('stream', e.target.value as Stream)}>
                  <option value="">{t('All')}</option>
                  {SCHOOL.streams.map((s) => (
                    <option key={s} value={s}>
                      {STREAM_LABELS[s][l]}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label={t('Code')} error={err('code')}>
              <Input value={values.code} onChange={(e) => set('code', e.target.value)} />
            </Field>
            <Field label={t('Order')} error={err('sort')} hint={t('Lower comes first on mark sheets.')}>
              <Input type="number" inputMode="numeric" min={0} value={values.sort} onChange={(e) => set('sort', e.target.value)} />
            </Field>
          </FormGrid>
          <label className="flex items-center gap-3 text-[15px] text-ink-800">
            <input type="checkbox" checked={values.optional} onChange={(e) => set('optional', e.target.checked)} className="h-4 w-4 accent-brand-700" />
            {t('Optional (an elective not every student takes)')}
          </label>
        </div>
      </Drawer>
    </>
  );
}

export function SubjectSwitch({ id, active }: { id: string; active: boolean }) {
  const t = useT();
  const save = useAction(setSubjectActiveAction, { success: active ? t('Switched off') : t('Switched on') });
  return (
    <LoadingButton variant="secondary" size="sm" loading={save.busy} onClick={() => save.run(id, !active)}>
      {active ? t('Switch off') : t('Switch on')}
    </LoadingButton>
  );
}

export function AssignmentPicker({ sectionId, subjectId, staffId, teachers }: { sectionId: string; subjectId: string; staffId: string; teachers: Teacher[] }) {
  const t = useT();
  const save = useAction(setAssignmentAction, { success: t('Saved') });
  return (
    <Select aria-label={t('Teacher')} value={staffId} disabled={save.busy} onChange={(e) => save.run({ sectionId, subjectId, staffId: e.target.value })} className="min-w-[12rem]">
      <option value="">{t('Not chosen')}</option>
      {teachers.map((teacher) => (
        <option key={teacher.id} value={teacher.id}>
          {teacher.name}
        </option>
      ))}
    </Select>
  );
}
