/**
 * The sections every West Bengal school website is expected to carry beyond
 * the basics: results, achievements, alumni, downloads, student life, rules,
 * uniform, fees, government schemes, mid-day meal, safety and grievance, the
 * "school at a glance" disclosure, RTI, FAQ and vacancies.
 *
 * Where a fact is not known, the default is a tidy line that is true as it
 * stands ("ask the school office") or an empty list that keeps the block
 * hidden; every such item is in docs/CONTENT_TO_CONFIRM.md for the school.
 */
import { defineSection } from '../types';
import { iconField, pageTopFields } from './options';

const S = '/images/school';

/* ───────────── home: the moving strip ───────────── */

export const homeMarquee = defineSection({
  key: 'home.marquee',
  page: 'Home',
  label: 'Moving strip of activities',
  description: 'The band of words that slides across the home page.',
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
      { text: 'Madhyamik' },
      { text: 'Higher Secondary' },
      { text: 'Science' },
      { text: 'Arts' },
      { text: 'Football' },
      { text: 'Annual sports' },
      { text: 'Drama' },
      { text: 'Trekking' },
      { text: 'Seminars' },
      { text: 'Blood donation camp' },
    ],
  },
});

/* ───────────── about: the story in chapters ───────────── */

export const aboutChapters = defineSection({
  key: 'about.chapters',
  page: 'About',
  label: 'Our story in chapters',
  description: 'The school’s story as numbered chapters. Add a year only when it is certain.',
  path: '/about',
  aliases: ['chapters', 'timeline', 'story', 'history timeline'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90, aliases: ['title'] },
    {
      name: 'items',
      label: 'Chapters',
      type: 'list',
      itemLabel: 'chapter',
      titleField: 'title',
      max: 10,
      fields: [
        { name: 'year', label: 'Year or time', type: 'text', maxLength: 20, help: 'For example 1965, or Today.' },
        { name: 'title', label: 'Title', type: 'text', maxLength: 70 },
        { name: 'text', label: 'A few lines', type: 'textarea', maxLength: 500 },
        { name: 'image', label: 'Photo (optional)', type: 'image' },
      ],
    },
  ],
  defaults: {
    eyebrow: 'From 1965 to today',
    heading: 'The story so far',
    items: [
      { year: '1965', title: 'A school begins', text: 'Sri Mihir Sengupta starts the school in Dum Dum with about nine students.', image: '' },
      { year: 'Headmastermoshai', title: 'The founder', text: 'To his students and the neighbourhood he is simply "Headmastermoshai". He also founds Kishore Bharati Primary School.', image: `${S}/founder.jpg` },
      { year: 'Growing', title: 'A high school', text: 'The school grows into a high school with Madhyamik under WBBSE and Higher Secondary, in Science and Arts, under WBCHSE.', image: `${S}/high-gate.jpg` },
      { year: 'Today', title: 'Class V to XII', text: 'Boys study from Class V to Class XII in Bengali medium, with football, sports, drama, trekking and programmes through the year.', image: `${S}/high-sports.jpg` },
    ],
  },
});

/* ───────────── results and achievements ───────────── */

export const resultsTop = defineSection({
  key: 'results.top',
  page: 'Results',
  label: 'Page heading',
  path: '/results',
  aliases: ['results heading', 'results page'],
  fields: [...pageTopFields, { name: 'emptyText', label: 'Message when nothing is listed yet', type: 'text', maxLength: 200 }],
  defaults: {
    eyebrow: 'Results',
    heading: 'Results and achievements',
    text: 'Madhyamik and Higher Secondary results, and what our students have won.',
    emptyText: 'The school will put up the board examination results here.',
  },
});

