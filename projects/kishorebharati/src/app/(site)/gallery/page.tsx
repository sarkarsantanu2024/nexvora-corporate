import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { galleryTop, galleryTour, siteBrand } from '@/cms/sections';
import { GalleryWall } from '@/components/site/gallery';
import { fill } from '@/components/site/i18n';
import { getSite } from '@/components/site/i18n/server';
import { Band, Head } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { CONTAINER } from '@/components/site/theme';
import { WallStage } from '@/components/site/three/wall-stage';
import { getGallery } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top, brand] = await Promise.all([getSite(), content(galleryTop), content(siteBrand)]);
  return pageMeta({ lang, title: t.pages.gallery, description: `${top.heading}. ${fill(t.pages.galleryMeta, { name: brand.name })}`, path: '/gallery' });
}

export default async function GalleryPage() {
  const { t } = await getSite();
  const [top, tour, photos] = await Promise.all([content(galleryTop), content(galleryTour), getGallery()]);
  // The tour wall takes photos that are big enough to look good large; small thumbnails stay in the grid below.
  const wall = photos.filter((p) => p.width >= 400 || !p.width).slice(0, 14);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={photos.length ? top.text : undefined} crumbs={[{ name: t.nav.gallery, path: '/gallery' }]} />

      {!isHidden(tour) && wall.length > 2 ? (
        <WallStage photos={wall.map((p) => ({ url: p.url, width: p.width, height: p.height, caption: p.caption }))} hint={t.gallery.tourHint}>
          <div className={`${CONTAINER} pt-10 sm:pt-14`}>
            <Head eyebrow={tour.eyebrow} heading={tour.heading} text={tour.text} light />
          </div>
        </WallStage>
      ) : null}

      <Band tone="paper">
        <h2 className="sr-only">{t.gallery.photos}</h2>
        {photos.length ? <GalleryWall photos={photos} allLabel={top.allLabel} /> : <p className="mx-auto max-w-md text-center text-lg text-ink-600">{top.emptyText}</p>}
      </Band>
    </>
  );
}
