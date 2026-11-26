/**
 * Starting rows of the school.
 *
 * seedSchool: what is true for Dum Dum Kishore Bharati High School, taken
 * from its official page on the government portal
 * (school.banglarshiksha.gov.in, UDISE 19114400910): the staff list, the
 * subjects and the Higher Secondary streams. The rest (sections, the school
 * year) is a sensible start the office changes from Classes and subjects.
 * Anything still to be confirmed with the school is listed in
 * docs/CONTENT_TO_CONFIRM.md.
 *
 * seedSchoolSample: made-up students, logins and day-to-day records so every
 * screen has something to show on a computer without Neon. Every sample
 * student carries meta.sample = true. Never loaded into Neon unless
 * SEED_DEMO=1 is set.
 */
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { DB } from './index';
import * as s from './schema';
import { DEFAULT_PASSWORD } from './seed-defaults';
import { SCHOOL, hasStreams } from '@/config/school';
import { SAMPLE_SEEDERS, type SampleContext } from './sample';

type StaffSeed = { name: string; designation: string; kind?: s.StaffKind };

/** High school staff as listed on the government portal (Our Teachers), in that order. */
const HIGH_STAFF: StaffSeed[] = [
  { name: 'Pintu Sarkar', designation: 'Headmaster' },
  ...[
    'Susmita Chattopadhyay',
    'Rinku Pal',
    'Amrita Pal',
    'Dipti Bhuniya Dhar',
    'Saikat Kundu',
    'Susmita Mondal',
    'Amitendra Chandra Sen',
    'Amrita Nandy Chaudhuri',
    'Arindam Kabasi',
    'Asim Kumar Mondal',
    'Avishek Manna',
    'Bandana Sarkar',
    'Biswajit Sardar',
    'Krishna Gopal Ghosh',
    'Krishnapada Mandal',
    'Pinaki Kayet',
    'Proloy Banerjee',
    'Samit Chakrabarty',
    'Sanjukta Mondal',
    'Smita Malakar',
    'Subhra Ghosh',
    'Susanta Dutta',
    'Tanushree Sarkar',
  ].map((name) => ({ name, designation: 'Assistant teacher' })),
  { name: 'Swati Seal', designation: 'Librarian', kind: 'non_teaching' },
  { name: 'Partha Malik', designation: 'Clerk', kind: 'non_teaching' },
  { name: 'Monojit Das', designation: 'Group D staff', kind: 'non_teaching' },
  { name: 'Nupur Krishna Das', designation: 'Group D staff', kind: 'non_teaching' },
];

type SubjectSeed = { name: string; nameBn: string; from: number; to: number; stream?: s.Stream; optional?: boolean };

/**
 * Up to Madhyamik: the list on the school's portal page (Bengali, English,
 * Hindi in VII-VIII, Mathematics, Physical Science, Life Science, History,
 * Geography); Class 5 also has Our Environment, as in every West Bengal
 * school. Higher Secondary: Science (Physics, Chemistry, Mathematics,
 * Biological Science, Computer Science) and Arts (Geography, Computer
 * Application), as listed on the portal. The office adds the rest.
 */
const SUBJECTS: SubjectSeed[] = [
  { name: 'Bengali', nameBn: 'বাংলা', from: 5, to: 12 },
  { name: 'English', nameBn: 'ইংরেজি', from: 5, to: 12 },
  { name: 'Mathematics', nameBn: 'গণিত', from: 5, to: 10 },
  { name: 'Our Environment', nameBn: 'আমাদের পরিবেশ', from: 5, to: 5 },
  { name: 'Hindi', nameBn: 'হিন্দি', from: 7, to: 8, optional: true },
  { name: 'Physical Science', nameBn: 'ভৌতবিজ্ঞান', from: 6, to: 10 },
  { name: 'Life Science', nameBn: 'জীবনবিজ্ঞান', from: 6, to: 10 },
  { name: 'History', nameBn: 'ইতিহাস', from: 6, to: 10 },
  { name: 'Geography', nameBn: 'ভূগোল', from: 6, to: 10 },
  { name: 'Physics', nameBn: 'পদার্থবিদ্যা', from: 11, to: 12, stream: 'science' },
  { name: 'Chemistry', nameBn: 'রসায়ন', from: 11, to: 12, stream: 'science' },
  { name: 'Mathematics', nameBn: 'গণিত', from: 11, to: 12, stream: 'science' },
  { name: 'Biological Science', nameBn: 'জীববিদ্যা', from: 11, to: 12, stream: 'science' },
  { name: 'Computer Science', nameBn: 'কম্পিউটার সায়েন্স', from: 11, to: 12, stream: 'science', optional: true },
  { name: 'Geography', nameBn: 'ভূগোল', from: 11, to: 12, stream: 'arts' },
  { name: 'Computer Application', nameBn: 'কম্পিউটার অ্যাপ্লিকেশন', from: 11, to: 12, stream: 'arts', optional: true },
];

