/**
 * Every editable section of the website, with its default text.
 * Pages import the section they render; the registry below feeds the edit
 * panel and the voice assistant.
 *
 * The default text is written for Dum Dum Kishore Bharati High School from
 * what the school has published. Nothing here may state a fact about the
 * school that we do not know to be true (no invented counts, years, results,
 * awards, fees or testimonials); open questions are in docs/CONTENT_TO_CONFIRM.md.
 */
import { BRAND } from '@/config/brand';
import { defineSection, type ContentData, type SectionDef } from '../types';
import { aboutCommittee, aboutHistory, aboutMotto, aboutTop, aboutValues } from './about';
import { homeEvents, homeFacts, homeGallery, homeIntro, homeMessage, homeNotices, homeVisit } from './home';
import { contactForm, contactTop, galleryTop, noticesTop, siteCta, siteFooter, siteHeader } from './pages';
import {
  achievementsList,
  admissionFees,
  alumniForm,
  alumniList,
  alumniTop,
  aboutChapters,
  careersList,
  disclosureFacts,
  disclosureRti,
  disclosureTop,
  downloadsList,
  downloadsTop,
  faqList,
  faqTop,
  galleryTour,
  homeMarquee,
  lifeClubs,
  lifeRules,
  lifeSafety,
  lifeTop,
  lifeUniform,
  resultsList,
  resultsTop,
  schemesList,
  schemesMeal,
  schemesTop,
} from './more';
import {
  academicsActivities,
  academicsClasses,
  academicsExams,
  academicsStreams,
  academicsSubjects,
  academicsTimings,
  academicsTop,
  admissionDocuments,
  admissionForm,
  admissionSteps,
  admissionTop,
  eventsTop,
  facilitiesList,
  facilitiesTop,
  teachersTop,
} from './school';
import { BN } from './translations/bn';
import { HI } from './translations/hi';

export * from './about';
export * from './home';
export * from './more';
export * from './pages';
export * from './school';

export const siteBrand = defineSection({
  key: 'site.brand',
  page: 'Whole site',
  label: 'Name and seal',
  description: 'Shown in the header and footer of every page. The Bengali name is in the Bengali version of this section.',
  path: '/',
  aliases: ['brand', 'logo', 'seal', 'school name', 'business name'],
  fields: [
    { name: 'name', label: 'School name', type: 'text', maxLength: 60 },
    { name: 'tagline', label: 'Motto', type: 'text', maxLength: 90, aliases: ['slogan', 'tagline'] },
    { name: 'logo', label: 'Seal for the footer', type: 'image', help: 'The full seal, shown in the footer.' },
    { name: 'mark', label: 'Seal for the header', type: 'image', help: 'Square. Shown beside the name at the top of every page.', aliases: ['header logo', 'small logo'] },
    { name: 'udise', label: 'UDISE code', type: 'text', maxLength: 20, aliases: ['school code'] },
  ],
  defaults: {
    name: BRAND.name as string,
    tagline: BRAND.tagline as string,
    logo: BRAND.mark as string,
    mark: BRAND.mark as string,
    udise: '19114400910',
  },
});

const MAP_PLACE = 'Dum Dum Kishore Bharati High School, P2/A Motijheel Avenue, Kolkata 700074';

