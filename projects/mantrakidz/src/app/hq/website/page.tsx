import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PREVIEW_COOKIE } from '@/cms/content';
import { SECTIONS } from '@/cms/sections';
import type { SectionDef } from '@/cms/types';
import { SectionsIndex, type IndexSection } from '@/components/cms/sections-index';
import { PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { getAllStates } from '@/server/cms/service';

export const metadata: Metadata = { title: 'Edit website' };

export default async function WebsitePage() {
  await requireSession(HQ_ROLES);
  const states = new Map((await getAllStates()).map((state) => [state.key, state]));
  const previewOn = (await cookies()).get(PREVIEW_COOKIE)?.value === '1';
  const sections: IndexSection[] = (SECTIONS as SectionDef[]).map((def) => {
    const state = states.get(def.key);
    return {
      key: def.key,
      page: def.page,
      label: def.label,
      description: def.description ?? '',
      aliases: def.aliases ?? [],
      fieldLabels: def.fields.map((field) => field.label),
      hasDraft: (state?.draftLangs.length ?? 0) > 0,
      draftLangs: state?.draftLangs ?? [],
      hidden: state?.hidden ?? false,
      hiddenInDraft: state?.hiddenInDraft ?? false,
    };
  });
  return (
    <>
      <PageHeader title="Edit website" description="Pick a section to change its words and photos. Or tap the mic and say what you want changed." />
      <SectionsIndex sections={sections} previewOn={previewOn} />
    </>
  );
}
