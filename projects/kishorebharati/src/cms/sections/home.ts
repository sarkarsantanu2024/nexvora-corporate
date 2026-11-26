/**
 * Home page sections, in the order they appear after the top banner.
 *
 * Everything here is either a fact the school has published (founded 1965,
 * Class V to XII, Madhyamik and Higher Secondary, Science and Arts, Bengali
 * medium, boys' school) or plainly marked for the school to check. No counts,
 * results or awards: the school adds those itself if it wants them.
 */
import { defineSection } from '../types';
import { iconField } from './options';

const S = '/images/school';

export const homeIntro = defineSection({
  key: 'home.intro',
  page: 'Home',
  label: 'Welcome',
  description: 'A short introduction to the school with two photos and a few points.',
  path: '/',
  aliases: ['welcome', 'introduction', 'intro', 'about block'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40, help: 'Must match words in the heading exactly.' },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 600, aliases: ['description'] },
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
    eyebrow: 'Welcome',
    heading: 'A school in Dum Dum since 1965',
    highlight: 'since 1965',
    text: 'Dum Dum Kishore Bharati High School is a Bengali-medium government high school for boys on Motijheel Avenue, South Dum Dum. Sri Mihir Sengupta founded it in 1965. Today it teaches boys from Class V to Class XII, up to Madhyamik and Higher Secondary.',
    image: `${S}/high-independence-day.jpg`,
    imageAlt: 'The national flag raised at the school gate on Independence Day, under the school signboard',
    image2: `${S}/high-campus.jpg`,
    image2Alt: 'The school building on Motijheel Avenue',
    points: [
      { text: 'Class V to XII, Bengali medium' },
      { text: 'Madhyamik (WBBSE) and Higher Secondary (WBCHSE)' },
      { text: 'Science and Arts streams in Class XI and XII' },
    ],
    buttonLabel: 'About the school',
  },
});

export const homeFacts = defineSection({
  key: 'home.facts',
  page: 'Home',
  label: 'At a glance',
  description: 'Short facts about the school. Write only what is true; a number in the big line (like 1965) counts up on the screen.',
  path: '/',
  aliases: ['at a glance', 'facts', 'quick facts', 'highlights'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    {
      name: 'items',
      label: 'Facts',
      type: 'list',
      itemLabel: 'fact',
      titleField: 'value',
      max: 8,
      aliases: ['points'],
      fields: [
        { name: 'value', label: 'Big line', type: 'text', maxLength: 30, help: 'For example: 1965, or Science and Arts.' },
        { name: 'label', label: 'Small line under it', type: 'text', maxLength: 70 },
        iconField,
      ],
    },
  ],
  defaults: {
    eyebrow: 'At a glance',
    heading: 'The school in short',
    items: [
      { value: '1965', label: 'Year the school was founded', icon: 'calendar' },
      { value: 'Class V to XII', label: 'Classes taught', icon: 'school' },
      { value: 'Madhyamik and HS', label: 'Board exams of WBBSE and WBCHSE', icon: 'pen' },
      { value: 'Science and Arts', label: 'Higher Secondary streams', icon: 'flask' },
      { value: 'Bengali', label: 'Medium of teaching', icon: 'book' },
      { value: 'Boys', label: 'A school for boys', icon: 'users' },
      { value: 'Government', label: 'Under the Department of School Education, West Bengal', icon: 'flag' },
    ],
  },
});

export const homeMessage = defineSection({
  key: 'home.message',
  page: 'Home',
  label: "Headmaster's message",
  description: "The wording here was written for the school as a starting point. Replace it with the Headmaster's own words.",
  path: '/',
  aliases: ['headmaster message', 'message', 'principal message', 'headmaster', 'message from the headmaster'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 60, aliases: ['title'] },
    { name: 'message', label: 'Message', type: 'textarea', maxLength: 1400, aliases: ['text', 'note', 'letter'] },
    { name: 'name', label: 'Name', type: 'text', maxLength: 60 },
    { name: 'role', label: 'Designation', type: 'text', maxLength: 60, aliases: ['post'] },
    { name: 'photo', label: 'Photo', type: 'image', aliases: ['picture'], help: 'Leave empty to show the school seal instead.' },
  ],
  defaults: {
    eyebrow: 'From the Headmaster',
    heading: "Headmaster's message",
    message:
      'Welcome to the website of our school. Since 1965 this school has taught the boys of Dum Dum, and that work goes on every day in the classroom, on the playground and in the programmes through the year.\n\nHere you will find our notices, the school calendar and details of admission. Parents are always welcome to meet us at the school.',
    name: 'Pintu Sarkar',
    role: 'Headmaster',
    photo: `${S}/headmaster-large.jpg`,
  },
});

export const homeNotices = defineSection({
  key: 'home.notices',
  page: 'Home',
  label: 'Latest notices',
  description: 'Shows the newest public notices. Notices are written in Notices and events in the dashboard.',
  path: '/',
  aliases: ['notices block', 'news', 'latest notices', 'notice board'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
    { name: 'emptyText', label: 'Message when there are no notices', type: 'text', maxLength: 160 },
  ],
  defaults: {
    eyebrow: 'Notice board',
    heading: 'Latest notices',
    buttonLabel: 'All notices',
    emptyText: 'There are no notices at the moment.',
  },
});

export const homeEvents = defineSection({
  key: 'home.events',
  page: 'Home',
  label: 'Coming up',
  description: 'The next events from the school calendar. Events are added in the calendar in the dashboard.',
  path: '/',
  aliases: ['events block', 'upcoming events', 'coming up', 'calendar block'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
    { name: 'emptyText', label: 'Message when nothing is coming up', type: 'text', maxLength: 160 },
  ],
  defaults: {
    eyebrow: 'School calendar',
    heading: 'Coming up',
    buttonLabel: 'Full calendar',
    emptyText: 'No events are listed for the coming days.',
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
    heading: 'Life at school',
    highlight: 'school',
    text: 'Football, sports, celebrations and programmes, in the school’s own photos.',
    buttonLabel: 'See all photos',
  },
});

export const homeVisit = defineSection({
  key: 'home.visit',
  page: 'Home',
  label: 'Find the school',
  description: 'The address strip at the foot of the home page. The address and phone numbers are in Whole site, Contact details.',
  path: '/',
  aliases: ['find us', 'contact strip', 'address strip', 'visit us'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 300 },
    { name: 'mapButton', label: 'Map button text', type: 'text', maxLength: 30 },
    { name: 'image', label: 'Photo', type: 'image' },
    { name: 'imageAlt', label: 'What the photo shows', type: 'text', maxLength: 140 },
  ],
  defaults: {
    eyebrow: 'Visit us',
    heading: 'Find the school',
    text: 'The school is on Motijheel Avenue in South Dum Dum. Call the office, or come and see us.',
    mapButton: 'Directions on Google Maps',
    image: `${S}/high-gate.jpg`,
    imageAlt: 'The school signboard at the gate on Motijheel Avenue',
  },
});
