import type { CSSProperties, ReactNode } from 'react';
import { content } from '@/cms/content';
import { careersList, siteBrand, siteContact, siteCta, siteFooter, siteHeader } from '@/cms/sections';
import { BRAND } from '@/config/brand';
import { Dock } from '@/components/site/dock';
import { SiteFooter } from '@/components/site/footer';
import { SiteHeader, type NavGroup } from '@/components/site/header';
import { SiteI18n } from '@/components/site/i18n/client';
import { getSite } from '@/components/site/i18n/server';
import { ScrollProgress } from '@/components/site/motion-kit';

/**
 * The frame around every public page: header with the grouped menu, footer,
 * floating buttons. The site's headings use the reading typeface (Hind
 * Siliguri in Bengali) rather than the rounded display face, for a sober,
 * printed look; the dashboards are not affected.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { lang, t } = await getSite();
  const [brand, brandBn, brandEn, contact, header, footer, visit, careers] = await Promise.all([
    content(siteBrand),
    content(siteBrand, 'bn'),
    content(siteBrand, 'en'),
    content(siteContact),
    content(siteHeader),
    content(siteFooter),
    content(siteCta),
    content(careersList),
  ]);

  const n = t.nav;
  const groups: NavGroup[] = [
    {
      key: 'school',
      label: n.groups.school,
      items: [
        { href: '/about', label: n.about, icon: 'about' },
        { href: '/teachers', label: n.teachers, icon: 'teachers' },
        { href: '/facilities', label: n.facilities, icon: 'facilities' },
        { href: '/disclosure', label: n.disclosure, icon: 'disclosure' },
      ],
    },
    {
      key: 'learning',
      label: n.groups.learning,
      items: [
        { href: '/academics', label: n.academics, icon: 'academics' },
        { href: '/results', label: n.results, icon: 'results' },
        { href: '/events', label: n.events, icon: 'events' },
        { href: '/downloads', label: n.downloads, icon: 'downloads' },
      ],
    },
    {
      key: 'admission',
      label: n.groups.admission,
      items: [
        { href: '/admission', label: n.admission, icon: 'admission' },
        { href: '/schemes', label: n.schemes, icon: 'schemes' },
        { href: '/faq', label: n.faq, icon: 'faq' },
      ],
    },
    {
      key: 'life',
      label: n.groups.life,
      items: [
        { href: '/student-life', label: n.life, icon: 'life' },
        { href: '/gallery', label: n.gallery, icon: 'gallery' },
        { href: '/alumni', label: n.alumni, icon: 'alumni' },
      ],
    },
    {
      key: 'info',
      label: n.groups.info,
      items: [
        { href: '/notices', label: n.notices, icon: 'notices' },
        // The vacancies page is in the menu only while a vacancy is listed.
        ...(careers.items.length ? [{ href: '/careers', label: n.careers, icon: 'careers' }] : []),
      ],
    },
    { key: 'contact', label: n.groups.contact, items: [{ href: '/contact', label: n.contact, icon: 'contact' }] },
  ];

  const names = { bn: brandBn.name, en: brandEn.name };
  // Headings in the reading typeface on the public site only.
  const faces = { '--font-display': 'var(--font-body)' } as CSSProperties;

  return (
    <SiteI18n lang={lang}>
      <div className="flex min-h-dvh flex-col overflow-x-clip bg-[#fbf7ec] text-ink-800" style={faces}>
        <ScrollProgress />
        <SiteHeader
          names={names}
          tagline={brand.tagline}
          mark={brand.mark || BRAND.mark}
          udise={brand.udise}
          groups={groups}
          admissionLabel={header.admissionLabel}
          callLabel={header.callLabel}
          loginLabel={header.loginLabel}
          phone={contact.phone}
          whatsapp={contact.whatsapp}
          whatsappMessage={visit.whatsappMessage}
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter names={names} brand={{ tagline: brand.tagline, logo: brand.logo || BRAND.mark, udise: brand.udise }} contact={contact} footer={footer} groups={groups} whatsappMessage={visit.whatsappMessage} />
        <Dock phone={contact.phone} whatsapp={contact.whatsapp} message={visit.whatsappMessage} />
      </div>
    </SiteI18n>
  );
}
