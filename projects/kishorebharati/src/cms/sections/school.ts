/**
 * The school's own pages: academics, admission, teachers, events and
 * facilities. The facts come from the school's published page and public
 * records; anything not yet confirmed by the school is listed in
 * docs/CONTENT_TO_CONFIRM.md.
 */
import { defineSection } from '../types';
import { iconField, pageTopFields } from './options';

const S = '/images/school';

/* ───────────── academics ───────────── */

export const academicsTop = defineSection({
  key: 'academics.top',
  page: 'Academics',
  label: 'Page heading',
  path: '/academics',
  aliases: ['academics heading', 'academics title', 'studies heading'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Academics',
    heading: 'Classes and subjects',
    text: 'Class V to Class XII in Bengali medium: Madhyamik under WBBSE and Higher Secondary under WBCHSE.',
  },
});

export const academicsClasses = defineSection({
  key: 'academics.classes',
  page: 'Academics',
  label: 'Classes',
  path: '/academics',
  aliases: ['classes', 'class groups', 'levels'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    {
      name: 'items',
      label: 'Class groups',
      type: 'list',
      itemLabel: 'class group',
      titleField: 'title',
      max: 6,
      fields: [
        { name: 'title', label: 'Classes', type: 'text', maxLength: 50 },
        { name: 'text', label: 'A few lines', type: 'textarea', maxLength: 300 },
      ],
    },
  ],
  defaults: {
    heading: 'Classes',
    items: [
      { title: 'Class V to VIII', text: 'The middle classes. New admission to Class V is by lottery, as per government rules.' },
      { title: 'Class IX and X', text: 'Preparation for the Madhyamik examination of the West Bengal Board of Secondary Education (WBBSE).' },
      { title: 'Class XI and XII', text: 'Higher Secondary under the West Bengal Council of Higher Secondary Education (WBCHSE), in the Science and Arts streams.' },
    ],
  },
});

export const academicsSubjects = defineSection({
  key: 'academics.subjects',
  page: 'Academics',
  label: 'Subjects up to Madhyamik',
  path: '/academics',
  aliases: ['subjects', 'madhyamik subjects', 'subject list'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 200 },
    {
      name: 'items',
      label: 'Subjects',
      type: 'list',
      itemLabel: 'subject',
      titleField: 'name',
      max: 16,
      fields: [
        { name: 'name', label: 'Subject', type: 'text', maxLength: 50 },
        { name: 'note', label: 'Note (optional)', type: 'text', maxLength: 60, help: 'For example: Class VII and VIII only.' },
      ],
    },
  ],
  defaults: {
    heading: 'Subjects up to Madhyamik',
    text: 'Taught in the classes up to the Madhyamik examination.',
    items: [
      { name: 'Bengali', note: '' },
      { name: 'English', note: '' },
      { name: 'Hindi', note: 'Class VII and VIII' },
      { name: 'Mathematics', note: '' },
      { name: 'Physical Science', note: '' },
      { name: 'Life Science', note: '' },
      { name: 'History', note: '' },
      { name: 'Geography', note: '' },
    ],
  },
});

