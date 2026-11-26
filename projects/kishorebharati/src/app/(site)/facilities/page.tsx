import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { facilitiesList, facilitiesTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band, CardGrid, InfoCard } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(facilitiesTop)]);
  return pageMeta({ lang, title: t.nav.facilities, description: `${top.heading}. ${top.text}`, path: '/facilities' });
}

export default async function FacilitiesPage() {
  const { t } = await getSite();
  const [top, list] = await Promise.all([content(facilitiesTop), content(facilitiesList)]);
  const items = isHidden(list) ? [] : list.items.filter((i) => i.title);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.facilities, path: '/facilities' }]} />
      {items.length ? (
        <Band tone="paper">
          <CardGrid cols={3}>
            {items.map((item, i) => (
              <InfoCard key={i} title={item.title} text={item.text} icon={item.icon} image={item.image} />
            ))}
          </CardGrid>
        </Band>
      ) : null}
    </>
  );
}
