import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { listProgrammes } from '@/server/hq/admin';
import { EMPTY_WORDS, ProgrammeForm } from '../programme-form';

export const metadata: Metadata = { title: 'Add programme' };

export default async function NewProgrammePage() {
  await requireSession(HQ_ROLES);
  const existing = await listProgrammes();
  const lastSort = existing.reduce((max, { row }) => Math.max(max, row.sort), 0);
  return (
    <>
      <PageHeader back={{ href: '/hq/programmes', label: 'Programmes' }} title="Add a programme" />
      <ProgrammeForm
        id={null}
        canDelete={false}
        initial={{
          name: '',
          slug: '',
          ageLabel: '',
          ageFromMonths: '',
          ageToMonths: '',
          tagline: '',
          description: '',
          highlights: [],
          image: '',
          color: 'indigo',
          seatsPerClass: '12',
          timing: '',
          suggestedMonthlyFee: '',
          sort: String(lastSort + 1),
          active: true,
          i18n: { bn: EMPTY_WORDS, hi: EMPTY_WORDS },
        }}
      />
    </>
  );
}
