import type { Metadata } from 'next';
import { GalleryManager } from '@/components/cms/gallery-manager';
import { LinkButton, PageHeader } from '@/components/ui/core';
import { HQ_ROLES, requireSession } from '@/lib/auth';
import { albumNames, listCentreOptions, listGallery } from '@/server/cms/gallery';

export const metadata: Metadata = { title: 'Gallery' };

export default async function GalleryPage() {
  await requireSession(HQ_ROLES);
  const [items, albums, centres] = await Promise.all([listGallery(), albumNames(), listCentreOptions()]);
  return (
    <>
      <PageHeader
        title="Gallery"
        description="The photos on the Gallery page of the website, in albums. Add, caption, reorder, hide."
        actions={
          <LinkButton href="/gallery" target="_blank" variant="secondary">
            See the gallery
          </LinkButton>
        }
      />
      <GalleryManager
        items={items.map((item) => ({ id: item.id, url: item.url, caption: item.caption, album: item.album, centreId: item.centreId, visible: item.visible, sort: item.sort }))}
        albums={albums}
        centres={centres}
      />
    </>
  );
}