export const resultsList = defineSection({
  key: 'results.list',
  page: 'Results',
  label: 'Board results',
  description: 'One row per year and examination, or per student who did well. Use only figures from the official results. Hidden until a row is added.',
  path: '/results',
  aliases: ['results', 'madhyamik results', 'hs results', 'toppers', 'achievers'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    {
      name: 'items',
      label: 'Results',
      type: 'list',
      itemLabel: 'result',
      titleField: 'title',
      max: 40,
      fields: [
        { name: 'year', label: 'Year', type: 'text', maxLength: 10 },
        {
          name: 'exam',
          label: 'Examination',
          type: 'select',
          options: [
            { value: 'madhyamik', label: 'Madhyamik' },
            { value: 'hs', label: 'Higher Secondary' },
          ],
        },
        { name: 'title', label: 'Student name or summary', type: 'text', maxLength: 80, help: 'For example a student’s name, or "All students passed".' },
        { name: 'detail', label: 'Marks or detail', type: 'text', maxLength: 80 },
        { name: 'photo', label: 'Photo (optional)', type: 'image' },
      ],
    },
  ],
  defaults: {
    heading: 'Madhyamik and Higher Secondary results',
    items: [] as Record<string, string>[],
  },
});

export const achievementsList = defineSection({
  key: 'achievements.list',
  page: 'Results',
  label: 'Achievements and awards',
  description: 'Prizes and awards won by students or the school. Hidden until a row is added.',
  path: '/results',
  aliases: ['achievements', 'awards', 'prizes'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    {
      name: 'items',
      label: 'Achievements',
      type: 'list',
      itemLabel: 'achievement',
      titleField: 'title',
      max: 40,
      fields: [
        { name: 'year', label: 'Year', type: 'text', maxLength: 10 },
        { name: 'title', label: 'What was won', type: 'text', maxLength: 100 },
        { name: 'text', label: 'A line about it', type: 'textarea', maxLength: 300 },
        { name: 'photo', label: 'Photo (optional)', type: 'image' },
      ],
    },
  ],
  defaults: {
    heading: 'Achievements and awards',
    items: [] as Record<string, string>[],
  },
});

/* ───────────── downloads ───────────── */

export const downloadsTop = defineSection({
  key: 'downloads.top',
  page: 'Downloads',
  label: 'Page heading',
  description: 'Notices that carry a file are listed on this page by themselves.',
  path: '/downloads',
  aliases: ['downloads heading', 'downloads page'],
  fields: [
    ...pageTopFields,
    { name: 'noticesHeading', label: 'Heading for files from notices', type: 'text', maxLength: 60 },
    { name: 'emptyText', label: 'Message when there are no files', type: 'text', maxLength: 160 },
  ],
  defaults: {
    eyebrow: 'Downloads',
    heading: 'Forms and documents',
    text: 'Forms, syllabus, class routine and the holiday list.',
    noticesHeading: 'Files attached to notices',
    emptyText: 'There are no files to download at the moment.',
  },
});

export const downloadsList = defineSection({
  key: 'downloads.list',
  page: 'Downloads',
  label: 'Files',
  description: 'Paste the link of each file (a PDF on Google Drive, for example). A file attached to a notice shows on the page by itself.',
  path: '/downloads',
  aliases: ['downloads', 'files', 'forms', 'syllabus', 'routine', 'holiday list'],
  fields: [
    {
      name: 'items',
      label: 'Files',
      type: 'list',
      itemLabel: 'file',
      titleField: 'title',
      max: 40,
      fields: [
        { name: 'title', label: 'Name of the file', type: 'text', maxLength: 100 },
        {
          name: 'kind',
          label: 'Kind',
          type: 'select',
          options: [
            { value: 'form', label: 'Form' },
            { value: 'syllabus', label: 'Syllabus' },
            { value: 'routine', label: 'Routine' },
            { value: 'holidays', label: 'Holiday list' },
            { value: 'other', label: 'Other' },
          ],
        },
        { name: 'file', label: 'Link to the file', type: 'url' },
        { name: 'note', label: 'Note (optional)', type: 'text', maxLength: 120 },
      ],
    },
  ],
  defaults: {
    items: [] as Record<string, string>[],
  },
});

/* ───────────── student life ───────────── */

