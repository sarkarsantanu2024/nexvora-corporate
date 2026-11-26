import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { faqList, faqTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { JsonLd } from '@/components/site/ui';
import { Stagger, StaggerItem } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(faqTop)]);
  return pageMeta({ lang, title: t.nav.faq, description: `${top.heading}. ${top.text}`, path: '/faq' });
}

export default async function FaqPage() {
  const { t } = await getSite();
  const [top, list] = await Promise.all([content(faqTop), content(faqList)]);
  const items = isHidden(list) ? [] : list.items.filter((i) => i.q && i.a);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.faq, path: '/faq' }]} />
      {items.length ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
          }}
        />
      ) : null}
      <Band tone="paper">
        {/* Native details/summary: works without script, opens with the keyboard, and the browser's find-in-page reaches closed answers. */}
        <Stagger className="mx-auto max-w-3xl divide-y divide-brand-950/10 border-y border-brand-950/10">
          {items.map((item, i) => (
            <StaggerItem key={i}>
              <details className="group py-2" open={i === 0}>
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 rounded-md py-3 text-lg font-bold text-brand-950 marker:hidden [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus aria-hidden size={22} className="shrink-0 text-accent-600 transition-transform duration-300 group-open:rotate-45" />
                </summary>
                <p className="whitespace-pre-line pb-4 pr-8 text-[17px] leading-relaxed text-ink-700">{item.a}</p>
              </details>
            </StaggerItem>
          ))}
        </Stagger>
      </Band>
    </>
  );
}
