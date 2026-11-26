/**
 * Guards the website's Bengali and Hindi wording against the mistakes that
 * are easy to make and hard to see: a translation for a section or field
 * that does not exist, a list row missing a field, an underline phrase that
 * is no longer in its heading, a dictionary key left in English by accident.
 * Only the languages in use (src/config/languages.ts) are checked.
 */
import { describe, expect, it } from 'vitest';
import { SECTIONS } from '@/cms/sections';
import { BN } from '@/cms/sections/translations/bn';
import { HI } from '@/cms/sections/translations/hi';
import type { ContentData, ListField } from '@/cms/types';
import { bn } from '@/components/site/i18n/bn';
import { en } from '@/components/site/i18n/en';
import { hi } from '@/components/site/i18n/hi';
import { LANGS } from '@/lib/i18n';
import { buildSlides, isMp4, youtubeId } from '@/components/site/hero';

const LAYERS = ([
  ['bn', BN],
  ['hi', HI],
] as const).filter(([code]) => LANGS.includes(code)) as [string, Record<string, ContentData>][];
const SITE_DICTS = ([
  ['bn', bn],
  ['hi', hi],
] as const).filter(([code]) => LANGS.includes(code));
// Text that is rightly the same in every language (names, real quotes, the header button labels are not).
const UNTRANSLATED_OK = new Set(['home.testimonials:items']);
const TEXT_TYPES = new Set(['text', 'textarea']);

describe('section translations', () => {
  it('only name sections that exist', () => {
    const keys = new Set(SECTIONS.map((s) => s.key));
    for (const [lang, layer] of LAYERS) for (const key of Object.keys(layer)) expect(keys.has(key), `${lang}: unknown section ${key}`).toBe(true);
  });

  it('cover every section and every text field', () => {
    for (const [lang, layer] of LAYERS) {
      for (const def of SECTIONS) {
        const words = layer[def.key];
        expect(words, `${lang}: ${def.key} has no translation`).toBeTruthy();
        for (const field of def.fields) {
          const english = def.defaults[field.name];
          const hasEnglish = Array.isArray(english) ? english.length > 0 : Boolean(english);
          const translatable = field.type === 'list' ? !UNTRANSLATED_OK.has(`${def.key}:${field.name}`) : TEXT_TYPES.has(field.type);
          // The brand name is a name; it is the same everywhere.
          if (!hasEnglish || !translatable || (def.key === 'site.brand' && field.name === 'name')) continue;
          expect(words[field.name], `${lang}: ${def.key}.${field.name} is not translated`).toBeTruthy();
        }
      }
    }
  });

  it('only use fields the section declares, with complete list rows', () => {
    for (const [lang, layer] of LAYERS) {
      for (const def of SECTIONS) {
        const words = layer[def.key] ?? {};
        for (const [name, value] of Object.entries(words)) {
          const field = def.fields.find((f) => f.name === name);
          expect(field, `${lang}: ${def.key}.${name} is not a field`).toBeTruthy();
          if (!field || field.type !== 'list') continue;
          const english = def.defaults[name] as Record<string, string>[];
          expect(Array.isArray(value), `${lang}: ${def.key}.${name} must be a list`).toBe(true);
          const rows = value as Record<string, string>[];
          expect(rows.length, `${lang}: ${def.key}.${name} row count`).toBe(english.length);
          rows.forEach((row, i) => {
            for (const sub of (field as ListField).fields) {
              expect(sub.name in row, `${lang}: ${def.key}.${name}[${i}] is missing ${sub.name}`).toBe(true);
              // Photos, icons, colours and links must be carried over unchanged.
              if (!TEXT_TYPES.has(sub.type)) expect(row[sub.name], `${lang}: ${def.key}.${name}[${i}].${sub.name}`).toBe(english[i][sub.name]);
            }
          });
        }
      }
    }
  });

  it('keep every underlined phrase inside its heading', () => {
    for (const [lang, layer] of LAYERS) {
      for (const def of SECTIONS) {
        const words = layer[def.key] ?? {};
        if (typeof words.highlight !== 'string') continue;
        expect(String(words.heading ?? ''), `${lang}: ${def.key} highlight "${words.highlight}" is not in its heading`).toContain(words.highlight);
      }
    }
    for (const def of SECTIONS) {
      const d = def.defaults as ContentData;
      if (typeof d.highlight === 'string' && d.highlight) expect(String(d.heading), `en: ${def.key} highlight`).toContain(d.highlight);
    }
  });

  it('use Latin digits only', () => {
    const other = /[০-৯०-९]/;
    for (const [lang, layer] of LAYERS) expect(other.test(JSON.stringify(layer)), `${lang}: Bengali or Devanagari digits found`).toBe(false);
    for (const [, dict] of SITE_DICTS) expect(other.test(JSON.stringify(dict))).toBe(false);
  });
});

describe('site dictionaries', () => {
  const flat = (obj: unknown, prefix = ''): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') out[path] = value;
      else if (Array.isArray(value)) out[path] = value.join('|');
      else Object.assign(out, flat(value, path));
    }
    return out;
  };
  const english = flat(en);

  it.each(SITE_DICTS)('%s has every key, keeps every {marker}, and is translated', (_lang, dict) => {
    const words = flat(dict);
    expect(Object.keys(words).sort()).toEqual(Object.keys(english).sort());
    for (const [key, text] of Object.entries(english)) {
      const markers = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort();
      expect(markers(words[key]), `markers in ${key}`).toEqual(markers(text));
      expect(words[key], `${key} is empty`).toBeTruthy();
    }
  });
});

describe('banner slides', () => {
  const hero = {
    eyebrow: '',
    heading: 'H',
    highlight: '',
    text: 'T',
    image: '/images/hero.jpg',
    imageAlt: 'A',
    badge: '',
    primaryLabel: 'Go',
    secondaryLabel: '',
    slides: [] as Record<string, string>[],
  };

  it('accepts only https YouTube addresses', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ?t=3')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youtubeId('https://evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youtubeId('https://www.youtube.com/watch?v=short')).toBeNull();
    expect(youtubeId('javascript:alert(1)')).toBeNull();
  });

  it('accepts only https or site-relative mp4 addresses', () => {
    expect(isMp4('/media/tour.mp4')).toBe(true);
    expect(isMp4('https://cdn.example.com/a/tour.mp4?x=1')).toBe(true);
    expect(isMp4('http://cdn.example.com/tour.mp4')).toBe(false);
    expect(isMp4('//cdn.example.com/tour.mp4')).toBe(false);
    expect(isMp4('/media/tour.mov')).toBe(false);
    expect(isMp4('javascript:alert(1)//.mp4')).toBe(false);
  });

  it('falls back to the single banner when there are no usable slides', () => {
    expect(buildSlides(hero)).toEqual([{ kind: 'image', image: '/images/hero.jpg', heading: 'H', text: 'T', buttonLabel: 'Go', buttonLink: '/contact#enquire', alt: 'A' }]);
    expect(buildSlides({ ...hero, slides: [{ type: 'youtube', video: 'http://bad', image: '' }] })).toHaveLength(1);
  });

  it('keeps a bad video slide as a photo and refuses unsafe button links', () => {
    const [slide] = buildSlides({ ...hero, slides: [{ type: 'mp4', video: 'http://x/a.mp4', image: '/images/a.webp', buttonLink: 'javascript:alert(1)' }] });
    expect(slide.kind).toBe('image');
    expect(slide.buttonLink).toBe('/contact#enquire');
  });
});
