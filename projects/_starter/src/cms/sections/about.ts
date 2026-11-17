/** About page sections. */
import { defineSection } from '../types';
import { colourField, iconField, pageTopFields } from './options';

export const aboutTop = defineSection({
  key: 'about.top',
  page: 'About',
  label: 'Page heading',
  path: '/about',
  aliases: ['about heading', 'about title', 'about banner'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'About us',
    heading: 'Who we are and what we do',
    text: 'One line that sums up the business.',
  },
});

export const aboutStory = defineSection({
  key: 'about.story',
  page: 'About',
  label: 'Who we are',
  path: '/about',
  aliases: ['who we are', 'our story', 'about the business'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    { name: 'text', label: 'First paragraph', type: 'textarea', maxLength: 600 },
    { name: 'text2', label: 'Second paragraph', type: 'textarea', maxLength: 600 },
    { name: 'image', label: 'Photo', type: 'image', aliases: ['picture'] },
    { name: 'imageAlt', label: 'What the photo shows', type: 'text', maxLength: 140 },
  ],
  defaults: {
    heading: 'Our story',
    highlight: 'story',
    text: 'Write here how the business started and what it does today.',
    text2: 'A second paragraph, if you need one. Leave it empty to show only the first.',
    image: '/images/sample-3.webp',
    imageAlt: 'Sample photo',
  },
});

export const aboutApproach = defineSection({
  key: 'about.approach',
  page: 'About',
  label: 'How we work',
  description: 'A few points on how the business works.',
  path: '/about',
  aliases: ['approach', 'how we work', 'our way', 'values'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    {
      name: 'items',
      label: 'Points',
      type: 'list',
      itemLabel: 'point',
      titleField: 'title',
      max: 6,
      fields: [
        { name: 'title', label: 'Title', type: 'text', maxLength: 50 },
        { name: 'text', label: 'A few lines', type: 'textarea', maxLength: 260 },
        iconField,
        colourField,
      ],
    },
  ],
  defaults: {
    eyebrow: 'How we work',
    heading: 'What you can count on',
    highlight: 'count on',
    items: [
      { title: 'First point', text: 'A few lines about this point.', icon: 'hand', color: 'sun' },
      { title: 'Second point', text: 'A few lines about this point.', icon: 'chat', color: 'coral' },
      { title: 'Third point', text: 'A few lines about this point.', icon: 'clock', color: 'mint' },
    ],
  },
});

export const aboutMission = defineSection({
  key: 'about.mission',
  page: 'About',
  label: 'Mission and vision',
  path: '/about',
  aliases: ['mission', 'vision', 'mission and vision', 'our aim'],
  fields: [
    { name: 'missionHeading', label: 'Mission heading', type: 'text', maxLength: 40 },
    { name: 'mission', label: 'Mission', type: 'textarea', maxLength: 400 },
    { name: 'visionHeading', label: 'Vision heading', type: 'text', maxLength: 40 },
    { name: 'vision', label: 'Vision', type: 'textarea', maxLength: 400 },
  ],
  defaults: {
    missionHeading: 'Our mission',
    mission: 'Write the aim of the business in one or two lines.',
    visionHeading: 'Our vision',
    vision: 'Write where the business wants to be in a few years.',
  },
});

export const aboutOwner = defineSection({
  key: 'about.owner',
  page: 'About',
  label: 'Message from the owner',
  description: 'Switched off until you write the message. Fill it in, add a photo, then switch the section on.',
  path: '/about',
  aliases: ['owner message', 'owner', 'director message', 'founder message', 'message from the owner'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 60, aliases: ['title'] },
    { name: 'message', label: 'Message', type: 'textarea', maxLength: 1200, aliases: ['text', 'note', 'letter'] },
    { name: 'name', label: 'Name', type: 'text', maxLength: 60 },
    { name: 'role', label: 'Designation', type: 'text', maxLength: 60, aliases: ['title', 'post'] },
    { name: 'photo', label: 'Photo', type: 'image', aliases: ['picture'] },
  ],
  defaults: {
    // Hidden from visitors until the client writes the real message.
    _hidden: '1',
    heading: 'A message from the owner',
    message: 'Write a short message from the owner here: why the business was started and what customers can expect. Three or four sentences are enough.',
    name: 'Name of the owner',
    role: 'Owner',
    photo: '',
  },
});
