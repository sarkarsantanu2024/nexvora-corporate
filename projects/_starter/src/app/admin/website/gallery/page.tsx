import type { Metadata } from 'next';
import { GalleryManager } from '@/components/cms/gallery-manager';
import { LinkButton, PageHeader } from '@/components/ui/core';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import { getT } from '@/lib/t';
import { albumNames, listGallery } from '@/server/cms/gallery';

export const metadata: Metadata = { title: 'Gallery' };

export default async function GalleryPage() {
  const t = await getT();
  await requireSession(TEAM_ROLES);
  const [items, albums] = await Promise.all([listGallery(), albumNames()]);
  return (
    <>
      <PageHeader
        title={t('Gallery')}
        description={t('The photos on the Gallery page of the website, in albums. Add, caption, reorder, hide.')}
        actions={
          <LinkButton href="/gallery" target="_blank" variant="secondary">
            {t('See the gallery')}
          </LinkButton>
        }
      />
      <GalleryManager
        items={items.map((item) => ({ id: item.id, url: item.url, caption: item.caption, album: item.album, visible: item.visible, sort: item.sort }))}
        albums={albums}
      />
    </>
  );
}
