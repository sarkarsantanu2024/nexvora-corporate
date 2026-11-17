/**
 * Franchise page sections.
 *
 * We do not know the investment, the space needed, the royalty or the support
 * head office gives. Nothing here states them: the page describes the
 * opportunity in general terms and says the details are shared on enquiry.
 */
import { defineSection } from '../types';
import { colourField, iconField } from './options';

export const franchiseTop = defineSection({
  key: 'franchise.top',
  page: 'Franchise',
  label: 'Top banner',
  path: '/franchise',
  aliases: ['franchise heading', 'franchise banner', 'franchise title'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title', 'headline'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 400, aliases: ['description'] },
    { name: 'image', label: 'Photo', type: 'image', aliases: ['picture'] },
    { name: 'imageAlt', label: 'What the photo shows', type: 'text', maxLength: 140 },
    { name: 'primaryLabel', label: 'Main button text', type: 'text', maxLength: 30 },
    { name: 'secondaryLabel', label: 'Second button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    eyebrow: 'Franchise',
    heading: 'Run a Mantra Kidz play school in your neighbourhood',
    text: 'Mantra Kidz is growing through franchise schools. If you care about young children and want a business of your own, we would like to hear from you.',
    image: '/images/listening.webp',
    imageAlt: 'A group of small children sitting on the floor and listening',
    primaryLabel: 'Send a franchise enquiry',
    secondaryLabel: 'See the steps',
  },
});

export const franchiseWhy = defineSection({
  key: 'franchise.why',
  page: 'Franchise',
  label: 'Why open a school',
  path: '/franchise',
  aliases: ['why franchise', 'franchise reasons', 'franchise benefits'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    {
      name: 'items',
      label: 'Reasons',
      type: 'list',
      itemLabel: 'reason',
      titleField: 'title',
      max: 6,
      fields: [
        { name: 'title', label: 'Title', type: 'text', maxLength: 60 },
        { name: 'text', label: 'A line or two', type: 'textarea', maxLength: 240 },
        iconField,
        colourField,
      ],
    },
  ],
  defaults: {
    eyebrow: 'The opportunity',
    heading: 'Why open a play school',
    highlight: 'play school',
    items: [
      {
        title: 'Every neighbourhood needs one',
        text: 'Parents of small children look for a play school close to home.',
        icon: 'home',
        color: 'sun',
      },
      {
        title: 'A name and a method to start with',
        text: 'You open under the Mantra Kidz name and run our four classes, from Play Group to UKG.',
        icon: 'star',
        color: 'coral',
      },
      {
        title: 'Small classes by design',
        text: 'Twelve seats in a class, the same at every school.',
        icon: 'users',
        color: 'mint',
      },
      {
        title: 'Work you can be proud of',
        text: 'You spend your days building something good for the children of your own area.',
        icon: 'heart',
        color: 'sky',
      },
    ],
  },
});

export const franchiseWho = defineSection({
  key: 'franchise.who',
  page: 'Franchise',
  label: 'Who we are looking for',
  path: '/franchise',
  aliases: ['who can apply', 'franchise partner', 'ideal partner'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300 },
    {
      name: 'items',
      label: 'Points',
      type: 'list',
      itemLabel: 'point',
      titleField: 'text',
      max: 6,
      fields: [{ name: 'text', label: 'Point', type: 'text', maxLength: 140 }],
    },
  ],
  defaults: {
    heading: 'Who we are looking for',
    highlight: 'looking for',
    text: 'You do not have to be a teacher. You do have to care.',
    items: [
      { text: 'You enjoy being around small children and talking to parents' },
      { text: 'You can give the school your own time and attention' },
      { text: 'You have a suitable place in mind, or are ready to look for one' },
      { text: 'You want to build something that lasts in your area' },
    ],
  },
});