/** Sections to start with: two sections a class in 5 to 10, one per stream in 11 and 12. */
function startingSections(): { grade: number; name: string; shift: s.Shift; stream: s.Stream }[] {
  const out: { grade: number; name: string; shift: s.Shift; stream: s.Stream }[] = [];
  for (const grade of SCHOOL.grades) {
    for (const shift of SCHOOL.shifts) {
      if (hasStreams(grade)) for (const stream of SCHOOL.streams) out.push({ grade, name: 'A', shift, stream });
      else for (const name of ['A', 'B']) out.push({ grade, name, shift, stream: '' });
    }
  }
  return out;
}

export async function seedSchool(db: DB) {
  const year = new Date().getFullYear();
  const [current] = await db
    .insert(s.academicYears)
    .values({ name: String(year), startsOn: `${year}-01-01`, endsOn: `${year}-12-31`, isCurrent: true })
    .returning();

  await db.insert(s.subjects).values(
    SUBJECTS.map((subject, index) => ({
      name: subject.name,
      nameBn: subject.nameBn,
      fromGrade: subject.from,
      toGrade: subject.to,
      stream: subject.stream ?? '',
      optional: subject.optional ?? false,
      sort: index + 1,
    })),
  );

  await db.insert(s.sections).values(startingSections().map((section) => ({ ...section, yearId: current.id, capacity: section.grade >= 11 ? 50 : 60 })));

  await db.insert(s.staff).values(
    HIGH_STAFF.map((person, index) => ({ name: person.name, designation: person.designation, kind: person.kind ?? 'teaching', sort: index + 1 })),
  );

  await db
    .insert(s.settings)
    .values({
      key: 'school',
      value: {
        high: {
          name: 'Dum Dum Kishore Bharati High School',
          nameBn: 'দমদম কিশোর ভারতী হাই স্কুল',
          udise: '19114400910',
          address: 'P2/A, Motijheel Avenue, Kolkata 700074',
          addressBn: 'পি২/এ, মতিঝিল অ্যাভিনিউ, কলকাতা ৭০০০৭৪',
          phone: '9433951428',
          phone2: '033 3556 1853',
          email: 'ddkb1965@gmail.com',
          board: 'WBBSE (Madhyamik) and WBCHSE (Higher Secondary)',
        },
        founded: 1965,
        founder: 'Sri Mihir Sengupta',
        founderBn: 'শ্রী মিহির সেনগুপ্ত',
        motto: 'তেজস্বিনাবধীতমস্তু',
      },
    })
    .onConflictDoNothing();
}

/* ───────────────────────────── sample data ───────────────────────────── */

const FIRST = ['Arnab', 'Soham', 'Ritam', 'Sayan', 'Debjit', 'Arijit', 'Subham', 'Ayan', 'Rohan', 'Sourav', 'Anirban', 'Pritam', 'Rajdeep', 'Sagnik', 'Tanmoy', 'Abhik', 'Indranil', 'Koushik', 'Niladri', 'Shreyan'];
const LAST = ['Das', 'Ghosh', 'Mondal', 'Sarkar', 'Paul', 'Dey', 'Roy', 'Saha', 'Biswas', 'Chakraborty', 'Banerjee', 'Mukherjee', 'Sen', 'Bose', 'Kundu'];
const FATHER = ['Prasanta', 'Tapas', 'Swapan', 'Ashok', 'Bikash', 'Dilip', 'Gautam', 'Manas', 'Partha', 'Sanjib'];
const MOTHER = ['Rina', 'Mitali', 'Sumana', 'Papiya', 'Shampa', 'Kakali', 'Mousumi', 'Soma', 'Jhuma', 'Tanima'];

/** Students a section gets in the sample: a few, so lists and registers look real without slowing the first start. */
const SAMPLE_PER_SECTION = 8;