export const lifeTop = defineSection({
  key: 'life.top',
  page: 'Student life',
  label: 'Page heading',
  path: '/student-life',
  aliases: ['student life heading', 'student life page'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Student life',
    heading: 'Life at Kishore Bharati',
    text: 'Clubs and activities, school rules, uniform, and how the school keeps every boy safe.',
  },
});

export const lifeClubs = defineSection({
  key: 'life.clubs',
  page: 'Student life',
  label: 'Clubs and activities',
  path: '/student-life',
  aliases: ['clubs', 'co-curricular', 'activities', 'societies'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 200 },
    {
      name: 'items',
      label: 'Clubs',
      type: 'list',
      itemLabel: 'club',
      titleField: 'title',
      max: 10,
      fields: [
        { name: 'title', label: 'Name', type: 'text', maxLength: 50 },
        { name: 'text', label: 'A few lines', type: 'textarea', maxLength: 300 },
        iconField,
        { name: 'image', label: 'Photo (optional)', type: 'image' },
      ],
    },
  ],
  defaults: {
    heading: 'Clubs and activities',
    text: 'What boys do beyond their lessons.',
    items: [
      { title: 'Sports', text: 'Football matches, a football tournament and the annual sports meet.', icon: 'trophy', image: `${S}/high-football-2019.jpg` },
      { title: 'Drama', text: 'Plays on stage, prepared by the students.', icon: 'drama', image: `${S}/high-drama.jpg` },
      { title: 'Trekking', text: 'Treks to the mountains, carrying the school banner up to the Himalayas.', icon: 'mountain', image: `${S}/high-trekking.jpg` },
      { title: 'Science', text: 'Seminars and talks with a projector and screen.', icon: 'flask', image: `${S}/high-seminar.jpg` },
      { title: 'Eco and service', text: 'Days of service such as the blood donation camp.', icon: 'hand', image: `${S}/high-blood-donation.jpg` },
    ],
  },
});

export const lifeRules = defineSection({
  key: 'life.rules',
  page: 'Student life',
  label: 'School rules',
  description: 'Written for the school to check and change.',
  path: '/student-life',
  aliases: ['rules', 'code of conduct', 'discipline'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    {
      name: 'items',
      label: 'Rules',
      type: 'list',
      itemLabel: 'rule',
      titleField: 'text',
      max: 20,
      fields: [{ name: 'text', label: 'Rule', type: 'text', maxLength: 200 }],
    },
  ],
  defaults: {
    heading: 'School rules and code of conduct',
    items: [
      { text: 'Come to school on time, in the school uniform.' },
      { text: 'Attend every class. A leave of absence needs a written note from a guardian.' },
      { text: 'Be courteous to teachers, staff and fellow students.' },
      { text: 'Look after the school’s books, furniture and rooms.' },
      { text: 'Bullying, ragging or harming anyone in any way is not allowed.' },
      { text: 'Follow the instructions of teachers during programmes and outings.' },
    ],
  },
});

export const lifeUniform = defineSection({
  key: 'life.uniform',
  page: 'Student life',
  label: 'Uniform',
  path: '/student-life',
  aliases: ['uniform', 'dress code', 'school dress'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 600 },
    { name: 'image', label: 'Photo (optional)', type: 'image' },
  ],
  defaults: {
    heading: 'Uniform',
    text: 'Every student comes to school in the school uniform. For the exact uniform for each class, please ask at the school office.',
    image: '',
  },
});

