import type { Metadata } from 'next';
import { MediaLibrary } from '@/components/cms/media-library';
import { PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { listMedia } from '@/server/cms/media';

export const metadata: Metadata = { title: 'Photo library' };

export default async function MediaPage() {
  await requireSession(HQ_ROLES);
  const listing = await listMedia();
  return (
    <>
      <PageHeader
        title="Photo library"
        description="Every photo uploaded through the app. Upload here once, then use a photo anywhere on the website."
        back={{ href: '/hq/website', label: 'Edit website' }}
      />
      <MediaLibrary initial={{ ...listing, items: listing.items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })) }} />
    </>
  );
}
