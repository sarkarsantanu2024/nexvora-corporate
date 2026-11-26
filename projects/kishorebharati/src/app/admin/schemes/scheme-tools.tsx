'use client';

/** Forms of Government schemes: one student, a whole section, change and remove. */
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { StudentPicker, type PickedStudent } from '@/components/school/student-picker';
import { ConfirmButton, Drawer, LoadingButton, Modal } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { BENEFIT_STATUSES, type BenefitStatus } from '@/db/schema';
import { addBenefitAction, addBenefitsForSectionAction, deleteBenefitAction, updateBenefitAction } from '@/server/schemes/actions';
import { sectionRosterAction } from '@/server/students/actions';
import { BENEFIT_STATUS_LABELS } from '@/server/students/constants';
import { useAction } from '../_ui/use-action';

type Fields = { scheme: string; year: string; status: BenefitStatus; amount: string; receivedOn: string; note: string };

function SchemeFields({ values, set, errors, suggestions }: { values: Fields; set: <K extends keyof Fields>(key: K, value: Fields[K]) => void; errors: Record<string, string>; suggestions: string[] }) {
  const t = useT();
  const err = (key: string) => (errors[key] ? t(errors[key]) : undefined);
  return (
    <div className="space-y-4">
      <FormGrid>
        <Field label={t('Scheme')} required error={err('scheme')}>
          <Input value={values.scheme} onChange={(e) => set('scheme', e.target.value)} list="scheme-names" autoComplete="off" />
          <datalist id="scheme-names">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label={t('Year')} required error={err('year')}>
          <Input value={values.year} onChange={(e) => set('year', e.target.value)} />
        </Field>
        <Field label={t('Status')} error={err('status')}>
          <Select value={values.status} onChange={(e) => set('status', e.target.value as BenefitStatus)}>
            {BENEFIT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(BENEFIT_STATUS_LABELS[s])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('Amount (₹)')} error={err('amount')} hint={t('Leave 0 for a bicycle or tablet.')}>
          <Input type="number" inputMode="numeric" min={0} step={1} value={values.amount} onChange={(e) => set('amount', e.target.value)} />
        </Field>
        {values.status === 'received' ? (
          <Field label={t('Received on')} error={err('receivedOn')}>
            <Input type="date" value={values.receivedOn} onChange={(e) => set('receivedOn', e.target.value)} />
          </Field>
        ) : null}
      </FormGrid>
      <Field label={t('Note')} error={err('note')}>
        <Textarea rows={2} value={values.note} onChange={(e) => set('note', e.target.value)} maxLength={300} />
      </Field>
    </div>
  );
}

const toInput = (values: Fields) => ({ ...values, amount: Number(values.amount) || 0, receivedOn: values.status === 'received' ? values.receivedOn : '' });

export function BenefitForm({
  suggestions,
  year,
  benefit,
}: {
  suggestions: string[];
  year: string;
  benefit?: { id: string; name: string; scheme: string; year: string; status: BenefitStatus; amount: number; receivedOn: string | null; note: string };
}) {
  const t = useT();
  const start = (): Fields => ({
    scheme: benefit?.scheme ?? '',
    year: benefit?.year ?? year,
    status: benefit?.status ?? 'applied',
    amount: String(benefit?.amount ?? 0),
    receivedOn: benefit?.receivedOn ?? '',
    note: benefit?.note ?? '',
  });
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const [values, setValues] = useState(start);
  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => setValues((v) => ({ ...v, [key]: value }));
  const close = () => setOpen(false);
  const add = useAction(addBenefitAction, { success: t('Saved'), onDone: close });
  const update = useAction(updateBenefitAction, { success: t('Saved'), onDone: close });
  const busy = add.busy || update.busy;
  return (
    <>
      {benefit ? (
        <Button variant="secondary" size="sm" onClick={() => (setValues(start()), setOpen(true))} aria-label={t('Edit')}>
          <Pencil size={15} />
        </Button>
      ) : (
        <Button onClick={() => (setValues(start()), setStudent(null), setOpen(true))}>
          <Plus size={18} /> {t('Add')}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={close}
        title={benefit ? benefit.name : t('Scheme for a student')}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('Cancel')}
            </Button>
            <LoadingButton
              loading={busy}
              disabled={!benefit && !student}
              onClick={() => (benefit ? update.run(benefit.id, toInput(values)) : student ? add.run({ ...toInput(values), studentId: student.id }) : undefined)}
            >
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          {!benefit ? (
            student ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink-900">{student.name}</span>
                  <span className="tabular block text-xs text-ink-500">{student.admissionNo}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setStudent(null)}>
                  {t('Change')}
                </Button>
              </div>
            ) : (
              <StudentPicker onPick={setStudent} />
            )
          ) : null}
          <SchemeFields values={values} set={set} errors={{ ...add.fields, ...update.fields }} suggestions={suggestions} />
        </div>
      </Drawer>
    </>
  );
}

