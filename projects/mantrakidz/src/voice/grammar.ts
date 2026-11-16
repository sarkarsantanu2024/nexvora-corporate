/**
 * Turns what was said into what to do. Pure functions, no browser, no network:
 *
 *   parseCommand(['change the home banner heading to admissions open'], catalogue)
 *     → { kind: 'setField', section: 'home.hero', field: 'heading', value: 'Admissions open', confidence: 1 }
 *
 * How it reads a sentence:
 *  1. Drop politeness ("please", "can you").
 *  2. Whole-sentence commands first: yes / no / publish / undo / help / stop.
 *  3. Find the verb, at the front (English: "change X to Y") or at the end
 *     (Hindi and Bengali put it last: "X ko Y karo", "X bodle Y koro").
 *  4. Find which section and field the remaining words name, by comparing
 *     them with every label and alias in the catalogue. Spelling may be off,
 *     word order may differ, extra words cost a little.
 *  5. What is left is the new value, cleaned for the kind of field (spoken
 *     digits become a phone number, "at" and "dot" become an email).
 *
 * The recogniser gives several guesses for each sentence. Every guess is
 * parsed and the most confident reading wins, because on an unclear speaker
 * the second guess is often the right one.
 *
 * Nothing here applies a change. The result is always shown for confirmation.
 */
import type { CatField, CatSection, Catalogue } from './catalogue';
import type { Intent, Target } from './intent';

export type ParseContext = {
  /** The section whose form is open, if any: "the heading" then means its heading. */
  currentSection?: string | null;
  /** The section last changed by voice: what "it" means in "show it again". */
  lastSection?: string | null;
  /** Sections switched off right now: "show testimonials" then means switch back on. */
  hiddenSections?: string[];
};

/* ───────────── words ───────────── */

/**
 * Hindi and Bengali words for things on a website, in native script and as
 * people type them in Latin letters, mapped to the English word the section
 * labels use. Lets "हेडिंग", "শিরোনাম" and "shironam" all find "Heading".
 */
const WORD_MAP: Record<string, string> = {
  हेडिंग: 'heading', हैडिंग: 'heading', शीर्षक: 'heading', হেডিং: 'heading', শিরোনাম: 'heading', shironam: 'heading', shirshak: 'heading',
  टाइटल: 'title', টাইটেল: 'title',
  फोन: 'phone', फ़ोन: 'phone', ফোন: 'phone', phon: 'phone',
  नंबर: 'number', नम्बर: 'number', নম্বর: 'number', নাম্বার: 'number', nambar: 'number', nombor: 'number',
  मोबाइल: 'mobile', মোবাইল: 'mobile',
  पता: 'address', ठिकाना: 'address', ঠিকানা: 'address', thikana: 'address', pata: 'address',
  फोटो: 'photo', फ़ोटो: 'photo', तस्वीर: 'photo', ফটো: 'photo', ছবি: 'photo', chobi: 'photo', chhobi: 'photo', tasveer: 'photo', tasvir: 'photo',
  लोगो: 'logo', লোগো: 'logo',
  नाम: 'name', নাম: 'name', naam: 'name',
  ईमेल: 'email', ইমেল: 'email', ইমেইল: 'email',
  बैनर: 'banner', ব্যানার: 'banner',
  होम: 'home', হোম: 'home',
  समय: 'hours', সময়: 'hours', somoy: 'hours', samay: 'hours',
  गैलरी: 'gallery', গ্যালারি: 'gallery',
  नोटिस: 'notice', सूचना: 'notice', নোটিশ: 'notice', নোটিস: 'notice', বিজ্ঞপ্তি: 'notice',
  सेक्शन: 'section', সেকশন: 'section',
  एल्बम: 'album', অ্যালবাম: 'album', এলবাম: 'album',
  व्हाट्सएप: 'whatsapp', হোয়াটসঅ্যাপ: 'whatsapp',
  ऑफिस: 'office', অফিস: 'office',
  संपर्क: 'contact', कॉन्टैक्ट: 'contact', যোগাযোগ: 'contact', কন্টাক্ট: 'contact', jogajog: 'contact', sampark: 'contact',
  पैराग्राफ: 'paragraph', প্যারাগ্রাফ: 'paragraph',
  बटन: 'button', বাটন: 'button', বোতাম: 'button',
  टैगलाइन: 'tagline', ট্যাগলাইন: 'tagline',
  प्रीव्यू: 'preview', প্রিভিউ: 'preview',
  पब्लिश: 'publish', পাবলিশ: 'publish', प्रकाशित: 'publish', প্রকাশ: 'publish', prokash: 'publish', prakashit: 'publish',
  अनडू: 'undo', আনডু: 'undo',
  वेबसाइट: 'website', ওয়েবসাইট: 'website', साइट: 'site', সাইট: 'site',
  photos: 'photo', pictures: 'photo', picture: 'photo', pics: 'photo', pic: 'photo', images: 'photo', image: 'photo',
};

/** Words that carry no meaning when naming a field: "the heading of the banner". */
const STOP = new Set([
  'the', 'a', 'an', 'of', 'on', 'in', 'for', 'at', 'our', 'my', 'this', 'that', 'to', 'is', 'section', 'page', 'field', 'text', 'wala', 'wali',
  'ka', 'ki', 'ke', 'ko', 'er', 'r', 'ta', 'te', 'e', 'mein', 'me', 'par', 'pe',
  'टा', 'का', 'की', 'के', 'को', 'में', 'पर', 'টা', 'টি', 'এর', 'কে', 'তে',
]);

type Word = { raw: string; n: string };

const EDGE = /^[^\p{L}\p{N}\p{M}]+|[^\p{L}\p{N}\p{M}]+$/gu;

