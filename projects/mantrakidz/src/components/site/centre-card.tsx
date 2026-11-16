/** A centre on the Centres page: photo or drawn placeholder, address, and the three ways to reach it. */
import { ArrowRight, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { telLink, waLink } from '@/lib/wa';
import { centreAddress, type SiteCentre } from '@/server/site/queries';
import { Blocks, Cloud, SunFace } from './art';
import { fill } from './i18n';
import { SiteLink } from './i18n/client';
import { getSite } from './i18n/server';
import { WhatsAppIcon } from './icons';
import { SiteImage } from './ui';
import { TONES, type Tone } from './theme';

const ROTATION: Tone[] = ['sky', 'sun', 'mint', 'coral'];

/** Shown where a centre has no photo yet: a small drawn scene in the centre's colour. */
export function CentreArt({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <div aria-hidden className={cn('relative h-full w-full overflow-hidden', TONES[tone].tint, className)}>
      <SunFace className="absolute right-[8%] top-[10%] w-[18%]" />
      <Cloud className="absolute left-[8%] top-[16%] w-[26%] text-white" />
      <Cloud className="absolute right-[30%] top-[34%] w-[16%] text-white/80" />
      <Blocks className="absolute bottom-[6%] left-1/2 w-[34%] -translate-x-1/2" />
      <div className="absolute inset-x-0 bottom-0 h-[10%] bg-white/50" />
    </div>
  );
}

export async function CentreCard({ centre, index }: { centre: SiteCentre; index: number }) {
  const { t } = await getSite();
  const tone = ROTATION[index % ROTATION.length];
  const tel = telLink(centre.phone);
  const wa = waLink(centre.whatsapp || centre.phone, fill(t.common.waAdmission, { name: centre.name }));
  const action = 'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-bold transition hover:-translate-y-0.5';
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-card transition duration-300 hover:shadow-lift">
      <SiteLink href={`/centres/${centre.slug}`} className="relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden>
        {centre.photo ? (
          <SiteImage src={centre.photo} alt="" sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 92vw" className="transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <CentreArt tone={tone} />
        )}
        {centre.status === 'onboarding' ? (
          <span className="absolute left-4 top-4 rounded-full bg-sun-400 px-3 py-1 font-display text-sm font-bold text-brand-950 shadow-sm">{t.common.openingSoon}</span>
        ) : null}
      </SiteLink>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-display text-2xl font-extrabold leading-tight text-brand-950">
          <SiteLink href={`/centres/${centre.slug}`} className="rounded hover:text-brand-700">
            {centre.name}
          </SiteLink>
        </h2>
        <p className="mt-2.5 flex gap-2.5 leading-relaxed text-ink-600">
          <MapPin aria-hidden size={19} className={cn('mt-1 shrink-0', TONES[tone].text)} />
          {centreAddress(centre)}
        </p>
        <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
          {tel ? (
            <a href={tel} className={cn(action, 'bg-brand-50 text-brand-800 hover:bg-brand-100')}>
              <Phone aria-hidden size={17} strokeWidth={2.4} />
              <span className="tabular">{centre.phone}</span>
            </a>
          ) : null}
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={fill(t.centres.whatsappAria, { name: centre.name })} className={cn(action, 'bg-mint-50 text-mint-700 hover:bg-mint-100')}>
              <WhatsAppIcon size={18} />
              {t.centres.whatsapp}
            </a>
          ) : null}
        </div>
        <SiteLink href={`/centres/${centre.slug}`} className="group/more mt-4 inline-flex min-h-[44px] items-center gap-1.5 font-display text-lg font-bold text-accent-600 hover:text-accent-700">
          {t.centres.see}
          <ArrowRight aria-hidden size={18} strokeWidth={2.6} className="transition-transform group-hover/more:translate-x-1" />
        </SiteLink>
      </div>
    </article>
  );
}
