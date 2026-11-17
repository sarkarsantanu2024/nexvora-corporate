import type { Metadata } from 'next';
import { Notice, PageHeader } from '@/components/ui/core';
import { getDb } from '@/db';
import { requireCentre } from '@/lib/auth';
import { todayIST } from '@/lib/date';
import { getT } from '@/lib/t';
import { ageInMonths } from '@/server/centre/children/constants';
import { loadEnquiry } from '@/server/centre/children/enquiries';
import { isUuid } from '@/server/centre/children/shared';
import { orNotFound, studentFormData } from '../form-data';
import { StudentForm, type StudentValues } from '../student-form';

export const metadata: Metadata = { title: 'Admit a child' };

export default async function NewStudentPage({ searchParams }: { searchParams: Promise<{ enquiry?: string }> }) {
  const t = await getT();
  const ctx = await requireCentre();
  const { enquiry: enquiryId } = await searchParams;
  const today = todayIST();
  const [form, enquiry] = await Promise.all([
    studentFormData(ctx),
    isUuid(enquiryId) ? orNotFound(getDb().then((db) => loadEnquiry(db, ctx.centre.id, enquiryId))) : Promise.resolve(null),
  ]);

  const initial: StudentValues = {
    name: '', dob: '', gender: '', photo: '', programmeId: '', batchId: '', admissionDate: today, monthlyFee: '',
    fatherName: '', motherName: '', guardianPhone: '', altPhone: '', email: '', address: '',
    bloodGroup: '', medicalNotes: '', pickupPerson: '', tshirtSize: '',
  };
  const usable = enquiry && enquiry.stage !== 'admitted' ? enquiry : null;
  if (usable) {
    initial.name = usable.childName;
    initial.dob = usable.dob ?? '';
    initial.guardianPhone = usable.phone;
    initial.email = usable.email;
    // The programme asked for, or the one that fits the age.
    const months = ageInMonths(usable.dob, today);
    const programme =
      form.programmes.find((p) => p.id === usable.programmeId) ??
      (months === null ? undefined : form.programmes.find((p) => months >= p.ageFromMonths && months < p.ageToMonths));
    if (programme) {
      const options = form.classes.filter((c) => c.programmeId === programme.id);
      initial.programmeId = programme.id;
      initial.batchId = (options.find((c) => c.isCurrentYear) ?? options[0])?.id ?? '';
    }
  }

  return (
    <>
      <PageHeader back={{ href: usable ? `/centre/enquiries/${usable.id}` : '/centre/students', label: usable ? t('Back to the enquiry') : t('Children') }} title={t('Admit a child')} />
      <div className="mx-auto mb-5 max-w-3xl">
        {usable ? (
          <Notice>
            {t('From the enquiry of {parentName} ({phone}). What they told you is filled in below. Saving marks the enquiry as admitted.', { parentName: usable.parentName, phone: usable.phone })}
          </Notice>
        ) : enquiry ? (
          <Notice tone="amber">{t('That enquiry has already been admitted, so this is a fresh form.')}</Notice>
        ) : null}
      </div>
      <StudentForm initial={initial} {...form} today={today} enquiryId={usable?.id} cancelHref={usable ? `/centre/enquiries/${usable.id}` : '/centre/students'} />
    </>
  );
}