export const franchiseTopics = defineSection({
  key: 'franchise.topics',
  page: 'Franchise',
  label: 'What we will discuss',
  description: 'The questions every enquirer has. Add real figures here once you are ready to publish them.',
  path: '/franchise',
  aliases: ['franchise details', 'investment', 'franchise support', 'what we discuss'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 400 },
    {
      name: 'items',
      label: 'Topics',
      type: 'list',
      itemLabel: 'topic',
      titleField: 'title',
      max: 8,
      fields: [
        { name: 'title', label: 'Topic', type: 'text', maxLength: 50 },
        { name: 'text', label: 'A line or two', type: 'textarea', maxLength: 240 },
        iconField,
        colourField,
      ],
    },
  ],
  defaults: {
    eyebrow: 'The details',
    heading: 'What we will talk through with you',
    highlight: 'talk through',
    text: 'The figures depend on your location and the size of the school, so we share them when we speak, not on a web page. Ask us anything.',
    items: [
      { title: 'Investment', text: 'What it takes to start a school and to run it. Shared on enquiry.', icon: 'rupee', color: 'sun' },
      { title: 'Space', text: 'How much room a school needs and what kind of place works. Shared on enquiry.', icon: 'ruler', color: 'coral' },
      { title: 'Setting up', text: 'What has to be ready before the first child walks in.', icon: 'key', color: 'mint' },
      { title: 'Teaching', text: 'The four classes, and how your teachers get to know them.', icon: 'book', color: 'sky' },
      { title: 'Who does what', text: 'What head office looks after and what the school looks after.', icon: 'hand', color: 'brand' },
    ],
  },
});

export const franchiseSteps = defineSection({
  key: 'franchise.steps',
  page: 'Franchise',
  label: 'Steps to open a school',
  path: '/franchise',
  aliases: ['franchise steps', 'franchise process', 'how to get a franchise'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    {
      name: 'items',
      label: 'Steps',
      type: 'list',
      itemLabel: 'step',
      titleField: 'title',
      max: 8,
      fields: [
        { name: 'title', label: 'Step', type: 'text', maxLength: 50 },
        { name: 'text', label: 'What happens', type: 'textarea', maxLength: 240 },
      ],
    },
  ],
  defaults: {
    eyebrow: 'The steps',
    heading: 'From first call to first day',
    highlight: 'first day',
    items: [
      { title: 'Send an enquiry', text: 'Fill in the form on this page. It takes two minutes.' },
      { title: 'We call you', text: 'We ask about your plans and answer your first questions.' },
      { title: 'We meet', text: 'We sit together and go through the investment, the space and how a school runs.' },
      { title: 'We look at the place', text: 'We see the location you have in mind.' },
      { title: 'Agreement', text: 'If both sides are happy, we sign the franchise agreement.' },
      { title: 'Set up and open', text: 'The school is made ready and the first children come in.' },
    ],
  },
});

export const franchiseForm = defineSection({
  key: 'franchise.form',
  page: 'Franchise',
  label: 'Enquiry form',
  path: '/franchise',
  aliases: ['franchise form', 'franchise enquiry form'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 60, aliases: ['title'] },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 200 },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
    { name: 'successHeading', label: 'Heading after sending', type: 'text', maxLength: 80 },
    { name: 'successText', label: 'Message after sending', type: 'textarea', maxLength: 240 },
    { name: 'whatsappMessage', label: 'Message that opens in WhatsApp', type: 'text', maxLength: 160 },
  ],
  defaults: {
    heading: 'Franchise enquiry',
    text: 'Tell us a little about yourself. Someone from head office will call you.',
    buttonLabel: 'Send enquiry',
    successHeading: 'Thank you. We have your details.',
    successText: 'Someone from head office will call you soon. If you would like to talk now, message us on WhatsApp.',
    whatsappMessage: 'Hello Mantra Kidz, I am interested in a franchise.',
  },
});

export const franchiseFaq = defineSection({
  key: 'franchise.faq',
  page: 'Franchise',
  label: 'Franchise questions',
  path: '/franchise',
  aliases: ['franchise faq', 'franchise questions'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    {
      name: 'items',
      label: 'Questions',
      type: 'list',
      itemLabel: 'question',
      titleField: 'question',
      max: 20,
      fields: [
        { name: 'question', label: 'Question', type: 'text', maxLength: 140 },
        { name: 'answer', label: 'Answer', type: 'textarea', maxLength: 600 },
      ],
    },
  ],
  defaults: {
    heading: 'Questions people ask first',
    highlight: 'ask first',
    items: [
      {
        question: 'How much do I need to invest?',
        answer: 'It depends on the location and the size of the school. We share the full figures when we speak, so that you get numbers that fit your case.',
      },
      {
        question: 'How much space does a school need?',
        answer: 'We will tell you when we speak, and we look at the place you have in mind before anything is signed.',
      },
      {
        question: 'Do I need to have run a school before?',
        answer: 'Tell us about your background in the form. We will talk about what the work needs when we call.',
      },
      {
        question: 'Which areas are open?',
        answer: 'Tell us your city and area in the form and we will let you know.',
      },
    ],
  },
});
