/** Admissions page sections. */
import { defineSection } from '../types';
import { pageTopFields } from './options';

export const admissionsTop = defineSection({
  key: 'admissions.top',
  page: 'Admissions',
  label: 'Page heading',
  path: '/admissions',
  aliases: ['admissions heading', 'admission title'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Admissions',
    heading: 'Admission in four easy steps',
    text: 'Tell us about your child, come and see the school, and take the seat. Here is how it works.',
  },
});

export const admissionsSteps = defineSection({
  key: 'admissions.steps',
  page: 'Admissions',
  label: 'How admission works',
  path: '/admissions',
  aliases: ['admission steps', 'admission process', 'how to apply', 'how admission works'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    { name: 'highlight', label: 'Words in the heading to underline', type: 'text', maxLength: 40 },
    {
      name: 'items',
      label: 'Steps',
      type: 'list',
      itemLabel: 'step',
      titleField: 'title',
      max: 6,
      fields: [
        { name: 'title', label: 'Step', type: 'text', maxLength: 50 },
        { name: 'text', label: 'What happens', type: 'textarea', maxLength: 240 },
      ],
    },
  ],
  defaults: {
    heading: 'How admission works',
    highlight: 'works',
    items: [
      { title: 'Send an enquiry', text: 'Fill in the form on this page, or call us. We call back and answer your questions.' },
      { title: 'Visit the school', text: 'Come with your child. See the classrooms and meet the teacher.' },
      { title: 'Fill in the admission form', text: 'We tell you which papers to bring and help you with the form.' },
      { title: 'Start school', text: 'We fix a starting day together and help your child settle in.' },
    ],
  },
});

export const admissionsForm = defineSection({
  key: 'admissions.form',
  page: 'Admissions',
  label: 'Enquiry form',
  path: '/admissions',
  aliases: ['admission form', 'enquiry form', 'admission enquiry'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 60, aliases: ['title'] },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 160 },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
    { name: 'successHeading', label: 'Heading after sending', type: 'text', maxLength: 80 },
    { name: 'successText', label: 'Message after sending', type: 'textarea', maxLength: 240 },
    { name: 'sideHeading', label: 'Heading beside the form', type: 'text', maxLength: 60 },
    { name: 'sideText', label: 'Text beside the form', type: 'textarea', maxLength: 240 },
  ],
  defaults: {
    heading: 'Admission enquiry',
    text: 'Leave your details and we will call you back.',
    buttonLabel: 'Send enquiry',
    successHeading: 'Thank you. We have your enquiry.',
    successText: 'We will call you on the number you gave. If you would like to talk now, message us on WhatsApp.',
    sideHeading: 'Would you rather talk?',
    sideText: 'Call us or send a WhatsApp message. We are glad to answer anything about your child’s first school.',
  },
});

export const admissionsFaq = defineSection({
  key: 'admissions.faq',
  page: 'Admissions',
  label: 'Questions parents ask',
  path: '/admissions',
  aliases: ['faq', 'faqs', 'questions', 'admission questions', 'frequently asked questions'],
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
    heading: 'Questions parents ask',
    highlight: 'parents ask',
    items: [
      {
        question: 'At what age can my child join?',
        answer: 'Play Group takes children from 1.5 years. The classes go up to UKG, which is for children up to 5.5 years.',
      },
      { question: 'How many children are there in a class?', answer: 'Each class has 12 seats.' },
      {
        question: 'Can we see the school before we decide?',
        answer: 'Yes, please do. Send an enquiry or call us and we will fix a time that suits you.',
      },
      {
        question: 'What are the fees?',
        answer: 'Please ask us. We will share the current fee for your child’s class when we speak.',
      },
      {
        question: 'Is there a seat free right now?',
        answer: 'Seats are limited to 12 in a class, so it depends on the class. Call us and we will tell you straight away.',
      },
      {
        question: 'My child has never stayed away from home. Will they manage?',
        answer: 'Most children need a little time, and that is normal. Tell the teacher about your child’s routine and what comforts them, and we will go at your child’s pace.',
      },
    ],
  },
});
