import { Download, FileText, Paperclip } from 'lucide-react';
import type { Metadata } from 'next';
import { content, isHidden } from '@/cms/content';
import { downloadsList, downloadsTop } from '@/cms/sections';
import { getSite } from '@/components/site/i18n/server';
import { Band, Head, niceDate } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Stagger, StaggerItem } from '@/components/ui/motion';
import { getNotices } from '@/server/site/queries';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top] = await Promise.all([getSite(), content(downloadsTop)]);
  return pageMeta({ lang, title: t.nav.downloads, description: `${top.heading}. ${top.text}`, path: '/downloads' });
}

export default async function DownloadsPage() {
  const { t } = await getSite();
  const [top, list, notices] = await Promise.all([content(downloadsTop), content(downloadsList), getNotices()]);
  const files = isHidden(list) ? [] : list.items.filter((f) => f.title && f.file);
  const attached = notices.filter((n) => n.attachment);
  const kinds = [...new Set(files.map((f) => f.kind || 'other'))];

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.downloads, path: '/downloads' }]} />
      <Band tone="paper">
        {!files.length && !attached.length ? <p className="mx-auto max-w-xl rounded-xl border border-dashed border-brand-950/20 p-10 text-center text-lg text-ink-700">{top.emptyText}</p> : null}

        {kinds.map((kind, ki) => (
          <section key={kind} className="mb-12">
            <Head index={ki + 1} heading={t.downloads.kinds[kind as keyof typeof t.downloads.kinds] ?? kind} as="h2" />
            <Stagger className="mt-6 divide-y divide-brand-950/10 border-y border-brand-950/10">
              {files
                .filter((f) => (f.kind || 'other') === kind)
                .map((f, i) => (
                  <StaggerItem key={i}>
                    <a href={f.file} target="_blank" rel="noopener noreferrer" className="group flex min-h-[64px] items-center gap-4 py-4">
                      <FileText aria-hidden size={22} className="shrink-0 text-accent-600" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-semibold text-brand-950 group-hover:underline">{f.title}</span>
                        {f.note ? <span className="block text-sm text-ink-600">{f.note}</span> : null}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand-950 px-3 py-2 text-sm font-semibold text-white">
                        <Download aria-hidden size={15} />
                        <span className="hidden sm:inline">{t.downloads.open}</span>
                        <span className="sr-only">{t.footer.opensNew}</span>
                      </span>
                    </a>
                  </StaggerItem>
                ))}
            </Stagger>
          </section>
        ))}

        {attached.length ? (
          <section>
            <Head index={kinds.length + 1} heading={top.noticesHeading} />
            <ul className="mt-6 divide-y divide-brand-950/10 border-y border-brand-950/10">
              {attached.map((n) => (
                <li key={n.id}>
                  <a href={n.attachment} target="_blank" rel="noopener noreferrer" className="group flex min-h-[64px] items-center gap-4 py-4">
                    <Paperclip aria-hidden size={20} className="shrink-0 text-accent-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold text-brand-950 group-hover:underline">{n.title}</span>
                      <span className="tabular block text-sm text-ink-600">{niceDate(n.publishOn, t.common.months)}</span>
                    </span>
                    <span className="sr-only">{t.footer.opensNew}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Band>
    </>
  );
}