export const lifeSafety = defineSection({
  key: 'life.safety',
  page: 'Student life',
  label: 'Safety and grievance',
  description: 'How the school keeps students safe, and how to raise a complaint. The form beside it reaches Enquiries in the dashboard, marked Grievance.',
  path: '/student-life',
  aliases: ['safety', 'child protection', 'anti bullying', 'grievance', 'complaint'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 700 },
    {
      name: 'items',
      label: 'Points',
      type: 'list',
      itemLabel: 'point',
      titleField: 'text',
      max: 10,
      fields: [{ name: 'text', label: 'Point', type: 'text', maxLength: 200 }],
    },
    { name: 'formHeading', label: 'Heading of the complaint form', type: 'text', maxLength: 80 },
    { name: 'formText', label: 'Line under the form heading', type: 'text', maxLength: 240 },
    { name: 'successText', label: 'Message after sending', type: 'textarea', maxLength: 240 },
  ],
  defaults: {
    heading: 'Student safety and grievance',
    text: 'Every boy should feel safe at school. A student or a parent can tell the Headmaster or any teacher about a problem, or write to the school from this page.',
    items: [
      { text: 'Bullying and ragging are not allowed, inside or outside the classroom.' },
      { text: 'A complaint is heard by the Headmaster and kept private.' },
      { text: 'A child in danger can be helped at once through CHILDLINE, phone 1098.' },
    ],
    formHeading: 'Raise a complaint',
    formText: 'Write what happened. Only the school will read it.',
    successText: 'Your complaint has reached the school. The Headmaster’s office will contact you.',
  },
});

/* ───────────── alumni ───────────── */

export const alumniTop = defineSection({
  key: 'alumni.top',
  page: 'Alumni',
  label: 'Page heading',
  path: '/alumni',
  aliases: ['alumni heading', 'ex students page', 'old boys'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Alumni',
    heading: 'Our former students',
    text: 'Studied at Kishore Bharati? Put your name on the alumni register and stay in touch with your school.',
  },
});

export const alumniList = defineSection({
  key: 'alumni.list',
  page: 'Alumni',
  label: 'Alumni names',
  description: 'Former students who agreed to be listed. Hidden until a name is added.',
  path: '/alumni',
  aliases: ['alumni', 'ex students', 'old students', 'former students'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    {
      name: 'items',
      label: 'Alumni',
      type: 'list',
      itemLabel: 'former student',
      titleField: 'name',
      max: 60,
      fields: [
        { name: 'name', label: 'Name', type: 'text', maxLength: 80 },
        { name: 'batch', label: 'Batch (year of leaving)', type: 'text', maxLength: 20 },
        { name: 'note', label: 'What they do now (optional)', type: 'text', maxLength: 120 },
        { name: 'photo', label: 'Photo (optional)', type: 'image' },
      ],
    },
  ],
  defaults: {
    heading: 'From the alumni register',
    items: [] as Record<string, string>[],
  },
});

export const alumniForm = defineSection({
  key: 'alumni.form',
  page: 'Alumni',
  label: 'Alumni register form',
  description: 'What a former student sends reaches Enquiries in the dashboard, marked Alumni.',
  path: '/alumni',
  aliases: ['alumni form', 'alumni register'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 80 },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 240 },
    { name: 'buttonLabel', label: 'Button text', type: 'text', maxLength: 30 },
    { name: 'successHeading', label: 'Heading after sending', type: 'text', maxLength: 80 },
    { name: 'successText', label: 'Message after sending', type: 'textarea', maxLength: 240 },
  ],
  defaults: {
    heading: 'Join the alumni register',
    text: 'Tell us your name, the year you left school and what you do now.',
    buttonLabel: 'Add my name',
    successHeading: 'Thank you. Welcome back.',
    successText: 'Your details have reached the school.',
  },
});

/* ───────────── fees, schemes, mid-day meal ───────────── */

export const admissionFees = defineSection({
  key: 'admission.fees',
  page: 'Admission',
  label: 'Fee information',
  description: 'Fees in a government school are set by the state. Put the current amounts here once the school confirms them.',
  path: '/admission',
  aliases: ['fees', 'fee', 'school fees', 'session fee'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 800 },
    {
      name: 'items',
      label: 'Fees',
      type: 'list',
      itemLabel: 'fee',
      titleField: 'who',
      max: 12,
      fields: [
        { name: 'who', label: 'Class or item', type: 'text', maxLength: 60 },
        { name: 'amount', label: 'Amount', type: 'text', maxLength: 40 },
      ],
    },
  ],
  defaults: {
    heading: 'Fees',
    text: 'This is a government school, and its fees are those set by the Government of West Bengal. For the amount payable this year, please ask at the school office.',
    items: [] as Record<string, string>[],
  },
});

