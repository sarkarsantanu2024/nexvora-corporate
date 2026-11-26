import { UtensilsCrossed } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { schemesList, schemesMeal, schemesTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band, Head, OutLink, Prose } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(schemesTop)]);
  return pageMeta({ lang, title: t.nav.schemes, description: `${top.heading}. ${top.text}`, path: '/schemes' });
}

export default async function SchemesPage() {
  const { t } = await getSite();
  const [top, list, meal] = await Promise.all([content(schemesTop), content(schemesList), content(schemesMeal)]);
  const menu = meal.menu.filter((m) => m.day && m.food);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.schemes, path: '/schemes' }]} />

      {!isHidden(list) && list.items.length ? (
        <Band tone="paper">
          <Stagger className="grid gap-5 md:grid-cols-2">
            {list.items.map((s, i) => (
              <StaggerItem key={i} className="flex h-full flex-col rounded-xl border border-brand-950/10 bg-white p-6 sm:p-7">
                <span className="text-xs font-bold text-accent-600">
                  {t.school.who}: {s.who}
                </span>
                <h2 className="mt-2 text-2xl font-bold leading-snug text-brand-950">{s.name}</h2>
                <p className="mt-2 flex-1 leading-relaxed text-ink-700">{s.text}</p>
                {s.link ? (
                  <OutLink href={s.link} note={t.footer.opensNew} className="mt-3 self-start">
                    {top.linkLabel}
                  </OutLink>
                ) : null}
              </StaggerItem>
            ))}
          </Stagger>
        </Band>
      ) : null}

      {!isHidden(meal) ? (
        <Band tone="deep">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <Head index={1} heading={meal.heading} />
              <Reveal delay={0.08}>
                <Prose text={meal.text} className="mt-6 text-ink-800" />
              </Reveal>
            </div>
            {menu.length ? (
              <Reveal delay={0.12} className="rounded-xl bg-white p-6 sm:p-8">
                <h3 className="flex items-center gap-2 text-xl font-bold text-brand-950">
                  <UtensilsCrossed aria-hidden size={20} className="text-accent-600" />
                  {meal.menuHeading}
                </h3>
                <table className="mt-4 w-full text-left">
                  <tbody>
                    {menu.map((m, i) => (
                      <tr key={i} className="border-b border-brand-950/10 last:border-0">
                        <th scope="row" className="py-3 pr-4 font-semibold text-brand-950">
                          {m.day}
                        </th>
                        <td className="py-3 text-ink-800">{m.food}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Reveal>
            ) : null}
          </div>
        </Band>
      ) : null}
    </>
  );
}