function norm(raw: string): string {
  const bare = raw.toLowerCase().replace(EDGE, '').replace(/['’]s$/, '');
  return WORD_MAP[bare] ?? bare;
}

function toWords(text: string): Word[] {
  return text
    .trim()
    .split(/\s+/)
    .map((raw) => ({ raw, n: norm(raw) }))
    .filter((word) => word.n !== '');
}

const rawOf = (words: Word[]) => words.map((word) => word.raw).join(' ');
const normOf = (words: Word[]) => words.map((word) => word.n).join(' ');

/** How many leading words match the longest phrase in the list (0 = none). */
function leadMatch(words: Word[], phrases: string[][]): number {
  let best = 0;
  for (const phrase of phrases) {
    if (phrase.length <= best || phrase.length > words.length) continue;
    if (phrase.every((token, index) => words[index].n === token)) best = phrase.length;
  }
  return best;
}

function tailMatch(words: Word[], phrases: string[][]): number {
  let best = 0;
  for (const phrase of phrases) {
    if (phrase.length <= best || phrase.length > words.length) continue;
    const offset = words.length - phrase.length;
    if (phrase.every((token, index) => words[offset + index].n === token)) best = phrase.length;
  }
  return best;
}

const phrases = (list: string) => list.split('|').map((phrase) => phrase.trim().split(/\s+/).map(norm));

const LEAD_FILLER = phrases(
  'please|ok|okay|hey|hi|hello|now|and|so|um|uh|kindly|just|can you|could you|would you|will you|i want to|i would like to|i need to|i want you to|let us|lets|go ahead and|accha|achha|zara|jara|ektu|doya kore|daya karke|kripya|कृपया|দয়া করে|অনুগ্রহ করে',
);
const TAIL_FILLER = phrases('please|now|thanks|thank you|ji|toh|to|na|plz');

function stripFillers(words: Word[]): Word[] {
  let out = words;
  for (let n = leadMatch(out, LEAD_FILLER); n > 0 && out.length > n; n = leadMatch(out, LEAD_FILLER)) out = out.slice(n);
  for (let n = tailMatch(out, TAIL_FILLER); n > 0 && out.length > n; n = tailMatch(out, TAIL_FILLER)) out = out.slice(0, out.length - n);
  return out;
}

/* ───────────── fuzzy matching ───────────── */

/** Levenshtein distance as a 0 to 1 likeness, so "hedding" still finds "heading". */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;
  let previous = Array.from({ length: shorter.length + 1 }, (_, i) => i);
  for (let i = 1; i <= longer.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= shorter.length; j += 1) {
      const cost = longer[i - 1] === shorter[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return 1 - previous[shorter.length] / longer.length;
}

const stem = (word: string) => (word.length > 3 ? word.replace(/(es|s)$/, '') : word);

function alike(a: string, b: string): boolean {
  if (a === b || stem(a) === stem(b)) return true;
  return Math.min(a.length, b.length) >= 4 && similarity(a, b) >= 0.8;
}

function nameTokens(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .map(norm)
    .filter((token) => token && !STOP.has(token));
}

/** Which words of the phrase a name accounts for. */
function cover(name: string[], phrase: string[]): { hits: number; used: Set<number> } {
  const used = new Set<number>();
  let hits = 0;
  for (const token of name) {
    const index = phrase.findIndex((word, at) => !used.has(at) && alike(word, token));
    if (index >= 0) {
      used.add(index);
      hits += 1;
    }
  }
  return { hits, used };
}

type Names = { section: string[][]; page: string[]; fields: Map<string, string[][]> };
const namesCache = new WeakMap<CatSection, Names>();

const uniq = (lists: string[][]) => {
  const seen = new Set<string>();
  return lists.filter((list) => list.length && !seen.has(list.join(' ')) && seen.add(list.join(' ')));
};

function namesOf(section: CatSection): Names {
  const cached = namesCache.get(section);
  if (cached) return cached;
  const names: Names = {
    section: uniq([section.label, `${section.page} ${section.label}`, section.key.replace(/[._-]/g, ' '), ...section.aliases].map(nameTokens)),
    page: nameTokens(section.page),
    fields: new Map(
      section.fields.map((field) => [
        field.name,
        uniq([field.label, field.name, ...field.aliases, ...(field.type === 'list' && field.itemLabel ? [field.itemLabel] : [])].map(nameTokens)),
      ]),
    ),
  };
  namesCache.set(section, names);
  return names;
}

type Scored = {
  section: string;
  field: string;
  score: number;
  /** Every spoken word was part of the name: nothing is left over to be a value. */
  full: boolean;
};

/** How well the spoken words name one field, 0 to about 1.25 (a section named as well scores above 1). */
function fieldScore(phrase: string[], section: CatSection, field: CatField): { score: number; full: boolean } {
  const names = namesOf(section);
  let best = 0;
  let full = false;
  for (const name of names.fields.get(field.name) ?? []) {
    const own = cover(name, phrase);
    if (!own.hits) continue;
    const base = 0.5 + (0.5 * own.hits) / name.length;
    for (const where of [null, ...names.section, names.page]) {
      const place = where ? cover(where, phrase) : { hits: 0, used: new Set<number>() };
      const used = new Set([...own.used, ...place.used]);
      const leftover = (phrase.length - used.size) / phrase.length;
      const bonus = where && place.hits ? (place.hits === where.length ? (where === names.page ? 0.15 : 0.25) : (0.1 * place.hits) / where.length) : 0;
      const score = base * (1 - 0.6 * leftover) + bonus;
      if (score > best) {
        best = score;
        full = leftover === 0;
      }
    }
  }
  return { score: best, full };
}

function sectionScore(phrase: string[], section: CatSection): number {
  let best = 0;
  for (const name of namesOf(section).section) {
    const { hits, used } = cover(name, phrase);
    if (!hits) continue;
    const leftover = (phrase.length - used.size) / phrase.length;
    best = Math.max(best, (0.4 + (0.6 * hits) / name.length) * (1 - 0.6 * leftover));
  }
  return best;
}

/** Readings this close to the best one count as "could be either". */
const TIE = 0.06;
const MIN_MATCH = 0.55;

type Resolved = { top: Scored; candidates: Target[] } | null;

function pickTop(scored: Scored[], ctx: ParseContext): Resolved {
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  if (!top || top.score < MIN_MATCH) return null;
  const close = scored.filter((item) => top.score - item.score <= TIE);
  if (close.length === 1) return { top, candidates: [] };
  // Several fit equally. The form that is open is the obvious one to mean.
  const here = close.filter((item) => item.section === ctx.currentSection);
  if (here.length === 1) return { top: here[0], candidates: [] };
  return { top, candidates: close.slice(0, 5).map(({ section, field }) => ({ section, field })) };
}

function resolveField(words: Word[], catalogue: Catalogue, accept: (field: CatField) => boolean, ctx: ParseContext): Resolved {
  const phrase = words.map((word) => word.n).filter((token) => !STOP.has(token));
  if (!phrase.length) return null;
  const scored: Scored[] = [];
  for (const section of catalogue) {
    for (const field of section.fields) {
      if (!accept(field)) continue;
      const { score, full } = fieldScore(phrase, section, field);
      if (score > 0) scored.push({ section: section.key, field: field.name, score, full });
    }
  }
  return pickTop(scored, ctx);
}

function resolveSection(words: Word[], catalogue: Catalogue, ctx: ParseContext): Resolved {
  const phrase = words.map((word) => word.n).filter((token) => !STOP.has(token));
  if (!phrase.length) return null;
  const scored = catalogue.map((section) => ({ section: section.key, field: '', score: sectionScore(phrase, section), full: false })).filter((item) => item.score > 0);
  return pickTop(scored, ctx);
}

const clamp = (value: number) => Math.max(0, Math.min(1, Math.round(value * 100) / 100));

/* ───────────── values ───────────── */

const DIGIT_WORDS: Record<string, string> = {
  zero: '0', oh: '0', o: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  shunya: '0', sunya: '0', ek: '1', do: '2', teen: '3', tin: '3', char: '4', chaar: '4', paanch: '5', panch: '5', chhe: '6', chhah: '6', che: '6', saat: '7', sat: '7', aath: '8', aat: '8', nau: '9',
  shunno: '0', dui: '2', choy: '6', chhoy: '6', noy: '9',
  शून्य: '0', एक: '1', दो: '2', तीन: '3', चार: '4', पांच: '5', पाँच: '5', छह: '6', छः: '6', सात: '7', आठ: '8', नौ: '9',
  শূন্য: '0', এক: '1', দুই: '2', তিন: '3', চার: '4', পাঁচ: '5', ছয়: '6', সাত: '7', আট: '8', নয়: '9',
  ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
};
const TENS_WORDS: Record<string, number> = { twenty: 2, thirty: 3, forty: 4, fourty: 4, fifty: 5, sixty: 6, seventy: 7, eighty: 8, ninety: 9 };
const REPEAT_WORDS: Record<string, number> = { double: 2, triple: 3, dabal: 2, डबल: 2, ডাবল: 2 };

/** Devanagari and Bengali digits become 0-9. */
const asciiDigits = (text: string) =>
  text.replace(/[०-९০-৯]/g, (char) => {
    const code = char.codePointAt(0) ?? 0;
    return String(code - (code >= 0x09e6 ? 0x09e6 : 0x0966));
  });

/**
 * A phone number as people say it: digit by digit, in pairs ("ninety eight"),
 * with "double three", in any of the three languages. Everything that is not
 * a number is dropped.
 */
export function spokenDigits(text: string): string {
  const tokens = asciiDigits(text)
    .toLowerCase()
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean);
  let out = '';
  let repeat = 1;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    let piece = '';
    if (/^\d+$/.test(token)) piece = token;
    else if (token in REPEAT_WORDS) {
      repeat = REPEAT_WORDS[token];
      continue;
    } else if (token in TENS_WORDS) {
      const unit = DIGIT_WORDS[tokens[i + 1] ?? ''];
      if (unit && unit.length === 1 && unit !== '0') {
        piece = `${TENS_WORDS[token]}${unit}`;
        i += 1;
      } else piece = `${TENS_WORDS[token]}0`;
    } else if (token in DIGIT_WORDS) piece = DIGIT_WORDS[token];
    if (piece) out += piece.repeat(repeat);
    repeat = 1;
  }
  return out;
}

const unquote = (text: string) => text.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

/** The recogniser writes everything in lower case; a heading should not start that way. */
function sentence(text: string): string {
  const clean = unquote(text);
  // "iPhone friendly" is spelt that way on purpose.
  if (/^\p{Ll}+\p{Lu}/u.test(clean)) return clean;
  return clean.replace(/^\p{Ll}/u, (char) => char.toUpperCase());
}

const titleCase = (text: string) => unquote(text).replace(/(^|\s)\p{Ll}/gu, (char) => char.toUpperCase());

const TRUE_WORDS = new Set(['on', 'yes', 'true', '1', 'show', 'haan', 'chalu', 'enabled']);

/** Shapes the spoken value for the kind of field it is going into. */
export function normaliseValue(field: Pick<CatField, 'type' | 'options'>, raw: string): string {
  const text = unquote(raw);
  switch (field.type) {
    case 'phone': {
      let digits = spokenDigits(text);
      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
      return digits || text;
    }
    case 'email':
      return text
        .toLowerCase()
        .replace(/\s+(at the rate of|at the rate|at)\s+/g, '@')
        .replace(/\s+(dot|period)\s+/g, '.')
        .replace(/\s+(underscore)\s+/g, '_')
        .replace(/\s+(dash|hyphen)\s+/g, '-')
        .replace(/\s+/g, '');
    case 'url':
      return text
        .replace(/\s+(dot|period)\s+/gi, '.')
        .replace(/\s+(slash)\s+/gi, '/')
        .replace(/\s+/g, '');
    case 'toggle':
      return TRUE_WORDS.has(text.toLowerCase()) ? '1' : '';
    case 'select': {
      const wanted = text.toLowerCase();
      const options = field.options ?? [];
      const hit = options.find((option) => option.label.toLowerCase() === wanted || option.value.toLowerCase() === wanted) ?? options.find((option) => similarity(option.label.toLowerCase(), wanted) >= 0.75);
      return hit ? hit.value : text;
    }
    default:
      return sentence(text);
  }
}

/* ───────────── whole-sentence commands ───────────── */

const set = (list: string) => new Set(list.split('|').map((phrase) => phrase.trim().split(/\s+/).map(norm).join(' ')));

const CONFIRM = set(
  "yes|yeah|yep|yup|ya|ok|okay|apply|apply it|confirm|confirmed|do it|go ahead|save|save it|correct|right|sure|yes please|yes apply|yes do it|thats right|that's right|haan|han|ha|haa|hyan|hya|ji|ji haan|haan ji|theek hai|thik hai|thik ache|thik achhe|theek|thik|sahi|sahi hai|kar do|kore dao|hobe|হ্যাঁ|হ্যা|হা|ঠিক আছে|ঠিক|করে দাও|हाँ|हां|जी|जी हाँ|ठीक है|ठीक|सही|कर दो",
);
const CANCEL = set(
  "no|nope|nah|cancel|cancel it|cancel that|dont|don't|do not|leave it|never mind|nevermind|forget it|wrong|nahi|nahin|na|mat karo|rehne do|chhodo|thak|thaak|bad dao|lagbe na|না|নাহ|বাতিল|থাক|বাদ দাও|नहीं|ना|मत करो|रहने दो|रद्द|गलत",
);
const STOP_LISTENING = set(
  "stop|stop listening|mic off|turn off the mic|turn off mic|stop the mic|be quiet|thats all|that's all|band karo|bas|bas karo|bondho koro|bondho|thamo|suna band karo|बंद करो|बस|रुको|বন্ধ করো|থামো",
);
const HELP = set(
  'help|help me|what can i say|what can you do|what can i do|commands|examples|show commands|show examples|madad|madad karo|sahajyo|sahajjo|ki bolbo|kya bolu|kya bolun|मदद|क्या बोलूं|সাহায্য|কী বলব',
);
const UNDO = set(
  'undo|undo that|undo it|undo this|undo the last change|undo last change|revert|revert that|revert it|take that back|go back|wapas karo|wapas lo|wapas|pehle jaisa|pehle jaisa karo|ager moto|ager moto koro|phiriye dao|firiye dao|वापस करो|वापस|पहले जैसा|पहले जैसा करो|আগের মতো|আগের মতো করো|ফিরিয়ে দাও',
);
const PREVIEW = set(
  'preview|show preview|show the preview|show me the preview|open preview|see preview|show me the site|show the site|show the website|show me the website|see it on the site|preview dikhao|preview dekhao|site dikhao|site dekhao|website dikhao|website dekhao|preview दिखाओ|preview দেখাও',
);
const PUBLISH = set(
  'publish|publish it|publish all|publish everything|publish now|publish changes|publish the changes|publish all changes|publish the site|publish the website|go live|make it live|make live|live|publish karo|publish kar do|publish koro|publish kore dao|live karo|live koro|publish करो|publish कर दो|publish করো|publish করে দাও',
);

const ORDINALS: Record<string, number> = {
  first: 0, '1st': 0, one: 0, '1': 0, pehla: 0, pehli: 0, prothom: 0, prothomta: 0, पहला: 0, पहली: 0, প্রথম: 0, প্রথমটা: 0,
  second: 1, '2nd': 1, two: 1, '2': 1, dusra: 1, dusri: 1, doosra: 1, ditiyo: 1, dwitiyo: 1, दूसरा: 1, दूसरी: 1, দ্বিতীয়: 1, দ্বিতীয়টা: 1,
  third: 2, '3rd': 2, three: 2, '3': 2, teesra: 2, tisra: 2, tritiyo: 2, तीसरा: 2, তৃতীয়: 2,
  fourth: 3, '4th': 3, four: 3, '4': 3, chautha: 3, chouthha: 3, चौथा: 3, চতুর্থ: 3,
};
const ORDINAL_NOISE = new Set(['the', 'one', 'option', 'number', 'wala', 'ta', 'টা', 'वाला']);

function simple(kind: 'confirm' | 'cancel' | 'stop' | 'help' | 'undo' | 'preview', confidence = 0.95): Intent {
  return { kind, confidence };
}

/* ───────────── verbs ───────────── */

type Verb = 'set' | 'add' | 'hide' | 'show' | 'open' | 'publish';

const table = (entries: Record<Verb, string>) =>
  (Object.entries(entries) as [Verb, string][]).flatMap(([verb, list]) => (list ? phrases(list).map((phrase) => ({ verb, phrase })) : []));

const LEAD_VERBS = table({
  set: 'change|set|update|make|replace|rename|modify|correct|fix|put|badlo|badal do|bodlao|bodle dao|बदलो|बदल दो|বদলাও|বদলে দাও',
  add: 'add|create|insert|new|jodo|jod do|joro|jog koro|जोड़ो|যোগ করো',
  hide: 'hide|turn off|switch off|disable|chhupao|chupao|lukao|छुपाओ|লুকাও',
  show: 'unhide|bring back|turn on|switch on|enable|show',
  open: 'open|open up|go to|goto|take me to|edit|show me|kholo|खोलो|খোলো',
  publish: 'publish',
});

const TAIL_VERBS = table({
  set: 'karo|kar do|kar dijiye|kar dena|kijiye|koro|kore dao|kore din|korun|badlo|badal do|badal dijiye|bodlao|bodle dao|bodle din|likho|likh do|lekho|likhe dao|rakho|rakh do|dao|de do|करो|कर दो|कर दीजिए|कीजिए|बदलो|बदल दो|बदल दीजिए|लिखो|लिख दो|रखो|रख दो|করো|করে দাও|করে দিন|করুন|বদলাও|বদলে দাও|লেখো|লিখে দাও|রাখো|দাও',
  add: 'jodo|jod do|jod dijiye|joro|jog koro|jog kore dao|dalo|daal do|dal do|add karo|add koro|add kar do|add kore dao|lagao|laga do|जोड़ो|जोड़ दो|डालो|डाल दो|लगाओ|লাগাও|যোগ করো|যোগ করে দাও',
  hide: 'chhupao|chupao|chhupa do|chupa do|hide karo|hide koro|hide kar do|hide kore dao|lukao|lukiye dao|lukiye rakho|bondho koro|band karo|band kar do|hata do|soriye dao|छुपाओ|छिपाओ|छुपा दो|छिपा दो|बंद करो|हटा दो|লুকাও|লুকিয়ে দাও|বন্ধ করো|সরিয়ে দাও',
  show: 'dikhao|dikha do|dekhao|dekhiye dao|chalu karo|chalu koro|show karo|show koro|दिखाओ|दिखा दो|चालू करो|দেখাও|চালু করো',
  open: 'kholo|khol do|khulo|khule dao|khulun|jao|chalo|open karo|open koro|खोलो|खोल दो|जाओ|খোলো|খুলে দাও|যাও',
  publish: 'publish karo|publish kar do|publish koro|publish kore dao|publish करो|publish करो|publish করো',
});

function bestVerb(words: Word[], verbs: { verb: Verb; phrase: string[] }[], at: 'lead' | 'tail'): { verb: Verb; length: number } | null {
  let best: { verb: Verb; length: number } | null = null;
  for (const entry of verbs) {
    const n = at === 'lead' ? leadMatch(words, [entry.phrase]) : tailMatch(words, [entry.phrase]);
    if (n && (!best || n > best.length)) best = { verb: entry.verb, length: n };
  }
  return best;
}

/** Words that sit between the field and its new value: "X to Y", "X ko Y", "X bodle Y". */
const SEPARATORS = phrases(
  'to|as|with|into|is|is now|should be|should say|should read|to say|to read|equals|ko|ke|badal kar|badalkar|badal ke|bodle|bodle diye|mein|me|को|बदलकर|बदल कर|बदल के|में|কে|বদলে|বদলিয়ে|তে',
);
/** A field name ending in one of these was clearly followed by its value. */
const PARTICLES = new Set(['ko', 'ta', 'টা', 'টি', 'কে', 'को', 'mein', 'me', 'में', 'তে', 'te']);

const AGAIN = new Set(['again', 'back', 'abar', 'phir', 'fir', 'se', 'wapas', 'dobara', 'আবার', 'फिर', 'से', 'वापस', 'दोबारा']);
const IT = new Set(['it', 'this', 'that', 'yeh', 'ye', 'isko', 'ise', 'eta', 'etake', 'ota', 'यह', 'इसे', 'इसको', 'এটা', 'এটাকে', 'ওটা']);

/* ───────────── the parts of a sentence ───────────── */

const scalarText = (field: CatField) => field.type !== 'list' && field.type !== 'image';
const isImage = (field: CatField) => field.type === 'image';
const isList = (field: CatField) => field.type === 'list';

function findField(catalogue: Catalogue, target: Target): CatField | null {
  return catalogue.find((section) => section.key === target.section)?.fields.find((field) => field.name === target.field) ?? null;
}

type Targeted = Extract<Intent, { candidates?: Target[] }>;

function withCandidates(intent: Targeted, candidates: Target[]): Intent {
  return candidates.length > 1 ? { ...intent, candidates } : intent;
}

/** "<field> [to] <value>": tries every place the field name could end and keeps the best. */
function parseSet(words: Word[], catalogue: Catalogue, ctx: ParseContext): Intent | null {
  type Split = { resolved: NonNullable<Resolved>; value: Word[]; score: number; separated: boolean; at: number };
  let best: Split | null = null;
  for (let at = 1; at < words.length && at <= 9; at += 1) {
    const target = words.slice(0, at);
    let value = words.slice(at);
    const skip = leadMatch(value, SEPARATORS);
    const separated = skip > 0 || PARTICLES.has(target[target.length - 1].n);
    if (skip && value.length > skip) value = value.slice(skip);
    const resolved = resolveField(target, catalogue, (field) => field.type !== 'list', ctx);
    if (!resolved) continue;
    const score = resolved.top.score * (separated ? 1 : 0.85);
    if (!best || score > best.score + 0.001 || (Math.abs(score - best.score) <= 0.001 && separated && !best.separated)) {
      best = { resolved, value, score, separated, at };
    }
  }

  // "change the phone number" names a field and nothing to change it to.
  const whole = resolveField(words, catalogue, (field) => field.type !== 'list', ctx);
  if (whole && (!best || (whole.top.full && whole.top.score >= best.score))) {
    const field = findField(catalogue, whole.top);
    if (field?.type === 'image') {
      return withCandidates({ kind: 'pickImage', section: whole.top.section, field: whole.top.field, camera: false, confidence: clamp(whole.top.score) }, whole.candidates);
    }
    return { kind: 'unknown', reason: 'no-value', section: whole.top.section, field: whole.top.field, confidence: clamp(whole.top.score * 0.6) };
  }
  if (!best) return null;

  const field = findField(catalogue, best.resolved.top);
  if (!field) return null;
  const rawValue = rawOf(best.value);
  if (field.type === 'image' && !/^(https:\/\/|\/)\S+$/i.test(rawValue.trim())) {
    // "change the banner photo to the new one": a photo cannot be spoken, so open the picker.
    return withCandidates({ kind: 'pickImage', section: best.resolved.top.section, field: field.name, camera: false, confidence: clamp(best.score * 0.9) }, best.resolved.candidates);
  }
  return withCandidates(
    { kind: 'setField', section: best.resolved.top.section, field: field.name, value: field.type === 'image' ? rawValue.trim() : normaliseValue(field, rawValue), confidence: clamp(best.score) },
    best.resolved.candidates,
  );
}

const ARTICLES = phrases('a|an|one|another|new|a new|ek|ekta|ekti|একটা|একটি|एक|naya|notun|নতুন|नया');

type Roles = { who?: CatField; body?: CatField; question?: CatField; answer?: CatField; title?: CatField };

function rolesOf(list: CatField): Roles {
  const fields = (list.fields ?? []).filter((field) => field.type === 'text' || field.type === 'textarea');
  const by = (pattern: RegExp) => fields.find((field) => pattern.test(`${field.name} ${field.label}`.toLowerCase()));
  const title = fields.find((field) => field.name === list.titleField) ?? fields[0];
  const body = by(/quote|review|message|comment|feedback|said|says|words/) ?? fields.find((field) => field.type === 'textarea') ?? by(/text|body|description|content|detail/);
  return {
    who: by(/\b(name|author|parent|person|by|who|from)\b/),
    body,
    question: by(/question/) ?? (by(/answer/) ? title : undefined),
    answer: by(/answer|reply/),
    title,
  };
}

const SAYING = /^(?:from|by)\s+(.+?)\s+(?:saying|says|who says|who said|said|that says|bolechen|bolchen|bolche|ne kaha|kehte hain)\s+(?:that\s+)?(.+)$/i;
const SAYS = /^(.+?)\s+(?:says|said|saying)\s+(?:that\s+)?(.+)$/i;
const ANSWER = /^(.+?)[?,.]?\s+(?:and\s+)?(?:the\s+)?(?:answer|ans|uttar|jawab|উত্তর|जवाब|उत्तर)(?:\s+is)?[:,]?\s+(.+)$/i;

/** Places what was dictated into a new row's fields, as far as it can be told apart. */
function fillItem(list: CatField, text: string): { item: Record<string, string>; needsEditor: boolean } {
  const roles = rolesOf(list);
  const clean = text.replace(/^[\s:,\-–]+/, '').replace(/^(?:saying|that says|that)\s+/i, '');
  const textFields = (list.fields ?? []).filter((field) => field.type === 'text' || field.type === 'textarea');
  const item: Record<string, string> = {};

  const said = clean.match(SAYING) ?? (roles.who && roles.body ? clean.match(SAYS) : null);
  if (said && roles.who && roles.body && roles.who !== roles.body && said[1].split(/\s+/).length <= 5) {
    item[roles.who.name] = titleCase(said[1]);
    item[roles.body.name] = sentence(said[2]);
    return { item, needsEditor: false };
  }
  const asked = clean.match(ANSWER);
  if (asked && roles.question && roles.answer && roles.question !== roles.answer) {
    item[roles.question.name] = sentence(asked[1].replace(/^(?:question|প্রশ্ন|सवाल|प्रश्न)[:,]?\s+/i, ''));
    item[roles.answer.name] = sentence(asked[2]);
    return { item, needsEditor: false };
  }

  const only = clean.replace(/^(?:question|প্রশ্ন|सवाल|प्रश्न)[:,]?\s+/i, '');
  if (!only) return { item, needsEditor: true };
  // One place to put words: fill it. Several: put them in the likeliest and let the person finish the row.
  const long = only.split(/\s+/).length > 8;
  const home = textFields.length === 1 ? textFields[0] : ((long ? roles.body : roles.title) ?? roles.title ?? textFields[0]);
  if (home) item[home.name] = sentence(only);
  return { item, needsEditor: textFields.length !== 1 };
}

/** "add a <kind of row> <words>": the row kind is at the front, the rest is its content. */
function parseAdd(words: Word[], catalogue: Catalogue, ctx: ParseContext): Intent | null {
  let rest = words;
  for (let n = leadMatch(rest, ARTICLES); n > 0 && rest.length > n; n = leadMatch(rest, ARTICLES)) rest = rest.slice(n);
  let best: { resolved: NonNullable<Resolved>; at: number } | null = null;
  for (let at = 1; at <= Math.min(4, rest.length); at += 1) {
    const resolved = resolveField(rest.slice(0, at), catalogue, isList, ctx);
    if (resolved && resolved.top.score >= 0.7 && (!best || resolved.top.score > best.resolved.top.score + 0.001)) best = { resolved, at };
  }
  if (!best) return null;
  const list = findField(catalogue, best.resolved.top);
  if (!list) return null;
  const text = rawOf(rest.slice(best.at));
  const { item, needsEditor } = fillItem(list, text);
  return withCandidates(
    { kind: 'appendListItem', section: best.resolved.top.section, field: list.name, item, text: text.trim(), needsEditor, confidence: clamp(best.resolved.top.score) },
    best.resolved.candidates,
  );
}

const NOTICE_LEAD = /^(?:(?:add|create|post|put up|put|make|issue|give|new)\s+)?(?:(?:a|an|the|one)\s+)?(?:new\s+)?(?:public\s+)?(?:notice|announcement|नोटिस|सूचना|নোটিশ|নোটিস|বিজ্ঞপ্তি)(?![\p{L}\p{M}])(?:\s+(?:on|to)\s+the\s+(?:website|site))?(?:\s+(?:dao|din|do|lagao|daal do|dalo|jodo|jog koro|दो|लगाओ|डालो|দাও|দিন|লাগাও))?\s*[:,\-–]?\s*(?:(?:saying|that says|that|about|for|ki|je|কি|যে|कि)\s+)?(.+)$/iu;
const NOTICE_TAIL = /^(.+?)\s+(?:ka|ki|er|এর|का|की)?\s*(?:notice|announcement|नोटिस|सूचना|নোটিশ|নোটিস|বিজ্ঞপ্তি)\s+(?:dao|din|de do|do|lagao|laga do|daal do|dal do|dalo|jodo|jog koro|add karo|add koro|दो|दे दो|लगाओ|लगा दो|डालो|डाल दो|দাও|দিন|লাগাও|যোগ করো)$/iu;

function parseNotice(words: Word[]): Intent | null {
  const text = rawOf(words);
  const match = text.match(NOTICE_LEAD) ?? text.match(NOTICE_TAIL);
  // "notice board" or "notices page" is a place, not a new notice.
  if (!match || /^(?:board|page|section|screen|list|kholo|khol do|dekhao|dikhao|खोलो|दिखाओ|খোলো|দেখাও)(?:\s|$)/iu.test(match[1])) return null;
  const said = sentence(match[1].replace(/[.\s]+$/, ''));
  if (said.length < 3) return null;
  if (said.length <= 90) return { kind: 'addNotice', title: said, body: '', confidence: 0.9 };
  // A long notice: its first clause is the title, the whole of it the text.
  const cut = said.slice(0, 90);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(': '), cut.lastIndexOf(', '));
  const title = (stop > 20 ? cut.slice(0, stop) : cut.slice(0, cut.lastIndexOf(' '))).trim();
  return { kind: 'addNotice', title, body: said, confidence: 0.85 };
}

