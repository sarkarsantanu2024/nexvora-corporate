'use client';

import { LogOut, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StudentPicker, type PickedStudent } from '@/components/school/student-picker';
import { ConfirmButton, Drawer, LoadingButton } from '@/components/ui/client';
import { Avatar, Button, Field, FormGrid, Input } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { sectionLabel } from '@/config/school';
import { todayIST } from '@/lib/date';
import { addVisitorAction, createGatePassAction, deleteVisitorAction, markVisitorOutAction } from '@/server/office/actions';
import { nowTimeIST } from '@/server/office/labels';
import { useAction, useForm } from '../_ui/use-action';

const err = (t: (s: string) => string, value?: string) => (value ? t(value) : undefined);

export function AddVisitorButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const blank = () => ({ day: todayIST(), name: '', phone: '', whomToMeet: '', purpose: '', inTime: nowTimeIST(), outTime: '' });
  const form = useForm(blank());
  const save = useAction(addVisitorAction, {
    success: t('Visitor written in the book'),
    onDone: () => {
      setOpen(false);
      form.reset(blank());
    },
  });
  const v = form.values;
  return (
    <>
      <Button
        onClick={() => {
          form.reset(blank());
          setOpen(true);
        }}
      >
        <Plus size={18} /> {t('Add visitor')}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('Add visitor')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run(v)}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('Name')} required error={err(t, save.fields.name)}>
            <Input value={v.name} autoFocus onChange={(e) => form.set('name', e.target.value)} />
          </Field>
          <Field label={t('Mobile')} error={err(t, save.fields.phone)}>
            <Input type="tel" inputMode="tel" value={v.phone} onChange={(e) => form.set('phone', e.target.value)} />
          </Field>
          <Field label={t('To meet')}>
            <Input value={v.whomToMeet} placeholder={t('Headmaster, a teacher, the office')} onChange={(e) => form.set('whomToMeet', e.target.value)} />
          </Field>
          <Field label={t('Purpose')}>
            <Input value={v.purpose} onChange={(e) => form.set('purpose', e.target.value)} />
          </Field>
          <FormGrid className="grid-cols-3 sm:grid-cols-3">
            <Field label={t('Day')} error={err(t, save.fields.day)}>
              <Input type="date" value={v.day} max={todayIST()} onChange={(e) => form.set('day', e.target.value)} />
            </Field>
            <Field label={t('In')} error={err(t, save.fields.inTime)}>
              <Input type="time" value={v.inTime} onChange={(e) => form.set('inTime', e.target.value)} />
            </Field>
            <Field label={t('Out')} error={err(t, save.fields.outTime)}>
              <Input type="time" value={v.outTime} onChange={(e) => form.set('outTime', e.target.value)} />
            </Field>
          </FormGrid>
        </div>
      </Drawer>
    </>
  );
}

/** One tap when the visitor leaves: out time is now. */
export function MarkOut({ id }: { id: string }) {
  const t = useT();
  const out = useAction(markVisitorOutAction, { success: t('Marked out') });
  return (
    <LoadingButton size="sm" variant="secondary" loading={out.busy} onClick={() => out.run(id, nowTimeIST())}>
      <LogOut size={15} /> {t('Mark out')}
    </LoadingButton>
  );
}

export function DeleteVisitor({ id, name }: { id: string; name: string }) {
  const t = useT();
  const remove = useAction(deleteVisitorAction, { success: t('Removed') });
  return (
    <ConfirmButton size="sm" variant="ghost" className="w-9 px-0" aria-label={t('Remove')} title={t('Remove the visitor line of {name}?', { name })} confirmLabel={t('Remove')} onConfirm={async () => void (await remove.run(id))}>
      <Trash2 size={15} />
    </ConfirmButton>
  );
}

export function GatePassButton() {
  const t = useT();
  const lang = useUiLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const blank = () => ({ day: todayIST(), time: nowTimeIST(), guardianName: '', guardianRelation: '', guardianPhone: '', reason: '', approvedBy: '' });
  const form = useForm(blank());
  const save = useAction(createGatePassAction, {
    success: t('Gate pass written'),
    onDone: (data) => {
      setOpen(false);
      router.push(`/admin/visitors/pass/${data.id}`);
    },
  });
  const v = form.values;
  return (
    <>
      <Button
        onClick={() => {
          form.reset(blank());
          setStudent(null);
          setOpen(true);
        }}
      >
        <Plus size={18} /> {t('New gate pass')}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('New gate pass')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} disabled={!student} onClick={() => student && save.run({ ...v, studentId: student.id })}>
              {t('Save and print')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          {student ? (
            <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-3">
              <Avatar name={student.name} src={student.photo} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{student.name}</p>
                <p className="truncate text-xs text-ink-500">
                  {student.grade !== null ? sectionLabel({ grade: student.grade, name: student.sectionName ?? '', stream: student.stream ?? '', shift: student.shift ?? 'day' }, lang) : student.admissionNo}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStudent(null)}>
                {t('Change')}
              </Button>
            </div>
          ) : (
            <Field label={t('Student')} required>
              <StudentPicker onPick={setStudent} autoFocus />
            </Field>
          )}
          <FormGrid>
            <Field label={t('Who is taking him')} required error={err(t, save.fields.guardianName)}>
              <Input value={v.guardianName} onChange={(e) => form.set('guardianName', e.target.value)} />
            </Field>
            <Field label={t('Relation')}>
              <Input value={v.guardianRelation} placeholder={t('Father, mother, uncle')} onChange={(e) => form.set('guardianRelation', e.target.value)} />
            </Field>
          </FormGrid>
          <Field label={t('Mobile')} error={err(t, save.fields.guardianPhone)}>
            <Input type="tel" inputMode="tel" value={v.guardianPhone} onChange={(e) => form.set('guardianPhone', e.target.value)} />
          </Field>
          <Field label={t('Reason')} required error={err(t, save.fields.reason)}>
            <Input value={v.reason} placeholder={t('Fever, family function')} onChange={(e) => form.set('reason', e.target.value)} />
          </Field>
          <FormGrid>
            <Field label={t('Allowed by')} required error={err(t, save.fields.approvedBy)}>
              <Input value={v.approvedBy} placeholder={t('Headmaster, class teacher')} onChange={(e) => form.set('approvedBy', e.target.value)} />
            </Field>
            <Field label={t('Time')} error={err(t, save.fields.time)}>
              <Input type="time" value={v.time} onChange={(e) => form.set('time', e.target.value)} />
            </Field>
          </FormGrid>
        </div>
      </Drawer>
    </>
  );
}
