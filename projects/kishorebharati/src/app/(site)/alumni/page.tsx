import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { alumniForm, alumniList, alumniTop, siteContact, siteCta } from '@/cms/sections';
import { AlumniForm } from '@/components/site/forms';
import { fill } from '@/components/site/i18n';
import { getSite } from '@/components/site/i18n/server';
import { Band, Head } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { SiteImage } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(alumniTop)]);
  return pageMeta({ lang, title: t.nav.alumni, description: `${top.heading}. ${top.text}`, path: '/alumni' });
}

export default async function AlumniPage() {
  const { t } = await getSite();
  const [top, list, form, contact, visit] = await Promise.all([content(alumniTop), content(alumniList), content(alumniForm), content(siteContact), content(siteCta)]);
  const people = isHidden(list) ? [] : list.items.filter((p) => p.name);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.alumni, path: '/alumni' }]} />

      {people.length ? (
        <Band tone="paper">
          <Head index={1} heading={list.heading} />
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p, i) => (
              <StaggerItem key={i} className="flex items-center gap-4 rounded-xl border border-brand-950/10 bg-white p-5">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-950 text-lg font-bold text-sun-300">
                  {p.photo ? <SiteImage src={p.photo} alt="" sizes="56px" /> : p.name.trim().charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-brand-950">{p.name}</span>
                  {p.batch ? <span className="block text-sm font-semibold text-accent-600">{fill(t.school.batch, { batch: p.batch })}</span> : null}
                  {p.note ? <span className="block text-ink-700">{p.note}</span> : null}
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </Band>
      ) : null}

      {!isHidden(form) ? (
        <Band tone="deep" id="register" className="scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <Head index={people.length ? 2 : 1} heading={form.heading} text={form.text} />
            <Reveal delay={0.08} className="rounded-xl bg-white p-6 sm:p-9">
              <AlumniForm copy={form} whatsapp={contact.whatsapp} whatsappMessage={visit.whatsappMessage} />
            </Reveal>
          </div>
        </Band>
      ) : null}
    </>
  );
}