export const academicsStreams = defineSection({
  key: 'academics.streams',
  page: 'Academics',
  label: 'Higher Secondary streams',
  path: '/academics',
  aliases: ['streams', 'higher secondary', 'hs subjects', 'science and arts'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 200 },
    { name: 'scienceHeading', label: 'Science heading', type: 'text', maxLength: 40 },
    {
      name: 'science',
      label: 'Science subjects',
      type: 'list',
      itemLabel: 'subject',
      titleField: 'name',
      max: 12,
      fields: [{ name: 'name', label: 'Subject', type: 'text', maxLength: 50 }],
    },
    { name: 'artsHeading', label: 'Arts heading', type: 'text', maxLength: 40 },
    {
      name: 'arts',
      label: 'Arts subjects',
      type: 'list',
      itemLabel: 'subject',
      titleField: 'name',
      max: 12,
      fields: [{ name: 'name', label: 'Subject', type: 'text', maxLength: 50 }],
    },
    { name: 'note', label: 'Note under the lists', type: 'text', maxLength: 200 },
  ],
  defaults: {
    heading: 'Higher Secondary: Class XI and XII',
    text: 'Two streams, under the West Bengal Council of Higher Secondary Education.',
    scienceHeading: 'Science',
    science: [{ name: 'Physics' }, { name: 'Chemistry' }, { name: 'Mathematics' }, { name: 'Biological Science' }, { name: 'Computer Science' }],
    artsHeading: 'Arts',
    arts: [{ name: 'Geography' }, { name: 'Computer Application' }],
    note: 'For the language papers and the full list of subjects and combinations, please ask at the school office.',
  },
});

export const academicsTimings = defineSection({
  key: 'academics.timings',
  page: 'Academics',
  label: 'School timings',
  path: '/academics',
  aliases: ['timings', 'school hours', 'school time', 'class timings'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    {
      name: 'rows',
      label: 'Timings',
      type: 'list',
      itemLabel: 'row',
      titleField: 'who',
      max: 10,
      fields: [
        { name: 'who', label: 'Classes or day', type: 'text', maxLength: 50 },
        { name: 'time', label: 'Time', type: 'text', maxLength: 50 },
      ],
    },
    { name: 'note', label: 'Note under the table', type: 'text', maxLength: 200 },
  ],
  defaults: {
    heading: 'School timings',
    rows: [
      { who: 'Class V', time: '10.50 am to 3.20 pm' },
      { who: 'Class VI', time: '10.50 am to 4.00 pm' },
      { who: 'Class VII to XII', time: '10.50 am to 4.30 pm' },
      { who: 'Saturday', time: '10.50 am to 1.30 pm' },
    ],
    note: 'On special days the timings may change. Watch the notice board.',
  },
});

export const academicsExams = defineSection({
  key: 'academics.exams',
  page: 'Academics',
  label: 'Examinations',
  path: '/academics',
  aliases: ['exams', 'examinations', 'evaluation', 'tests'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 800 },
  ],
  defaults: {
    heading: 'Examinations and evaluation',
    text: 'Students are assessed through the year with summative evaluations, as laid down by the West Bengal Board of Secondary Education and the West Bengal Council of Higher Secondary Education. Class X students sit for the Madhyamik examination and Class XII students for the Higher Secondary examination. Exam dates are put up on the notice board.',
  },
});

export const academicsActivities = defineSection({
  key: 'academics.activities',
  page: 'Academics',
  label: 'Beyond the classroom',
  description: 'Games, celebrations and programmes, each with a photo.',
  path: '/academics',
  aliases: ['activities', 'co-curricular', 'extra activities', 'beyond the classroom'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 200 },
    {
      name: 'items',
      label: 'Activities',
      type: 'list',
      itemLabel: 'activity',
      titleField: 'title',
      max: 12,
      fields: [
        { name: 'title', label: 'Name', type: 'text', maxLength: 60 },
        { name: 'image', label: 'Photo', type: 'image' },
      ],
    },
  ],
  defaults: {
    heading: 'Beyond the classroom',
    text: 'Games, celebrations and programmes from the school year.',
    items: [
      { title: 'Football', image: `${S}/high-sports.jpg` },
      { title: 'Annual sports', image: `${S}/high-annual-sports.jpg` },
      { title: 'Drama', image: `${S}/high-drama.jpg` },
      { title: 'Trekking in the Himalayas', image: `${S}/high-trekking.jpg` },
      { title: 'Seminars', image: `${S}/high-seminar.jpg` },
      { title: 'Blood donation camp', image: `${S}/high-blood-donation.jpg` },
      { title: 'Netaji’s birth anniversary', image: `${S}/high-netaji-125.jpg` },
      { title: 'Independence Day', image: `${S}/high-independence-day.jpg` },
      { title: 'Prize distribution', image: `${S}/high-prize-distribution.jpg` },
    ],
  },
});

