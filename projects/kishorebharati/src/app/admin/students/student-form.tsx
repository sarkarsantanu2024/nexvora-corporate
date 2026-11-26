'use client';

/** The admission form, also used to edit a student. One page, four parts. */
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Card, CardBody, CardHeader, Field, FormGrid, Input, LinkButton, Notice, Select, Textarea } from '@/components/ui/core';
import { useT, useUiLang } from '@/components/ui/lang';
import { sectionLabel } from '@/config/school';
import { CATEGORIES, GENDERS, type Category, type Gender, type Shift, type Stream } from '@/db/schema';
import { admitStudentAction, updateStudentAction } from '@/server/students/actions';
import { BLOOD_GROUPS, CATEGORY_LABELS, GENDER_LABELS, RELIGIONS } from '@/server/students/constants';
import type { StudentInput } from '@/server/students/service';

export type StudentFormValues = {
  name: string;
  nameBn: string;
  gender: Gender;
  dob: string;
  photo: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianRelation: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  category: Category;
  religion: string;
  bloodGroup: string;
  portalId: string;
  admittedOn: string;
  admissionNo: string;
  sectionId: string;
  rollNo: string;
};

export type SectionChoice = { id: string; grade: number; name: string; stream: Stream; shift: Shift; capacity: number; students: number; lastRoll: number };

