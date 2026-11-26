'use client';

import { CheckCircle2, ListPlus, Lock, Pencil, Plus, RotateCcw, Scale, Send, Trash2, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Field, FormGrid, Input, Notice, Select, Textarea } from '@/components/ui/core';
import { ConfirmButton, Drawer, LoadingButton, Modal } from '@/components/ui/client';
import { useT, useUiLang } from '@/components/ui/lang';
import { SCHOOL, gradeLabel } from '@/config/school';
import type { ExamStatus } from '@/db/schema';
import {
  createExamAction,
  deleteExamAction,
  deletePaperAction,
  saveGradeScaleAction,
  setExamStatusAction,
  setupPapersAction,
  updateExamAction,
  updatePaperAction,
} from '@/server/exams/actions';
import { EXAM_NAME_SUGGESTIONS } from '@/server/exams/constants';
import { useAction, useForm } from '../_ui/use-action';

type ExamValues = { name: string; fromGrade: string; toGrade: string; startsOn: string; endsOn: string; sort: string };

/** Add an exam, or change one (pass `exam`). */
export function ExamFormButton({ exam, nextSort = 1 }: { exam?: { id: string; name: string; fromGrade: number; toGrade: number; startsOn: string | null; endsOn: string | null; sort: number }; nextSort?: number }) {
  const t = useT();
  const lang = useUiLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const first = String(SCHOOL.grades[0]);
  const last = String(SCHOOL.grades[SCHOOL.grades.length - 1]);
  const initial: ExamValues = exam
    ? { name: exam.name, fromGrade: String(exam.fromGrade), toGrade: String(exam.toGrade), startsOn: exam.startsOn ?? '', endsOn: exam.endsOn ?? '', sort: String(exam.sort) }
    : { name: '', fromGrade: first, toGrade: last, startsOn: '', endsOn: '', sort: String(nextSort) };
  const form = useForm<ExamValues>(initial);
  const create = useAction(createExamAction, {
    success: t('Exam added'),
    onDone: (data) => {
      setOpen(false);
      router.push(`/admin/exams/${data.id}`);
    },
  });
  const update = useAction(updateExamAction, { success: t('Saved'), onDone: () => setOpen(false) });
  const busy = create.busy || update.busy;
  const fields = exam ? update.fields : create.fields;
  const save = () => {
    const input = { ...form.values, fromGrade: Number(form.values.fromGrade), toGrade: Number(form.values.toGrade), sort: Number(form.values.sort) || 0 };
    if (exam) void update.run(exam.id, input);
    else void create.run(input);
  };
  const err = (key: string) => (fields[key] ? t(fields[key]) : undefined);

  return (
    <>
      {exam ? (
        <Button variant="secondary" onClick={() => { form.reset(initial); setOpen(true); }}>
          <Pencil size={16} /> {t('Edit')}
        </Button>
      ) : (
        <Button onClick={() => { form.reset(initial); setOpen(true); }}>
          <Plus size={18} /> {t('Add exam')}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={exam ? t('Change the exam') : t('Add exam')}
        description={t('Which classes sit it and when. Papers come next.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={busy} onClick={save}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Name of the exam')} required error={err('name')}>
            <Input value={form.values.name} onChange={(e) => form.set('name', e.target.value)} list="exam-names" placeholder={t('First Summative')} invalid={Boolean(fields.name)} />
            <datalist id="exam-names">
              {EXAM_NAME_SUGGESTIONS.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <FormGrid>
            <Field label={t('From class')} error={err('fromGrade')}>
              <Select value={form.values.fromGrade} onChange={(e) => form.set('fromGrade', e.target.value)}>
                {SCHOOL.grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {gradeLabel(grade, lang)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('To class')} error={err('toGrade')}>
              <Select value={form.values.toGrade} onChange={(e) => form.set('toGrade', e.target.value)} invalid={Boolean(fields.toGrade)}>
                {SCHOOL.grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {gradeLabel(grade, lang)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('First day')} error={err('startsOn')}>
              <Input type="date" value={form.values.startsOn} onChange={(e) => form.set('startsOn', e.target.value)} />
            </Field>
            <Field label={t('Last day')} error={err('endsOn')}>
              <Input type="date" value={form.values.endsOn} onChange={(e) => form.set('endsOn', e.target.value)} invalid={Boolean(fields.endsOn)} />
            </Field>
            <Field label={t('Order in the year')} hint={t('1 for the first exam of the year, 2 for the next')} error={err('sort')}>
              <Input type="number" inputMode="numeric" min={0} value={form.values.sort} onChange={(e) => form.set('sort', e.target.value)} />
            </Field>
          </FormGrid>
        </div>
      </Drawer>
    </>
  );
}

/** Draft → open → published, and back where allowed. Publishing and taking results back are for the head of school. */
export function StatusActions({ id, name, status, isAdmin, short }: { id: string; name: string; status: ExamStatus; isAdmin: boolean; short: number }) {
  const t = useT();
  const change = useAction(setExamStatusAction, { success: t('Status changed') });
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (status === 'draft') {
    return (
      <LoadingButton loading={change.busy} onClick={() => void change.run(id, 'open')}>
        <Unlock size={16} /> {t('Open for marks')}
      </LoadingButton>
    );
  }
  if (status === 'open') {
    return (
      <>
        <ConfirmButton variant="secondary" danger={false} title={t('Close {name} for marks?', { name })} text={t('Teachers cannot enter marks while the exam is a draft. Marks already entered are kept.')} confirmLabel={t('Back to draft')} onConfirm={async () => void (await change.run(id, 'draft'))}>
          <Lock size={16} /> {t('Back to draft')}
        </ConfirmButton>
        {isAdmin ? (
          <ConfirmButton
            variant="primary"
            danger={false}
            title={t('Publish the results of {name}?', { name })}
            text={
              <div className="space-y-2">
                <p>{t('Parents will see the results and marks will be locked.')}</p>
                {short ? <Notice tone="amber">{t('{n} papers still have marks missing.', { n: short })}</Notice> : null}
              </div>
            }
            confirmLabel={t('Publish results')}
            onConfirm={async () => void (await change.run(id, 'published'))}
          >
            <Send size={16} /> {t('Publish results')}
          </ConfirmButton>
        ) : null}
      </>
    );
  }
  if (!isAdmin) return null;
  return (
    <>
      <Button variant="secondary" onClick={() => { setReason(''); setReasonOpen(true); }}>
        <RotateCcw size={16} /> {t('Take back results')}
      </Button>
      <Modal
        open={reasonOpen}
        onClose={() => !change.busy && setReasonOpen(false)}
        title={t('Take back the results of {name}?', { name })}
        description={t('Parents stop seeing them and teachers can correct marks again. The reason goes in the activity log.')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReasonOpen(false)} disabled={change.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton
              variant="accent"
              loading={change.busy}
              disabled={!reason.trim()}
              onClick={async () => {
                if (await change.run(id, 'open', reason)) setReasonOpen(false);
              }}
            >
              {t('Take back results')}
            </LoadingButton>
          </>
        }
      >
        <Field label={t('Reason')} required error={change.fields.reason ? t(change.fields.reason) : undefined}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Wrong marks in Class 7 A Mathematics')} />
        </Field>
      </Modal>
    </>
  );
}

export function DeleteExam({ id, name }: { id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const remove = useAction(deleteExamAction, { success: t('Exam deleted'), onDone: () => router.push('/admin/exams') });
  return (
    <ConfirmButton title={t('Delete the exam {name}?', { name })} text={t('Only an exam without any marks can be deleted. Its papers go with it.')} confirmLabel={t('Delete')} onConfirm={async () => void (await remove.run(id))}>
      <Trash2 size={16} /> {t('Delete')}
    </ConfirmButton>
  );
}

/** Adds a paper for each subject of each class, with the full and pass marks given here. */
export function SetupPapersButton({ id, hasHs, primary }: { id: string; hasHs: boolean; primary: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const form = useForm({ fullMarks: '100', passMarks: '25', hsFullMarks: '100', hsPassMarks: '30' });
  const setup = useAction(setupPapersAction, {
    success: (data) => (data.added ? t('{n} papers added', { n: data.added }) : t('Every subject already has a paper')),
    onDone: () => setOpen(false),
  });
  const err = (key: string) => (setup.fields[key] ? t(setup.fields[key]) : undefined);
  return (
    <>
      <Button variant={primary ? 'primary' : 'secondary'} onClick={() => setOpen(true)}>
        <ListPlus size={16} /> {t('Set up papers')}
      </Button>
      <Modal
        open={open}
        onClose={() => !setup.busy && setOpen(false)}
        title={t('Set up papers')}
        description={t('A paper is added for every subject taught in each class of this exam. Papers already there are kept. Change the marks of one paper afterwards if it differs.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={setup.busy}>
              {t('Cancel')}
            </Button>
            <LoadingButton
              loading={setup.busy}
              onClick={() =>
                void setup.run(id, { fullMarks: Number(form.values.fullMarks), passMarks: Number(form.values.passMarks), hsFullMarks: Number(form.values.hsFullMarks), hsPassMarks: Number(form.values.hsPassMarks) })
              }
            >
              {t('Add papers')}
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label={hasHs ? t('Full marks up to Class 10') : t('Full marks')} error={err('fullMarks')}>
            <Input type="number" inputMode="numeric" min={1} value={form.values.fullMarks} onChange={(e) => form.set('fullMarks', e.target.value)} />
          </Field>
          <Field label={hasHs ? t('Pass marks up to Class 10') : t('Pass marks')} error={err('passMarks')}>
            <Input type="number" inputMode="numeric" min={0} value={form.values.passMarks} onChange={(e) => form.set('passMarks', e.target.value)} />
          </Field>
          {hasHs ? (
            <>
              <Field label={t('Full marks in Class 11 and 12')} error={err('hsFullMarks')}>
                <Input type="number" inputMode="numeric" min={1} value={form.values.hsFullMarks} onChange={(e) => form.set('hsFullMarks', e.target.value)} />
              </Field>
              <Field label={t('Pass marks in Class 11 and 12')} error={err('hsPassMarks')}>
                <Input type="number" inputMode="numeric" min={0} value={form.values.hsPassMarks} onChange={(e) => form.set('hsPassMarks', e.target.value)} />
              </Field>
            </>
          ) : null}
        </FormGrid>
      </Modal>
    </>
  );
}

/** Full marks, pass marks and date of one paper. */
export function PaperEditButton({ paper, label, locked }: { paper: { id: string; fullMarks: number; passMarks: number; examDate: string | null }; label: string; locked: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const initial = { fullMarks: String(paper.fullMarks), passMarks: String(paper.passMarks), examDate: paper.examDate ?? '' };
  const form = useForm(initial);
  const save = useAction(updatePaperAction, { success: t('Saved'), onDone: () => setOpen(false) });
  const remove = useAction(deletePaperAction, { success: t('Paper removed'), onDone: () => setOpen(false) });
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  if (locked) return null;
  return (
    <>
      <Button variant="ghost" size="sm" className="w-9 px-0" aria-label={t('Change {name}', { name: label })} title={t('Change')} onClick={() => { form.reset(initial); setOpen(true); }}>
        <Pencil size={15} />
      </Button>
      <Modal
        open={open}
        onClose={() => !save.busy && setOpen(false)}
        title={label}
        size="sm"
        footer={
          <>
            <Button variant="ghost" className="mr-auto text-accent-700" disabled={save.busy || remove.busy} onClick={() => void remove.run(paper.id)}>
              <Trash2 size={15} /> {t('Remove paper')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => void save.run(paper.id, form.values)}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <FormGrid>
          <Field label={t('Full marks')} error={err('fullMarks')}>
            <Input type="number" inputMode="numeric" min={1} value={form.values.fullMarks} onChange={(e) => form.set('fullMarks', e.target.value)} invalid={Boolean(save.fields.fullMarks)} />
          </Field>
          <Field label={t('Pass marks')} error={err('passMarks')}>
            <Input type="number" inputMode="numeric" min={0} value={form.values.passMarks} onChange={(e) => form.set('passMarks', e.target.value)} invalid={Boolean(save.fields.passMarks)} />
          </Field>
          <Field label={t('Date of the paper')} className="sm:col-span-2">
            <Input type="date" value={form.values.examDate} onChange={(e) => form.set('examDate', e.target.value)} />
          </Field>
        </FormGrid>
      </Modal>
    </>
  );
}

/** The letter grades and the percentage each starts at. Admin only. */
export function GradeScaleButton({ scale }: { scale: { grade: string; min: number }[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(scale.map((row) => ({ grade: row.grade, min: String(row.min) })));
  const save = useAction(saveGradeScaleAction, { success: t('Grading scale saved'), onDone: () => setOpen(false) });
  const set = (index: number, key: 'grade' | 'min', value: string) => setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  return (
    <>
      <Button variant="secondary" onClick={() => { setRows(scale.map((row) => ({ grade: row.grade, min: String(row.min) }))); setOpen(true); }}>
        <Scale size={16} /> {t('Grading scale')}
      </Button>
      <Modal
        open={open}
        onClose={() => !save.busy && setOpen(false)}
        title={t('Grading scale')}
        description={t('The letter grade a boy gets from his percentage. Set by the school; check it against the board before results go out.')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRows((current) => [...current, { grade: '', min: '' }])} className="mr-auto">
              <Plus size={15} /> {t('Add grade')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => void save.run(rows.filter((row) => row.grade.trim() || row.min !== ''))}>
              <CheckCircle2 size={16} /> {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <span>{t('Grade')}</span>
            <span>{t('From %')}</span>
            <span className="w-9" />
          </div>
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <Input value={row.grade} onChange={(e) => set(index, 'grade', e.target.value)} aria-label={t('Grade')} maxLength={4} />
              <Input type="number" inputMode="numeric" min={0} max={100} value={row.min} onChange={(e) => set(index, 'min', e.target.value)} aria-label={t('From %')} />
              <Button variant="ghost" size="sm" className="w-9 px-0" aria-label={t('Remove')} onClick={() => setRows((current) => current.filter((_, i) => i !== index))}>
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