/* ───────────── admission ───────────── */

export const admissionTop = defineSection({
  key: 'admission.top',
  page: 'Admission',
  label: 'Page heading',
  path: '/admission',
  aliases: ['admission heading', 'admission title'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Admission',
    heading: 'Admission to the school',
    text: 'How admission works, the papers to bring, and a form to ask the school office.',
  },
});

export const admissionSteps = defineSection({
  key: 'admission.steps',
  page: 'Admission',
  label: 'How admission works',
  description: 'Check these lines with the school every year before the admission season.',
  path: '/admission',
  aliases: ['admission process', 'how to apply', 'lottery', 'admission rules'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    {
      name: 'items',
      label: 'Steps',
      type: 'list',
      itemLabel: 'step',
      titleField: 'title',
      max: 6,
      fields: [
        { name: 'title', label: 'Title', type: 'text', maxLength: 50 },
        { name: 'text', label: 'A few lines', type: 'textarea', maxLength: 400 },
      ],
    },
    { name: 'note', label: 'Note under the steps', type: 'text', maxLength: 200 },
  ],
  defaults: {
    heading: 'How admission works',
    items: [
      { title: 'Class V', text: 'New admission to Class V is by lottery, as per the rules of the Government of West Bengal. The notice with the dates is put up on the school notice board and on this website.' },
      { title: 'Class XI', text: 'Admission to Class XI, in Science or Arts, is after the Madhyamik results. The dates, seats and rules are given in the school’s notice each year.' },
      { title: 'Other classes', text: 'Admission to other classes depends on seats being free. Please ask at the school office.' },
    ],
    note: 'The rules can change from year to year. The school’s own notice is final.',
  },
});

export const admissionDocuments = defineSection({
  key: 'admission.documents',
  page: 'Admission',
  label: 'Papers to bring',
  path: '/admission',
  aliases: ['documents', 'papers', 'documents needed', 'required documents'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    {
      name: 'items',
      label: 'Papers',
      type: 'list',
      itemLabel: 'paper',
      titleField: 'text',
      max: 12,
      fields: [{ name: 'text', label: 'Paper', type: 'text', maxLength: 120 }],
    },
    { name: 'note', label: 'Note under the list', type: 'text', maxLength: 200 },
  ],
  defaults: {
    heading: 'Papers usually needed',
    items: [
      { text: 'Birth certificate of the student' },
      { text: 'Transfer certificate from the last school' },
      { text: 'Mark sheet of the last class passed' },
      { text: 'Aadhaar card of the student' },
      { text: 'Recent passport-size photographs' },
      { text: 'Caste certificate, where it applies' },
    ],
    note: 'The exact list is given in the admission notice. Bring the original and a photocopy of each.',
  },
});

export const admissionForm = defineSection({
  key: 'admission.form',
  page: 'Admission',
  label: 'Admission enquiry form',
  description: 'What a parent sends from here reaches Enquiries in the dashboard, marked Admission.',
  path: '/admission',
  aliases: ['admission form', 'admission enquiry', 'enquiry form'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 60, aliases: ['title'] },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 200 },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
    { name: 'successHeading', label: 'Heading after sending', type: 'text', maxLength: 80 },
    { name: 'successText', label: 'Message after sending', type: 'textarea', maxLength: 240 },
  ],
  defaults: {
    heading: 'Ask about admission',
    text: 'Leave your mobile number and the class you are asking about. The school office will get back to you.',
    buttonLabel: 'Send',
    successHeading: 'Thank you. Your question has reached the school.',
    successText: 'The school office will contact you on the number you gave.',
  },
});

/* ───────────── teachers ───────────── */