function Part({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="animate-fade-up">
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

export function StudentForm({
  initial,
  sections,
  studentId,
  today,
  admissionHint,
}: {
  initial: StudentFormValues;
  sections: SectionChoice[];
  /** Set when editing. */
  studentId?: string;
  today: string;
  /** How the next admission number will look. */
  admissionHint: string;
}) {
  const t = useT();
  const lang = useUiLang();
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof StudentFormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));
  const bind = (key: keyof StudentFormValues) => ({
    value: values[key],
    invalid: Boolean(errors[key]),
    onChange: (event: { target: { value: string } }) => set(key, event.target.value),
  });
  const err = (key: string) => (errors[key] ? t(errors[key]) : undefined);
  const chosen = sections.find((s) => s.id === values.sectionId);
  const isOwnSection = studentId && values.sectionId === initial.sectionId;

  async function save() {
    setSaving(true);
    setErrors({});
    const input: StudentInput = { ...values, bloodGroup: values.bloodGroup as StudentInput['bloodGroup'], rollNo: values.rollNo === '' ? '' : Number(values.rollNo) };
    const result = studentId ? await updateStudentAction(studentId, input) : await admitStudentAction(input);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast.error(t(result.error));
      const first = Object.keys(result.fields ?? {})[0];
      if (first) document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    toast.success(studentId ? t('Saved') : t('Student admitted'));
    router.push(`/admin/students/${result.data.id}`);
    router.refresh();
  }

  return (
    <form
      className="mx-auto max-w-3xl space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <Part title={t('Student')}>
        <FormGrid>
          <div data-field="name">
            <Field label={t('Full name')} required error={err('name')}>
              <Input {...bind('name')} autoComplete="off" />
            </Field>
          </div>
          <Field label={t('Name in Bengali')} error={err('nameBn')}>
            <Input {...bind('nameBn')} autoComplete="off" lang="bn" />
          </Field>
          <div data-field="dob">
            <Field label={t('Date of birth')} error={err('dob')}>
              <Input type="date" max={today} {...bind('dob')} />
            </Field>
          </div>
          <Field label={t('Gender')} error={err('gender')}>
            <Select {...bind('gender')}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {t(GENDER_LABELS[g])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Category')} error={err('category')}>
            <Select {...bind('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(CATEGORY_LABELS[c])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Religion')} error={err('religion')}>
            <Input {...bind('religion')} list="religions" autoComplete="off" />
            <datalist id="religions">
              {RELIGIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Field>
          <Field label={t('Blood group')} error={err('bloodGroup')}>
            <Select {...bind('bloodGroup')}>
              <option value="">{t('Not known')}</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Banglar Shiksha ID')} error={err('portalId')} hint={t('Student ID on the Banglar Shiksha portal.')}>
            <Input {...bind('portalId')} autoComplete="off" />
          </Field>
        </FormGrid>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-700">{t('Photo')}</p>
          <ImageField value={values.photo} onChange={(url) => set('photo', url)} folder="students" />
        </div>
      </Part>

      <Part title={t('Admission and class')}>
        <FormGrid>
          <div data-field="admissionNo">
            <Field label={t('Admission number')} error={err('admissionNo')} hint={studentId ? undefined : t('Leave blank for the next number ({example}).', { example: admissionHint })}>
              <Input {...bind('admissionNo')} autoComplete="off" />
            </Field>
          </div>
          <div data-field="admittedOn">
            <Field label={t('Admission date')} error={err('admittedOn')}>
              <Input type="date" max={today} {...bind('admittedOn')} />
            </Field>
          </div>
          <div data-field="sectionId">
            <Field label={t('Class and section')} required={!studentId} error={err('sectionId')} hint={studentId && !initial.sectionId ? t('No class this year. Leave it so for a student who has left or passed out.') : undefined}>
              <Select {...bind('sectionId')}>
                <option value="">{studentId && !initial.sectionId ? t('No class this year') : t('Choose')}</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {sectionLabel(s, lang)} ({t('{n} students', { n: s.students })})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div data-field="rollNo">
            <Field
              label={t('Roll number')}
              error={err('rollNo')}
              hint={chosen && !isOwnSection ? t('Leave blank for the next roll number ({n}).', { n: chosen.lastRoll + 1 }) : undefined}
            >
              <Input type="number" inputMode="numeric" min={1} step={1} {...bind('rollNo')} />
            </Field>
          </div>
        </FormGrid>
        {chosen && !isOwnSection && chosen.students >= chosen.capacity ? (
          <Notice tone="amber">{t('This section is full: {n} students for {capacity} seats. You can still admit, or choose another section.', { n: chosen.students, capacity: chosen.capacity })}</Notice>
        ) : null}
      </Part>

      <Part title={t('Family')}>
        <FormGrid>
          <Field label={t("Father's name")} error={err('fatherName')}>
            <Input {...bind('fatherName')} autoComplete="off" />
          </Field>
          <Field label={t("Mother's name")} error={err('motherName')}>
            <Input {...bind('motherName')} autoComplete="off" />
          </Field>
          <Field label={t('Guardian')} error={err('guardianName')} hint={t('If not the father or mother.')}>
            <Input {...bind('guardianName')} autoComplete="off" />
          </Field>
          <Field label={t('Relation to the student')} error={err('guardianRelation')}>
            <Input {...bind('guardianRelation')} autoComplete="off" />
          </Field>
          <div data-field="phone">
            <Field label={t('Guardian mobile')} error={err('phone')} hint={t('Reminders and the parent login use this number.')}>
              <Input type="tel" inputMode="numeric" {...bind('phone')} autoComplete="off" />
            </Field>
          </div>
          <div data-field="altPhone">
            <Field label={t('Other mobile')} error={err('altPhone')}>
              <Input type="tel" inputMode="numeric" {...bind('altPhone')} autoComplete="off" />
            </Field>
          </div>
        </FormGrid>
        <div data-field="email">
          <Field label={t('Email')} error={err('email')}>
            <Input type="email" {...bind('email')} autoComplete="off" />
          </Field>
        </div>
        <Field label={t('Home address')} error={err('address')}>
          <Textarea {...bind('address')} rows={2} maxLength={300} />
        </Field>
      </Part>

      <div className="sticky bottom-[var(--dash-bottom)] z-10 -mx-4 flex justify-end gap-2 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <LinkButton href={studentId ? `/admin/students/${studentId}` : '/admin/students'} variant="secondary">
          {t('Cancel')}
        </LinkButton>
        <LoadingButton type="submit" loading={saving}>
          {studentId ? t('Save changes') : t('Admit student')}
        </LoadingButton>
      </div>
    </form>
  );
}
