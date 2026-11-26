/**
 * The voice grammar, phrase by phrase. The catalogue here is a small fixed
 * website (so the tests do not break when real sections are reworded), plus a
 * last block that runs against the real section registry.
 */
import { describe, expect, it } from 'vitest';
import { SECTIONS } from '@/cms/sections';
import { defineSection, type SectionDef } from '@/cms/types';
import { buildCatalogue } from '@/voice/catalogue';
import { normaliseValue, parseCommand, parseOne, spokenDigits } from '@/voice/grammar';
import { intentSchema, type Intent, type IntentKind, type IntentOf } from '@/voice/intent';

const brand = defineSection({
  key: 'site.brand',
  page: 'Whole site',
  label: 'Name and logo',
  aliases: ['brand', 'logo', 'shop name'],
  fields: [
    { name: 'name', label: 'Shop name', type: 'text', maxLength: 60 },
    { name: 'tagline', label: 'Tagline', type: 'text', aliases: ['slogan'] },
    { name: 'logo', label: 'Logo', type: 'image' },
  ],
  defaults: { name: 'Sunrise Store', tagline: 'A General Store', logo: '/brand/logo.png' },
});
const contact = defineSection({
  key: 'site.contact',
  page: 'Whole site',
  label: 'Contact details',
  aliases: ['contact', 'phone number', 'address'],
  fields: [
    { name: 'phone', label: 'Phone number', type: 'phone', aliases: ['mobile', 'contact number'] },
    { name: 'whatsapp', label: 'WhatsApp number', type: 'phone' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Office address', type: 'textarea' },
    { name: 'hours', label: 'Office hours', type: 'text' },
    { name: 'facebook', label: 'Facebook page link', type: 'url' },
  ],
  defaults: { phone: '8777896483', whatsapp: '8777896483', email: '', address: 'Kolkata', hours: '9 to 5', facebook: '' },
});
const hero = defineSection({
  key: 'home.hero',
  page: 'Home',
  label: 'Top banner',
  aliases: ['hero', 'banner', 'main banner', 'home banner'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text' },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title', 'headline'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', aliases: ['description', 'subheading'] },
    { name: 'image', label: 'Photo', type: 'image', aliases: ['picture', 'banner photo'] },
    { name: 'showBadge', label: 'Offers open badge', type: 'toggle' },
  ],
  defaults: { eyebrow: '', heading: 'Where little ones learn by playing', text: '', image: '/images/hero.jpg', showBadge: '' },
});
const aboutIntro = defineSection({
  key: 'about.intro',
  page: 'About',
  label: 'Introduction',
  aliases: ['about page', 'about us'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', aliases: ['title'] },
    { name: 'body', label: 'Paragraph', type: 'textarea' },
    { name: 'photo', label: 'Photo', type: 'image' },
  ],
  defaults: { heading: 'About us', body: '', photo: '' },
});
const testimonials = defineSection({
  key: 'home.testimonials',
  page: 'Home',
  label: 'What customers say',
  aliases: ['testimonials', 'reviews', 'customer reviews'],
  fields: [
    { name: 'heading', label: 'Section heading', type: 'text' },
    {
      name: 'items',
      label: 'Testimonials',
      type: 'list',
      itemLabel: 'testimonial',
      titleField: 'name',
      max: 12,
      aliases: ['review'],
      fields: [
        { name: 'name', label: 'Customer name', type: 'text' },
        { name: 'relation', label: 'Customer since', type: 'text' },
        { name: 'quote', label: 'What they said', type: 'textarea' },
      ],
    },
  ],
  defaults: { heading: 'What customers say', items: [] as Record<string, string>[] },
});
const faq = defineSection({
  key: 'offers.faq',
  page: 'Offers',
  label: 'Common questions',
  aliases: ['faq', 'faqs', 'questions'],
  fields: [
    {
      name: 'items',
      label: 'Questions',
      type: 'list',
      itemLabel: 'question',
      titleField: 'question',
      fields: [
        { name: 'question', label: 'Question', type: 'text' },
        { name: 'answer', label: 'Answer', type: 'textarea' },
      ],
    },
  ],
  defaults: { items: [] as Record<string, string>[] },
});
const highlights = defineSection({
  key: 'home.highlights',
  page: 'Home',
  label: 'Highlights strip',
  aliases: ['highlights'],
  fields: [{ name: 'items', label: 'Highlights', type: 'list', itemLabel: 'highlight', fields: [{ name: 'text', label: 'Line', type: 'text' }] }],
  defaults: { items: [] as Record<string, string>[] },
});

const catalogue = buildCatalogue([brand, contact, hero, aboutIntro, testimonials, faq, highlights] as SectionDef[]);

const parse = (...alternatives: string[]) => parseCommand(alternatives, catalogue);

function as<K extends IntentKind>(intent: Intent, kind: K): IntentOf<K> {
  expect(intent.kind, JSON.stringify(intent)).toBe(kind);
  return intent as IntentOf<K>;
}

describe('changing text (English)', () => {
  it('finds the section and the field', () => {
    const intent = as(parse('Change the home banner heading to Offers open for 2027'), 'setField');
    expect(intent).toMatchObject({ section: 'home.hero', field: 'heading', value: 'Offers open for 2027' });
    expect(intent.candidates).toBeUndefined();
    expect(intent.confidence).toBeGreaterThan(0.9);
  });

  it('keeps a "to" that belongs to the value', () => {
    expect(as(parse('change the banner heading to welcome to sunrise store'), 'setField')).toMatchObject({ field: 'heading', value: 'Welcome to sunrise store' });
  });

  it('copes with politeness, another verb and word order', () => {
    expect(as(parse('please update heading of the main banner to Learning through play'), 'setField')).toMatchObject({ section: 'home.hero', field: 'heading', value: 'Learning through play' });
    expect(as(parse('could you set the tagline as a happy little shop please'), 'setField')).toMatchObject({ section: 'site.brand', field: 'tagline', value: 'A happy little shop' });
  });

  it('uses aliases', () => {
    expect(as(parse('change the slogan to Learn. Play. Grow.'), 'setField')).toMatchObject({ field: 'tagline', value: 'Learn. Play. Grow.' });
    expect(as(parse('change the hero title to Hello'), 'setField')).toMatchObject({ section: 'home.hero', field: 'heading' });
  });

  it('forgives a misheard word', () => {
    expect(as(parse('change the home baner hedding to Welcome'), 'setField')).toMatchObject({ section: 'home.hero', field: 'heading', value: 'Welcome' });
  });

  it('reads a sentence with no separator', () => {
    expect(as(parse('set office hours Monday to Friday 9 to 2'), 'setField')).toMatchObject({ field: 'hours', value: 'Monday to Friday 9 to 2' });
  });

  it('reads a statement with no verb', () => {
    expect(as(parse('the office hours should be 10 am to 4 pm'), 'setField')).toMatchObject({ field: 'hours', value: '10 am to 4 pm' });
  });

  it('updates the address', () => {
    expect(as(parse('update the address to 12 Lake Town Road, Kolkata 700089'), 'setField')).toMatchObject({ section: 'site.contact', field: 'address', value: '12 Lake Town Road, Kolkata 700089' });
  });

  it('asks which one when a name fits two places', () => {
    const intent = as(parse('change the paragraph to We are open'), 'setField');
    expect(intent.candidates?.map((c) => c.section).sort()).toEqual(['about.intro', 'home.hero']);
  });

  it('means the open form when a name fits two places', () => {
    const intent = as(parseCommand(['change the paragraph to We are open'], catalogue, { currentSection: 'about.intro' }), 'setField');
    expect(intent).toMatchObject({ section: 'about.intro', field: 'body' });
    expect(intent.candidates).toBeUndefined();
  });

  it('tells the heading of the about page from the banner', () => {
    expect(as(parse('change the heading of the about page to Our story'), 'setField')).toMatchObject({ section: 'about.intro', field: 'heading', value: 'Our story' });
  });

  it('says so when no value was given', () => {
    const intent = as(parse('change the phone number'), 'unknown');
    expect(intent).toMatchObject({ reason: 'no-value', section: 'site.contact', field: 'phone' });
  });

  it('switches a toggle', () => {
    expect(as(parse('turn on the offers open badge'), 'setField')).toMatchObject({ section: 'home.hero', field: 'showBadge', value: '1' });
    expect(as(parse('switch off the offers open badge'), 'setField')).toMatchObject({ field: 'showBadge', value: '' });
  });
});

describe('phone, email and links', () => {
  it('turns spoken digits into a number', () => {
    expect(as(parse('Set phone number to 98300 12345'), 'setField')).toMatchObject({ section: 'site.contact', field: 'phone', value: '9830012345' });
    expect(as(parse('set the phone number to nine eight three zero zero one two three four five'), 'setField').value).toBe('9830012345');
    expect(as(parse('change whatsapp number to double nine 03 double one 2345'), 'setField')).toMatchObject({ field: 'whatsapp', value: '9903112345' });
    expect(as(parse('set mobile to +91 98300-12345'), 'setField')).toMatchObject({ field: 'phone', value: '9830012345' });
  });

  it('reads digits in three scripts', () => {
    expect(spokenDigits('ninety eight thirty 12 345')).toBe('983012345');
    expect(spokenDigits('नौ आठ तीन शून्य')).toBe('9830');
    expect(spokenDigits('৯৮৩০০ ১২৩৪৫')).toBe('9830012345');
    expect(spokenDigits('noy aat tin shunno')).toBe('9830');
    expect(spokenDigits('triple five')).toBe('555');
  });

  it('builds an email from "at" and "dot"', () => {
    expect(as(parse('change the email to info at sunrise store dot com'), 'setField')).toMatchObject({ field: 'email', value: 'info@sunrisestore.com' });
  });

  it('builds a link', () => {
    expect(as(parse('set the facebook page link to facebook dot com slash sunrisestore'), 'setField')).toMatchObject({ field: 'facebook', value: 'facebook.com/sunrisestore' });
  });

  it('shapes values by field type', () => {
    expect(normaliseValue({ type: 'text' }, '"hello there"')).toBe('Hello there');
    expect(normaliseValue({ type: 'text' }, 'iPhone friendly')).toBe('iPhone friendly');
    expect(normaliseValue({ type: 'toggle' }, 'on')).toBe('1');
    expect(normaliseValue({ type: 'select', options: [{ value: 'left', label: 'Left side' }] }, 'left side')).toBe('left');
  });
});

describe('photos', () => {
  it('opens the picker for a named photo', () => {
    expect(as(parse('Change the banner photo'), 'pickImage')).toMatchObject({ section: 'home.hero', field: 'image', camera: false });
    expect(as(parse('replace the logo'), 'pickImage')).toMatchObject({ section: 'site.brand', field: 'logo' });
    expect(as(parse('change the home banner picture to a new one'), 'pickImage')).toMatchObject({ section: 'home.hero', field: 'image' });
  });

  it('opens the camera when asked to take one', () => {
    expect(as(parse('take a photo for the banner'), 'pickImage')).toMatchObject({ section: 'home.hero', field: 'image', camera: true });
    expect(as(parse('upload the logo'), 'pickImage')).toMatchObject({ field: 'logo', camera: false });
  });

  it('adds to the gallery, with or without an album', () => {
    expect(as(parse('add a photo to the gallery in album Annual Day'), 'addGalleryPhoto')).toMatchObject({ album: 'Annual Day' });
    expect(as(parse('add photos to the sports day album'), 'addGalleryPhoto')).toMatchObject({ album: 'Sports Day' });
    expect(as(parse('upload some pictures to the gallery'), 'addGalleryPhoto')).toMatchObject({ album: '' });
    expect(as(parse('take a photo for the gallery'), 'addGalleryPhoto')).toMatchObject({ camera: true });
  });
});

describe('adding rows', () => {
  it('places name and words of a testimonial', () => {
    const intent = as(parse('Add a testimonial from Rina Das saying the teachers are caring'), 'appendListItem');
    expect(intent).toMatchObject({ section: 'home.testimonials', field: 'items', needsEditor: false });
    expect(intent.item).toEqual({ name: 'Rina Das', quote: 'The teachers are caring' });
  });

  it('places a question and its answer', () => {
    const intent = as(parse('add a question what are the shop timings answer nine thirty to twelve thirty'), 'appendListItem');
    expect(intent).toMatchObject({ section: 'offers.faq', needsEditor: false });
    expect(intent.item).toEqual({ question: 'What are the shop timings', answer: 'Nine thirty to twelve thirty' });
  });

  it('opens the row for the person to finish when parts cannot be told apart', () => {
    const intent = as(parse('add a question do you provide transport'), 'appendListItem');
    expect(intent.needsEditor).toBe(true);
    expect(intent.item).toEqual({ question: 'Do you provide transport' });
    expect(intent.text).toBe('do you provide transport');
  });

  it('fills a one-field row outright', () => {
    const intent = as(parse('add a new highlight CCTV in every classroom'), 'appendListItem');
    expect(intent).toMatchObject({ section: 'home.highlights', needsEditor: false, item: { text: 'CCTV in every classroom' } });
  });

  it('finds the list by its alias', () => {
    expect(as(parse('add a review from Amit saying lovely shop'), 'appendListItem')).toMatchObject({ section: 'home.testimonials', item: { name: 'Amit', quote: 'Lovely shop' } });
  });
});

describe('notices', () => {
  it('makes a notice from what follows', () => {
    expect(as(parse('Add a notice: shop closed on Friday for Kali Puja'), 'addNotice')).toMatchObject({ title: 'Shop closed on Friday for Kali Puja', body: '' });
    expect(as(parse('put up a new notice saying annual day is on 20 December'), 'addNotice').title).toBe('Annual day is on 20 December');
  });

  it('splits a long notice into title and text', () => {
    const long = 'add a notice shop will stay closed from Monday to Wednesday for Durga Puja, classes start again on Thursday at the usual time and the van will run as normal';
    const intent = as(parse(long), 'addNotice');
    expect(intent.title.length).toBeLessThanOrEqual(90);
    expect(intent.body).toContain('the van will run as normal');
  });

  it('does not mistake the notices screen for a new notice', () => {
    expect(as(parse('open notices'), 'navigate').to).toBe('/admin/website/notices');
    expect(as(parse('go to notice board'), 'navigate').to).toBe('/admin/website/notices');
  });
});

describe('sections and getting around', () => {
  it('hides and shows a section', () => {
    expect(as(parse('Hide the testimonials section'), 'hideSection').section).toBe('home.testimonials');
    expect(as(parse('unhide testimonials'), 'showSection').section).toBe('home.testimonials');
    expect(as(parse('show the testimonials section again'), 'showSection').section).toBe('home.testimonials');
  });

  it('knows what "it" is', () => {
    expect(as(parseCommand(['show it again'], catalogue, { lastSection: 'home.testimonials' }), 'showSection').section).toBe('home.testimonials');
    expect(as(parseCommand(['hide this'], catalogue, { currentSection: 'offers.faq' }), 'hideSection').section).toBe('offers.faq');
    expect(as(parse('hide it'), 'unknown').reason).toBe('no-target');
  });

  it('opens a hidden section back up on "show", otherwise goes to it', () => {
    expect(as(parse('show testimonials'), 'navigate').to).toBe('/admin/website/home.testimonials');
    expect(as(parseCommand(['show testimonials'], catalogue, { hiddenSections: ['home.testimonials'] }), 'showSection').section).toBe('home.testimonials');
  });

  it('goes to screens and sections', () => {
    expect(as(parse('open contact details'), 'navigate').to).toBe('/admin/website/site.contact');
    expect(as(parse('go to gallery'), 'navigate').to).toBe('/admin/website/gallery');
    expect(as(parse('open the photo library'), 'navigate').to).toBe('/admin/website/media');
    expect(as(parse('show me the change history'), 'navigate').to).toBe('/admin/website/history');
    expect(as(parse('take me to the faq'), 'navigate').to).toBe('/admin/website/offers.faq');
    expect(as(parse('open home'), 'navigate').to).toBe('/admin/website?q=Home');
  });

  it('publishes, everything or one section', () => {
    expect(as(parse('publish'), 'publish').section).toBeUndefined();
    expect(as(parse('publish everything now'), 'publish').section).toBeUndefined();
    expect(as(parse('publish the contact details'), 'publish').section).toBe('site.contact');
    expect(as(parseCommand(['publish this'], catalogue, { currentSection: 'home.hero' }), 'publish').section).toBe('home.hero');
  });
});

describe('short commands', () => {
  const cases: [string, IntentKind][] = [
    ['yes', 'confirm'],
    ['Apply', 'confirm'],
    ['ok do it', 'confirm'],
    ['haan', 'confirm'],
    ['thik ache', 'confirm'],
    ['ठीक है', 'confirm'],
    ['হ্যাঁ', 'confirm'],
    ['no', 'cancel'],
    ['cancel that', 'cancel'],
    ['nahi', 'cancel'],
    ['বাতিল', 'cancel'],
    ['रहने दो', 'cancel'],
    ['undo', 'undo'],
    ['undo that please', 'undo'],
    ['wapas karo', 'undo'],
    ['আগের মতো করো', 'undo'],
    ['show preview', 'preview'],
    ['preview dekhao', 'preview'],
    ['help', 'help'],
    ['what can I say', 'help'],
    ['সাহায্য', 'help'],
    ['stop listening', 'stop'],
    ['bondho koro', 'stop'],
    ['बंद करो', 'stop'],
    ['publish kar do', 'publish'],
    ['প্রকাশ করো', 'publish'],
  ];
  it.each(cases)('%s → %s', (phrase, kind) => {
    expect(parse(phrase).kind).toBe(kind);
  });

  it('reads "the second one"', () => {
    expect(as(parse('the second one'), 'choose').index).toBe(1);
    expect(as(parse('first'), 'choose').index).toBe(0);
    expect(as(parse('dusra wala'), 'choose').index).toBe(1);
  });

  it('types what follows "write"', () => {
    expect(as(parse('write We welcome every customer'), 'dictate').text).toBe('We welcome every customer');
    expect(as(parse('start dictation'), 'dictation').on).toBe(true);
    expect(as(parse('dictation off'), 'dictation').on).toBe(false);
  });
});

describe('which language to edit', () => {
  const cases: [string, 'en' | 'bn' | 'hi'][] = [
    ['edit Bengali', 'bn'],
    ['Edit Hindi', 'hi'],
    ['edit English', 'en'],
    ['switch to bangla', 'bn'],
    ['change language to hindi please', 'hi'],
    ['hindi mein edit karo', 'hi'],
    ['bangla te edit koro', 'bn'],
    ['বাংলা এডিট করো', 'bn'],
    ['हिंदी में एडिट करो', 'hi'],
  ];
  it.each(cases)('%s → %s', (phrase, lang) => {
    expect(as(parse(phrase), 'editLanguage').lang).toBe(lang);
  });

  it('is not fooled by a value that names a language', () => {
    expect(as(parse('change the tagline to English and Bengali medium'), 'setField')).toMatchObject({ field: 'tagline', value: 'English and Bengali medium' });
    expect(parse('hindi').kind).toBe('unknown');
  });
});

describe('Hindi', () => {
  it('reads the verb at the end, in Latin letters', () => {
    expect(as(parse('home banner heading ko Offer chalu hai kar do'), 'setField')).toMatchObject({ section: 'home.hero', field: 'heading', value: 'Offer chalu hai' });
    expect(as(parse('phone number 98300 12345 karo'), 'setField')).toMatchObject({ field: 'phone', value: '9830012345' });
    expect(as(parse('tagline badal kar Khel khel mein seekho kar do'), 'setField')).toMatchObject({ field: 'tagline', value: 'Khel khel mein seekho' });
  });

  it('reads Devanagari', () => {
    expect(as(parse('होम बैनर की हेडिंग बदलकर एडमिशन चालू हैं कर दो'), 'setField')).toMatchObject({ section: 'home.hero', field: 'heading', value: 'एडमिशन चालू हैं' });
    expect(as(parse('फोन नंबर को नौ आठ तीन शून्य शून्य एक दो तीन चार पांच करो'), 'setField')).toMatchObject({ field: 'phone', value: '9830012345' });
  });

  it('hides, opens and adds', () => {
    expect(as(parse('testimonials section chhupa do'), 'hideSection').section).toBe('home.testimonials');
    expect(as(parse('contact details kholo'), 'navigate').to).toBe('/admin/website/site.contact');
    expect(as(parse('गैलरी खोलो'), 'navigate').to).toBe('/admin/website/gallery');
    expect(as(parse('gallery mein photo daal do'), 'addGalleryPhoto').album).toBe('');
    expect(as(parse('kal shop band rahega notice laga do'), 'addNotice').title).toBe('Kal shop band rahega');
  });
});

describe('Bengali', () => {
  it('reads the verb at the end, in Latin letters', () => {
    expect(as(parse('home banner heading ta bodle Bhorti cholche koro'), 'setField')).toMatchObject({ section: 'home.hero', field: 'heading', value: 'Bhorti cholche' });
    expect(as(parse('thikana bodle 12 Lake Town Road kore dao'), 'setField')).toMatchObject({ field: 'address', value: '12 Lake Town Road' });
  });

  it('reads Bengali script', () => {
    expect(as(parse('হোম ব্যানার হেডিং বদলে ভর্তি চলছে করো'), 'setField')).toMatchObject({ section: 'home.hero', field: 'heading', value: 'ভর্তি চলছে' });
    expect(as(parse('ফোন নম্বর ৯৮৩০০১২৩৪৫ করো'), 'setField')).toMatchObject({ field: 'phone', value: '9830012345' });
    expect(as(parse('ঠিকানা বদলে ১২ লেক টাউন রোড করে দাও'), 'setField')).toMatchObject({ field: 'address', value: '১২ লেক টাউন রোড' });
  });

  it('hides, opens, adds', () => {
    expect(as(parse('testimonials lukiye dao'), 'hideSection').section).toBe('home.testimonials');
    expect(as(parse('testimonials abar dekhao'), 'showSection').section).toBe('home.testimonials');
    expect(as(parse('গ্যালারি খোলো'), 'navigate').to).toBe('/admin/website/gallery');
    expect(as(parse('annual day album e chobi jog koro'), 'addGalleryPhoto').album).toBe('Annual Day');
    expect(as(parse('নোটিশ দাও: শুক্রবার স্কুল বন্ধ'), 'addNotice').title).toBe('শুক্রবার স্কুল বন্ধ');
    expect(as(parse('banner er chobi bodlao'), 'pickImage')).toMatchObject({ section: 'home.hero', field: 'image' });
  });
});

describe('messy input', () => {
  it('tries every guess the recogniser made', () => {
    // The top guess is noise; the second is the sentence.
    const intent = as(parse('chain the home bananas heading two offers', 'change the home banner heading to Offers open'), 'setField');
    expect(intent).toMatchObject({ section: 'home.hero', field: 'heading', value: 'Offers open' });
  });

  it('does not act on chatter', () => {
    expect(parse('what a lovely morning it is today').kind).toBe('unknown');
    expect(parse('').kind).toBe('unknown');
    expect(parse('change the colour of the sky to green').kind).toBe('unknown');
    expect(parseOne('hmm', catalogue).kind).toBe('unknown');
  });

  it('never returns a shape the assistant cannot handle', () => {
    const phrases = ['change the banner heading to Hi', 'add a notice: test', 'hide testimonials', 'go to gallery', 'publish', 'undo', 'nonsense words here', 'add a testimonial from A saying B'];
    for (const phrase of phrases) expect(() => intentSchema.parse(parse(phrase))).not.toThrow();
  });
});

describe('the real website', () => {
  const real = buildCatalogue(SECTIONS as SectionDef[]);

  it('has a catalogue entry for every section and field', () => {
    expect(real).toHaveLength(SECTIONS.length);
    for (const section of real) expect(section.fields.length).toBeGreaterThan(0);
  });

  it('can address every section by its own label', () => {
    for (const section of real) {
      const intent = parseCommand([`open ${section.page} ${section.label}`], real);
      expect(intent.kind, section.key).toBe('navigate');
      if (intent.kind !== 'navigate') continue;
      const reachable = [intent.to, ...(intent.candidates ?? []).map((c) => `/admin/website/${c.section}`)];
      expect(reachable, section.key).toContain(`/admin/website/${section.key}`);
    }
  });

  it('changes the shop phone number', () => {
    expect(parseCommand(['set phone number to 98300 12345'], real)).toMatchObject({ kind: 'setField', section: 'site.contact', field: 'phone', value: '9830012345' });
  });
});