export const teachersTop = defineSection({
  key: 'teachers.top',
  page: 'Teachers',
  label: 'Page heading',
  description: 'The names come from Staff in the dashboard: only those marked "show on website" are listed.',
  path: '/teachers',
  aliases: ['teachers heading', 'staff heading', 'teachers page'],
  fields: [
    ...pageTopFields,
    { name: 'headLabel', label: 'Heading for the Headmaster', type: 'text', maxLength: 40 },
    { name: 'teachingLabel', label: 'Heading for the teachers', type: 'text', maxLength: 40 },
    { name: 'nonTeachingLabel', label: 'Heading for the other staff', type: 'text', maxLength: 50 },
    { name: 'emptyText', label: 'Message when no one is listed yet', type: 'text', maxLength: 160 },
  ],
  defaults: {
    eyebrow: 'Our people',
    heading: 'Teachers and staff',
    text: 'The teachers and staff of the school.',
    headLabel: 'Headmaster',
    teachingLabel: 'Teachers',
    nonTeachingLabel: 'Office and support staff',
    emptyText: 'The list of teachers will be put up soon.',
  },
});

/* ───────────── events ───────────── */

export const eventsTop = defineSection({
  key: 'events.top',
  page: 'Events',
  label: 'Page heading',
  description: 'Events and holidays come from the school calendar in the dashboard.',
  path: '/events',
  aliases: ['events heading', 'calendar heading', 'events page'],
  fields: [
    ...pageTopFields,
    { name: 'upcomingHeading', label: 'Heading for coming events', type: 'text', maxLength: 40 },
    { name: 'holidaysHeading', label: 'Heading for holidays', type: 'text', maxLength: 40 },
    { name: 'pastHeading', label: 'Heading for past events', type: 'text', maxLength: 40 },
    { name: 'emptyText', label: 'Message when nothing is listed', type: 'text', maxLength: 160 },
  ],
  defaults: {
    eyebrow: 'School calendar',
    heading: 'Events and calendar',
    text: 'What is coming up at school, the holidays, and what happened earlier this year.',
    upcomingHeading: 'Coming up',
    holidaysHeading: 'Holidays',
    pastHeading: 'Earlier this year',
    emptyText: 'Nothing is listed yet. Please look in again soon.',
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
    heading: 'Facilities at school',
    text: 'What the school has for its students.',
  },
});

export const facilitiesList = defineSection({
  key: 'facilities.list',
  page: 'Facilities',
  label: 'Facilities',
  description: 'One card for each facility. Keep each one short and true.',
  path: '/facilities',
  aliases: ['facilities', 'amenities', 'library', 'computer lab'],
  fields: [
    {
      name: 'items',
      label: 'Facilities',
      type: 'list',
      itemLabel: 'facility',
      titleField: 'title',
      max: 12,
      fields: [
        { name: 'title', label: 'Title', type: 'text', maxLength: 50 },
        { name: 'text', label: 'A few lines', type: 'textarea', maxLength: 300 },
        iconField,
        { name: 'image', label: 'Photo (optional)', type: 'image' },
      ],
    },
  ],
  defaults: {
    items: [
      { title: 'Library', text: 'A school library with books for reading and reference.', icon: 'library', image: '' },
      { title: 'Computer lab', text: 'Computers for learning, used also for Computer Science and Computer Application in Higher Secondary.', icon: 'computer', image: '' },
      { title: 'Smart class', text: 'A projector and screen for lessons and seminars.', icon: 'school', image: `${S}/high-seminar.jpg` },
      { title: 'Mid-day meal', text: 'Mid-day meal for eligible students under the government scheme.', icon: 'meal', image: '' },
      { title: 'Drinking water', text: 'Safe drinking water in the school.', icon: 'water', image: '' },
      { title: 'Games and sports', text: 'Football matches and the annual sports are part of the school year.', icon: 'trophy', image: `${S}/high-sports.jpg` },
    ],
  },
});
