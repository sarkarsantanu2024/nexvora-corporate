/** About page sections: the history, the motto, what the school works for, the managing committee. */
import { defineSection } from '../types';
import { iconField, pageTopFields } from './options';

export const aboutTop = defineSection({
  key: 'about.top',
  page: 'About',
  label: 'Page heading',
  path: '/about',
  aliases: ['about heading', 'about title', 'about banner'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'About us',
    heading: 'Our school',
    text: 'A Bengali-medium high school for boys in Dum Dum, teaching since 1965.',
  },
});

export const aboutHistory = defineSection({
  key: 'about.history',
  page: 'About',
  label: 'History and founder',
  description: 'How the school began, with the photo of the founder.',
  path: '/about',
  aliases: ['history', 'our story', 'founder', 'how it began'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    { name: 'text', label: 'First paragraph', type: 'textarea', maxLength: 900 },
    { name: 'text2', label: 'Second paragraph', type: 'textarea', maxLength: 900 },
    { name: 'founderPhoto', label: 'Photo of the founder', type: 'image', aliases: ['founder photo', 'picture'] },
    { name: 'founderName', label: 'Name of the founder', type: 'text', maxLength: 60 },
    { name: 'founderRole', label: 'Line under the name', type: 'text', maxLength: 90 },
  ],
  defaults: {
    eyebrow: 'Our story',
    heading: 'How the school began',
    highlight: 'began',
    text: 'Dum Dum Kishore Bharati High School was founded in 1965 by Sri Mihir Sengupta. He started the school with about nine students. To his students and to the neighbourhood he was simply "Headmastermoshai".',
    text2:
      'From that small beginning it became a high school for boys from Class V to Class XII: Madhyamik under the West Bengal Board of Secondary Education, and Higher Secondary under the West Bengal Council of Higher Secondary Education. Sri Mihir Sengupta also founded Kishore Bharati Primary School.',
    founderPhoto: '/images/school/founder.jpg',
    founderName: 'Sri Mihir Sengupta',
    founderRole: 'Founder, remembered as Headmastermoshai',
  },
});

export const aboutMotto = defineSection({
  key: 'about.motto',
  page: 'About',
  label: 'Our motto',
  description: 'The words on the school seal and what they mean.',
  path: '/about',
  aliases: ['motto', 'seal', 'school motto'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'motto', label: 'The motto', type: 'text', maxLength: 60 },
    { name: 'meaning', label: 'What it means, in one line', type: 'text', maxLength: 120 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 700 },
    { name: 'verse', label: 'The full verse', type: 'textarea', maxLength: 300 },
    { name: 'source', label: 'Where it comes from', type: 'text', maxLength: 90 },
  ],
  defaults: {
    eyebrow: 'Our motto',
    heading: 'The words on our seal',
    motto: 'তেজস্বি নাবধীতমস্তু',
    meaning: 'May our learning be bright and full of strength.',
    text: 'The motto on the school seal is a line from the Shanti mantra of the Taittiriya Upanishad, the prayer that teacher and student say together before they study. It asks that what they learn together shine. The flame at the centre of the seal says the same.',
    verse: 'ওঁ সহ নাববতু। সহ নৌ ভুনক্তু। সহ বীর্যং করবাবহৈ। তেজস্বি নাবধীতমস্তু মা বিদ্বিষাবহৈ। ওঁ শান্তিঃ শান্তিঃ শান্তিঃ॥',
    source: 'Taittiriya Upanishad, Shanti mantra',
  },
});

export const aboutValues = defineSection({
  key: 'about.values',
  page: 'About',
  label: 'What we work for',
  description: 'A few lines on what the school stands for. Written for the school to check and change.',
  path: '/about',
  aliases: ['values', 'vision', 'mission', 'what we stand for', 'aims'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 400 },
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
      ],
    },
  ],
  defaults: {
    eyebrow: 'What we value',
    heading: 'What the school works for',
    text: 'A government school is a school for every family in the neighbourhood. These are the things we try to give every boy.',
    items: [
      { title: 'Steady study', text: 'Regular classes and careful work through the year, in the boys’ own language.', icon: 'book' },
      { title: 'Discipline and courtesy', text: 'Respect for teachers, for one another and for the school.', icon: 'users' },
      { title: 'Games and culture', text: 'Football, the annual sports, drama and celebrations are part of school life.', icon: 'trophy' },
      { title: 'Thinking of others', text: 'Programmes like the blood donation camp teach boys to care for the people around them.', icon: 'hand' },
    ],
  },
});

export const aboutCommittee = defineSection({
  key: 'about.committee',
  page: 'About',
  label: 'Managing committee',
  description: 'The members of the managing committee. The block stays hidden until at least one name is added.',
  path: '/about',
  aliases: ['managing committee', 'committee', 'governing body', 'members'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    {
      name: 'members',
      label: 'Members',
      type: 'list',
      itemLabel: 'member',
      titleField: 'name',
      max: 20,
      aliases: ['committee members', 'names'],
      fields: [
        { name: 'name', label: 'Name', type: 'text', maxLength: 80 },
        { name: 'role', label: 'Post on the committee', type: 'text', maxLength: 80, help: 'For example: President, Secretary, Teacher representative.' },
      ],
    },
  ],
  defaults: {
    eyebrow: 'Managing committee',
    heading: 'The managing committee',
    // Filled in by the school: no names are invented.
    members: [] as { name: string; role: string }[],
  },
});
