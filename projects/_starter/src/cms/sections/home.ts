/** Home page sections, in the order they appear after the top banner. */
import { defineSection } from '../types';
import { colourField, iconField } from './options';

export const homeMarquee = defineSection({
  key: 'home.marquee',
  page: 'Home',
  label: 'Moving strip of words',
  description: 'The band of words that slides across the page under the top banner.',
  path: '/',
  aliases: ['marquee', 'ticker', 'moving words', 'scrolling strip'],
  fields: [
    {
      name: 'items',
      label: 'Words',
      type: 'list',
      itemLabel: 'word',
      titleField: 'text',
      max: 16,
      fields: [{ name: 'text', label: 'Word', type: 'text', maxLength: 30 }],
    },
  ],
  defaults: {
    items: [{ text: 'Service one' }, { text: 'Service two' }, { text: 'Service three' }, { text: 'Service four' }, { text: 'Service five' }, { text: 'Service six' }],
  },
});

export const homeIntro = defineSection({
  key: 'home.intro',
  page: 'Home',
  label: 'Welcome',
  description: 'A short introduction with a photo and a few points.',
  path: '/',
  aliases: ['welcome', 'introduction', 'intro', 'about block'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40, help: 'Must match words in the heading exactly.' },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 500, aliases: ['description'] },
    { name: 'image', label: 'Main photo', type: 'image', aliases: ['picture', 'photo'] },
    { name: 'imageAlt', label: 'What the main photo shows', type: 'text', maxLength: 140, help: 'Read out to people who cannot see the photo.' },
    { name: 'image2', label: 'Small photo', type: 'image', aliases: ['second photo'] },
    { name: 'image2Alt', label: 'What the small photo shows', type: 'text', maxLength: 140 },
    {
      name: 'points',
      label: 'Points',
      type: 'list',
      itemLabel: 'point',
      titleField: 'text',
      max: 5,
      fields: [{ name: 'text', label: 'Point', type: 'text', maxLength: 90 }],
    },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    eyebrow: 'Welcome',
    heading: 'A short introduction to the business',
    highlight: 'introduction',
    text: 'Write three or four lines here: what the business does, where it is and what makes it different. Keep it plain and true.',
    image: '/images/sample-1.webp',
    imageAlt: 'Sample photo',
    image2: '/images/sample-2.webp',
    image2Alt: 'Sample photo',
    points: [{ text: 'First point about the business' }, { text: 'Second point about the business' }, { text: 'Third point about the business' }],
    buttonLabel: 'More about us',
  },
});

export const homeWhy = defineSection({
  key: 'home.why',
  page: 'Home',
  label: 'Why choose us',
  description: 'The strengths of the business. Also shown on the About page.',
  path: '/',
  aliases: ['why us', 'strengths', 'why choose us', 'features'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300 },
    {
      name: 'items',
      label: 'Strengths',
      type: 'list',
      itemLabel: 'strength',
      titleField: 'title',
      max: 8,
      aliases: ['points', 'reasons'],
      fields: [
        { name: 'title', label: 'Title', type: 'text', maxLength: 50 },
        { name: 'text', label: 'One or two lines', type: 'textarea', maxLength: 220 },
        iconField,
        colourField,
      ],
    },
  ],
  defaults: {
    eyebrow: 'Why us',
    heading: 'What you can expect from us',
    highlight: 'expect',
    text: 'Three or four short promises that the business can keep.',
    items: [
      { title: 'First strength', text: 'One or two lines about it.', icon: 'star', color: 'sun' },
      { title: 'Second strength', text: 'One or two lines about it.', icon: 'heart', color: 'coral' },
      { title: 'Third strength', text: 'One or two lines about it.', icon: 'shield', color: 'mint' },
    ],
  },
});

export const homeGallery = defineSection({
  key: 'home.gallery',
  page: 'Home',
  label: 'Photo strip',
  description: 'A few photos from the gallery. The photos themselves are managed in Gallery in the dashboard.',
  path: '/',
  aliases: ['photos block', 'gallery strip', 'home gallery'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300 },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    eyebrow: 'Gallery',
    heading: 'A look at our work',
    highlight: 'our work',
    text: 'A few photos from the gallery.',
    buttonLabel: 'See all photos',
  },
});

export const homeTestimonials = defineSection({
  key: 'home.testimonials',
  page: 'Home',
  label: 'What people say',
  description: 'Short words from customers. Use only real ones, with the person’s permission. The block stays hidden until there is at least one.',
  path: '/',
  aliases: ['testimonials', 'reviews', 'customer feedback', 'what customers say'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    {
      name: 'items',
      label: 'Testimonials',
      type: 'list',
      itemLabel: 'testimonial',
      titleField: 'name',
      max: 12,
      aliases: ['reviews', 'quotes'],
      fields: [
        { name: 'quote', label: 'What they said', type: 'textarea', maxLength: 400, aliases: ['review', 'words'] },
        { name: 'name', label: 'Name', type: 'text', maxLength: 60 },
        { name: 'role', label: 'Who they are (optional)', type: 'text', maxLength: 60, help: 'For example: Customer since 2021' },
        { name: 'photo', label: 'Photo (optional)', type: 'image' },
      ],
    },
  ],
  defaults: {
    eyebrow: 'Kind words',
    heading: 'What people say about us',
    highlight: 'say about us',
    // No invented testimonials: the client adds real ones.
    items: [] as { quote: string; name: string; role: string; photo: string }[],
  },
});

export const homeNotices = defineSection({
  key: 'home.notices',
  page: 'Home',
  label: 'Notices block',
  description: 'Shows the latest public notices. It hides itself when there are none.',
  path: '/',
  aliases: ['notices block', 'news', 'events block'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    eyebrow: 'Notice board',
    heading: 'Notices and events',
    buttonLabel: 'All notices',
  },
});
