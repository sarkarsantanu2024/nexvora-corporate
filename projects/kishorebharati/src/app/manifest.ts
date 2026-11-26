import type { MetadataRoute } from 'next';
import { BRAND } from '@/config/brand';

/**
 * What a phone needs to install the dashboard as an app: name, icon, colours.
 * It opens on /login, which sends a logged-in person straight to their home.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: BRAND.description,
    start_url: '/login?source=app',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: BRAND.themeColor,
    background_color: BRAND.backgroundColor,
    icons: [
      { src: '/brand/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/app-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
