'use client';

/** The admission form, also used to edit a child. One page, four sections. */
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { ImageField } from '@/components/cms/image-field';
import { LoadingButton, useToast } from '@/components/ui/client';
import { Card, CardBody, CardHeader, Field, FormGrid, Input, LinkButton, Notice, Select, Textarea } from '@/components/ui/core';
import { ageLabel } from '@/lib/date';
import { inr } from '@/lib/money';
import { admitStudentAction, updateStudentAction } from '@/server/centre/children/actions';
import { ageInMonths, BLOOD_GROUPS, GENDERS, TSHIRT_SIZES } from '@/server/centre/children/constants';

export type StudentValues = {
  name: string;
  dob: string;
  gender: string;
  photo: string;
  programmeId: string;
  batchId: string;
  admissionDate: string;
  monthlyFee: string;
  fatherName: string;
  motherName: string;
  guardianPhone: string;
  altPhone: string;
  email: string;
  address: string;
  bloodGroup: string;
  medicalNotes: string;
  pickupPerson: string;
  tshirtSize: string;
};

type ProgrammeOption = { id: string; name: string; ageLabel: string; ageFromMonths: number; ageToMonths: number };
type ClassOption = { id: string; name: string; programmeId: string; yearName: string; isCurrentYear: boolean; capacity: number; filled: number };

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="animate-fade-up">
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

