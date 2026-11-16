import type { Metadata, Viewport } from 'next';
import { Baloo_2, Baloo_Da_2, Hind, Hind_Siliguri, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/client';
import { LANG_NAMES } from '@/lib/i18n';
import { getLang } from '@/lib/lang';
import './globals.css';

const display = Baloo_2({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display-latin', display: 'swap' });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body-latin', display: 'swap' });

// Bengali and Hindi need their own typefaces: the Latin ones have no such
// letters. Baloo Da 2 and Baloo 2 are the same family as the English headings,
// so the three languages look like one brand. Not preloaded: the browser
// fetches them only on a page that actually shows those letters.
const displayBn = Baloo_Da_2({ subsets: ['bengali'], weight: ['500', '600', '700', '800'], variable: '--font-display-bn', display: 'swap', preload: false });
const bodyBn = Hind_Siliguri({ subsets: ['bengali'], weight: ['400', '500', '600', '700'], variable: '--font-body-bn', display: 'swap', preload: false });
const displayHi = Baloo_2({ subsets: ['devanagari'], weight: ['500', '600', '700', '800'], variable: '--font-display-hi', display: 'swap', preload: false });
const bodyHi = Hind({ subsets: ['devanagari'], weight: ['400', '500', '600', '700'], variable: '--font-body-hi', display: 'swap', preload: false });
const FONT_VARS = [display, body, displayBn, bodyBn, displayHi, bodyHi].map((font) => font.variable).join(' ');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Mantra Kidz | A Play School', template: '%s | Mantra Kidz' },
  description: 'Mantra Kidz is a play school for children from 1.5 to 5.5 years: Play Group, Nursery, LKG and UKG.',
  icons: { icon: '/brand/icon.png', apple: '/brand/icon.png' },
};

export const viewport: Viewport = { themeColor: '#3f348f', width: 'device-width', initialScale: 1 };

// Every page reads the database at request time; website content is cached
// separately (see src/cms/content.ts), so nothing is baked in at build time.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={LANG_NAMES[lang].htmlLang} data-lang={lang} className={FONT_VARS}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
