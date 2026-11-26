import type { NextConfig } from 'next';

/**
 * Sent with every page and file. They close the common holes a browser
 * leaves open by default: another site showing ours inside a frame, a file
 * being read as a different type, our full address leaking to other sites.
 * The microphone stays allowed for our own pages, because voice editing uses it.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Only the rules that cannot break a page: scripts, styles, photos and
  // YouTube slides are left to the defaults on purpose.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const config: NextConfig = {
  // A second build can run beside a live dev server by pointing this elsewhere.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['@electric-sql/pglite', 'sharp', 'ws'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }],
  },
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default config;
