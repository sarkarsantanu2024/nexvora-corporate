'use client';

import { Check, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Card, CardHeader, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { todayIST } from '@/lib/date';
import { applyLeaveAction, cancelLeaveAction, decideLeaveAction, saveLeaveTypesAction } from '@/server/leave/actions';
import type { LeaveType } from '@/server/office/defaults';
import { useAction, useForm } from '../_ui/use-action';

export function ApplyLeaveButton({ office, staff, types }: { office: boolean; staff: { id: string; name: string; designation: string }[]; types: { key: string; name: string }[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const today = todayIST();
  const form = useForm({ staffId: office ? '' : (staff[0]?.id ?? ''), leaveType: types[0]?.key ?? '', fromDate: today, toDate: today, reason: '' });
  const save = useAction(applyLeaveAction, {
    success: office ? t('Leave recorded') : t('Leave applied for. The head of school will decide.'),
    onDone: () => {
      setOpen(false);
      form.reset();
    },
  });
  const v = form.values;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} /> {office ? t('Record leave') : t('Apply for leave')}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={office ? t('Record leave') : t('Apply for leave')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run({ ...v, staffId: v.staffId || null })}>
              {office ? t('Save') : t('Apply')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          {office ? (
            <Field label={t('Staff member')} required error={save.fields.staffId ? t(save.fields.staffId) : undefined}>
              <Select value={v.staffId} onChange={(e) => form.set('staffId', e.target.value)}>
                <option value="">{t('Choose')}</option>
                {staff.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field label={t('Kind of leave')} required error={save.fields.leaveType ? t(save.fields.leaveType) : undefined}>
            <Select value={v.leaveType} onChange={(e) => form.set('leaveType', e.target.value)}>
              {types.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.name}
                </option>
              ))}
            </Select>
          </Field>
          <FormGrid>
            <Field label={t('From')} required error={save.fields.fromDate ? t(save.fields.fromDate) : undefined}>
              <Input type="date" value={v.fromDate} onChange={(e) => form.set('fromDate', e.target.value)} />
            </Field>
            <Field label={t('To')} required error={save.fields.toDate ? t(save.fields.toDate) : undefined}>
              <Input type="date" value={v.toDate} min={v.fromDate} onChange={(e) => form.set('toDate', e.target.value)} />
            </Field>
          </FormGrid>
          <Field label={t('Reason')} hint={t('Sundays and holidays in between are not counted.')}>
            <Textarea value={v.reason} onChange={(e) => form.set('reason', e.target.value)} />
          </Field>
        </div>
      </Drawer>
    </>
  );
}

/** Approve at once; reject asks first and takes a short reason. */
export function DecideLeave({ id, name }: { id: string; name: string }) {
  const t = useT();
  const [note, setNote] = useState('');
  const decide = useAction(decideLeaveAction, { success: t('Done') });
  return (
    <>
      <LoadingButton size="sm" variant="success" loading={decide.busy} onClick={() => decide.run(id, 'approved', '')}>
        <Check size={15} /> {t('Approve')}
      </LoadingButton>
      <ConfirmButton
        size="sm"
        title={t('Reject the leave of {name}?', { name })}
        confirmLabel={t('Reject')}
        text={
          <Field label={t('Reason (optional)')}>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        }
        onConfirm={async () => void (await decide.run(id, 'rejected', note))}
      >
        <X size={15} /> {t('Reject')}
      </ConfirmButton>
    </>
  );
}

export function CancelLeave({ id }: { id: string }) {
  const t = useT();
  const cancel = useAction(cancelLeaveAction, { success: t('Leave cancelled') });
  return (
    <ConfirmButton size="sm" variant="ghost" title={t('Cancel this leave?')} confirmLabel={t('Cancel leave')} text={t('The days go back to the balance.')} onConfirm={async () => void (await cancel.run(id))}>
      {t('Cancel leave')}
    </ConfirmButton>
  );
}

/** The head of school's list of leave types and their yearly days. */
export function LeaveTypesForm({ initial }: { initial: LeaveType[] }) {
  const t = useT();
  const [types, setTypes] = useState(initial.map((type) => ({ ...type, quota: String(type.quota) })));
  const save = useAction(saveLeaveTypesAction, { success: t('Saved') });
  const set = (index: number, key: 'key' | 'name' | 'quota', value: string) => setTypes((list) => list.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  return (
    <Card>
      <CardHeader
        title={t('Leave types')}
        description={t('The yearly days of each kind of leave. 0 means no fixed limit. A code already used on an application should not be changed.')}
        action={
          <Button variant="secondary" size="sm" onClick={() => setTypes((list) => [...list, { key: '', name: '', quota: '0' }])}>
            <Plus size={16} /> {t('Add leave type')}
          </Button>
        }
      />
      <div className="space-y-2 p-5">
        <div className="grid grid-cols-[4.5rem_1fr_5rem_2.25rem] gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <span>{t('Code')}</span>
          <span>{t('Name')}</span>
          <span>{t('Days a year')}</span>
          <span />
        </div>
        {types.map((type, index) => (
          <div key={index} className="grid grid-cols-[4.5rem_1fr_5rem_2.25rem] items-center gap-2">
            <Input aria-label={t('Code')} value={type.key} maxLength={6} invalid={Boolean(save.fields[`${index}.key`])} onChange={(e) => set(index, 'key', e.target.value)} />
            <Input aria-label={t('Name')} value={type.name} invalid={Boolean(save.fields[`${index}.name`])} onChange={(e) => set(index, 'name', e.target.value)} />
            <Input aria-label={t('Days a year')} inputMode="numeric" value={type.quota} className="tabular text-center" onChange={(e) => set(index, 'quota', e.target.value.replace(/[^0-9]/g, ''))} />
            <Button variant="ghost" size="sm" className="w-9 px-0" aria-label={t('Remove')} onClick={() => setTypes((list) => list.filter((_, i) => i !== index))}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <LoadingButton loading={save.busy} onClick={() => save.run(types.map((type) => ({ key: type.key, name: type.name, quota: Number(type.quota || 0) })))}>
            {t('Save')}
          </LoadingButton>
        </div>
      </div>
    </Card>
  );
}
