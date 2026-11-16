/**
 * Sections of the smaller pages: programmes, facilities, gallery, centres,
 * notices, contact, and the pieces repeated across the site.
 */
import { defineSection } from '../types';
import { colourField, iconField, pageTopFields } from './options';

/* ───────────── whole site ───────────── */

export const siteHeader = defineSection({
  key: 'site.header',
  page: 'Whole site',
  label: 'Header buttons',
  description: 'The buttons at the top right of every page.',
  path: '/',
  aliases: ['header', 'top bar', 'menu buttons', 'navigation'],
  fields: [
    { name: 'enquireLabel', label: 'Enquiry button text', type: 'text', maxLength: 24, aliases: ['enquire button', 'call to action'] },
    { name: 'loginLabel', label: 'Login link text', type: 'text', maxLength: 16 },
  ],
  defaults: {
    enquireLabel: 'Enquire now',
    loginLabel: 'Login',
  },
});

export const siteFooter = defineSection({
  key: 'site.footer',
  page: 'Whole site',
  label: 'Footer',
  description: 'The bottom of every page.',
  path: '/',
  aliases: ['footer', 'bottom of the page'],
  fields: [
    { name: 'about', label: 'Short line about the school', type: 'textarea', maxLength: 240, aliases: ['footer text', 'blurb'] },
    { name: 'note', label: 'Small line at the very bottom', type: 'text', maxLength: 120, aliases: ['copyright line'] },
  ],
  defaults: {
    about: 'A play school for children from 1.5 to 5.5 years. Play Group, Nursery, LKG and UKG, with 12 seats in each class.',
    note: 'All rights reserved.',
  },
});

export const siteVisit = defineSection({
  key: 'site.visit',
  page: 'Whole site',
  label: 'Visit invitation',
  description: 'The coloured band near the bottom of most pages that invites parents to visit.',
  path: '/',
  aliases: ['visit band', 'call to action band', 'book a visit block', 'bottom banner'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300 },
    { name: 'primaryLabel', label: 'Main button text', type: 'text', maxLength: 30 },
    { name: 'whatsappLabel', label: 'WhatsApp button text', type: 'text', maxLength: 30 },
    { name: 'whatsappMessage', label: 'Message that opens in WhatsApp', type: 'text', maxLength: 160, help: 'The parent can change it before sending.' },
  ],
  defaults: {
    heading: 'Come and see the school',
    text: 'The best way to judge a play school is to walk in. Pick a day, bring your child and meet the teachers.',
    primaryLabel: 'Book a visit',
    whatsappLabel: 'Chat on WhatsApp',
    whatsappMessage: 'Hello Mantra Kidz, I would like to know about admission for my child.',
  },
});

/* ───────────── programmes ───────────── */

export const programmesTop = defineSection({
  key: 'programmes.top',
  page: 'Programmes',
  label: 'Page heading',
  description: 'The classes themselves (names, ages, descriptions) are edited in Programmes in the dashboard.',
  path: '/programmes',
  aliases: ['programmes heading', 'programmes title', 'classes page heading'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Our programmes',
    heading: 'Four classes for children from 1.5 to 5.5 years',
    text: 'Children are placed by age and move up every year. Each class has 12 seats.',
  },
});

export const programmesFinder = defineSection({
  key: 'programmes.finder',
  page: 'Programmes',
  label: 'Class finder',
  description: 'The small tool where a parent enters a date of birth and sees the class for that age.',
  path: '/programmes',
  aliases: ['class finder', 'age finder', 'which class', 'age calculator'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 240 },
    { name: 'note', label: 'Small note under the result', type: 'text', maxLength: 160 },
    { name: 'tooYoung', label: 'Message when the child is too young', type: 'text', maxLength: 200 },
    { name: 'tooOld', label: 'Message when the child is too old', type: 'text', maxLength: 200 },
  ],
  defaults: {
    heading: 'Which class is right for my child?',
    text: 'Enter your child’s date of birth and we will show the class for that age.',
    note: 'The school confirms the class after meeting your child.',
    tooYoung: 'Your child is a little young for Play Group just now. Leave an enquiry and we will tell you when to come.',
    tooOld: 'Your child is past our UKG age. Please call us and we will guide you.',
  },
});

