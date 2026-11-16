/**
 * The home page banner. This file is the server half: it turns what the
 * editor saved into a clean list of slides (dropping anything unsafe or
 * unusable) and hands them to the slider, which runs in the browser.
 */
import { HeroSlider, type Slide } from './hero-slider';

export type HeroContent = {
  eyebrow: string;
  heading: string;
  highlight: string;
  text: string;
  image: string;
  imageAlt: string;
  badge: string;
  primaryLabel: string;
  secondaryLabel: string;
  slides: Record<string, string>[];
};

const DEFAULT_LINK = '/admissions#enquire';

/** A YouTube address, https only → the 11-character video id, or null. */
export function youtubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  const host = parsed.hostname.replace(/^(www|m)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = parsed.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
    else id = /^\/(embed|shorts|live)\/([^/]+)/.exec(parsed.pathname)?.[2] ?? null;
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/** An mp4 file on this site ('/media/x.mp4') or on an https address. Nothing else is played. */
export const isMp4 = (url: string) => /^(https:\/\/[^\s/]+\/|\/(?!\/))[^\s]*\.mp4(\?[^\s]*)?$/i.test(url.trim());

/** A button may point at a page of this site or an https address, nothing else (no javascript:, no http:). */
const safeLink = (link: string | undefined) => {
  const value = (link ?? '').trim();
  return /^\/(?!\/)/.test(value) || /^https:\/\//.test(value) ? value : DEFAULT_LINK;
};

export function buildSlides(hero: HeroContent): Slide[] {
  const slides: Slide[] = [];
  for (const row of hero.slides ?? []) {
    const image = (row.image ?? '').trim();
    const video = (row.video ?? '').trim();
    const words = {
      heading: row.heading?.trim() || hero.heading,
      text: row.text?.trim() || hero.text,
      buttonLabel: row.buttonLabel?.trim() || hero.primaryLabel,
      buttonLink: safeLink(row.buttonLink),
      alt: row.alt?.trim() || hero.imageAlt,
    };
    const youtube = row.type === 'youtube' ? youtubeId(video) : null;
    if (youtube) slides.push({ kind: 'youtube', youtube, image, ...words });
    else if (row.type === 'mp4' && isMp4(video)) slides.push({ kind: 'mp4', video, image, ...words });
    // A video slide whose address we cannot accept still shows its photo, if it has one.
    else if (image) slides.push({ kind: 'image', image, ...words });
  }
  // No usable slides: the banner's own heading, text and photo make a single slide.
  if (!slides.length) {
    slides.push({
      kind: 'image',
      image: hero.image,
      heading: hero.heading,
      text: hero.text,
      buttonLabel: hero.primaryLabel,
      buttonLink: DEFAULT_LINK,
      alt: hero.imageAlt,
    });
  }
  return slides;
}

export function HomeHero({ hero, ages, seats }: { hero: HeroContent; ages: string; seats: number }) {
  return (
    <HeroSlider
      slides={buildSlides(hero)}
      eyebrow={hero.eyebrow}
      highlight={hero.highlight}
      badge={hero.badge}
      secondaryLabel={hero.secondaryLabel}
      ages={ages}
      seats={seats}
    />
  );
}