const ALBUM = /\balbum\s+(?:called\s+|named\s+)?(.+?)(?:\s+(?:e|te|mein|me|ke|এ|তে|में))?$/iu;
const ALBUM_BEFORE = /(?:^|\s)(?:in|to|into|under)?\s*(?:the\s+)?(.+?)\s+album\b/iu;

function parseGallery(words: Word[]): Intent | null {
  const tokens = words.map((word) => word.n);
  const addish = bestVerb(words, LEAD_VERBS, 'lead')?.verb === 'add' || bestVerb(words, TAIL_VERBS, 'tail')?.verb === 'add' || ['upload', 'take', 'put'].includes(tokens[0]);
  if (!addish || !tokens.includes('photo') || !(tokens.includes('gallery') || tokens.includes('album'))) return null;
  // Work on the words with the verb at the end removed, so it cannot end up in the album name.
  const tail = bestVerb(words, TAIL_VERBS, 'tail');
  const body = normOf(tail?.verb === 'add' ? words.slice(0, words.length - tail.length) : words);
  let album = '';
  const after = body.match(ALBUM);
  const named = after?.[1].replace(/^(?:e|te|mein|me|ke|এ|তে|में)\s+/u, '') ?? '';
  if (named && !/^(photo|gallery)\b/.test(named)) album = named;
  else {
    const before = body.match(ALBUM_BEFORE);
    if (before) album = before[1].replace(/^.*\b(?:gallery|photo|in|to|the)\s+/i, '');
  }
  album = album.replace(/\b(?:photo|in the gallery|to the gallery|gallery)\b.*$/i, '').trim();
  return { kind: 'addGalleryPhoto', album: album ? titleCase(album) : '', camera: tokens[0] === 'take' || tokens.includes('camera'), confidence: 0.9 };
}

