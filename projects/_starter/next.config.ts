import type { NextConfig } from 'next';

const config: NextConfig = {
  // A second build can run beside a live dev server by pointing this elsewhere.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: ['@electric-sql/pglite', 'sharp', 'ws'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }],
  },
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
};

export default config;
