import type { Metadata } from 'next';
import { content } from '@/cms/content';
import { teachersTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { SiteImage } from '@/components/site/ui';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { getStaff } from '@/server/site/queries';
import { groupStaff, staffName, type SiteStaff } from '@/server/site/school';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(teachersTop)]);
  return pageMeta({ lang, title: t.nav.teachers, description: `${top.heading}. ${top.text}`, path: '/teachers' });
}

/** Two letters from the name, for the round badge when there is no photo. */
const initials = (name: string) =>
  name
    .replace(/^(sri|smt|shri|dr|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => [...w][0])
    .join('');

async function Person({ person, large }: { person: SiteStaff; large?: boolean }) {
  const { lang, t } = await getSite();
  const name = staffName(person, lang);
  return (
    <article className={cn('flex h-full items-center gap-4 rounded-xl border border-brand-950/10 bg-white p-5', large && 'gap-6 p-7 sm:p-8')}>
      <span className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-950 font-bold text-sun-300', large ? 'h-24 w-24 text-3xl' : 'h-14 w-14 text-lg')}>
        {person.photo ? <SiteImage src={person.photo} alt={name} sizes={large ? '96px' : '56px'} /> : <span aria-hidden>{initials(name)}</span>}
      </span>
      <span className="min-w-0">
        <span className={cn('block font-bold text-brand-950', large ? 'text-2xl' : 'text-lg')}>{name}</span>
        {person.designation ? <span className="block text-[15px] font-semibold text-accent-600">{person.designation}</span> : null}
        {person.subjects ? (
          <span className="mt-0.5 block text-[15px] text-ink-700">
            <span className="sr-only">{t.teachers.subjects}: </span>
            {person.subjects}
          </span>
        ) : null}
      </span>
    </article>
  );
}

export default async function TeachersPage() {
  const { t } = await getSite();
  const [top, staff] = await Promise.all([content(teachersTop), getStaff()]);
  const { head, teaching, nonTeaching } = groupStaff(staff);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.teachers, path: '/teachers' }]} />
      <Band tone="paper">
        {!staff.length ? <p className="mx-auto max-w-xl rounded-xl border border-dashed border-brand-950/20 p-10 text-center text-lg text-ink-700">{top.emptyText}</p> : null}

        {head.length ? (
          <section aria-labelledby="t-head">
            <h2 id="t-head" className="flex items-center gap-4 text-2xl font-bold text-brand-950 sm:text-3xl">
              <span className="tabular text-base font-semibold text-accent-600">01</span>
              {top.headLabel}
              <span aria-hidden className="h-px flex-1 bg-brand-950/15" />
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {head.map((p) => (
                <Person key={p.id} person={p} large />
              ))}
            </div>
          </section>
        ) : null}

        {[
          { key: 'teaching', label: top.teachingLabel, list: teaching },
          { key: 'non', label: top.nonTeachingLabel, list: nonTeaching },
        ]
          .filter((g) => g.list.length)
          .map((group, gi) => (
            <section key={group.key} aria-labelledby={`t-${group.key}`} className="mt-14 first:mt-0">
              <h2 id={`t-${group.key}`} className="flex items-center gap-4 text-2xl font-bold text-brand-950 sm:text-3xl">
                <span className="tabular text-base font-semibold text-accent-600">{String(gi + (head.length ? 2 : 1)).padStart(2, '0')}</span>
                {group.label}
                <span aria-hidden className="h-px flex-1 bg-brand-950/15" />
              </h2>
              <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.list.map((p) => (
                  <StaggerItem key={p.id} className="h-full">
                    <Person person={p} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          ))}
      </Band>
    </>
  );
}