export const schemesTop = defineSection({
  key: 'schemes.top',
  page: 'Schemes',
  label: 'Page heading',
  path: '/schemes',
  aliases: ['schemes heading', 'scholarships page'],
  fields: [...pageTopFields, { name: 'linkLabel', label: 'Link text', type: 'text', maxLength: 30 }],
  defaults: {
    eyebrow: 'For students',
    heading: 'Government schemes and scholarships',
    text: 'Help that students of a government school may be able to get. Who can apply and when is decided by each scheme; the school office helps with the forms.',
    linkLabel: 'Official website',
  },
});

export const schemesList = defineSection({
  key: 'schemes.list',
  page: 'Schemes',
  label: 'Schemes',
  description: 'One line about each scheme with its official website. Check the rules each year on the official site.',
  path: '/schemes',
  aliases: ['schemes', 'scholarships', 'government schemes', 'sabooj sathi'],
  fields: [
    {
      name: 'items',
      label: 'Schemes',
      type: 'list',
      itemLabel: 'scheme',
      titleField: 'name',
      max: 16,
      fields: [
        { name: 'name', label: 'Name', type: 'text', maxLength: 70 },
        { name: 'who', label: 'For whom', type: 'text', maxLength: 90 },
        { name: 'text', label: 'One or two lines', type: 'textarea', maxLength: 300 },
        { name: 'link', label: 'Official website', type: 'url' },
      ],
    },
  ],
  defaults: {
    items: [
      { name: 'Sabooj Sathi', who: 'Class IX to XII', text: 'A bicycle from the Government of West Bengal for students of government and government-aided schools.', link: 'https://wbsaboojsathi.gov.in' },
      { name: 'Taruner Swapna', who: 'Class XI and XII', text: 'A grant from the Government of West Bengal to buy a tablet or smartphone for study.', link: '' },
      { name: 'Aikyashree', who: 'Students of minority communities', text: 'Scholarships of the West Bengal Minorities Development and Finance Corporation, for students of minority communities.', link: 'https://wbmdfcscholarship.org' },
      { name: 'OASIS scholarship', who: 'SC, ST and OBC students', text: 'Pre-matric and post-matric scholarships of the Government of West Bengal for SC, ST and OBC students.', link: 'https://oasis.gov.in' },
      { name: 'Swami Vivekananda Merit-cum-Means Scholarship', who: 'From Class XI, after Madhyamik', text: 'A scholarship of the Government of West Bengal for students who did well in the board examination and whose family income is low.', link: 'https://svmcm.wbhed.gov.in' },
      { name: 'Shikshashree', who: 'SC and ST students, Class V to VIII', text: 'A grant of the Government of West Bengal for SC and ST day scholars in Class V to VIII.', link: '' },
      { name: 'National Means-cum-Merit Scholarship (NMMS)', who: 'Selected in Class VIII', text: 'A scholarship of the Government of India for Class IX to XII, for students who pass the NMMS selection test in Class VIII.', link: 'https://scholarships.gov.in' },
    ],
  },
});

export const schemesMeal = defineSection({
  key: 'schemes.meal',
  page: 'Schemes',
  label: 'Mid-day meal',
  description: 'About the mid-day meal (PM POSHAN) and, if the school wants, this week’s menu. The menu stays hidden until a row is added.',
  path: '/schemes',
  aliases: ['mid day meal', 'midday meal', 'pm poshan', 'menu', 'lunch'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 600 },
    { name: 'menuHeading', label: 'Heading above the menu', type: 'text', maxLength: 60 },
    {
      name: 'menu',
      label: 'Menu',
      type: 'list',
      itemLabel: 'day',
      titleField: 'day',
      max: 7,
      fields: [
        { name: 'day', label: 'Day', type: 'text', maxLength: 20 },
        { name: 'food', label: 'What is served', type: 'text', maxLength: 120 },
      ],
    },
  ],
  defaults: {
    heading: 'Mid-day meal',
    text: 'Under PM POSHAN (the mid-day meal scheme of the Government of India and the state), students up to Class VIII in government and government-aided schools get a cooked meal at school on school days.',
    menuHeading: 'This week’s menu',
    menu: [] as Record<string, string>[],
  },
});

