/** The footer of every public page. */
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { fill } from './i18n';
import { SiteLink } from './i18n/client';
import { getSite } from './i18n/server';
import { telLink, waLink } from '@/lib/wa';
import { Blocks, Cloud, Wave } from './art';
import type { NavItem } from './header';
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YoutubeIcon } from './icons';
import { SiteImage } from './ui';
import { CONTAINER } from './theme';

type Contact = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  mapUrl: string;
  facebook: string;
  instagram: string;
  youtube: string;
};

export async function SiteFooter({
  brand,
  contact,
  footer,
  nav,
  programmes,
  whatsappMessage,
}: {
  brand: { name: string; tagline: string; parent: string; logo: string };
  contact: Contact;
  footer: { about: string; note: string };
  nav: NavItem[];
  programmes: { slug: string; name: string }[];
  whatsappMessage: string;
}) {
  const { t } = await getSite();
  const tel = telLink(contact.phone);
  const wa = waLink(contact.whatsapp, whatsappMessage);
  const socials = [
    { href: contact.facebook, label: 'Facebook', icon: <FacebookIcon /> },
    { href: contact.instagram, label: 'Instagram', icon: <InstagramIcon /> },
    { href: contact.youtube, label: 'YouTube', icon: <YoutubeIcon /> },
  ].filter((s) => s.href);
  const linkClass = 'flex min-h-[44px] min-w-[44px] items-center leading-normal text-brand-100 transition hover:translate-x-0.5 hover:text-white';

  return (
    <footer className="relative mt-auto bg-brand-900 text-brand-100">
      <Wave flip className="absolute inset-x-0 -top-px text-white" variant={1} />
      <div aria-hidden className="pointer-events-none absolute right-[8%] top-16 hidden w-32 text-white/5 lg:block">
        <Cloud />
      </div>

      <div className={`${CONTAINER} relative grid gap-10 pb-12 pt-24 sm:grid-cols-2 sm:pt-28 lg:grid-cols-[1.3fr_.8fr_.8fr_1.2fr] lg:gap-12 lg:pt-32`}>
        <div>
          <SiteLink href="/" aria-label={fill(t.header.homeAria, { name: brand.name })} className="inline-block rounded-3xl bg-white p-3 shadow-lift">
            <SiteImage src={brand.logo} alt={fill(t.footer.logoAlt, { name: brand.name })} width={150} height={135} sizes="150px" className="h-auto w-[132px]" />
          </SiteLink>
          <p className="mt-5 max-w-sm leading-relaxed">{footer.about}</p>
          {brand.parent ? <p className="mt-3 text-sm font-semibold text-brand-200">{brand.parent}</p> : null}
          {socials.length ? (
            <ul className="mt-5 flex gap-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={fill(t.footer.social, { name: brand.name, network: s.label })}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-brand-800"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label={t.footer.navAria}>
          <h2 className="font-display text-lg font-bold text-white">{t.footer.explore}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-1">
            {nav.map((item) => (
              <li key={item.href}>
                <SiteLink href={item.href} className={linkClass}>
                  {item.label}
                </SiteLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t.footer.programmes}>
          <h2 className="font-display text-lg font-bold text-white">{t.footer.programmes}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-1">
            {programmes.map((p) => (
              <li key={p.slug}>
                <SiteLink href={`/programmes/${p.slug}`} className={linkClass}>
                  {p.name}
                </SiteLink>
              </li>
            ))}
            <li>
              <Link href="/login" className={linkClass}>
                {t.footer.login}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-lg font-bold text-white">{t.footer.reach}</h2>
          <ul className="mt-4 space-y-3.5">
            {contact.address ? (
              <li className="flex gap-3">
                <MapPin aria-hidden size={20} className="mt-0.5 shrink-0 text-sun-300" />
                <span>
                  <span className="whitespace-pre-line">{contact.address}</span>
                  {contact.mapUrl ? (
                    <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center font-semibold text-white underline decoration-sun-300 underline-offset-4 hover:decoration-white">
                      {t.footer.map}
                    </a>
                  ) : null}
                </span>
              </li>
            ) : null}
            {tel ? (
              <li className="flex gap-3">
                <Phone aria-hidden size={20} className="mt-0.5 shrink-0 text-sun-300" />
                <a href={tel} className="tabular -my-2.5 inline-flex min-h-[44px] items-center font-semibold text-white hover:underline">
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {wa ? (
              <li className="flex gap-3">
                <WhatsAppIcon size={20} className="mt-0.5 shrink-0 text-sun-300" />
                <a href={wa} target="_blank" rel="noopener noreferrer" className="-my-2.5 inline-flex min-h-[44px] items-center font-semibold text-white hover:underline">
                  {t.footer.whatsapp}
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li className="flex gap-3">
                <Mail aria-hidden size={20} className="mt-0.5 shrink-0 text-sun-300" />
                <a href={`mailto:${contact.email}`} className="-my-2.5 inline-flex min-h-[44px] items-center break-all font-semibold text-white hover:underline">
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.hours ? (
              <li className="flex gap-3">
                <Clock aria-hidden size={20} className="mt-0.5 shrink-0 text-sun-300" />
                <span>{contact.hours}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className={`${CONTAINER} flex flex-col items-center justify-between gap-2 py-5 text-center text-sm text-brand-200 sm:flex-row sm:text-left`}>
          <p>
            © {new Date().getFullYear()} {brand.name}. {footer.note}
          </p>
          <div aria-hidden className="hidden w-14 sm:block">
            <Blocks />
          </div>
        </div>
      </div>
    </footer>
  );
}
