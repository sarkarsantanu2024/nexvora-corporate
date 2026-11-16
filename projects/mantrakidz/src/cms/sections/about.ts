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
    heading: 'A play school that keeps things simple',
    text: 'Small classes, kind teachers and a day full of play. That is the whole idea.',
  },
});

export const aboutStory = defineSection({
  key: 'about.story',
  page: 'About',
  label: 'Who we are',
  path: '/about',
  aliases: ['who we are', 'our story', 'about the school'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    { name: 'text', label: 'First paragraph', type: 'textarea', maxLength: 600 },
    { name: 'text2', label: 'Second paragraph', type: 'textarea', maxLength: 600 },
    { name: 'image', label: 'Photo', type: 'image', aliases: ['picture'] },
    { name: 'imageAlt', label: 'What the photo shows', type: 'text', maxLength: 140 },
  ],
  defaults: {
    heading: 'Who we are',
    highlight: 'we are',
    text: 'Mantra Kidz is a play school in Kolkata for children from 1.5 to 5.5 years. It is a unit of Mind Mantra Abacus. We run four classes: Play Group, Nursery, LKG and UKG, with 12 seats in each.',
    text2: 'A child of two or three does not learn by sitting still. They learn by pouring, stacking, singing, asking and trying again. So we keep the classes small, let the children play with a purpose, and stay close enough to help.',
    image: '/images/circle-time.webp',
    imageAlt: 'Small children sitting together on the classroom floor',
  },
});

export const aboutApproach = defineSection({
  key: 'about.approach',
  page: 'About',
  label: 'Our approach',
  description: 'How children learn at the school.',
  path: '/about',
  aliases: ['approach', 'how we teach', 'teaching method', 'philosophy'],
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
    eyebrow: 'Our approach',
    heading: 'How children learn here',
    highlight: 'learn here',
    items: [
      {
        title: 'Play comes first',
        text: 'Blocks, clay, colours and pretend games. Children learn to count, sort, speak and share while they play.',
        icon: 'blocks',
        color: 'sun',
      },
      {
        title: 'Small groups',
        text: 'With 12 seats in a class, the teacher can sit with each child and notice who needs a little help.',
        icon: 'users',
        color: 'coral',
      },
      {
        title: 'Habits before homework',
        text: 'Saying good morning, washing hands, packing the bag, waiting for a turn. At this age these matter more than pages of writing.',
        icon: 'hand',
        color: 'mint',
      },
      {
        title: 'Parents kept informed',
        text: 'We tell you how your child is doing, and we want to hear what you see at home.',
        icon: 'chat',
        color: 'sky',
      },
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
    mission: 'To give every child in our care a happy, safe start to school, and to send them on to Class 1 ready and sure of themselves.',
    visionHeading: 'Our vision',
    vision: 'To be the play school that parents in each neighbourhood trust enough to recommend to a friend.',
  },
});

export const aboutDirector = defineSection({
  key: 'about.director',
  page: 'About',
  label: 'Message from the director',
  description: 'Switched off until you write the message. Fill it in, add a photo, then switch the section on.',
  path: '/about',
  aliases: ['director message', 'director', 'principal message', 'founder message', 'message from the director'],
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
    heading: 'A message from the director',
    message:
      'Write a short message from the director here: why the school was started, what you want every child to take away from it, and an invitation to visit. Three or four sentences are enough.',
    name: 'Name of the director',
    role: 'Director, Mantra Kidz',
    photo: '',
  },
});
