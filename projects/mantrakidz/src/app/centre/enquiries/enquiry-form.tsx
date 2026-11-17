'use client';

/** Add or edit an enquiry in a side panel. The same form serves both. */
import { Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Drawer, LoadingButton, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
import { useT } from '@/components/ui/lang';
import { createEnquiryAction, updateEnquiryAction } from '@/server/centre/children/actions';
import { ENQUIRY_SOURCES, sourceLabel } from '@/server/centre/children/constants';

export type EnquiryValues = {
  childName: string;
  dob: string;
  programmeId: string;
  parentName: string;
  phone: string;
  email: string;
  area: string;
  message: string;
  source: string;
  nextFollowUp: string;
};

const BLANK: EnquiryValues = { childName: '', dob: '', programmeId: '', parentName: '', phone: '', email: '', area: '', message: '', source: 'walk-in', nextFollowUp: '' };

export function EnquiryFormButton({
  programmes,
  today,
  edit,
}: {
  programmes: { id: string; name: string; ageLabel: string }[];
  today: string;
  /** When set, the button edits this enquiry instead of adding one. */
  edit?: { id: string; values: EnquiryValues };
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<EnquiryValues>(edit?.values ?? BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const bind = (key: keyof EnquiryValues) => ({
    value: values[key],
    invalid: Boolean(errors[key]),
    onChange: (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value })),
  });
  // A source that came from elsewhere (an old import, say) must stay selectable when editing.
  const sources = ENQUIRY_SOURCES.includes(values.source as (typeof ENQUIRY_SOURCES)[number]) ? [...ENQUIRY_SOURCES] : [...ENQUIRY_SOURCES, values.source];

  function show() {
    setValues(edit?.values ?? BLANK);
    setErrors({});
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const result = edit ? await updateEnquiryAction(edit.id, values) : await createEnquiryAction(values);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      return toast.error(t(result.error));
    }
    toast.success(edit ? t('Enquiry saved') : t('Enquiry added'));
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {edit ? (
        <Button variant="secondary" onClick={show}>
          <Pencil size={17} /> {t('Edit')}
        </Button>
      ) : (
        <Button onClick={show}>
          <Plus size={18} /> {t('Add enquiry')}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={edit ? t('Edit enquiry') : t('New enquiry')}
        description={edit ? undefined : t('For a parent who walked in or called.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              {t('Cancel')}
            </Button>
            <LoadingButton loading={saving} onClick={save}>
              {edit ? t('Save') : t('Add enquiry')}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t("Child's name")} required error={errors.childName && t(errors.childName)}>
            <Input {...bind('childName')} autoComplete="off" />
          </Field>
          <FormGrid>
            <Field label={t('Date of birth')} error={errors.dob && t(errors.dob)}>
              <Input type="date" max={today} {...bind('dob')} />
            </Field>
            <Field label={t('Programme')} error={errors.programmeId && t(errors.programmeId)}>
              <Select {...bind('programmeId')}>
                <option value="">{t('Not sure yet')}</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.ageLabel})
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
          <Field label={t("Parent's name")} required error={errors.parentName && t(errors.parentName)}>
            <Input {...bind('parentName')} autoComplete="off" />
          </Field>
          <FormGrid>
            <Field label={t('Mobile number')} required error={errors.phone && t(errors.phone)}>
              <Input type="tel" inputMode="numeric" {...bind('phone')} autoComplete="off" />
            </Field>
            <Field label={t('Email')} error={errors.email && t(errors.email)}>
              <Input type="email" {...bind('email')} autoComplete="off" />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label={t('Area')} error={errors.area && t(errors.area)}>
              <Input {...bind('area')} />
            </Field>
            <Field label={t('How they found us')} error={errors.source && t(errors.source)}>
              <Select {...bind('source')}>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {t(sourceLabel(source))}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
          <Field label={t('Next follow-up')} hint={t('The day to call them again.')} error={errors.nextFollowUp && t(errors.nextFollowUp)}>
            <Input type="date" {...bind('nextFollowUp')} />
          </Field>
          <Field label={t('What they asked')} error={errors.message && t(errors.message)}>
            <Textarea {...bind('message')} maxLength={1000} />
          </Field>
        </div>
      </Drawer>
    </>
  );
}
