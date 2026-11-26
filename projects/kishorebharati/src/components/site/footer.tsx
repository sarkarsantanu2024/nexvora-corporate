/** The footer of every public page: the seal and both names, the page groups, useful government links, and how to reach the school. */
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { telLink, waLink } from '@/lib/wa';
import type { NavGroup } from './header';
import { fill } from './i18n';
import { SiteLink } from './i18n/client';
import { getSite } from './i18n/server';
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YoutubeIcon } from './icons';
import { CONTAINER } from './theme';
import { SiteImage } from './ui';

type Contact = {
  phone: string;
  phone2: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  mapUrl: string;
  facebook: string;
  instagram: string;
  youtube: string;
};

const USEFUL = [
  { key: 'banglarShiksha', href: 'https://banglarshiksha.wb.gov.in' },
  { key: 'wbbse', href: 'https://wbbse.wb.gov.in' },
  { key: 'wbchse', href: 'https://wbchse.wb.gov.in' },
] as const;

export async function SiteFooter({
  names,
  brand,
  contact,
  footer,
  groups,
  whatsappMessage,
}: {
  names: { bn: string; en: string };
  brand: { tagline: string; logo: string; udise: string };
  contact: Contact;
  footer: { about: string; note: string };
  groups: NavGroup[];
  whatsappMessage: string;
}) {
  const { lang, t } = await getSite();
  const tel = telLink(contact.phone);
  const tel2 = telLink(contact.phone2);
  const wa = waLink(contact.whatsapp, whatsappMessage);
  const socials = [
    { href: contact.facebook, label: 'Facebook', icon: <FacebookIcon /> },
    { href: contact.instagram, label: 'Instagram', icon: <InstagramIcon /> },
    { href: contact.youtube, label: 'YouTube', icon: <YoutubeIcon /> },
  ].filter((s) => s.href);
  const name = lang === 'bn' ? names.bn : names.en;
  const link = 'inline-flex min-h-[40px] items-center leading-snug text-brand-100 transition hover:text-white hover:underline decoration-sun-300 underline-offset-4';

  return (
    <footer className="relative mt-auto overflow-hidden bg-brand-950 pb-[calc(72px+env(safe-area-inset-bottom))] text-brand-100 xl:pb-0">
      {/* the seal as a large watermark, cut off by the edge */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-20 h-[420px] w-[420px] opacity-[0.05] invert">
        <SiteImage src={brand.logo} alt="" sizes="420px" className="!object-contain" />
      </div>
      <div aria-hidden className="h-1 bg-[linear-gradient(90deg,#ffc83d,#f2433a_45%,#2b3888)]" />

      <div className={`${CONTAINER} relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12 lg:py-20`}>
        <div>
          <SiteLink href="/" aria-label={fill(t.header.homeAria, { name })} className="inline-flex items-center gap-3">
            <span className="relative block h-16 w-16 shrink-0 rounded-full bg-white p-1">
              <SiteImage src={brand.logo} alt={fill(t.footer.logoAlt, { name })} width={120} height={120} sizes="64px" className="h-full w-full object-contain" />
            </span>
            <span className="leading-tight">
              <span lang="bn" className="block text-xl font-bold text-white">
                {names.bn}
              </span>
              <span lang="en" className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-200">
                {names.en}
              </span>
            </span>
          </SiteLink>
          <p lang="bn" className="mt-5 text-lg text-sun-300">
            {brand.tagline}
          </p>
          <p className="mt-3 max-w-sm leading-relaxed">{footer.about}</p>
          {brand.udise ? (
            <p className="mt-4 text-sm text-brand-200">
              {t.footer.udise}: <span className="tabular font-semibold text-white">{brand.udise}</span>
            </p>
          ) : null}
          {socials.length ? (
            <ul className="mt-5 flex gap-2.5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={fill(t.footer.social, { name, network: s.label })}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-brand-950"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label={t.footer.navAria}>
          <h2 className="text-base font-bold text-white">{t.footer.explore}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-1">
            {groups
              .flatMap((g) => g.items)
              .filter((item, i, all) => all.findIndex((other) => other.href === item.href) === i)
              .slice(0, 12)
              .map((item) => (
                <li key={item.href}>
                  <SiteLink href={item.href} className={link}>
                    {item.label}
                  </SiteLink>
                </li>
              ))}
            <li>
              <Link href="/login" className={link}>
                {t.footer.login}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-base font-bold text-white">{t.footer.useful}</h2>
          <ul className="mt-3">
            {USEFUL.map((u) => (
              <li key={u.key}>
                <a href={u.href} target="_blank" rel="noopener noreferrer" className={`${link} gap-1`}>
                  {t.footer[u.key]}
                  <ArrowUpRight aria-hidden size={15} className="text-sun-300" />
                  <span className="sr-only">{t.footer.opensNew}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white">{t.footer.reach}</h2>
          <ul className="mt-4 space-y-3">
            {contact.address ? (
              <li className="flex gap-3">
                <MapPin aria-hidden size={19} className="mt-1 shrink-0 text-sun-300" />
                <span>
                  <span className="whitespace-pre-line">{contact.address}</span>
                  {contact.mapUrl ? (
                    <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-[40px] items-center font-semibold text-white underline decoration-sun-300 underline-offset-4">
                      {t.footer.map}
                    </a>
                  ) : null}
                </span>
              </li>
            ) : null}
            {tel ? (
              <li className="flex gap-3">
                <Phone aria-hidden size={19} className="mt-2.5 shrink-0 text-sun-300" />
                <span className="flex flex-wrap gap-x-3">
                  <a href={tel} className="tabular inline-flex min-h-[44px] items-center font-semibold text-white hover:underline">
                    {contact.phone}
                  </a>
                  {tel2 ? (
                    <a href={tel2} className="tabular inline-flex min-h-[44px] items-center font-semibold text-white hover:underline">
                      {contact.phone2}
                    </a>
                  ) : null}
                </span>
              </li>
            ) : null}
            {wa ? (
              <li className="flex gap-3">
                <WhatsAppIcon size={19} className="mt-2.5 shrink-0 text-sun-300" />
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center font-semibold text-white hover:underline">
                  {t.footer.whatsapp}
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li className="flex gap-3">
                <Mail aria-hidden size={19} className="mt-2.5 shrink-0 text-sun-300" />
                <a href={`mailto:${contact.email}`} className="inline-flex min-h-[44px] items-center break-all font-semibold text-white hover:underline">
                  {contact.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className={`${CONTAINER} flex flex-col gap-1 py-5 text-sm text-brand-200 sm:flex-row sm:justify-between`}>
          <p>
            © {new Date().getFullYear()} {name}. {footer.note}
          </p>
          <p lang="bn">{brand.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
