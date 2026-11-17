/**
 * Every editable section of the website, with its default text.
 * Pages import the section they render; the registry below feeds the edit
 * panel and the voice assistant.
 *
 * The default text is placeholder wording for a new client. Nothing here may
 * state a fact about the business that we do not know to be true (no invented
 * counts, years, awards, prices or testimonials).
 */
import { BRAND } from '@/config/brand';
import { defineSection, type ContentData, type SectionDef } from '../types';
import { aboutApproach, aboutMission, aboutOwner, aboutStory, aboutTop } from './about';
import { homeGallery, homeIntro, homeMarquee, homeNotices, homeTestimonials, homeWhy } from './home';
import { contactForm, contactTop, galleryTop, noticesTop, siteCta, siteFooter, siteHeader } from './pages';
import { BN } from './translations/bn';
import { HI } from './translations/hi';

export * from './about';
export * from './home';
export * from './pages';

export const siteBrand = defineSection({
  key: 'site.brand',
  page: 'Whole site',
  label: 'Name and logo',
  description: 'Shown in the header and footer of every page.',
  path: '/',
  aliases: ['brand', 'logo', 'business name'],
  fields: [
    { name: 'name', label: 'Business name', type: 'text', maxLength: 60 },
    { name: 'tagline', label: 'Tagline', type: 'text', maxLength: 90, aliases: ['slogan'] },
    { name: 'logo', label: 'Logo', type: 'image', help: 'The full logo, shown in the footer.' },
    { name: 'mark', label: 'Small logo for the header', type: 'image', help: 'Square. Shown beside the name at the top of every page.', aliases: ['header logo', 'small logo'] },
  ],
  defaults: {
    name: BRAND.name as string,
    tagline: BRAND.tagline as string,
    logo: BRAND.mark as string,
    mark: BRAND.mark as string,
  },
});

export const siteContact = defineSection({
  key: 'site.contact',
  page: 'Whole site',
  label: 'Contact details',
  description: 'Phone, WhatsApp, email, address and social links used across the site.',
  path: '/contact',
  aliases: ['contact', 'phone number', 'address'],
  fields: [
    { name: 'phone', label: 'Phone number', type: 'phone', aliases: ['mobile', 'contact number'] },
    { name: 'whatsapp', label: 'WhatsApp number', type: 'phone' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'hours', label: 'Office hours', type: 'text' },
    { name: 'mapUrl', label: 'Google Maps link', type: 'url' },
    { name: 'facebook', label: 'Facebook page link', type: 'url' },
    { name: 'instagram', label: 'Instagram link', type: 'url' },
    { name: 'youtube', label: 'YouTube link', type: 'url' },
  ],
  defaults: {
    // Left empty on purpose: the website shows each of these only once it is filled in.
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    hours: '',
    mapUrl: '',
    facebook: '',
    instagram: '',
    youtube: '',
  },
});

export const homeHero = defineSection({
  key: 'home.hero',
  page: 'Home',
  label: 'Top banner',
  description:
    'The first thing a visitor sees: a slider. Each slide is a photo or a video with its own heading and button. With no slides, the single heading, paragraph and photo below are shown.',
  path: '/',
  aliases: ['hero', 'banner', 'main banner', 'home banner', 'slider', 'slideshow', 'banner slider'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 60 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title', 'headline'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300, aliases: ['description', 'subheading'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40, help: 'Must match words in the heading exactly.' },
    { name: 'image', label: 'Photo', type: 'image', aliases: ['picture', 'banner photo'] },
    { name: 'imageAlt', label: 'What the photo shows', type: 'text', maxLength: 140, help: 'Read out to people who cannot see the photo.' },
    { name: 'badge', label: 'Small sticker on the photo', type: 'text', maxLength: 30, aliases: ['sticker'] },
    { name: 'primaryLabel', label: 'Main button text', type: 'text', maxLength: 30 },
    { name: 'secondaryLabel', label: 'Second button text', type: 'text', maxLength: 30 },
    {
      name: 'slides',
      label: 'Slides',
      type: 'list',
      itemLabel: 'slide',
      titleField: 'heading',
      max: 8,
      help: 'Shown one after another. A slide is a photo, a YouTube video or an mp4 video file.',
      aliases: ['banner slides', 'slider', 'slideshow', 'banners'],
      fields: [
        {
          name: 'type',
          label: 'Kind of slide',
          type: 'select',
          options: [
            { value: 'image', label: 'Photo' },
            { value: 'youtube', label: 'YouTube video' },
            { value: 'mp4', label: 'Video file (mp4)' },
          ],
          aliases: ['kind'],
        },
        { name: 'image', label: 'Photo', type: 'image', help: 'For a video slide this is the still picture shown before it plays.', aliases: ['picture', 'poster'] },
        {
          name: 'video',
          label: 'Video link',
          type: 'url',
          help: 'A YouTube link (https://www.youtube.com/watch?v=...) or the address of an mp4 file. Leave empty for a photo slide.',
          aliases: ['youtube link', 'video address'],
        },
        { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title', 'headline'] },
        { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300, aliases: ['description'] },
        { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
        { name: 'buttonLink', label: 'Button link', type: 'url', help: 'A page of this site, for example /contact, or a full https address.' },
        { name: 'alt', label: 'What the photo or video shows', type: 'text', maxLength: 140, help: 'Read out to people who cannot see it.' },
      ],
    },
  ],
  defaults: {
    eyebrow: 'Welcome',
    heading: 'Your main headline goes here',
    text: 'Say in one or two lines what the business does and who it is for. Change this from the edit panel.',
    highlight: 'headline',
    image: '/images/hero.jpg',
    imageAlt: 'Sample banner photo',
    badge: '',
    primaryLabel: 'Enquire now',
    secondaryLabel: 'About us',
    slides: [
      {
        type: 'image',
        image: '/images/hero.jpg',
        video: '',
        heading: 'Your main headline goes here',
        text: 'Say in one or two lines what the business does and who it is for. Change this from the edit panel.',
        buttonLabel: 'Enquire now',
        buttonLink: '/contact#enquire',
        alt: 'Sample banner photo',
      },
      {
        type: 'image',
        image: '/images/sample-4.webp',
        video: '',
        heading: 'A second slide for an offer or news',
        text: 'Each slide has its own photo, heading and button. Add, change or remove slides from the edit panel.',
        buttonLabel: 'See the gallery',
        buttonLink: '/gallery',
        alt: 'Sample photo',
      },
    ],
  },
});

/**
 * The registry. Keep it in the order the edit panel should list things.
 * (Add every new section here.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SECTIONS: SectionDef<any>[] = [
  siteBrand,
  siteContact,
  siteHeader,
  siteFooter,
  siteCta,
  homeHero,
  homeMarquee,
  homeIntro,
  homeWhy,
  homeGallery,
  homeTestimonials,
  homeNotices,
  aboutTop,
  aboutStory,
  aboutApproach,
  aboutMission,
  aboutOwner,
  galleryTop,
  noticesTop,
  contactTop,
  contactForm,
];

/**
 * Bengali and Hindi wording lives in ./translations, one file per language,
 * keyed by section key. It is attached here, once, so that content() finds it
 * on the section. (Kept apart from the definitions so a translator can read
 * one language top to bottom.)
 */
for (const def of SECTIONS) {
  const bn = BN[def.key] as Partial<ContentData> | undefined;
  const hi = HI[def.key] as Partial<ContentData> | undefined;
  if (bn || hi) def.translations = { ...(bn ? { bn } : {}), ...(hi ? { hi } : {}) };
}
