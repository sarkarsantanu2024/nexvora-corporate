import type { ReactNode } from 'react';
import { content } from '@/cms/content';
import { siteBrand, siteContact, siteFooter, siteHeader, siteVisit } from '@/cms/sections';
import { Dock } from '@/components/site/dock';
import { SiteFooter } from '@/components/site/footer';
import { SiteHeader, type NavItem } from '@/components/site/header';
import { SiteI18n } from '@/components/site/i18n/client';
import { getSite } from '@/components/site/i18n/server';
import { ScrollProgress } from '@/components/site/motion-kit';
import { getNotices, getProgrammes } from '@/server/site/queries';

/** The frame around every public page: progress bar, header, footer, floating buttons. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { lang, t } = await getSite();
  const [brand, contact, header, footer, visit, programmes, notices] = await Promise.all([
    content(siteBrand),
    content(siteContact),
    content(siteHeader),
    content(siteFooter),
    content(siteVisit),
    getProgrammes(),
    getNotices(),
  ]);

  const nav: NavItem[] = [
    { href: '/about', label: t.nav.about },
    { href: '/programmes', label: t.nav.programmes },
    { href: '/facilities', label: t.nav.facilities },
    { href: '/gallery', label: t.nav.gallery },
    { href: '/centres', label: t.nav.centres },
    { href: '/admissions', label: t.nav.admissions },
    { href: '/franchise', label: t.nav.franchise },
    // The notice board is only worth a place in the menu when something is pinned to it.
    ...(notices.length ? [{ href: '/notices', label: t.nav.notices }] : []),
    { href: '/contact', label: t.nav.contact },
  ];

  return (
    <SiteI18n lang={lang}>
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-white">
      <ScrollProgress />
      <SiteHeader
        brand={{ name: brand.name, tagline: brand.tagline, mark: brand.mark || '/brand/mark.png' }}
        nav={nav}
        enquireLabel={header.enquireLabel}
        loginLabel={header.loginLabel}
        phone={contact.phone}
        whatsapp={contact.whatsapp}
        whatsappMessage={visit.whatsappMessage}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter
        brand={brand}
        contact={contact}
        footer={footer}
        nav={nav}
        programmes={programmes.map((p) => ({ slug: p.slug, name: p.name }))}
        whatsappMessage={visit.whatsappMessage}
      />
      <Dock phone={contact.phone} whatsapp={contact.whatsapp} message={visit.whatsappMessage} />
    </div>
    </SiteI18n>
  );
}
