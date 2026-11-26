import type { MetadataRoute } from 'next';
import { absLocale, languageAlternates } from '@/components/site/seo';
import { DEFAULT_LANG, LANGS } from '@/lib/i18n';
import { content } from '@/cms/content';
import { careersList } from '@/cms/sections';

/**
 * Every public page in each language in use (src/config/languages.ts). Each entry lists its
 * other-language versions, so a search engine can offer the right one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const careers = await content(careersList, 'en');
  const now = new Date();

  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/admission', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/notices', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/academics', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/events', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/teachers', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/results', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/schemes', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/student-life', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/gallery', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/facilities', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/downloads', priority: 0.5, changeFrequency: 'weekly' },
    { path: '/disclosure', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/alumni', priority: 0.4, changeFrequency: 'monthly' },
    // The vacancies page exists only while a vacancy is listed.
    ...(careers.items.length ? [{ path: '/careers', priority: 0.4, changeFrequency: 'weekly' as const }] : []),
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
