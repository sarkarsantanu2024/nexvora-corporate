'use client';

/** Add or edit a class, and the small actions on a class card. */
import { Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmButton, Drawer, LoadingButton, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { createBatchAction, deleteBatchAction, setBatchActiveAction, updateBatchAction } from '@/server/centre/children/actions';

export type BatchValues = { programmeId: string; academicYearId: string; name: string; capacity: string; timing: string; teacherId: string };

type Options = {
  programmes: { id: string; name: string; seatsPerClass: number; timing: string }[];
  years: { id: string; name: string; isCurrent: boolean }[];
  teachers: { id: string; name: string; roleTitle: string }[];
};

export function BatchFormButton({ options, defaultYearId, edit }: { options: Options; defaultYearId: string; edit?: { id: string; values: BatchValues; hasChildren: boolean } }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const blank: BatchValues = { programmeId: '', academicYearId: defaultYearId, name: '', capacity: '12', timing: '', teacherId: '' };
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<BatchValues>(edit?.values ?? blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const bind = (key: keyof BatchValues) => ({
    value: values[key],
    invalid: Boolean(errors[key]),
    onChange: (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value })),
  });

  function chooseProgramme(programmeId: string) {
    const programme = options.programmes.find((p) => p.id === programmeId);
    setValues((v) => ({
      ...v,
      programmeId,
      // Suggest a name, the usual seats and timing; all three can be changed.
      name: v.name || (programme ? `${programme.name} A` : ''),
      capacity: edit || !programme ? v.capacity : String(programme.seatsPerClass),
      timing: v.timing || programme?.timing || '',
    }));
  }

  async function save() {
    setSaving(true);
    const input = { ...values, capacity: Number(values.capacity) };
    const result = edit ? await updateBatchAction(edit.id, input) : await createBatchAction(input);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      return toast.error(t(result.error));
    }
    toast.success(edit ? t('Class saved') : t('Class added'));
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {edit ? (
        <Button variant="secondary" size="sm" onClick={() => { setValues(edit.values); setErrors({}); setOpen(true); }}>
          <Pencil size={15} /> {t('Edit')}
        </Button>
      ) : (
        <Button onClick={() => { setValues(blank); setErrors({}); setOpen(true); }}>
          <Plus size={18} /> {t('Add a class')}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={edit ? t('Edit class') : t('New class')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={saving} onClick={save}>
              {edit ? t('Save') : t('Add class')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormGrid>
            <Field label={t('Programme')} required error={errors.programmeId && t(errors.programmeId)} hint={edit?.hasChildren ? t('Fixed while the class has children.') : undefined}>
              <Select value={values.programmeId} invalid={Boolean(errors.programmeId)} disabled={edit?.hasChildren} onChange={(event) => chooseProgramme(event.target.value)}>
                <option value="">{t('Choose')}</option>
                {options.programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('Academic year')} required error={errors.academicYearId && t(errors.academicYearId)}>
              <Select {...bind('academicYearId')} disabled={edit?.hasChildren}>
                {options.years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.isCurrent ? t('{name} (this year)', { name: y.name }) : y.name}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
          <Field label={t('Class name')} required error={errors.name && t(errors.name)} hint={t('For example Nursery A, or Nursery evening.')}>
            <Input {...bind('name')} autoComplete="off" />
          </Field>
          <FormGrid>
            <Field label={t('Seats')} required error={errors.capacity && t(errors.capacity)}>
              <Input type="number" inputMode="numeric" min={1} max={60} {...bind('capacity')} />
            </Field>
            <Field label={t('Timing')} error={errors.timing && t(errors.timing)}>
              <Input {...bind('timing')} placeholder={t('9:00 am to 11:30 am')} />
            </Field>
          </FormGrid>
          <Field label={t('Class teacher')} error={errors.teacherId && t(errors.teacherId)} hint={options.teachers.length ? undefined : t('Add teachers under Staff to choose one here.')}>
            <Select {...bind('teacherId')}>
              <option value="">{t('Not assigned')}</option>
              {options.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.roleTitle})
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Drawer>
    </>
  );
}

export function BatchCardActions({ id, name, active, hasChildren }: { id: string; name: string; active: boolean; hasChildren: boolean }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function setActive(next: boolean) {
    setBusy(true);
    const result = await setBatchActiveAction(id, next);
    setBusy(false);
    if (!result.ok) return toast.error(t(result.error));
    toast.success(next ? t('{name} reopened', { name }) : t('{name} closed', { name }));
    router.refresh();
  }

  return (
    <>
      {active ? (
        <ConfirmButton
          size="sm"
          variant="ghost"
          danger={false}
          title={t('Close {name}?', { name })}
          text={t('A closed class is no longer offered for new children or on the attendance screen. Its children and history are kept, and you can reopen it.')}
          confirmLabel={t('Close class')}
          onConfirm={() => setActive(false)}
        >
          {t('Close')}
        </ConfirmButton>
      ) : (
        <LoadingButton size="sm" variant="ghost" loading={busy} onClick={() => setActive(true)}>
          {t('Reopen')}
        </LoadingButton>
      )}
      {!hasChildren ? (
        <ConfirmButton
          size="sm"
          variant="ghost"
          title={t('Delete {name}?', { name })}
          text={t('The class is removed for good. This is only possible because no child has ever been placed in it.')}
          confirmLabel={t('Delete class')}
          onConfirm={async () => {
            const result = await deleteBatchAction(id);
            if (!result.ok) return toast.error(t(result.error));
            toast.success(t('Class deleted'));
            router.refresh();
          }}
        >
          {t('Delete')}
        </ConfirmButton>
      ) : null}
    </>
  );
}
