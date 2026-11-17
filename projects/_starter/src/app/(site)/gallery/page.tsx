import type { Metadata } from 'next';
import { content } from '@/cms/content';
import { galleryTop, siteBrand, siteContact, siteCta } from '@/cms/sections';
import { Cloud } from '@/components/site/art';
import { CtaBand } from '@/components/site/blocks';
import { GalleryWall } from '@/components/site/gallery';
import { fill } from '@/components/site/i18n';
import { getSite } from '@/components/site/i18n/server';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Section } from '@/components/site/ui';
import { getGallery } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top, brand] = await Promise.all([getSite(), content(galleryTop), content(siteBrand)]);
  return pageMeta({ lang, title: t.pages.gallery, description: `${top.heading}. ${fill(t.pages.galleryMeta, { name: brand.name })}`, path: '/gallery' });
}

export default async function GalleryPage() {
  const { t } = await getSite();
  const [top, contact, visit, photos] = await Promise.all([content(galleryTop), content(siteContact), content(siteCta), getGallery()]);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={photos.length ? top.text : undefined} tone="coral" crumbs={[{ name: t.nav.gallery, path: '/gallery' }]} />

      <Section className="!pt-10 sm:!pt-14">
        <h2 className="sr-only">{t.gallery.photos}</h2>
        {photos.length ? (
          <GalleryWall photos={photos} allLabel={top.allLabel} />
        ) : (
          <div className="mx-auto max-w-md text-center">
            <Cloud className="mx-auto w-32 text-brand-100" />
            <p className="mt-6 text-lg text-ink-600">{top.emptyText}</p>
          </div>
        )}
      </Section>

      <CtaBand visit={visit} whatsapp={contact.whatsapp} />
    </>
  );
}
