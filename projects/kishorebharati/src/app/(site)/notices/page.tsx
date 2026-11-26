import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { content } from '@/cms/content';
import { noticesTop } from '@/cms/sections';
import { fill } from '@/components/site/i18n';
import { SiteLink } from '@/components/site/i18n/client';
import { getSite } from '@/components/site/i18n/server';
import { Band } from '@/components/site/kit';
import { NoticeCard } from '@/components/site/notices';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { localePath } from '@/lib/i18n';
import { getNotices } from '@/server/site/queries';
import { filterNotices } from '@/server/site/school';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(noticesTop)]);
  return pageMeta({ lang, title: t.pages.notices, description: `${top.heading}. ${top.text}`, path: '/notices' });
}

export default async function NoticesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { lang, t } = await getSite();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.slice(0, 80) : '';
  const year = typeof params.year === 'string' && /^\d{4}$/.test(params.year) ? params.year : '';
  const [top, all] = await Promise.all([content(noticesTop), getNotices()]);
  const years = [...new Set(all.map((n) => n.publishOn.slice(0, 4)))].sort().reverse();
  const shown = filterNotices(all, q, year);
  const filtering = Boolean(q || year);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.notices, path: '/notices' }]} />
      <Band tone="paper">
        {all.length ? (
          // A plain GET form: the search works without script, and the address can be shared.
          <form method="get" action={localePath(lang, '/notices')} role="search" className="mx-auto mb-10 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">{t.notices.search}</span>
              <Search aria-hidden size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
              <input name="q" type="search" defaultValue={q} placeholder={t.notices.searchPlaceholder} className="h-12 w-full rounded-md border border-brand-950/20 bg-white pl-11 pr-4 text-[16px] text-brand-950 outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20" />
            </label>
            {years.length > 1 ? (
              <label>
                <span className="sr-only">{t.notices.year}</span>
                <select name="year" defaultValue={year} className="h-12 w-full rounded-md border border-brand-950/20 bg-white px-4 text-[16px] text-brand-950 sm:w-40">
                  <option value="">{t.notices.allYears}</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button type="submit" className="h-12 rounded-md bg-brand-950 px-6 font-bold text-white transition hover:bg-brand-800">
              {t.notices.search}
            </button>
          </form>
        ) : null}

        {filtering ? (
          <p className="mx-auto mb-6 flex max-w-3xl items-center justify-between text-ink-600" aria-live="polite">
            {fill(t.notices.shown, { n: shown.length })}
            <SiteLink href="/notices" className="inline-flex min-h-[44px] items-center font-semibold text-brand-700 underline underline-offset-4">
              {t.notices.clear}
            </SiteLink>
          </p>
        ) : null}

        {shown.length ? (
          <Stagger className="mx-auto grid max-w-3xl gap-4">
            {shown.map((notice) => (
              <StaggerItem key={notice.id}>
                <NoticeCard notice={notice} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <p className="mx-auto max-w-xl rounded-xl border border-dashed border-brand-950/20 p-10 text-center text-lg text-ink-700">{filtering ? t.notices.noMatch : top.emptyText}</p>
        )}
      </Band>
    </>
  );
}
