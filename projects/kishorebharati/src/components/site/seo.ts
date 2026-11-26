/** Page titles, descriptions and structured data for search engines, in each language in use. */
import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { DEFAULT_LANG, LANG_NAMES, LANGS, localePath, type Lang } from '@/lib/i18n';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400').replace(/\/$/, '');

/** '/about' → 'https://…/about'. Leaves full URLs alone. */
export const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

/** The full address of a site page in one language. */
export const absLocale = (lang: Lang, path: string) => abs(localePath(lang, path));

/** hreflang → address, for <link rel="alternate"> and the sitemap. The default language is also the x-default. */
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const lang of LANGS) out[LANG_NAMES[lang].htmlLang] = absLocale(lang, path);
  out['x-default'] = absLocale(DEFAULT_LANG, path);
  return out;
}

const OG_LOCALE: Record<Lang, string> = { en: 'en_IN', bn: 'bn_IN', hi: 'hi_IN' };

/** Cuts a description to what a search result shows, on a word boundary. */
export function trimTo(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(' ', max - 1)).replace(/[,.;:।]$/, '')}…`;
}

export function pageMeta({
  lang,
  title,
  description,
  path,
  image = '/images/hero.jpg',
  absoluteTitle,
}: {
  lang: Lang;
  title: string;
  description: string;
  /** The page's address without a language prefix: '/about'. */
  path: string;
  image?: string;
  /** Use the title as it is, without the business name after it. */
  absoluteTitle?: boolean;
}): Metadata {
  const desc = trimTo(description);
  const url = absLocale(lang, path);
  const picture = image || '/images/hero.jpg';
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: 'website',
      locale: OG_LOCALE[lang],
      alternateLocale: LANGS.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
      siteName: BRAND.name,
      title,
      description: desc,
      url,
      images: [{ url: picture }],
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [picture] },
  };
}

export type Crumb = { name: string; path: string };

export const breadcrumbLd = (lang: Lang, crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  inLanguage: LANG_NAMES[lang].htmlLang,
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: absLocale(lang, crumb.path),
  })),
});

/** "12, Park Street, Kolkata 700016" becomes the pieces schema.org wants. Best effort: only the PIN code is picked out. */
export function postalAddress(address: string) {
  const pin = address.match(/\b\d{6}\b/)?.[0] || '';
  const street = address.replace(pin, '').replace(/[,\s]+$/, '');
  return {
    '@type': 'PostalAddress',
    streetAddress: street,
    ...(pin ? { postalCode: pin } : {}),
    addressCountry: 'IN',
  };
}

/**
 * What a search engine reads about the school on the home page: a high
 * school (an EducationalOrganization) with its real address, phone, email,
 * founding year and founder.
 */
export function schoolLd(
  lang: Lang,
  { name, logo, image, contact }: { name: string; logo: string; image: string; contact: { phone: string; phone2?: string; email: string; address: string; mapUrl: string; facebook: string; instagram: string; youtube: string } },
) {
  const firstLine = contact.address.split('\n')[0] ?? '';
  const pin = firstLine.match(/\b\d{6}\b/)?.[0] ?? '';
  const street = firstLine.replace(/,?\s*Kolkata.*$/i, '').replace(/,?\s*কলকাতা.*$/, '').trim();
  const phones = [contact.phone, contact.phone2].filter(Boolean).map((p) => {
    const digits = (p ?? '').replace(/\D/g, '').replace(/^0/, '');
    return `+91${digits.slice(-10)}`;
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'HighSchool',
    '@id': abs('/#school'),
    inLanguage: LANG_NAMES[lang].htmlLang,
    name,
    alternateName: BRAND.name,
    url: absLocale(lang, '/'),
    logo: abs(logo),
    image: abs(image),
    foundingDate: '1965',
    founder: { '@type': 'Person', name: 'Mihir Sengupta' },
    ...(phones.length ? { telephone: phones[0] } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: street || 'P2/A, Motijheel Avenue',
      addressLocality: 'Kolkata',
      addressRegion: 'West Bengal',
      ...(pin ? { postalCode: pin } : {}),
      addressCountry: 'IN',
    },
    ...(contact.mapUrl ? { hasMap: contact.mapUrl } : {}),
    ...(phones.length > 1 ? { contactPoint: phones.map((telephone) => ({ '@type': 'ContactPoint', telephone, contactType: 'school office' })) } : {}),
    sameAs: [contact.facebook, contact.instagram, contact.youtube].filter(Boolean),
  };
}
