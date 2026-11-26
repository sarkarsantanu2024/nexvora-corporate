'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { ConfirmButton, Drawer, LoadingButton } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { MEETING_KINDS, type Meeting, type MeetingKind } from '@/db/schema';
import { todayIST } from '@/lib/date';
import { deleteMeetingAction, saveMeetingAction } from '@/server/office/actions';
import { MEETING_KIND_LABELS } from '@/server/office/labels';
import { useAction, useForm } from '../_ui/use-action';

export function MeetingFormButton({ grades, meeting }: { grades: { grade: number; label: string }[]; meeting?: Meeting }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const start = () => ({
    kind: (meeting?.kind ?? 'smc') as MeetingKind,
    day: meeting?.day ?? todayIST(),
    time: meeting?.time ?? '',
    title: meeting?.title ?? '',
    grade: meeting?.grade !== null && meeting?.grade !== undefined ? String(meeting.grade) : '',
    venue: meeting?.venue ?? '',
    attendees: meeting?.attendees ?? '',
    agenda: meeting?.agenda ?? '',
    minutes: meeting?.minutes ?? '',
    attachment: meeting?.attachment ?? '',
  });
  const form = useForm(start());
  const save = useAction(saveMeetingAction, {
    success: t('Saved'),
    onDone: (data) => {
      setOpen(false);
      if (!meeting) router.push(`/admin/meetings/${data.id}`);
    },
  });
  const v = form.values;
  const err = (key: string) => (save.fields[key] ? t(save.fields[key]) : undefined);
  return (
    <>
      <Button
        variant={meeting ? 'secondary' : 'primary'}
        onClick={() => {
          form.reset(start());
          setOpen(true);
        }}
      >
        {meeting ? <Pencil size={16} /> : <Plus size={18} />} {meeting ? t('Edit') : t('Add meeting')}
      </Button>
      <Drawer
        wide
        open={open}
        onClose={() => setOpen(false)}
        title={meeting ? t('Edit meeting') : t('Add meeting')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={save.busy} onClick={() => save.run(meeting?.id ?? null, { ...v, grade: v.kind === 'ptm' && v.grade ? Number(v.grade) : null })}>
              {t('Save')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormGrid>
            <Field label={t('Kind of meeting')}>
              <Select value={v.kind} onChange={(e) => form.set('kind', e.target.value as MeetingKind)}>
                {MEETING_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(MEETING_KIND_LABELS[kind])}
                  </option>
                ))}
              </Select>
            </Field>
            {v.kind === 'ptm' ? (
              <Field label={t('Class')} hint={t('Leave as every class for a meeting of the whole school.')} error={err('grade')}>
                <Select value={v.grade} onChange={(e) => form.set('grade', e.target.value)}>
                  <option value="">{t('Every class')}</option>
                  {grades.map((row) => (
                    <option key={row.grade} value={row.grade}>
                      {row.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label={t('Venue')}>
                <Input value={v.venue} onChange={(e) => form.set('venue', e.target.value)} />
              </Field>
            )}
            <Field label={t('Date')} required error={err('day')}>
              <Input type="date" value={v.day} onChange={(e) => form.set('day', e.target.value)} />
            </Field>
            <Field label={t('Time')} error={err('time')}>
              <Input type="time" value={v.time} onChange={(e) => form.set('time', e.target.value)} />
            </Field>
          </FormGrid>
          <Field label={t('Title')} hint={t('For example: Meeting on the annual sports')}>
            <Input value={v.title} onChange={(e) => form.set('title', e.target.value)} />
          </Field>
          <Field label={t('Present')} hint={t('Names of those who came, one per line, or the number of parents present.')}>
            <Textarea value={v.attendees} onChange={(e) => form.set('attendees', e.target.value)} />
          </Field>
          <Field label={t('Agenda')}>
            <Textarea value={v.agenda} onChange={(e) => form.set('agenda', e.target.value)} />
          </Field>
          <Field label={t('Resolutions and minutes')}>
            <Textarea rows={8} value={v.minutes} onChange={(e) => form.set('minutes', e.target.value)} />
          </Field>
          <Field label={t('Photo of the signed minutes')}>
            <ImageField value={v.attachment} onChange={(url) => form.set('attachment', url)} folder="meetings" />
          </Field>
        </div>
      </Drawer>
    </>
  );
}

export function DeleteMeeting({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const remove = useAction(deleteMeetingAction, { success: t('Removed'), onDone: () => router.push('/admin/meetings') });
  return (
    <ConfirmButton title={t('Remove this meeting?')} text={t('Its minutes are removed too.')} confirmLabel={t('Remove')} onConfirm={async () => void (await remove.run(id))}>
      <Trash2 size={16} /> {t('Remove')}
    </ConfirmButton>
  );
}
