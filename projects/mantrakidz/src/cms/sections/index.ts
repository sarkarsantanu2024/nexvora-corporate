/**
 * Every editable section of the website, with its default text.
 * Pages import the section they render; the registry below feeds the edit
 * panel and the voice assistant.
 *
 * Nothing here may state a fact about the school that we do not know to be
 * true (no invented counts, years, awards or fees).
 */
import { defineSection, type ContentData, type SectionDef } from '../types';
import { aboutApproach, aboutDirector, aboutMission, aboutStory, aboutTop } from './about';
import { admissionsFaq, admissionsForm, admissionsSteps, admissionsTop } from './admissions';
import { franchiseFaq, franchiseForm, franchiseSteps, franchiseTop, franchiseTopics, franchiseWho, franchiseWhy } from './franchise';
import { homeFranchise, homeGallery, homeIntro, homeMarquee, homeNotices, homeNumbers, homeProgrammes, homeTestimonials, homeWhy } from './home';
import {
  centresTop,
  contactForm,
  contactTop,
  facilitiesList,
  facilitiesTop,
  galleryTop,
  noticesTop,
  programmesDetail,
  programmesFinder,
  programmesTop,
  siteFooter,
  siteHeader,
  siteVisit,
} from './pages';
import { BN } from './translations/bn';
import { HI } from './translations/hi';

export * from './about';
export * from './admissions';
export * from './franchise';
export * from './home';
export * from './pages';

export const siteBrand = defineSection({
  key: 'site.brand',
  page: 'Whole site',
  label: 'Name and logo',
  description: 'Shown in the header and footer of every page.',
  path: '/',
  aliases: ['brand', 'logo', 'school name'],
  fields: [
    { name: 'name', label: 'School name', type: 'text', maxLength: 60 },
    { name: 'tagline', label: 'Tagline', type: 'text', maxLength: 90, aliases: ['slogan'] },
    { name: 'parent', label: 'Parent organisation line', type: 'text', maxLength: 90 },
    { name: 'logo', label: 'Logo', type: 'image', help: 'The full logo, shown in the footer.' },
    { name: 'mark', label: 'Small logo for the header', type: 'image', help: 'The crest alone, square. Shown beside the name at the top of every page.', aliases: ['crest', 'header logo', 'small logo'] },
  ],
  defaults: {
    name: 'Mantra Kidz',
    tagline: 'A Play School',
    parent: 'A unit of Mind Mantra Abacus',
    logo: '/brand/logo.png',
    mark: '/brand/mark.png',
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
    { name: 'address', label: 'Head office address', type: 'textarea' },
    { name: 'hours', label: 'Office hours', type: 'text' },
    { name: 'mapUrl', label: 'Google Maps link', type: 'url' },
    { name: 'facebook', label: 'Facebook page link', type: 'url' },
    { name: 'instagram', label: 'Instagram link', type: 'url' },
    { name: 'youtube', label: 'YouTube link', type: 'url' },
  ],
  defaults: {
    phone: '8777896483',
    whatsapp: '8777896483',
    email: '',
    address: '17/106, Dakshindari Road, Kolkata 700048',
    hours: 'Monday to Saturday, 9 am to 5 pm',
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
        { name: 'buttonLink', label: 'Button link', type: 'url', help: 'A page of this site, for example /admissions, or a full https address.' },
        { name: 'alt', label: 'What the photo or video shows', type: 'text', maxLength: 140, help: 'Read out to people who cannot see it.' },
      ],
    },
  ],
  defaults: {
    eyebrow: 'Play Group · Nursery · LKG · UKG',
    heading: 'Where little ones learn by playing',
    text: 'A warm, safe play school for children from 1.5 to 5.5 years, with small classes and teachers who know every child by name.',
    highlight: 'by playing',
    image: '/images/hero.jpg',
    imageAlt: 'A girl and a boy sitting on a mat, working together with wooden learning material',
    badge: '12 seats per class',
    primaryLabel: 'Book a school visit',
    secondaryLabel: 'See our programmes',
    slides: [
      {
        type: 'image',
        image: '/images/hero.jpg',
        video: '',
        heading: 'Where little ones learn by playing',
        text: 'A warm, safe play school for children from 1.5 to 5.5 years, with small classes and teachers who know every child by name.',
        buttonLabel: 'Book a school visit',
        buttonLink: '/admissions#enquire',
        alt: 'A girl and a boy sitting on a mat, working together with wooden learning material',
      },
      {
        type: 'image',
        image: '/images/pink-tower.webp',
        video: '',
        heading: 'Only 12 children in a class',
        text: 'Four classes, from Play Group to UKG, and 12 seats in each. The teacher has time to sit with every child.',
        buttonLabel: 'See the four classes',
        buttonLink: '/programmes',
        alt: 'A smiling boy building a tall tower of pink blocks',
      },
      {
        type: 'image',
        image: '/images/reading-corner.webp',
        video: '',
        heading: 'Come and see the school',
        text: 'Pick a day, bring your child and meet the teachers. It is the best way to decide.',
        buttonLabel: 'Fix a visit',
        buttonLink: '/admissions#enquire',
        alt: 'A boy sitting on the floor, reading a book',
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
  siteVisit,
  homeHero,
  homeMarquee,
  homeIntro,
  homeNumbers,
  homeProgrammes,
  homeWhy,
  homeGallery,
  homeTestimonials,
  homeFranchise,
  homeNotices,
  aboutTop,
  aboutStory,
  aboutApproach,
  aboutMission,
  aboutDirector,
  programmesTop,
  programmesFinder,
  programmesDetail,
  facilitiesTop,
  facilitiesList,
  galleryTop,
  centresTop,
  admissionsTop,
  admissionsSteps,
  admissionsForm,
  admissionsFaq,
  franchiseTop,
  franchiseWhy,
  franchiseWho,
  franchiseTopics,
  franchiseSteps,
  franchiseForm,
  franchiseFaq,
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
