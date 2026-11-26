/**
 * The five colour families of the public website, as ready-made class sets.
 * Tailwind only keeps class names it can see written out in full, which is
 * why every combination is spelled out here and not built from the key.
 */
export type Tone = 'sun' | 'coral' | 'mint' | 'sky' | 'brand';

export const TONES: Record<
  Tone,
  { soft: string; tint: string; solid: string; text: string; border: string; hex: string; deep: string; chip: string }
> = {
  sun: { soft: 'bg-sun-50', tint: 'bg-sun-100', solid: 'bg-sun-400', text: 'text-sun-700', border: 'border-sun-300', hex: '#ffc83d', deep: '#a86a00', chip: 'bg-sun-100 text-sun-700' },
  coral: { soft: 'bg-coral-50', tint: 'bg-coral-100', solid: 'bg-coral-400', text: 'text-coral-700', border: 'border-coral-300', hex: '#ff7a59', deep: '#a3320f', chip: 'bg-coral-100 text-coral-700' },
  mint: { soft: 'bg-mint-50', tint: 'bg-mint-100', solid: 'bg-mint-400', text: 'text-mint-700', border: 'border-mint-300', hex: '#2ec4a0', deep: '#0c6b56', chip: 'bg-mint-100 text-mint-700' },
  sky: { soft: 'bg-sky-50', tint: 'bg-sky-100', solid: 'bg-sky-400', text: 'text-sky-700', border: 'border-sky-300', hex: '#38b6ff', deep: '#0a5e94', chip: 'bg-sky-100 text-sky-700' },
  brand: { soft: 'bg-brand-50', tint: 'bg-brand-100', solid: 'bg-brand-600', text: 'text-brand-700', border: 'border-brand-300', hex: '#6a5cc6', deep: '#3f348f', chip: 'bg-brand-100 text-brand-700' },
};

const ORDER: Tone[] = ['sun', 'coral', 'mint', 'sky', 'brand'];

/** A saved colour key, or the next colour in the rotation when it is missing or unknown. */
export function toneOf(key: string | undefined | null, index = 0): Tone {
  if (key && key in TONES) return key as Tone;
  if (key === 'indigo') return 'brand';
  return ORDER[index % ORDER.length];
}

/** Side padding shared by the header (which runs the full width of the screen) and the page container. */
export const GUTTER = 'px-4 sm:px-8 lg:px-12 2xl:px-16';

/**
 * The page container: centred and wide enough to fill a large monitor without
 * stranding the content in the middle. Paragraphs keep their own max width
 * inside it, so lines stay readable. On a very wide monitor (2200px and up)
 * it widens once more, so the margins do not grow to a third of the screen.
 */
export const CONTAINER = `mx-auto w-full max-w-[1560px] min-[2200px]:max-w-[1880px] ${GUTTER}`;

/**
 * The school's own surfaces: warm paper for reading, deep navy from the seal
 * for the bold bands, the flame's yellow as the one bright accent. Written
 * out in full so Tailwind keeps them.
 */
export const PAPER = 'bg-[#f7f1e3]';
export const PAPER_DEEP = 'bg-[#efe5cc]';
export const NIGHT = 'bg-brand-950';