export const programmesDetail = defineSection({
  key: 'programmes.detail',
  page: 'Programmes',
  label: 'Class page wording',
  description: 'Headings and notes used on the page of each class.',
  path: '/programmes',
  aliases: ['class page', 'programme page wording'],
  fields: [
    { name: 'highlightsHeading', label: 'Heading above the list of activities', type: 'text', maxLength: 60 },
    { name: 'seatsText', label: 'Line about seats', type: 'text', maxLength: 120 },
    { name: 'feeHeading', label: 'Fee heading', type: 'text', maxLength: 40 },
    { name: 'feeText', label: 'Fee note', type: 'textarea', maxLength: 240, aliases: ['fees'] },
    { name: 'buttonLabel', label: 'Enquiry button text', type: 'text', maxLength: 40 },
    { name: 'othersHeading', label: 'Heading above the other classes', type: 'text', maxLength: 60 },
  ],
  defaults: {
    highlightsHeading: 'What children do in this class',
    seatsText: 'Small on purpose, so every child gets attention.',
    feeHeading: 'Fees',
    feeText: 'Ask us and we will share the current fee for this class when we speak.',
    buttonLabel: 'Enquire about this class',
    othersHeading: 'The other classes',
  },
});

/* ───────────── facilities ───────────── */

export const facilitiesTop = defineSection({
  key: 'facilities.top',
  page: 'Facilities',
  label: 'Page heading',
  path: '/facilities',
  aliases: ['facilities heading', 'facilities title'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Facilities',
    heading: 'A safe, cheerful place for small children',
    text: 'This is what your child will find at Mantra Kidz. Do visit and see it for yourself.',
  },
});

export const facilitiesList = defineSection({
  key: 'facilities.list',
  page: 'Facilities',
  label: 'List of facilities',
  description: 'One card per facility, each with a photo.',
  path: '/facilities',
  aliases: ['facilities', 'facility list', 'what we have', 'amenities'],
  fields: [
    {
      name: 'items',
      label: 'Facilities',
      type: 'list',
      itemLabel: 'facility',
      titleField: 'title',
      max: 12,
      fields: [
        { name: 'title', label: 'Name', type: 'text', maxLength: 50 },
        { name: 'text', label: 'A line or two', type: 'textarea', maxLength: 260 },
        { name: 'image', label: 'Photo', type: 'image', aliases: ['picture'] },
        { name: 'imageAlt', label: 'What the photo shows', type: 'text', maxLength: 140 },
        iconField,
        colourField,
      ],
    },
  ],
  defaults: {
    items: [
      {
        title: 'Bright classrooms',
        text: 'Child-sized furniture, open floor space and learning material kept within a child’s reach.',
        image: '/images/sensorial-play.webp',
        imageAlt: 'Two children working together on a mat in a bright classroom',
        icon: 'home',
        color: 'sun',
      },
      {
        title: 'Play area',
        text: 'Room to climb, slide and run about, always with a teacher watching.',
        image: '/images/slide.webp',
        imageAlt: 'A boy coming down a blue playground slide',
        icon: 'play',
        color: 'sky',
      },
      {
        title: 'Art and activity corner',
        text: 'Crayons, clay, paint and paper for busy hands.',
        image: '/images/choosing-colours.webp',
        imageAlt: 'A girl choosing a colour pencil for her drawing',
        icon: 'palette',
        color: 'coral',
      },
      {
        title: 'Story corner',
        text: 'Picture books and a quiet place to sit and listen to a story.',
        image: '/images/picture-book.webp',
        imageAlt: 'A little girl in glasses looking at a picture book',
        icon: 'book',
        color: 'mint',
      },
      {
        title: 'Teaching aids',
        text: 'Blocks, puzzles and counting material that let children learn by doing.',
        image: '/images/table-activity.webp',
        imageAlt: 'A child working with wooden learning material at a table',
        icon: 'puzzle',
        color: 'brand',
      },
      {
        title: 'Safety and care',
        text: 'Children are never left alone, and they go home only with a guardian the school knows.',
        image: '/images/peekaboo.webp',
        imageAlt: 'Two small children peeping round a wall and laughing',
        icon: 'shield',
        color: 'coral',
      },
    ],
  },
});