const PLACES: { to: string; label: string; names: string[] }[] = [
  { to: '/hq/website/gallery', label: 'Gallery', names: ['gallery', 'photo gallery', 'gallery photo', 'album', 'albums'] },
  { to: '/hq/website/notices', label: 'Notices and events', names: ['notice', 'notices', 'events', 'notices and events', 'notice and events', 'notice board', 'announcements'] },
  { to: '/hq/website/media', label: 'Photo library', names: ['media', 'media library', 'photo library', 'library', 'uploads', 'photo', 'all photo'] },
  { to: '/hq/website/history', label: 'Change history', names: ['history', 'change history', 'changes', 'past changes', 'revisions'] },
  { to: '/hq/website', label: 'All sections', names: ['website', 'edit website', 'all sections', 'sections', 'all section', 'main', 'start', 'list', 'everything'] },
];

function parseOpen(words: Word[], catalogue: Catalogue, ctx: ParseContext): Intent | null {
  const phrase = words.map((word) => word.n).filter((token) => !STOP.has(token) || token === 'section');
  const said = phrase.join(' ');
  if (!said) return null;
  for (const place of PLACES) {
    if (place.names.some((name) => name === said || name === phrase.filter((token) => token !== 'section').join(' '))) {
      return { kind: 'navigate', to: place.to, label: place.label, confidence: 0.95 };
    }
  }
  const resolved = resolveSection(words, catalogue, ctx);
  // A whole page ("open home") is several sections: show the list narrowed to it.
  const page = [...new Set(catalogue.map((section) => section.page))].find((name) => nameTokens(name).join(' ') === phrase.filter((token) => token !== 'section').join(' '));
  if (page && (!resolved || resolved.candidates.length > 1 || resolved.top.score < 0.9)) {
    return { kind: 'navigate', to: `/hq/website?q=${encodeURIComponent(page)}`, label: `${page} page`, confidence: 0.85 };
  }
  if (!resolved) return null;
  const section = catalogue.find((item) => item.key === resolved.top.section);
  if (!section) return null;
  return withCandidates({ kind: 'navigate', to: `/hq/website/${section.key}`, label: `${section.page} › ${section.label}`, confidence: clamp(resolved.top.score) }, resolved.candidates);
}