export async function seedSchoolSample(db: DB) {
  const [year] = await db.select().from(s.academicYears).where(eq(s.academicYears.isCurrent, true)).limit(1);
  if (!year) return;
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const [office] = await db
    .insert(s.users)
    .values({ name: 'Office (sample)', username: 'office', passwordHash: hash, role: 'staff' })
    .returning();

  // A sample teacher login, tied to the first assistant teacher on the staff list.
  const highTeachers = await db.select().from(s.staff);
  const teacherRow = highTeachers.filter((row) => row.designation === 'Assistant teacher').sort((a, b) => a.sort - b.sort)[0];
  const [teacherUser] = await db
    .insert(s.users)
    .values({ name: teacherRow?.name ?? 'Teacher', username: 'teacher', passwordHash: hash, role: 'teacher' })
    .returning();
  if (teacherRow) await db.update(s.staff).set({ userId: teacherUser.id }).where(eq(s.staff.id, teacherRow.id));

  const sectionRows = (await db.select().from(s.sections).where(eq(s.sections.yearId, year.id))).sort(
    (a, b) => a.grade - b.grade || a.shift.localeCompare(b.shift) || a.stream.localeCompare(b.stream) || a.name.localeCompare(b.name),
  );

  // The teacher is class teacher of the first Class 7 section.
  const class7 = sectionRows.find((row) => row.grade === 7);
  if (class7 && teacherRow) await db.update(s.sections).set({ classTeacherId: teacherRow.id }).where(eq(s.sections.id, class7.id));

  let serial = 0;
  const studentRows: (typeof s.students.$inferInsert)[] = [];
  const enrolmentPlan: { admissionNo: string; sectionId: string; rollNo: number }[] = [];
  for (const section of sectionRows) {
    for (let roll = 1; roll <= SAMPLE_PER_SECTION; roll++) {
      serial++;
      const first = FIRST[(serial * 7) % FIRST.length];
      const last = LAST[(serial * 11) % LAST.length];
      const birthYear = year.startsOn.slice(0, 4) as string;
      const age = section.grade + 5;
      const dob = `${Number(birthYear) - age}-${String(((serial * 5) % 12) + 1).padStart(2, '0')}-${String(((serial * 3) % 27) + 1).padStart(2, '0')}`;
      const admissionNo = `S-${String(serial).padStart(4, '0')}`;
      studentRows.push({
        admissionNo,
        name: `${first} ${last}`,
        dob,
        fatherName: `${FATHER[serial % FATHER.length]} ${last}`,
        motherName: `${MOTHER[(serial * 3) % MOTHER.length]} ${last}`,
        phone: `90000${String(serial).padStart(5, '0')}`,
        address: 'Dum Dum, Kolkata 700074',
        category: s.CATEGORIES[serial % s.CATEGORIES.length],
        admittedOn: `${Number(birthYear) - Math.max(0, section.grade - 1)}-01-10`,
        admittedGrade: Math.max(0, section.grade - (serial % 3)),
        meta: { sample: true },
      });
      enrolmentPlan.push({ admissionNo, sectionId: section.id, rollNo: roll });
    }
  }
  const inserted = await db.insert(s.students).values(studentRows).returning({ id: s.students.id, admissionNo: s.students.admissionNo });
  const idByNo = new Map(inserted.map((row) => [row.admissionNo, row.id]));
  await db.insert(s.enrolments).values(enrolmentPlan.map((plan) => ({ yearId: year.id, studentId: idByNo.get(plan.admissionNo)!, sectionId: plan.sectionId, rollNo: plan.rollNo })));
  await db.insert(s.counters).values({ key: 'admission', value: serial }).onConflictDoNothing();

  // A sample parent login: the first student of the sample Class 7 section. Username is the phone number.
  const firstOf7 = class7 ? enrolmentPlan.find((plan) => plan.sectionId === class7.id) : undefined;
  if (firstOf7) {
    const studentId = idByNo.get(firstOf7.admissionNo)!;
    const [student] = await db.select().from(s.students).where(eq(s.students.id, studentId));
    const [parent] = await db
      .insert(s.users)
      .values({ name: student.fatherName, username: student.phone, phone: student.phone, passwordHash: hash, role: 'parent' })
      .returning();
    await db.update(s.students).set({ parentUserId: parent.id }).where(eq(s.students.id, studentId));
  }

  const context: SampleContext = { yearId: year.id, officeUserId: office.id, teacherUserId: teacherUser.id, teacherStaffId: teacherRow?.id ?? null };
  for (const seed of SAMPLE_SEEDERS) await seed(db, context);
}