type RosterRow = { id: string; name: string; admissionNo: string; rollNo: number | null; status: string };

/** One scheme for many students of a section at once. */
export function BulkBenefits({ sections, suggestions, year }: { sections: { id: string; label: string }[]; suggestions: string[]; year: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [sectionId, setSectionId] = useState('');
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Fields>({ scheme: '', year, status: 'applied', amount: '0', receivedOn: '', note: '' });
  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => setValues((v) => ({ ...v, [key]: value }));
  const load = useAction(sectionRosterAction, {
    onDone: (rows) => {
      const onRoll = rows.filter((row) => row.status === 'active');
      setRoster(onRoll);
      setTicked(new Set(onRoll.map((row) => row.id)));
    },
  });
  const save = useAction(addBenefitsForSectionAction, {
    success: (data) => t('{added} entered; {skipped} already had it.', data),
    onDone: () => setOpen(false),
  });
  const chooseSection = (id: string) => {
    setSectionId(id);
    setRoster([]);
    if (id) void load.run(id);
  };
  const toggle = (id: string) =>
    setTicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Users size={18} /> {t('For a section')}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={t('A scheme for a whole section')}
        description={t('Students who already have this scheme for the year are left as they are.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} disabled={!ticked.size} onClick={() => save.run({ ...toInput(values), sectionId, studentIds: [...ticked] })}>
              {t('Enter for {n} students', { n: ticked.size })}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Section')} required>
            <Select value={sectionId} onChange={(e) => chooseSection(e.target.value)}>
              <option value="">{t('Choose a section')}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          {roster.length ? (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-ink-200 p-3">
              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {roster.map((row) => (
                  <label key={row.id} className="flex items-center gap-2 text-sm text-ink-800">
                    <input type="checkbox" checked={ticked.has(row.id)} onChange={() => toggle(row.id)} className="h-4 w-4 accent-brand-700" />
                    <span className="tabular w-6 text-ink-500">{row.rollNo}</span> {row.name}
                  </label>
                ))}
              </div>
            </div>
          ) : sectionId && !load.busy ? (
            <p className="text-sm text-ink-500">{t('No students on roll in this section.')}</p>
          ) : null}
          <SchemeFields values={values} set={set} errors={save.fields} suggestions={suggestions} />
        </div>
      </Modal>
    </>
  );
}

export function DeleteBenefit({ id }: { id: string }) {
  const t = useT();
  const remove = useAction(deleteBenefitAction, { success: t('Removed') });
  return (
    <ConfirmButton size="sm" title={t('Remove this entry?')} text={t('Only for a wrong entry. A scheme that was refused is marked rejected instead.')} confirmLabel={t('Remove')} onConfirm={async () => void (await remove.run(id))} aria-label={t('Remove')}>
      <Trash2 size={15} />
    </ConfirmButton>
  );
}
