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
    { name: 'about', label: 'Short line about the business', type: 'textarea', maxLength: 240, aliases: ['footer text', 'blurb'] },
    { name: 'note', label: 'Small line at the very bottom', type: 'text', maxLength: 120, aliases: ['copyright line'] },
  ],
  defaults: {
    about: 'A short line about the business goes here. Change it from the edit panel.',
    note: 'All rights reserved.',
  },
});

export const siteCta = defineSection({
  key: 'site.cta',
  page: 'Whole site',
  label: 'Get in touch band',
  description: 'The coloured band near the bottom of most pages that invites visitors to get in touch.',
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
    heading: 'Have a question? Talk to us',
    text: 'Call, send a WhatsApp message or write to us. We reply to every enquiry.',
    primaryLabel: 'Contact us',
    whatsappLabel: 'Chat on WhatsApp',
    whatsappMessage: 'Hello, I would like to know more.',
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
    heading: 'Photos',
    text: 'Tap a photo to see it larger.',
    allLabel: 'All photos',
    emptyText: 'Photos are on their way. Please look in again soon.',
  },
});

/* ───────────── notices ───────────── */

export const noticesTop = defineSection({
  key: 'notices.top',
  page: 'Notices',
  label: 'Page heading',
  description: 'Notices are written in Notices and events in the dashboard.',
  path: '/notices',
  aliases: ['notices heading', 'notice board heading', 'news heading'],
  fields: [...pageTopFields, { name: 'emptyText', label: 'Message when there are no notices', type: 'text', maxLength: 160 }],
  defaults: {
    eyebrow: 'Notice board',
    heading: 'Notices and events',
    text: 'News, offers and events.',
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
    text: 'Call, send a WhatsApp message or write to us here.',
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
