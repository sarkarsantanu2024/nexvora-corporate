import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { content, isHidden } from '@/cms/content';
import { contactForm, contactTop, siteBrand, siteContact, siteCta } from '@/cms/sections';
import { Cloud } from '@/components/site/art';
import { ContactForm } from '@/components/site/forms';
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YoutubeIcon } from '@/components/site/icons';
import { Drift } from '@/components/site/motion-kit';
import { fill } from '@/components/site/i18n';
import { getSite } from '@/components/site/i18n/server';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Cta, Section } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { telLink, waLink } from '@/lib/wa';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top, contact, brand] = await Promise.all([getSite(), content(contactTop), content(siteContact), content(siteBrand)]);
  return pageMeta({
    lang,
    title: t.pages.contact,
    description: `${top.heading}. ${top.text} ${[brand.name, contact.address.replace(/\s+/g, ' '), contact.phone].filter(Boolean).join(', ')}`,
    path: '/contact',
  });
}

export default async function ContactPage() {
  const { t } = await getSite();
  const [top, form, contact, visit, brand] = await Promise.all([content(contactTop), content(contactForm), content(siteContact), content(siteCta), content(siteBrand)]);
  const tel = telLink(contact.phone);
  const wa = waLink(contact.whatsapp, visit.whatsappMessage);

  // Each way to reach the business is listed only when it has been filled in.
  const ways: { key: string; label: string; value: string; href?: string; icon: ReactNode; chip: string; outside?: boolean }[] = [
    tel ? { key: 'phone', label: t.pages.callUs, value: contact.phone, href: tel, icon: <Phone aria-hidden size={24} />, chip: 'bg-brand-100 text-brand-700' } : null,
    wa ? { key: 'wa', label: t.pages.whatsapp, value: t.pages.sendMessage, href: wa, icon: <WhatsAppIcon size={26} />, chip: 'bg-mint-100 text-mint-700', outside: true } : null,
    contact.email ? { key: 'email', label: t.pages.email, value: contact.email, href: `mailto:${contact.email}`, icon: <Mail aria-hidden size={24} />, chip: 'bg-coral-100 text-coral-700' } : null,
    contact.hours ? { key: 'hours', label: t.pages.officeHours, value: contact.hours, icon: <Clock aria-hidden size={24} />, chip: 'bg-sun-100 text-sun-700' } : null,
  ].filter((way) => way !== null);

  const socials = [
    { href: contact.facebook, label: 'Facebook', icon: <FacebookIcon size={20} /> },
    { href: contact.instagram, label: 'Instagram', icon: <InstagramIcon size={20} /> },
    { href: contact.youtube, label: 'YouTube', icon: <YoutubeIcon size={20} /> },
  ].filter((s) => s.href);
  // The address card is worth showing only once there is an address, a map link or a social page.
  const hasPlace = Boolean(contact.address || contact.mapUrl || socials.length);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} tone="brand" crumbs={[{ name: t.nav.contact, path: '/contact' }]} />

      <Section className="!pt-10 sm:!pt-14">
        <h2 className="sr-only">{t.pages.contactWays}</h2>
        <Stagger className={cn('grid gap-4 sm:grid-cols-2 sm:gap-5', ways.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {ways.map((way) => {
            const inner = (
              <>
                <span className={cn('grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110', way.chip)}>{way.icon}</span>
                <span className="mt-4 block text-sm font-bold uppercase tracking-wide text-ink-500">{way.label}</span>
                <span className={cn('mt-1 block font-display text-xl font-bold text-brand-950', way.key === 'email' && 'break-all', way.key === 'phone' && 'tabular')}>{way.value}</span>
              </>
            );
            const box = 'group block h-full rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-card transition duration-300';
            return (
              <StaggerItem key={way.key} className="h-full">
                {way.href ? (
                  <a href={way.href} {...(way.outside ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={cn(box, 'hover:-translate-y-1.5 hover:shadow-lift')}>
                    {inner}
                  </a>
                ) : (
                  <div className={box}>{inner}</div>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className={cn('mt-10 grid gap-8 lg:gap-10', hasPlace ? 'lg:grid-cols-[1.2fr_.8fr]' : 'mx-auto max-w-3xl')}>
          {!isHidden(form) ? (
            <Reveal id="enquire" className="scroll-mt-28 rounded-[2.25rem] border border-ink-100 bg-white p-6 shadow-lift sm:p-10">
              <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">{form.heading}</h2>
              {form.text ? <p className="mt-2 text-lg text-ink-600">{form.text}</p> : null}
              <div className="mt-7">
                <ContactForm copy={form} whatsapp={contact.whatsapp} whatsappMessage={visit.whatsappMessage} />
              </div>
            </Reveal>
          ) : null}

          {hasPlace ? (
            <Reveal delay={0.1} className="relative self-start overflow-hidden rounded-[2.25rem] bg-sky-50">
              {/* A drawn sky, not a map: the Google Maps link opens the real one. */}
              <div aria-hidden className="relative h-44 overflow-hidden bg-sky-100">
                <Drift className="absolute left-[8%] top-6 w-24 text-white" bob={6} duration={9}>
                  <Cloud />
                </Drift>
                <Drift className="absolute right-[10%] top-10 w-16 text-white/80" bob={8} duration={7} delay={1}>
                  <Cloud />
                </Drift>
                <div className="absolute inset-x-0 bottom-0 h-10 rounded-t-[100%] bg-mint-300" />
                <span className="absolute bottom-4 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full bg-accent-500 text-white shadow-glow">
                  <MapPin size={28} />
                </span>
              </div>
              <div className="p-7 sm:p-9">
                <h2 className="font-display text-2xl font-extrabold text-brand-950 sm:text-3xl">{form.mapHeading}</h2>
                {contact.address ? <p className="mt-3 whitespace-pre-line text-lg font-medium leading-relaxed text-ink-800">{contact.address}</p> : null}
                {contact.mapUrl ? (
                  <Cta href={contact.mapUrl} variant="indigo" icon={<Navigation aria-hidden size={18} className="relative" />} className="mt-6 w-full sm:w-auto">
                    {form.mapButton}
                  </Cta>
                ) : null}
                {socials.length ? (
                  <ul className="mt-6 flex gap-2.5">
                    {socials.map((s) => (
                      <li key={s.label}>
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={fill(t.footer.social, { name: brand.name, network: s.label })}
                          className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-700 shadow-card transition hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white"
                        >
                          {s.icon}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Reveal>
          ) : null}
        </div>
      </Section>
    </>
  );
}