export const siteContact = defineSection({
  key: 'site.contact',
  page: 'Whole site',
  label: 'Contact details',
  description: 'Phone, WhatsApp, email, address and social links used across the site.',
  path: '/contact',
  aliases: ['contact', 'phone number', 'address'],
  fields: [
    { name: 'phone', label: 'Phone number', type: 'phone', aliases: ['mobile', 'contact number'] },
    { name: 'phone2', label: 'Second phone (landline)', type: 'text', maxLength: 20, aliases: ['landline', 'office phone'] },
    { name: 'whatsapp', label: 'WhatsApp number', type: 'phone' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'hours', label: 'Office hours', type: 'text' },
    { name: 'mapUrl', label: 'Google Maps link', type: 'url' },
    { name: 'mapPlace', label: 'Place shown on the map', type: 'text', maxLength: 160, help: 'What Google Maps looks up to draw the map on the Contact page.' },
    { name: 'facebook', label: 'Facebook page link', type: 'url' },
    { name: 'instagram', label: 'Instagram link', type: 'url' },
    { name: 'youtube', label: 'YouTube link', type: 'url' },
  ],
  defaults: {
    phone: '9433951428',
    phone2: '033 3556 1853',
    whatsapp: '9433951428',
    email: 'ddkb1965@gmail.com',
    address: 'P2/A, Motijheel Avenue, Kolkata 700074\nWard No. 9, South Dum Dum Municipality, North 24 Parganas',
    // Not known yet: the site shows office hours only once the school gives them.
    hours: '',
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_PLACE)}`,
    mapPlace: MAP_PLACE,
    facebook: '',
    instagram: '',
    youtube: '',
  },
});

const S = '/images/school';

export const homeHero = defineSection({
  key: 'home.hero',
  page: 'Home',
  label: 'Top banner',
  description:
    'The first thing a visitor sees: the school name over a slider of photos. Each slide is a photo or a video with a short caption. With no slides, the single photo below is shown.',
  path: '/',
  aliases: ['hero', 'banner', 'main banner', 'home banner', 'slider', 'slideshow', 'banner slider'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 60 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title', 'headline'] },
    { name: 'motto', label: 'Motto line', type: 'text', maxLength: 60 },
    { name: 'mottoMeaning', label: 'What the motto means', type: 'text', maxLength: 90 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300, aliases: ['description', 'subheading'] },
    { name: 'image', label: 'Photo', type: 'image', aliases: ['picture', 'banner photo'] },
    { name: 'imageAlt', label: 'What the photo shows', type: 'text', maxLength: 140, help: 'Read out to people who cannot see the photo.' },
    { name: 'primaryLabel', label: 'Main button text', type: 'text', maxLength: 30, help: 'Opens the Admission page.' },
    { name: 'secondaryLabel', label: 'Second button text', type: 'text', maxLength: 30, help: 'Opens the Contact page.' },
    {
      name: 'slides',
      label: 'Slides',
      type: 'list',
      itemLabel: 'slide',
      titleField: 'heading',
      max: 8,
      help: 'Shown one after another behind the school name. A slide is a photo, a YouTube video or an mp4 video file (16:9). A video plays to the end before the next slide.',
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
        { name: 'heading', label: 'Caption', type: 'text', maxLength: 90, aliases: ['title', 'caption'] },
        { name: 'alt', label: 'What the photo or video shows', type: 'text', maxLength: 140, help: 'Read out to people who cannot see it.' },
      ],
    },
  ],
  defaults: {
    eyebrow: 'Since 1965 · Dum Dum, Kolkata',
    heading: 'Dum Dum Kishore Bharati High School',
    motto: 'তেজস্বি নাবধীতমস্তু',
    mottoMeaning: 'May our learning be bright',
    text: 'A Bengali-medium government school for boys, Class V to XII. Madhyamik under WBBSE, and Higher Secondary in Science and Arts under WBCHSE.',
    image: `${S}/high-gate.jpg`,
    imageAlt: 'The school signboard at the gate on Motijheel Avenue',
    primaryLabel: 'Admission information',
    secondaryLabel: 'Contact',
    slides: [
      { type: 'image', image: `${S}/high-gate.jpg`, video: '', heading: 'The school gate on Motijheel Avenue', alt: 'The school signboard at the gate, among the trees' },
      { type: 'image', image: `${S}/high-sports.jpg`, video: '', heading: 'Football on the field', alt: 'Students and teachers together after a football match' },
      { type: 'image', image: `${S}/high-annual-sports.jpg`, video: '', heading: 'The annual sports', alt: 'Teachers and students on the ground at the annual sports' },
      { type: 'image', image: `${S}/high-netaji-125.jpg`, video: '', heading: 'Netaji’s birth anniversary at the school gate', alt: 'Teachers and students at the school gate on Netaji’s birth anniversary' },
      { type: 'image', image: `${S}/high-football-2019.jpg`, video: '', heading: 'The football tournament', alt: 'Boys playing football in the tournament' },
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
  homeFacts,
  homeMessage,
  homeNotices,
  homeEvents,
  homeGallery,
  homeVisit,
  aboutTop,
  aboutHistory,
  aboutChapters,
  aboutMotto,
  aboutValues,
  aboutCommittee,
  academicsTop,
  academicsClasses,
  academicsSubjects,
  academicsStreams,
  academicsTimings,
  academicsExams,
  academicsActivities,
  resultsTop,
  resultsList,
  achievementsList,
  admissionTop,
  admissionSteps,
  admissionDocuments,
  admissionFees,
  admissionForm,
  schemesTop,
  schemesList,
  schemesMeal,
  faqTop,
  faqList,
  lifeTop,
  lifeClubs,
  lifeRules,
  lifeUniform,
  lifeSafety,
  alumniTop,
  alumniList,
  alumniForm,
  teachersTop,
  noticesTop,
  eventsTop,
  downloadsTop,
  downloadsList,
  galleryTop,
  galleryTour,
  facilitiesTop,
  facilitiesList,
  disclosureTop,
  disclosureFacts,
  disclosureRti,
  careersList,
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
