import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/components/site/seo';

/** Search engines may read the website; the dashboards, the login and the API are off limits. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/api', '/login'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
