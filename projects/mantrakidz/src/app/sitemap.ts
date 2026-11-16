import type { MetadataRoute } from 'next';
import { absLocale, languageAlternates } from '@/components/site/seo';
import { LANGS } from '@/lib/i18n';
import { getCentres, getNotices, getProgrammes } from '@/server/site/queries';

/**
 * Every public page in all three languages, including one per class and one
 * per centre shown on the website. Each entry lists its other-language
 * versions, so a search engine can offer the right one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programmes, centres, notices] = await Promise.all([getProgrammes('en'), getCentres(), getNotices()]);
  const now = new Date();

  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/programmes', priority: 0.9, changeFrequency: 'monthly' },
    ...programmes.map((p) => ({ path: `/programmes/${p.slug}`, priority: 0.8, changeFrequency: 'monthly' as const })),
    { path: '/facilities', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/gallery', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/centres', priority: 0.8, changeFrequency: 'monthly' },
    ...centres.map((c) => ({ path: `/centres/${c.slug}`, priority: 0.8, changeFrequency: 'monthly' as const })),
    { path: '/admissions', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/franchise', priority: 0.9, changeFrequency: 'monthly' },
    // The notice board is listed only while it has something on it.
    ...(notices.length ? [{ path: '/notices', priority: 0.5, changeFrequency: 'weekly' as const }] : []),
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  ];

  return pages.flatMap((page) =>
    LANGS.map((lang) => ({
      url: absLocale(lang, page.path),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      // English is the main version; the translations rank a little below it.
      priority: lang === 'en' ? page.priority : Math.round(page.priority * 90) / 100,
      alternates: { languages: languageAlternates(page.path) },
    })),
  );
}