function parseVisibility(kind: 'hideSection' | 'showSection', words: Word[], catalogue: Catalogue, ctx: ParseContext): Intent | null {
  const named = words.filter((word) => !AGAIN.has(word.n));
  if (!named.length || named.every((word) => IT.has(word.n) || STOP.has(word.n))) {
    const section = ctx.currentSection ?? ctx.lastSection;
    return section ? { kind, section, confidence: 0.85 } : { kind: 'unknown', reason: 'no-target', confidence: 0.3 };
  }
  const resolved = resolveSection(named, catalogue, ctx);
  if (!resolved) return null;
  return withCandidates({ kind, section: resolved.top.section, confidence: clamp(resolved.top.score) }, resolved.candidates);
}

/** "turn on the admissions banner": a switch inside a section rather than the section itself. */
function parseToggle(on: boolean, words: Word[], catalogue: Catalogue, ctx: ParseContext): Intent | null {
  const resolved = resolveField(words, catalogue, (field) => field.type === 'toggle', ctx);
  if (!resolved || resolved.top.score < 0.75) return null;
  return withCandidates({ kind: 'setField', section: resolved.top.section, field: resolved.top.field, value: on ? '1' : '', confidence: clamp(resolved.top.score) }, resolved.candidates);
}

/** Names people use for the three languages of the website. */
const LANGUAGE_WORDS: Record<string, 'en' | 'bn' | 'hi'> = {
  english: 'en', angrezi: 'en', ingreji: 'en', ingriji: 'en', इंग्लिश: 'en', अंग्रेजी: 'en', अंग्रेज़ी: 'en', ইংরেজি: 'en', ইংলিশ: 'en',
  bengali: 'bn', bangla: 'bn', bangali: 'bn', বাংলা: 'bn', বাঙলা: 'bn', बांग्ला: 'bn', बंगाली: 'bn', बंगला: 'bn',
  hindi: 'hi', हिंदी: 'hi', हिन्दी: 'hi', হিন্দি: 'hi',
};
/** The other words a "switch language" sentence may contain. Anything else and it is not one. */
const LANGUAGE_NOISE = new Set([
  'edit', 'editing', 'switch', 'to', 'in', 'into', 'language', 'version', 'wording', 'text', 'the', 'now', 'change', 'use', 'work', 'go', 'write',
  'mein', 'me', 'e', 'te', 'ta', 'karo', 'koro', 'kar', 'do', 'kore', 'dao', 'likho', 'lekho', 'bhasha', 'bhasa',
  'एडिट', 'करो', 'में', 'भाषा', 'लिखो', 'এডিট', 'করো', 'তে', 'ভাষা', 'লেখো', 'ভাষায়',
]);

