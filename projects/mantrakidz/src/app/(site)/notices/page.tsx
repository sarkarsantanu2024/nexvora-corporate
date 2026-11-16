import type { Metadata } from 'next';
import { content } from '@/cms/content';
import { noticesTop } from '@/cms/sections';
import { Cloud } from '@/components/site/art';
import { NoticeCard } from '@/components/site/notices';
import { getSite } from '@/components/site/i18n/server';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Section } from '@/components/site/ui';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { getCentres, getNotices } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(noticesTop)]);
  return pageMeta({ lang, title: t.pages.notices, description: `${top.heading}. ${top.text}`, path: '/notices' });
}

export default async function NoticesPage() {
  const { t } = await getSite();
  const [top, notices, centres] = await Promise.all([content(noticesTop), getNotices(), getCentres()]);
  const centreName = new Map(centres.map((c) => [c.id, c.name]));
  // A notice written for one centre is shown only while that centre is on the website.
  const shown = notices.filter((n) => !n.centreId || centreName.has(n.centreId));

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} tone="mint" crumbs={[{ name: t.nav.notices, path: '/notices' }]} />
      <Section className="!pt-10 sm:!pt-14">
        <h2 className="sr-only">{t.pages.noticesHeading}</h2>
        {shown.length ? (
          <Stagger className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {shown.map((notice, i) => (
              <StaggerItem key={notice.id} className="h-full">
                <NoticeCard notice={notice} index={i} centreName={notice.centreId ? centreName.get(notice.centreId) : undefined} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="mx-auto max-w-md text-center">
            <Cloud className="mx-auto w-32 text-brand-100" />
            <p className="mt-6 text-lg text-ink-600">{top.emptyText}</p>
          </div>
        )}
      </Section>
    </>
  );
}