/* ───────────── FAQ ───────────── */

export const faqTop = defineSection({
  key: 'faq.top',
  page: 'FAQ',
  label: 'Page heading',
  path: '/faq',
  aliases: ['faq heading', 'questions page'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Questions',
    heading: 'Questions parents ask',
    text: 'Short answers to what parents most often want to know. For anything else, call the school office.',
  },
});

export const faqList = defineSection({
  key: 'faq.list',
  page: 'FAQ',
  label: 'Questions and answers',
  path: '/faq',
  aliases: ['faq', 'questions', 'answers'],
  fields: [
    {
      name: 'items',
      label: 'Questions',
      type: 'list',
      itemLabel: 'question',
      titleField: 'q',
      max: 24,
      fields: [
        { name: 'q', label: 'Question', type: 'text', maxLength: 160 },
        { name: 'a', label: 'Answer', type: 'textarea', maxLength: 700 },
      ],
    },
  ],
  defaults: {
    items: [
      { q: 'How does a boy get into Class V?', a: 'New admission to Class V is by lottery, as per the rules of the Government of West Bengal. The dates are given in the school’s notice, on the notice board and on this website.' },
      { q: 'Is this a school for boys only?', a: 'Yes. Dum Dum Kishore Bharati High School is a boys’ school.' },
      { q: 'What is the medium of teaching?', a: 'Bengali.' },
      { q: 'Which streams are there in Higher Secondary?', a: 'Science and Arts, under the West Bengal Council of Higher Secondary Education. The Academics page lists the subjects.' },
      { q: 'What are the school timings?', a: 'School starts at 10.50 am. Class V ends at 3.20 pm, Class VI at 4.00 pm and Class VII to XII at 4.30 pm. On Saturday school ends at 1.30 pm.' },
      { q: 'What are the fees?', a: 'This is a government school; fees are those set by the Government of West Bengal. The school office will tell you the amount for this year.' },
      { q: 'How will I know about holidays and exams?', a: 'They are put up on the school notice board and on the Notices and Calendar pages of this website.' },
      { q: 'How do I get a transfer certificate or other certificate?', a: 'Apply at the school office with the student’s details. The office will tell you what to bring.' },
    ],
  },
});

/* ───────────── disclosure, RTI, vacancies ───────────── */

export const disclosureTop = defineSection({
  key: 'disclosure.top',
  page: 'School information',
  label: 'Page heading',
  path: '/disclosure',
  aliases: ['disclosure heading', 'school information page', 'mandatory disclosure'],
  fields: pageTopFields,
  defaults: {
    eyebrow: 'Public information',
    heading: 'School at a glance',
    text: 'The official details of the school in one place.',
  },
});

