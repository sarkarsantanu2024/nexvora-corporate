import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { PwaProvider } from '@/components/pwa/pwa';
import { IntroCover } from '@/components/site/intro-cover';
import { ToastProvider } from '@/components/ui/client';
import { BRAND } from '@/config/brand';
import { LANG_NAMES } from '@/lib/i18n';
import { getLang } from '@/lib/lang';
// The font files live in the project (the @fontsource packages), so a build
// never has to download them: fetching from Google at build time failed a
// deployment once. These stylesheets declare every subset with a unicode-range,
// so the browser fetches only the files a page needs: Bengali, Devanagari, or
// the extended Latin file that holds the rupee sign. The family names they
// declare are given to the --font-* variables in globals.css.
import '@fontsource-variable/baloo-2/wght.css';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource-variable/baloo-da-2/wght.css';
import '@fontsource/hind/400.css';
import '@fontsource/hind/500.css';
import '@fontsource/hind/600.css';
import '@fontsource/hind/700.css';
import '@fontsource/hind-siliguri/400.css';
import '@fontsource/hind-siliguri/500.css';
import '@fontsource/hind-siliguri/600.css';
import '@fontsource/hind-siliguri/700.css';
import './globals.css';

// The two English faces again, as next/font files, only so they are preloaded
// on every page. No metric-matched fallback: it would sit in the font list
// ahead of the families above and take the letters these Latin files lack.
const display = localFont({
  src: '../../node_modules/@fontsource-variable/baloo-2/files/baloo-2-latin-wght-normal.woff2',
  weight: '400 800',
  variable: '--font-display-latin',
  display: 'swap',
  adjustFontFallback: false,
});
const body = localFont({
  src: '../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-body-latin',
  display: 'swap',
  adjustFontFallback: false,
});
const FONT_VARS = [display, body].map((font) => font.variable).join(' ');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} | ${BRAND.tagline}`, template: `%s | ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  icons: { icon: '/brand/icon.png', apple: '/brand/apple-touch-icon.png' },
  // Opens without browser bars when added to an iPhone home screen.
  appleWebApp: { capable: true, title: BRAND.shortName, statusBarStyle: 'default' },
};

// viewportFit lets the dashboard's bars reach under a phone's rounded corners
// and home indicator; they add the safe-area padding themselves.
export const viewport: Viewport = { themeColor: BRAND.themeColor, width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// Every page reads the database at request time; website content is cached
// separately (see src/cms/content.ts), so nothing is baked in at build time.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={LANG_NAMES[lang].htmlLang} data-lang={lang} className={FONT_VARS} suppressHydrationWarning>
      <body>
        {/* First thing in the page: the home page's intro starts on this cover (see the file). */}
        <IntroCover />
        <PwaProvider>
          <ToastProvider>{children}</ToastProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
