/**
 * Sample office registers: the last week of the mid-day meal, two leave
 * applications, a few visitors and a gate pass, some stock, one managing
 * committee meeting, one staff circular and two student records. Made up,
 * small, and only on a computer without Neon (see ../seed-school.ts).
 */
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { addDays, todayIST, weekday } from '@/lib/date';
import { OFFICE_DEFAULTS } from '@/server/office/defaults';
import type { DB } from '../index';
import * as s from '../schema';
import type { SampleContext } from './index';

/** Rice a child gets a day under PM POSHAN, in grams: 100 up to Class 5, 150 in 6 to 8. */
const riceGrams = (grade: number) => (grade <= 5 ? 100 : 150);

export async function seedOfficeSample(db: DB, context: SampleContext): Promise<void> {
  const today = todayIST();
  const [admin] = await db.select().from(s.users).where(eq(s.users.username, 'admin')).limit(1);
  const grades = OFFICE_DEFAULTS.mdmGrades;

  // Roll of each mid-day meal class, from the sample enrolments.
  const enrolled = await db
    .select({ grade: s.sections.grade, studentId: s.enrolments.studentId })
    .from(s.enrolments)
    .innerJoin(s.sections, eq(s.sections.id, s.enrolments.sectionId))
    .where(and(eq(s.enrolments.yearId, context.yearId), inArray(s.sections.grade, grades)));
  const roll = new Map<number, number>();
  for (const row of enrolled) roll.set(row.grade, (roll.get(row.grade) ?? 0) + 1);

  // Mid-day meal: the last six school days before today (no Sundays, no holidays of the calendar).
  const holidays = await db.select({ from: s.calendarEvents.startsOn, to: s.calendarEvents.endsOn }).from(s.calendarEvents).where(and(eq(s.calendarEvents.kind, 'holiday'), isNull(s.calendarEvents.deletedAt)));
  const shut = (day: string) => weekday(day) === 0 || holidays.some((h) => day >= h.from && day <= (h.to ?? h.from));
  const days: string[] = [];
  for (let day = addDays(today, -1); days.length < 6 && day > addDays(today, -20); day = addDays(day, -1)) {
    if (!shut(day)) days.unshift(day);
  }
  for (const [index, day] of days.entries()) {
    const [row] = await db
      .insert(s.mdmDays)
      .values({ day, menu: OFFICE_DEFAULTS.menu[String(weekday(day))] ?? '', cooksPresent: index % 3 === 2 ? 2 : 3, updatedBy: context.officeUserId })
      .onConflictDoNothing()
      .returning();
    if (!row) continue;
    const counts = grades.map((grade, g) => {
      const present = Math.max(0, (roll.get(grade) ?? 0) - ((index + g) % 3));
      return { dayId: row.id, grade, present, ate: Math.max(0, present - ((index + g) % 2)) };
    });
    await db.insert(s.mdmClassCounts).values(counts);
    const ate = counts.reduce((sum, c) => sum + c.ate, 0);
    const rice = counts.reduce((sum, c) => sum + c.ate * riceGrams(c.grade), 0);
    const stock = [
      { dayId: row.id, item: 'চাল', received: index === 0 ? 50_000 : 0, used: rice },
      { dayId: row.id, item: 'ডাল', received: index === 0 ? 10_000 : 0, used: ate * 20 },
    ];
    // Eggs on the egg days of the menu (Wednesday and Friday).
    if (weekday(day) === 3 || weekday(day) === 5) stock.push({ dayId: row.id, item: 'ডিম', received: ate * 1000, used: ate * 1000 });
    await db.insert(s.mdmStock).values(stock);
  }

  // Leave: the sample teacher asks for two casual days next week; another teacher's medical leave was approved.
  const others = await db.select().from(s.staff).where(eq(s.staff.designation, 'Assistant teacher')).limit(3);
  let monday = addDays(today, 7);
  while (weekday(monday) !== 1) monday = addDays(monday, 1);
  const [teacher] = await db.select({ name: s.users.name }).from(s.users).where(eq(s.users.id, context.teacherUserId)).limit(1);
  if (context.teacherStaffId && monday.slice(0, 4) === today.slice(0, 4)) {
    await db.insert(s.staffLeaves).values({
      staffId: context.teacherStaffId,
      leaveType: 'CL',
      fromDate: monday,
      toDate: addDays(monday, 1),
      days: 2,
      reason: 'Family function at home',
      appliedBy: context.teacherUserId,
      appliedByName: teacher?.name ?? '',
    });
  }
  const sick = others.find((row) => row.id !== context.teacherStaffId);
  const sickFrom = addDays(today, -12);
  if (sick && admin && weekday(sickFrom) !== 0 && sickFrom.slice(0, 4) === today.slice(0, 4)) {
    const to = addDays(sickFrom, 2);
    let n = 0;
    for (let day = sickFrom; day <= to; day = addDays(day, 1)) if (weekday(day) !== 0) n++;
    await db.insert(s.staffLeaves).values({
      staffId: sick.id,
      leaveType: 'ML',
      fromDate: sickFrom,
      toDate: to,
      days: n,
      reason: 'Fever, doctor advised rest',
      status: 'approved',
      appliedBy: context.officeUserId,
      appliedByName: 'Office (sample)',
      decidedBy: admin.id,
      decidedByName: admin.name,
      decidedAt: new Date(),
    });
  }

  // The gate.
  await db.insert(s.visitors).values([
    { day: addDays(today, -1), name: 'Subrata Ghosh', phone: '9831000001', whomToMeet: 'Headmaster', purpose: 'Admission enquiry for Class 5', inTime: '10:40', outTime: '11:05', createdBy: context.officeUserId },
    { day: addDays(today, -1), name: 'Book supplier', phone: '9831000002', whomToMeet: 'Office', purpose: 'Delivered free textbooks', inTime: '12:15', outTime: '12:50', createdBy: context.officeUserId },
    { day: today, name: 'Mitali Paul', phone: '9831000003', whomToMeet: 'Class teacher, Class 7 A', purpose: 'About her son’s attendance', inTime: '11:20', outTime: '', createdBy: context.officeUserId },
  ]);
  const [boy] = enrolled;
  if (boy) {
    const year = today.slice(0, 4);
    await db.insert(s.gatePasses).values({ serialNo: `GP/1/${year}`, studentId: boy.studentId, day: addDays(today, -2), time: '12:30', guardianName: 'Prasanta Das', guardianRelation: 'Father', guardianPhone: '9831000004', reason: 'Fever', approvedBy: 'Headmaster', createdBy: context.officeUserId });
    await db.insert(s.counters).values({ key: `gatepass:${year}`, value: 1 }).onConflictDoNothing();
    await db.insert(s.studentRecords).values([
      { studentId: boy.studentId, kind: 'health', day: addDays(today, -30), data: { heightCm: 138, weightKg: 31, vision: '6/6', dental: 'Fine', remarks: 'School health programme check-up' }, createdBy: context.officeUserId, createdByName: 'Office (sample)' },
      { studentId: boy.studentId, kind: 'achievement', day: addDays(today, -45), data: { competition: 'Inter-school drawing competition', level: 'district', position: 'Second', note: '' }, createdBy: context.officeUserId, createdByName: 'Office (sample)' },
    ]);
  }

  // Stock register.
  const items: (typeof s.assets.$inferInsert)[] = [
    { name: 'Wooden bench (double seat)', category: 'Furniture', quantity: 120, damaged: 6, location: 'Classrooms', condition: 'good', source: 'government_grant', value: 180_000, purchasedOn: '2019-06-10' },
    { name: 'Steel almirah', category: 'Furniture', quantity: 8, location: 'Office and staff room', condition: 'good', source: 'school_fund', value: 64_000, purchasedOn: '2021-02-15' },
    { name: 'Compound microscope', category: 'Lab equipment', quantity: 10, damaged: 1, location: 'Biology laboratory', condition: 'good', source: 'government_grant', value: 45_000, purchasedOn: '2022-08-01' },
    { name: 'Desktop computer', category: 'Computers', quantity: 12, location: 'Computer room', condition: 'needs_repair', source: 'government_grant', value: 420_000, purchasedOn: '2020-11-20' },
    { name: 'Football', category: 'Sports goods', quantity: 6, location: 'Games room', condition: 'good', source: 'donation', value: 3_600, purchasedOn: addDays(today, -60) },
  ];
  const assets = await db.insert(s.assets).values(items).returning();
  await db.insert(s.assetMovements).values(
    assets.map((asset) => ({ assetId: asset.id, day: asset.purchasedOn ?? today, kind: 'received' as const, quantity: asset.quantity + (asset.name === 'Football' ? 2 : 0), party: 'Opening entry', note: 'Opening entry', createdBy: context.officeUserId, createdByName: 'Office (sample)' })),
  );
  const football = assets.find((asset) => asset.name === 'Football');
  if (football) await db.insert(s.assetMovements).values({ assetId: football.id, day: addDays(today, -10), kind: 'written_off', quantity: 2, party: 'Torn in use', createdBy: context.officeUserId, createdByName: 'Office (sample)' });

  // A managing committee meeting.
  await db.insert(s.meetings).values({
    kind: 'smc',
    day: addDays(today, -21),
    time: '15:00',
    title: 'Repair of the school roof before the rains',
    venue: 'Headmaster’s room',
    attendees: 'President\nHeadmaster (Secretary)\nTwo teacher representatives\nTwo guardian representatives',
    agenda: '1. Repair of the roof of the east wing\n2. Annual sports day\n3. Any other matter',
    minutes: '1. Resolved to get three quotations for the roof repair and place them in the next meeting.\n2. Annual sports day to be held in the second week of December.',
    createdBy: context.officeUserId,
  });

  // One staff circular, read by the office.
  const [circular] = await db
    .insert(s.announcements)
    .values({ title: 'Invigilation duty for the second summative evaluation', body: 'The duty chart is pinned on the staff room board. Please sign against your name by Saturday.', audience: 'staff', publishOn: addDays(today, -2), createdBy: context.officeUserId })
    .returning();
  await db.insert(s.circularReads).values({ announcementId: circular.id, userId: context.officeUserId });
}
