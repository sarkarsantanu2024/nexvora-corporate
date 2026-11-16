import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { sectionByKey } from '@/cms/content';
import type { Field, SectionDef } from '@/cms/types';
import { SectionForm } from '@/components/cms/section-form';
import { PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { contentKey, isLang } from '@/lib/i18n';
import { getSectionState, listRevisions } from '@/server/cms/service';

type Props = { params: Promise<{ key: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const def = sectionByKey(decodeURIComponent((await params).key));
  return { title: def ? `${def.label} | Edit website` : 'Edit website' };
}

export default async function SectionPage({ params, searchParams }: Props) {
  await requireSession(HQ_ROLES);
  const key = decodeURIComponent((await params).key);
  const def = sectionByKey(key) as SectionDef | null;
  if (!def) notFound();
  // English is the row named after the section; Bengali and Hindi each have their own row, draft and history.
  const asked = (await searchParams).lang;
  const rowKey = contentKey(def.key, isLang(asked) ? asked : 'en');
  const [state, revisions] = await Promise.all([getSectionState(rowKey), listRevisions({ key: rowKey, limit: 5 })]);
  return (
    <>
      <PageHeader title={def.label} description={def.description} back={{ href: '/hq/website', label: `Edit website › ${def.page}` }} />
      <SectionForm
        key={rowKey}
        section={{ key: def.key, page: def.page, label: def.label, description: def.description, path: def.path, fields: def.fields as Field[] }}
        state={state}
        revisions={revisions}
      />
    </>
  );
}
