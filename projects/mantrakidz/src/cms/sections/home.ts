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
    items: [
      { text: 'Play Group' },
      { text: 'Nursery' },
      { text: 'LKG' },
      { text: 'UKG' },
      { text: 'Rhymes' },
      { text: 'Stories' },
      { text: 'Clay' },
      { text: 'Colours' },
      { text: 'Blocks' },
      { text: 'Numbers' },
      { text: 'Letters' },
      { text: 'Friends' },
    ],
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
    eyebrow: 'Welcome to Mantra Kidz',
    heading: 'A small school where your child is noticed',
    highlight: 'noticed',
    text: 'Mantra Kidz is a play school on Dakshindari Road for children from one and a half to five and a half years. Each class has only 12 seats, so the teacher has time for every child. The day is built around play, because that is how children of this age learn best.',
    image: '/images/pouring-water.webp',
    imageAlt: 'A little girl carefully pouring water from a jug in a classroom',
    image2: '/images/pink-tower.webp',
    image2Alt: 'A smiling boy building a tall tower of pink blocks',
    points: [
      { text: 'Only 12 children in a class' },
      { text: 'Four classes, from Play Group to UKG' },
      { text: 'Learning through play, songs and stories' },
    ],
    buttonLabel: 'More about us',
  },
});

export const homeNumbers = defineSection({
  key: 'home.numbers',
  page: 'Home',
  label: 'Numbers strip',
  description:
    'Four real numbers. The numbers themselves come from the programmes and centres you have set up; only the words under them are edited here.',
  path: '/',
  aliases: ['numbers', 'stats', 'counters', 'figures'],
  fields: [
    { name: 'agesLabel', label: 'Words under the age range', type: 'text', maxLength: 40 },
    { name: 'seatsLabel', label: 'Words under seats per class', type: 'text', maxLength: 40 },
    { name: 'programmesLabel', label: 'Words under the number of classes', type: 'text', maxLength: 40 },
    { name: 'centresLabel', label: 'Words under the number of centres', type: 'text', maxLength: 40 },
  ],
  defaults: {
    agesLabel: 'years of age',
    seatsLabel: 'seats in each class',
    programmesLabel: 'classes, Play Group to UKG',
    centresLabel: 'centres open',
  },
});

export const homeProgrammes = defineSection({
  key: 'home.programmes',
  page: 'Home',
  label: 'Programmes block',
  description: 'The heading above the four class cards. The cards themselves come from Programmes in the dashboard.',
  path: '/',
  aliases: ['programmes heading', 'classes block', 'courses'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300 },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    eyebrow: 'Our programmes',
    heading: 'Four classes, one for each age',
    highlight: 'each age',
    text: 'Children join the class that fits their age and move up every year.',
    buttonLabel: 'Compare all classes',
  },
});

export const homeWhy = defineSection({
  key: 'home.why',
  page: 'Home',
  label: 'Why parents choose us',
  description: 'The strengths of the school. Also shown on the About page.',
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
    eyebrow: 'Why Mantra Kidz',
    heading: 'What parents can expect from us',
    highlight: 'expect',
    text: 'We keep our promises short, so that we can keep them.',
    items: [
      {
        title: 'Good habits and manners',
        text: 'We care about personality and discipline from the first day: greeting, sharing, waiting for a turn and tidying up.',
        icon: 'heart',
        color: 'coral',
      },
      {
        title: 'Trained teachers',
        text: 'Our teachers are trained to work with very young children, and they do it with patience.',
        icon: 'teacher',
        color: 'sky',
      },
      {
        title: 'Experienced, dedicated faculty',
        text: 'The people who teach here have worked with this age group before and take the job to heart.',
        icon: 'star',
        color: 'sun',
      },
      {
        title: 'Modern teaching aids',
        text: 'Children learn by touching and doing, with material made for small hands.',
        icon: 'puzzle',
        color: 'mint',
      },
      {
        title: 'Small classes',
        text: 'Every class has 12 seats. No child is lost in a crowd.',
        icon: 'users',
        color: 'brand',
      },
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
    heading: 'A look inside',
    highlight: 'inside',
    text: 'A few moments from the classroom and the play area.',
    buttonLabel: 'See all photos',
  },
});

export const homeTestimonials = defineSection({
  key: 'home.testimonials',
  page: 'Home',
  label: 'What people say',
  description: 'Short words from parents. Use only real ones, with the person’s permission.',
  path: '/',
  aliases: ['testimonials', 'reviews', 'parent feedback', 'what parents say'],
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
        { name: 'role', label: 'Who they are (optional)', type: 'text', maxLength: 60, help: 'For example: Parent of a Nursery child' },
        { name: 'photo', label: 'Photo (optional)', type: 'image' },
      ],
    },
  ],
  defaults: {
    eyebrow: 'Kind words',
    heading: 'What people say about us',
    highlight: 'say about us',
    items: [
      { quote: 'Good quality institute', name: 'Pritam Das', role: '', photo: '' },
      { quote: 'One of the best institute in Kolkata', name: 'Biswajit Saha', role: '', photo: '' },
    ],
  },
});

export const homeFranchise = defineSection({
  key: 'home.franchise',
  page: 'Home',
  label: 'Franchise invitation',
  description: 'The band that invites people to open a centre.',
  path: '/',
  aliases: ['franchise block', 'franchise teaser', 'franchise banner'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 400 },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
  ],
  defaults: {
    eyebrow: 'Franchise',
    heading: 'Start a Mantra Kidz in your area',
    text: 'We are looking for people who want to run a play school in their own neighbourhood. If that sounds like you, tell us a little about yourself and we will call you.',
    buttonLabel: 'Know about the franchise',
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
