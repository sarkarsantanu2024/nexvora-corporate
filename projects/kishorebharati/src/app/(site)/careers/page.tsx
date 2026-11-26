import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { content, isHidden } from '@/cms/content';
import { careersList } from '@/cms/sections';
import { fill } from '@/components/site/i18n';
import { getSite } from '@/components/site/i18n/server';
import { Band, OutLink } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, list] = await Promise.all([getSite(), content(careersList)]);
  return pageMeta({ lang, title: t.nav.careers, description: `${list.heading}. ${list.text}`, path: '/careers' });
}

/** Vacancies. The page exists only while the school lists one; otherwise it is "not found", like the menu link. */
export default async function CareersPage() {
  const { t } = await getSite();
  const list = await content(careersList);
  const items = isHidden(list) ? [] : list.items.filter((i) => i.title);
  if (!items.length) notFound();

  return (
    <>
      <PageTop eyebrow={list.eyebrow} heading={list.heading} text={list.text} crumbs={[{ name: t.nav.careers, path: '/careers' }]} />
      <Band tone="paper">
        <Stagger className="mx-auto grid max-w-3xl gap-4">
          {items.map((v, i) => (
            <StaggerItem key={i} className="rounded-xl border border-brand-950/10 bg-white p-6 sm:p-7">
              <h2 className="text-2xl font-bold text-brand-950">{v.title}</h2>
              {v.lastDate ? <p className="mt-1 text-sm font-semibold text-accent-600">{fill(t.school.lastDate, { date: v.lastDate })}</p> : null}
              {v.text ? <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-700">{v.text}</p> : null}
              {v.link ? (
                <OutLink href={v.link} note={t.footer.opensNew} className="mt-3">
                  {t.common.readMore}
                </OutLink>
              ) : null}
            </StaggerItem>
          ))}
        </Stagger>
      </Band>
    </>
  );
}