export const disclosureFacts = defineSection({
  key: 'disclosure.facts',
  page: 'School information',
  label: 'Official details',
  description: 'The details a parent or an office may ask for. Only real, official facts.',
  path: '/disclosure',
  aliases: ['official details', 'school details', 'udise', 'mandatory disclosure'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    {
      name: 'items',
      label: 'Details',
      type: 'list',
      itemLabel: 'detail',
      titleField: 'label',
      max: 24,
      fields: [
        { name: 'label', label: 'What', type: 'text', maxLength: 60 },
        { name: 'value', label: 'Detail', type: 'text', maxLength: 200 },
      ],
    },
  ],
  defaults: {
    heading: 'Official details',
    items: [
      { label: 'Name of the school', value: 'Dum Dum Kishore Bharati High School' },
      { label: 'UDISE code', value: '19114400910' },
      { label: 'Established', value: '1965' },
      { label: 'Founder', value: 'Sri Mihir Sengupta' },
      { label: 'Management', value: 'Department of School Education, Government of West Bengal' },
      { label: 'Board up to Class X', value: 'West Bengal Board of Secondary Education (WBBSE)' },
      { label: 'Council for Class XI and XII', value: 'West Bengal Council of Higher Secondary Education (WBCHSE)' },
      { label: 'Classes', value: 'Class V to Class XII' },
      { label: 'Higher Secondary streams', value: 'Science and Arts' },
      { label: 'Medium of teaching', value: 'Bengali' },
      { label: 'Students', value: 'Boys' },
      { label: 'Headmaster', value: 'Pintu Sarkar' },
      { label: 'Address', value: 'P2/A, Motijheel Avenue, Kolkata 700074 (Ward No. 9, South Dum Dum Municipality, North 24 Parganas)' },
      { label: 'Phone', value: '9433951428, 033 3556 1853' },
      { label: 'Email', value: 'ddkb1965@gmail.com' },
    ],
  },
});

export const disclosureRti = defineSection({
  key: 'disclosure.rti',
  page: 'School information',
  label: 'Right to Information',
  description: 'Fill in the Public Information Officer’s name once the school confirms it.',
  path: '/disclosure',
  aliases: ['rti', 'right to information', 'public information officer', 'pio'],
  fields: [
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    { name: 'text', label: 'Paragraph', type: 'textarea', maxLength: 600 },
    { name: 'officer', label: 'Public Information Officer', type: 'text', maxLength: 80 },
    { name: 'officerRole', label: 'Designation', type: 'text', maxLength: 80 },
    { name: 'appellate', label: 'Appellate authority', type: 'text', maxLength: 120 },
  ],
  defaults: {
    heading: 'Right to Information (RTI)',
    text: 'Information about the school can be asked for under the Right to Information Act, 2005. Until the officer’s name is given here, send the application to the Headmaster at the school address.',
    officer: '',
    officerRole: '',
    appellate: '',
  },
});

export const careersList = defineSection({
  key: 'careers.list',
  page: 'Vacancies',
  label: 'Vacancies',
  description: 'Posts the school is filling. The page and its menu link appear only while a vacancy is listed.',
  path: '/careers',
  aliases: ['vacancies', 'careers', 'jobs', 'recruitment'],
  fields: [
    ...pageTopFields,
    {
      name: 'items',
      label: 'Vacancies',
      type: 'list',
      itemLabel: 'vacancy',
      titleField: 'title',
      max: 12,
      fields: [
        { name: 'title', label: 'Post', type: 'text', maxLength: 90 },
        { name: 'text', label: 'Details', type: 'textarea', maxLength: 600 },
        { name: 'lastDate', label: 'Last date', type: 'text', maxLength: 30 },
        { name: 'link', label: 'Link to the full notice (optional)', type: 'url' },
      ],
    },
  ],
  defaults: {
    eyebrow: 'Vacancies',
    heading: 'Work at the school',
    text: 'Posts the school is filling at present.',
    items: [] as Record<string, string>[],
  },
});

/* ───────────── campus tour ───────────── */

export const galleryTour = defineSection({
  key: 'gallery.tour',
  page: 'Gallery',
  label: 'Campus tour',
  description: 'The turning wall of photos at the top of the Gallery page. The photos come from the gallery.',
  path: '/gallery',
  aliases: ['campus tour', 'virtual tour', 'photo wall', '3d gallery'],
  fields: [
    { name: 'eyebrow', label: 'Small line above the heading', type: 'text', maxLength: 40 },
    { name: 'heading', label: 'Heading', type: 'text', maxLength: 90 },
    { name: 'text', label: 'Line under the heading', type: 'text', maxLength: 200 },
  ],
  defaults: {
    eyebrow: 'Campus tour',
    heading: 'Walk through the school year',
    text: 'Scroll, or drag the wall, to turn through the photos.',
  },
});