/** "edit Bengali", "switch to Hindi", "bangla te edit koro": one language name and nothing but switching words. */
function parseLanguage(words: Word[]): Intent | null {
  const named = words.filter((word) => word.n in LANGUAGE_WORDS);
  if (named.length !== 1 || words.length < 2 || words.length > 6) return null;
  if (!words.every((word) => word.n in LANGUAGE_WORDS || LANGUAGE_NOISE.has(word.n))) return null;
  return { kind: 'editLanguage', lang: LANGUAGE_WORDS[named[0].n], confidence: 0.9 };
}

const PHOTO_VERBS = new Set(['take', 'click', 'upload', 'choose', 'pick', 'select']);
const UNKNOWN: Intent = { kind: 'unknown', reason: 'not-understood', confidence: 0 };

/* ───────────── one sentence ───────────── */

export function parseOne(text: string, catalogue: Catalogue, ctx: ParseContext = {}): Intent {
  const words = stripFillers(toWords(text));
  if (!words.length) return UNKNOWN;
  const said = normOf(words);

  if (CONFIRM.has(said)) return simple('confirm');
  if (CANCEL.has(said)) return simple('cancel');
  if (STOP_LISTENING.has(said)) return simple('stop');
  if (HELP.has(said)) return simple('help');
  if (UNDO.has(said)) return simple('undo');
  if (PREVIEW.has(said)) return simple('preview');
  if (PUBLISH.has(said)) return { kind: 'publish', confidence: 0.95 };

  const plain = words.filter((word) => !ORDINAL_NOISE.has(word.n));
  const ordinal = plain.length ? plain : words.filter((word) => word.n in ORDINALS);
  if (ordinal.length === 1 && ordinal[0].n in ORDINALS && words.length <= 3) return { kind: 'choose', index: ORDINALS[ordinal[0].n], confidence: 0.9 };

  const dictation = said.match(/^(?:(start|stop|begin|end)\s+(?:dictation|dictating|typing)|(?:dictation|dictate)(?:\s+mode)?\s+(on|off|start|stop))$/);
  if (dictation) return { kind: 'dictation', on: ['start', 'begin', 'on'].includes(dictation[1] ?? dictation[2]), confidence: 0.95 };
  if (['write', 'type', 'likho', 'lekho', 'लिखो', 'লেখো'].includes(words[0].n) && words.length > 1) {
    return { kind: 'dictate', text: rawOf(words.slice(1)), confidence: 0.9 };
  }

  const language = parseLanguage(words);
  if (language) return language;

  const gallery = parseGallery(words);
  if (gallery) return gallery;
  const notice = parseNotice(words);
  if (notice) return notice;

  const lead = bestVerb(words, LEAD_VERBS, 'lead');
  if (lead && words.length > lead.length) {
    const rest = words.slice(lead.length);
    const found = byVerb(lead.verb, rest, words, catalogue, ctx, 'lead');
    if (found) return found;
  }

  // A photo asked for without a "change" verb: "take a photo for the banner", "upload the logo".
  if (PHOTO_VERBS.has(words[0].n) && words.length > 1) {
    const resolved = resolveField(words.slice(1), catalogue, isImage, ctx);
    if (resolved) {
      return withCandidates({ kind: 'pickImage', section: resolved.top.section, field: resolved.top.field, camera: words[0].n === 'take' || words[0].n === 'click', confidence: clamp(resolved.top.score) }, resolved.candidates);
    }
  }

  const tail = bestVerb(words, TAIL_VERBS, 'tail');
  if (tail && words.length > tail.length) {
    const rest = words.slice(0, words.length - tail.length);
    const found = byVerb(tail.verb, rest, words, catalogue, ctx, 'tail');
    if (found) return found;
  }

  // No verb at all: "the phone number is now 98300 12345", "heading should be Welcome".
  const stated = said.match(/^(.+?)\s+(is now|should be|should say|should read|will be)\s+(.+)$/);
  if (stated) {
    const found = parseSet(words, catalogue, ctx);
    if (found?.kind === 'setField') return { ...found, confidence: clamp(found.confidence * 0.9) };
  }
  return UNKNOWN;
}