export function StudentForm({
  initial,
  programmes,
  classes,
  classFees,
  today,
  studentId,
  enquiryId,
  cancelHref,
}: {
  initial: StudentValues;
  programmes: ProgrammeOption[];
  classes: ClassOption[];
  /** The centre's monthly fee for each programme, shown as the default. */
  classFees: Record<string, number>;
  today: string;
  /** Set when editing. */
  studentId?: string;
  /** Set when admitting from an enquiry. */
  enquiryId?: string;
  cancelHref: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof StudentValues, value: string) => setValues((v) => ({ ...v, [key]: value }));
  const bind = (key: keyof StudentValues) => ({
    value: values[key],
    invalid: Boolean(errors[key]),
    onChange: (event: { target: { value: string } }) => set(key, event.target.value),
  });

  const months = ageInMonths(values.dob, today);
  const fitting = months === null ? null : (programmes.find((p) => months >= p.ageFromMonths && months < p.ageToMonths) ?? null);
  const ofProgramme = useMemo(() => classes.filter((c) => c.programmeId === values.programmeId), [classes, values.programmeId]);
  const chosen = classes.find((c) => c.id === values.batchId);
  // When editing, the child already holds one of the seats counted as filled.
  const seatsLeft = (c: ClassOption) => c.capacity - c.filled + (studentId && c.id === initial.batchId ? 1 : 0);

  function chooseProgramme(programmeId: string) {
    const options = classes.filter((c) => c.programmeId === programmeId);
    // Start on this year's class; the person can still pick another.
    const first = options.find((c) => c.isCurrentYear) ?? options[0];
    setValues((v) => ({ ...v, programmeId, batchId: first?.id ?? '' }));
  }

  function changeDob(dob: string) {
    set('dob', dob);
    // Until a programme is picked, follow the child's age.
    const age = ageInMonths(dob, today);
    const fit = age === null ? null : programmes.find((p) => age >= p.ageFromMonths && age < p.ageToMonths);
    if (fit && !values.programmeId) chooseProgramme(fit.id);
  }

  async function save() {
    setSaving(true);
    setErrors({});
    const input = {
      ...values,
      gender: values.gender as '' | 'Girl' | 'Boy',
      // Blank stays blank (the class fee applies); anything typed goes as a number.
      monthlyFee: values.monthlyFee === '' ? ('' as const) : Number(values.monthlyFee),
    };
    const result = studentId ? await updateStudentAction(studentId, input) : await admitStudentAction(input, enquiryId);
    if (!result.ok) {
      setSaving(false);
      setErrors(result.fields ?? {});
      toast.error(result.error);
      // Bring the first problem into view on a long form.
      const first = Object.keys(result.fields ?? {})[0];
      if (first) document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (studentId) {
      toast.success('Saved');
      router.push(`/centre/students/${studentId}`);
    } else {
      router.push(`/centre/students/${(result.data as { id: string }).id}/admitted`);
    }
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
      <Section title="Child">
        <div data-field="name">
          <Field label="Child's full name" required error={errors.name}>
            <Input {...bind('name')} autoComplete="off" />
          </Field>
        </div>
        <FormGrid>
          <div data-field="dob">
            <Field
              label="Date of birth"
              error={errors.dob}
              hint={
                months === null
                  ? 'The age is worked out for you.'
                  : `Age ${ageLabel(values.dob, today)}.${fitting ? ` ${fitting.name} suits this age (${fitting.ageLabel}).` : ' No programme matches this age exactly.'}`
              }
            >
              <Input type="date" max={today} value={values.dob} invalid={Boolean(errors.dob)} onChange={(event) => changeDob(event.target.value)} />
            </Field>
          </div>
          <Field label="Gender" error={errors.gender}>
            <Select {...bind('gender')}>
              <option value="">Choose</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-700">Photo</p>
          <ImageField value={values.photo} onChange={(url) => set('photo', url)} folder="students" />
        </div>
      </Section>

      <Section title="Class">
        <FormGrid>
          <div data-field="programmeId">
            <Field label="Programme" required error={errors.programmeId}>
              <Select value={values.programmeId} invalid={Boolean(errors.programmeId)} onChange={(event) => chooseProgramme(event.target.value)}>
                <option value="">Choose</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.ageLabel})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div data-field="batchId">
            <Field
              label="Class"
              error={errors.batchId}
              hint={!values.programmeId ? 'Choose the programme first.' : ofProgramme.length === 0 ? 'No class for this programme yet. Add one under Classes.' : undefined}
            >
              <Select {...bind('batchId')} disabled={!values.programmeId}>
                <option value="">Not placed in a class yet</option>
                {ofProgramme.map((c) => {
                  const left = seatsLeft(c);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name}, {c.yearName}: {left > 0 ? `${left} seat${left === 1 ? '' : 's'} left` : 'full'}
                    </option>
                  );
                })}
              </Select>
            </Field>
          </div>
        </FormGrid>
        {chosen && seatsLeft(chosen) <= 0 ? (
          <Notice tone="amber">
            {chosen.name} is full: all {chosen.capacity} seats are taken. You can still admit the child, or pick another class.
          </Notice>
        ) : null}
        {values.programmeId && !values.batchId && ofProgramme.length > 0 ? (
          <Notice tone="amber">Without a class the child will not appear on the attendance sheet.</Notice>
        ) : null}
        <FormGrid>
          <div data-field="admissionDate">
            <Field label="Admission date" required error={errors.admissionDate}>
              <Input type="date" {...bind('admissionDate')} />
            </Field>
          </div>
          <div data-field="monthlyFee">
            <Field
              label="Monthly fee agreed"
              error={errors.monthlyFee}
              hint={
                values.programmeId && classFees[values.programmeId]
                  ? `Leave blank to charge the class fee of ${inr(classFees[values.programmeId])}.`
                  : 'Leave blank to charge the class fee.'
              }
            >
              <Input type="number" inputMode="numeric" min={0} step={1} placeholder="Class fee" {...bind('monthlyFee')} />
            </Field>
          </div>
        </FormGrid>
      </Section>

      <Section title="Family">
        <FormGrid>
          <Field label="Father's name" error={errors.fatherName}>
            <Input {...bind('fatherName')} autoComplete="off" />
          </Field>
          <Field label="Mother's name" error={errors.motherName}>
            <Input {...bind('motherName')} autoComplete="off" />
          </Field>
          <div data-field="guardianPhone">
            <Field label="Guardian mobile" required error={errors.guardianPhone} hint="Fee reminders and the parent login use this number.">
              <Input type="tel" inputMode="numeric" {...bind('guardianPhone')} autoComplete="off" />
            </Field>
          </div>
          <div data-field="altPhone">
            <Field label="Other mobile" error={errors.altPhone}>
              <Input type="tel" inputMode="numeric" {...bind('altPhone')} autoComplete="off" />
            </Field>
          </div>
        </FormGrid>
        <div data-field="email">
          <Field label="Email" error={errors.email}>
            <Input type="email" {...bind('email')} autoComplete="off" />
          </Field>
        </div>
        <Field label="Home address" error={errors.address}>
          <Textarea {...bind('address')} rows={2} maxLength={300} />
        </Field>
      </Section>

      <Section title="Care" description="What the teacher needs to know to look after the child.">
        <FormGrid>
          <Field label="Blood group" error={errors.bloodGroup}>
            <Select {...bind('bloodGroup')}>
              <option value="">Not known</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="T-shirt size" error={errors.tshirtSize}>
            <Select {...bind('tshirtSize')}>
              <option value="">Not measured</option>
              {/* Keep a size that is not on our list when editing an old record. */}
              {[...new Set([...TSHIRT_SIZES, ...(values.tshirtSize ? [values.tshirtSize] : [])])].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
        <Field label="Medical notes or allergies" error={errors.medicalNotes}>
          <Textarea {...bind('medicalNotes')} rows={2} maxLength={500} placeholder="Allergic to peanuts, uses an inhaler" />
        </Field>
        <Field label="Who collects the child" error={errors.pickupPerson}>
          <Input {...bind('pickupPerson')} placeholder="Mother, grandmother, pool car" />
        </Field>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
        <LoadingButton type="submit" loading={saving}>
          {studentId ? 'Save changes' : 'Admit child'}
        </LoadingButton>
      </div>
    </form>
  );
}
