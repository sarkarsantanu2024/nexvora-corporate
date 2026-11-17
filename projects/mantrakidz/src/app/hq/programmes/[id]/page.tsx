import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/core';
import { ApiError } from '@/lib/api';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { getProgramme } from '@/server/hq/admin';
import { PROGRAMME_COLOURS } from '@/server/hq/constants';
import { isAdmin } from '@/server/hq/shared';
import { EMPTY_WORDS, ProgrammeForm } from '../programme-form';

export const metadata: Metadata = { title: 'Edit programme' };

export default async function EditProgrammePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const session = await requireSession(HQ_ROLES);
  const { id } = await params;
  const programme = await getProgramme(id).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const colour = PROGRAMME_COLOURS.find((c) => c === programme.color) ?? 'indigo';
  return (
    <>
      <PageHeader back={{ href: '/hq/programmes', label: t('Programmes') }} title={programme.name} description={t('Changes show on the website and in the centres as soon as you save.')} />
      <ProgrammeForm
        id={programme.id}
        canDelete={isAdmin(session)}
        initial={{
          name: programme.name,
          slug: programme.slug,
          ageLabel: programme.ageLabel,
          ageFromMonths: String(programme.ageFromMonths),
          ageToMonths: String(programme.ageToMonths),
          tagline: programme.tagline,
          description: programme.description,
          highlights: programme.highlights,
          image: programme.image,
          color: colour,
          seatsPerClass: String(programme.seatsPerClass),
          timing: programme.timing,
          suggestedMonthlyFee: String(programme.suggestedMonthlyFee),
          sort: String(programme.sort),
          active: programme.active,
          i18n: { bn: { ...EMPTY_WORDS, ...programme.i18n?.bn }, hi: { ...EMPTY_WORDS, ...programme.i18n?.hi } },
        }}
      />
    </>
  );
}