/* ───────────── gallery ───────────── */

export const galleryTop = defineSection({
  key: 'gallery.top',
  page: 'Gallery',
  label: 'Page heading',
  description: 'The photos themselves are added in Gallery in the dashboard.',
  path: '/gallery',
  aliases: ['gallery heading', 'gallery title', 'photos page'],
  fields: [
    ...pageTopFields,
    { name: 'allLabel', label: 'Name of the "all photos" button', type: 'text', maxLength: 20 },
    { name: 'emptyText', label: 'Message when there are no photos', type: 'text', maxLength: 160 },
  ],
  defaults: {
    eyebrow: 'Gallery',
    heading: 'Moments from school',
    text: 'Tap a photo to see it larger.',
    allLabel: 'All photos',
    emptyText: 'Photos are on their way. Please look in again soon.',
  },
});

/* ───────────── centres ───────────── */

export const centresTop = defineSection({
  key: 'centres.top',
  page: 'Centres',
  label: 'Page heading',
  description: 'The centres themselves are managed in Centres in the dashboard.',
  path: '/centres',
  aliases: ['centres heading', 'branches heading', 'locations'],
  fields: [
    ...pageTopFields,
    { name: 'franchiseHeading', label: 'Heading of the franchise note', type: 'text', maxLength: 80 },
    { name: 'franchiseText', label: 'Franchise note', type: 'textarea', maxLength: 240 },
    { name: 'franchiseButton', label: 'Franchise button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    eyebrow: 'Our centres',
    heading: 'Find a Mantra Kidz near you',
    text: 'Pick a centre to see its address, phone number and the classes it runs.',
    franchiseHeading: 'No centre in your area yet?',
    franchiseText: 'You could be the one to open it. Read about the franchise and tell us where you are.',
    franchiseButton: 'About the franchise',
  },
});

/* ───────────── notices ───────────── */

export const noticesTop = defineSection({
  key: 'notices.top',
  page: 'Notices',
  label: 'Page heading',
  description: 'Notices are written in Announcements in the dashboard.',
  path: '/notices',
  aliases: ['notices heading', 'notice board heading', 'news heading'],
  fields: [...pageTopFields, { name: 'emptyText', label: 'Message when there are no notices', type: 'text', maxLength: 160 }],
  defaults: {
    eyebrow: 'Notice board',
    heading: 'Notices and events',
    text: 'Holidays, events and news from the school.',
    emptyText: 'There are no notices at the moment.',
  },
});

/* ───────────── contact ───────────── */

export const contactTop = defineSection({
  key: 'contact.top',
  page: 'Contact',
  label: 'Page heading',
  description: 'The phone number and address are in Whole site, Contact details.',
  path: '/contact',
  aliases: ['contact heading', 'contact title'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Contact',
    heading: 'Talk to us',
    text: 'Call, send a WhatsApp message or write to us here. We are happy to answer any question about your child’s first school.',
  },
});

export const contactForm = defineSection({
  key: 'contact.form',
  page: 'Contact',
  label: 'Message form',
  path: '/contact',
  aliases: ['contact form', 'message form'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 60, aliases: ['title'] },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 160 },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
    { name: 'successHeading', label: 'Heading after sending', type: 'text', maxLength: 80 },
    { name: 'successText', label: 'Message after sending', type: 'textarea', maxLength: 240 },
    { name: 'mapHeading', label: 'Heading above the address card', type: 'text', maxLength: 60 },
    { name: 'mapButton', label: 'Map button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    heading: 'Send us a message',
    text: 'We read every message and reply by phone.',
    buttonLabel: 'Send message',
    successHeading: 'Thank you. Your message has reached us.',
    successText: 'We will call you back on the number you gave. If it is urgent, message us on WhatsApp.',
    mapHeading: 'Where to find us',
    mapButton: 'Open in Google Maps',
  },
});
