'use client';

/** Add or edit an enquiry in a side panel. The same form serves both. */
import { Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Drawer, LoadingButton, useToast } from '@/components/ui/client';
import { Button, Field, FormGrid, Input, Select, Textarea } from '@/components/ui/core';
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
      return toast.error(result.error);
    }
    toast.success(edit ? 'Enquiry saved' : 'Enquiry added');
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {edit ? (
        <Button variant="secondary" onClick={show}>
          <Pencil size={17} /> Edit
        </Button>
      ) : (
        <Button onClick={show}>
          <Plus size={18} /> Add enquiry
        </Button>
      )}
      <Drawer
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={edit ? 'Edit enquiry' : 'New enquiry'}
        description={edit ? undefined : 'For a parent who walked in or called.'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <LoadingButton loading={saving} onClick={save}>
              {edit ? 'Save' : 'Add enquiry'}
            </LoadingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Child's name" required error={errors.childName}>
            <Input {...bind('childName')} autoComplete="off" />
          </Field>
          <FormGrid>
            <Field label="Date of birth" error={errors.dob}>
              <Input type="date" max={today} {...bind('dob')} />
            </Field>
            <Field label="Programme" error={errors.programmeId}>
              <Select {...bind('programmeId')}>
                <option value="">Not sure yet</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.ageLabel})
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
          <Field label="Parent's name" required error={errors.parentName}>
            <Input {...bind('parentName')} autoComplete="off" />
          </Field>
          <FormGrid>
            <Field label="Mobile number" required error={errors.phone}>
              <Input type="tel" inputMode="numeric" {...bind('phone')} autoComplete="off" />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" {...bind('email')} autoComplete="off" />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Area" error={errors.area}>
              <Input {...bind('area')} />
            </Field>
            <Field label="How they found us" error={errors.source}>
              <Select {...bind('source')}>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabel(source)}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
          <Field label="Next follow-up" hint="The day to call them again." error={errors.nextFollowUp}>
            <Input type="date" {...bind('nextFollowUp')} />
          </Field>
          <Field label="What they asked" error={errors.message}>
            <Textarea {...bind('message')} maxLength={1000} />
          </Field>
        </div>
      </Drawer>
    </>
  );
}