function byVerb(verb: Verb, rest: Word[], all: Word[], catalogue: Catalogue, ctx: ParseContext, at: 'lead' | 'tail'): Intent | null {
  switch (verb) {
    case 'set': {
      // "bondho koro" and friends end in the same word as "… koro": what is left decides.
      const left = normOf(rest);
      if (at === 'tail') {
        if (PUBLISH.has(left)) return { kind: 'publish', confidence: 0.95 };
        if (PREVIEW.has(left)) return simple('preview');
        if (UNDO.has(left)) return simple('undo');
      }
      return parseSet(rest, catalogue, ctx);
    }
    case 'add':
      return parseAdd(rest, catalogue, ctx);
    case 'hide': {
      const first = all[0].n;
      if (first === 'turn' || first === 'switch' || first === 'disable') {
        const toggle = parseToggle(false, rest, catalogue, ctx);
        if (toggle) return toggle;
      }
      return parseVisibility('hideSection', rest, catalogue, ctx);
    }
    case 'show': {
      const first = all[0].n;
      if (first === 'turn' || first === 'switch' || first === 'enable') {
        const toggle = parseToggle(true, rest, catalogue, ctx);
        if (toggle) return toggle;
      }
      const again = rest.some((word) => AGAIN.has(word.n));
      const plainShow = (at === 'lead' && first === 'show') || (at === 'tail' && /^(dikhao|dekhao|दिखाओ|দেখাও)$/.test(all[all.length - 1].n));
      if (plainShow && !again) {
        // "show testimonials" opens it, unless it is switched off, in which case it means bring it back.
        const visible = parseVisibility('showSection', rest, catalogue, ctx);
        if (visible?.kind === 'showSection' && (ctx.hiddenSections ?? []).includes(visible.section)) return visible;
        return parseOpen(rest, catalogue, ctx);
      }
      return parseVisibility('showSection', rest, catalogue, ctx);
    }
    case 'open':
      return parseOpen(rest, catalogue, ctx);
    case 'publish': {
      if (rest.every((word) => IT.has(word.n) || STOP.has(word.n))) return { kind: 'publish', section: ctx.currentSection ?? undefined, confidence: 0.9 };
      const resolved = resolveSection(rest, catalogue, ctx);
      if (!resolved || resolved.candidates.length > 1) return { kind: 'publish', confidence: 0.7 };
      return { kind: 'publish', section: resolved.top.section, confidence: clamp(resolved.top.score) };
    }
  }
}

/* ───────────── every guess ───────────── */

/** Below this the assistant does not act on a reading; it asks to hear it again. */
export const ACT_THRESHOLD = 0.55;

const REASON_RANK = { 'no-value': 2, 'no-target': 1, 'not-understood': 0 } as const;

/**
 * Parses every guess the recogniser made and returns the most confident
 * reading. Earlier guesses win ties, because the recogniser ranks them.
 */
export function parseCommand(alternatives: string[], catalogue: Catalogue, ctx: ParseContext = {}): Intent {
  let best: Intent = UNKNOWN;
  for (const alternative of alternatives) {
    const intent = parseOne(alternative, catalogue, ctx);
    if (intent.kind === 'unknown') {
      if (best.kind === 'unknown' && REASON_RANK[intent.reason ?? 'not-understood'] > REASON_RANK[best.reason ?? 'not-understood']) best = intent;
      continue;
    }
    if (best.kind === 'unknown' || intent.confidence > best.confidence + 0.05) best = intent;
  }
  if (best.kind !== 'unknown' && best.confidence < ACT_THRESHOLD) {
    return { kind: 'unknown', reason: 'not-understood', confidence: best.confidence };
  }
  return best;
}
