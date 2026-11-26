/**
 * Sections of the smaller pages (gallery, notices, contact) and the pieces
 * repeated across the site.
 */
import { defineSection } from '../types';
import { pageTopFields } from './options';

/* ───────────── whole site ───────────── */

export const siteHeader = defineSection({
  key: 'site.header',
  page: 'Whole site',
  label: 'Header buttons',
  description: 'The buttons at the top of every page.',
  path: '/',
  aliases: ['header', 'top bar', 'menu buttons', 'navigation'],
  fields: [
    { name: 'admissionLabel', label: 'Admission button text', type: 'text', maxLength: 24, aliases: ['admission button', 'call to action'] },
    { name: 'callLabel', label: 'Call button text', type: 'text', maxLength: 16, aliases: ['phone button'] },
    { name: 'loginLabel', label: 'Login link text', type: 'text', maxLength: 16 },
  ],
  defaults: {
    admissionLabel: 'Admission',
    callLabel: 'Call',
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
    about: 'A Bengali-medium government high school for boys, Class V to XII, Madhyamik and Higher Secondary. Founded in 1965.',
    note: 'All rights reserved.',
  },
});

export const siteCta = defineSection({
  key: 'site.cta',
  page: 'Whole site',
  label: 'Get in touch band',
  description: 'The band near the bottom of most pages that invites parents to get in touch.',
  path: '/',
  aliases: ['get in touch band', 'call to action band', 'contact band', 'bottom banner'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300 },
    { name: 'primaryLabel', label: 'Main button text', type: 'text', maxLength: 30 },
    { name: 'whatsappLabel', label: 'WhatsApp button text', type: 'text', maxLength: 30 },
    { name: 'whatsappMessage', label: 'Message that opens in WhatsApp', type: 'text', maxLength: 160, help: 'The visitor can change it before sending.' },
  ],
  defaults: {
    heading: 'Questions about admission or anything else?',
    text: 'Call the school office, send a WhatsApp message, or write to us from the website.',
    primaryLabel: 'Admission information',
    whatsappLabel: 'Message on WhatsApp',
    whatsappMessage: 'Namaskar, I would like to know about the school.',
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
    heading: 'Photos from school',
    text: 'Sports, celebrations and programmes. Tap a photo to see it larger.',
    allLabel: 'All photos',
    emptyText: 'Photos are on their way. Please look in again soon.',
  },
});

/* ───────────── notices ───────────── */

export const noticesTop = defineSection({
  key: 'notices.top',
  page: 'Notices',
  label: 'Page heading',
  description: 'Notices are written in Notices and events in the dashboard. Only notices for the public are shown.',
  path: '/notices',
  aliases: ['notices heading', 'notice board heading', 'news heading'],
  fields: [...pageTopFields, { name: 'emptyText', label: 'Message when there are no notices', type: 'text', maxLength: 160 }],
  defaults: {
    eyebrow: 'Notice board',
    heading: 'Notices',
    text: 'Notices from the school: admission, examinations, holidays and programmes.',
    emptyText: 'There are no notices at the moment.',
  },
});

/* ───────────── contact ───────────── */

export const contactTop = defineSection({
  key: 'contact.top',
  page: 'Contact',
  label: 'Page heading',
  description: 'The phone numbers and address are in Whole site, Contact details.',
  path: '/contact',
  aliases: ['contact heading', 'contact title'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Contact',
    heading: 'Contact the school',
    text: 'Call or write to the school office, or come and see us.',
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
    { name: 'mapHeading', label: 'Heading above the map', type: 'text', maxLength: 60 },
    { name: 'mapButton', label: 'Map button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    heading: 'Send a message',
    text: 'Write to the school office. Leave a mobile number so that we can reply.',
    buttonLabel: 'Send message',
    successHeading: 'Thank you. Your message has reached the school.',
    successText: 'The school office will contact you on the number you gave.',
    mapHeading: 'How to reach us',
    mapButton: 'Open in Google Maps',
  },
});
