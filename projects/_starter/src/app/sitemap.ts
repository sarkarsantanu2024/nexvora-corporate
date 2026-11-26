import type { MetadataRoute } from 'next';
import { absLocale, languageAlternates } from '@/components/site/seo';
import { DEFAULT_LANG, LANGS } from '@/lib/i18n';
import { getNotices } from '@/server/site/queries';

/**
 * Every public page in each language in use (src/config/languages.ts). Each entry lists its
 * other-language versions, so a search engine can offer the right one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const notices = await getNotices();
  const now = new Date();

  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/gallery', priority: 0.6, changeFrequency: 'weekly' },
    // The notice board is listed only while it has something on it.
    ...(notices.length ? [{ path: '/notices', priority: 0.5, changeFrequency: 'weekly' as const }] : []),
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  ];

  return pages.flatMap((page) =>
    LANGS.map((lang) => ({
      url: absLocale(lang, page.path),
      lastModified: now,
      changeFrequency: page.changeFrequency,
      // The default language is the main version; the others rank a little below it.
      priority: lang === DEFAULT_LANG ? page.priority : Math.round(page.priority * 90) / 100,
      alternates: { languages: languageAlternates(page.path) },
    })),
  );
}
