import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/components/site/seo';

/** Search engines may read the website; the dashboards, the login and the API are off limits. */
export default function robots(): MetadataRoute.Robots {
  return {
    // '/centre' alone would also shut out the public '/centres' pages, so the dashboard is named exactly.
    rules: [{ userAgent: '*', allow: '/', disallow: ['/hq', '/centre$', '/centre/', '/parent', '/account', '/api', '/login'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
