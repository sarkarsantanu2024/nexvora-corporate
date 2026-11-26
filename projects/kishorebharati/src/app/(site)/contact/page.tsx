import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { content, isHidden } from '@/cms/content';
import { contactForm, contactTop, siteBrand, siteContact, siteCta } from '@/cms/sections';
import { ContactForm } from '@/components/site/forms';
import { getSite } from '@/components/site/i18n/server';
import { WhatsAppIcon } from '@/components/site/icons';
import { Band } from '@/components/site/kit';
import { PageTop } from '@/components/site/page-top';
import { pageMeta } from '@/components/site/seo';
import { Cta } from '@/components/site/ui';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { telLink, waLink } from '@/lib/wa';

export async function generateMetadata(): Promise<Metadata> {
  const [{ lang, t }, top, contact, brand] = await Promise.all([getSite(), content(contactTop), content(siteContact), content(siteBrand)]);
  return pageMeta({
    lang,
    title: t.pages.contact,
    description: `${top.heading}. ${[brand.name, contact.address.replace(/\s+/g, ' '), contact.phone, contact.phone2].filter(Boolean).join(', ')}`,
    path: '/contact',
  });
}

export default async function ContactPage() {
  const { t } = await getSite();
  const [top, form, contact, visit] = await Promise.all([content(contactTop), content(contactForm), content(siteContact), content(siteCta)]);
  const tel = telLink(contact.phone);
  const tel2 = telLink(contact.phone2);
  const wa = waLink(contact.whatsapp, visit.whatsappMessage);
  // The map is Google's own embed page: no API key, and it loads only when scrolled near.
  const embed = contact.mapPlace ? `https://maps.google.com/maps?q=${encodeURIComponent(contact.mapPlace)}&z=16&output=embed` : '';

  const ways: { key: string; label: string; value: string; href?: string; icon: ReactNode; outside?: boolean }[] = [
    tel ? { key: 'phone', label: t.pages.callUs, value: contact.phone, href: tel, icon: <Phone aria-hidden size={22} /> } : null,
    tel2 ? { key: 'phone2', label: t.pages.landline, value: contact.phone2, href: tel2, icon: <Phone aria-hidden size={22} /> } : null,
    wa ? { key: 'wa', label: t.pages.whatsapp, value: t.pages.sendMessage, href: wa, icon: <WhatsAppIcon size={24} />, outside: true } : null,
    contact.email ? { key: 'email', label: t.pages.email, value: contact.email, href: `mailto:${contact.email}`, icon: <Mail aria-hidden size={22} /> } : null,
    contact.hours ? { key: 'hours', label: t.pages.officeHours, value: contact.hours, icon: <Clock aria-hidden size={22} /> } : null,
  ].filter((way) => way !== null);

  return (
    <>
      <PageTop eyebrow={top.eyebrow} heading={top.heading} text={top.text} crumbs={[{ name: t.nav.contact, path: '/contact' }]} />

      <Band tone="paper">
        <h2 className="sr-only">{t.pages.contactWays}</h2>
        <Stagger className={cn('grid gap-px overflow-hidden rounded-xl border border-brand-950/10 bg-brand-950/10 sm:grid-cols-2', ways.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {ways.map((way) => {
            const inner = (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-md bg-brand-950 text-sun-300 transition-transform duration-300 group-hover:-rotate-6">{way.icon}</span>
                <span className="mt-4 block text-sm font-semibold text-ink-600">{way.label}</span>
                <span className={cn('mt-0.5 block text-xl font-bold text-brand-950', way.key === 'email' && 'break-all', way.key.startsWith('phone') && 'tabular')}>{way.value}</span>
              </>
            );
            return (
              <StaggerItem key={way.key} className="h-full bg-white">
                {way.href ? (
                  <a href={way.href} {...(way.outside ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="group block h-full p-6 transition hover:bg-[#fbf7ec]">
                    {inner}
                  </a>
                ) : (
                  <div className="group h-full p-6">{inner}</div>
                )}
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-10">
          {!isHidden(form) ? (
            <Reveal id="enquire" className="scroll-mt-28 rounded-xl border border-brand-950/10 bg-white p-6 sm:p-10">
              <h2 className="text-3xl font-bold text-brand-950">{form.heading}</h2>
              {form.text ? <p className="mt-2 text-lg text-ink-700">{form.text}</p> : null}
              <div className="mt-7">
                <ContactForm copy={form} whatsapp={contact.whatsapp} whatsappMessage={visit.whatsappMessage} />
              </div>
            </Reveal>
          ) : null}

          <Reveal delay={0.1} className="self-start overflow-hidden rounded-xl bg-brand-950 text-white">
            {embed ? (
              <iframe
                src={embed}
                title={t.common.mapTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block aspect-[4/3] w-full border-0 bg-brand-900"
              />
            ) : null}
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold">{form.mapHeading}</h2>
              {contact.address ? (
                <p className="mt-3 flex gap-3 text-lg leading-relaxed text-brand-50">
                  <MapPin aria-hidden size={22} className="mt-1 shrink-0 text-sun-300" />
                  <span className="whitespace-pre-line">{contact.address}</span>
                </p>
              ) : null}
              {contact.mapUrl ? (
                <Cta href={contact.mapUrl} variant="red" icon={<Navigation aria-hidden size={18} className="relative" />} className="mt-6 w-full rounded-md sm:w-auto">
                  {form.mapButton}
                </Cta>
              ) : null}
            </div>
          </Reveal>
        </div>
      </Band>
    </>
  );
}
