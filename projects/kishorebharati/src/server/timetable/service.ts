/**
 * The timetable: one cell per section, day (1 Monday … 6 Saturday) and
 * period, holding a subject and a teacher. The office fills it; teachers
 * read it. Putting a teacher in two sections at the same time is refused
 * unless the office confirms it (a combined class, say).
 */
import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { sections, staff, subjects, timetableSlots, type Section } from '@/db/schema';
import { SCHOOL, sectionLabel } from '@/config/school';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { text, uuid } from '@/lib/validators';
import { assertAdmin, getSetting, putSetting } from '../admin/shared';
import { assertOffice, assertSchool, assertSectionAccess, currentYear, isOffice, staffOf } from '../school/access';
import { sectionById } from '../daily/shared';
import { periodsFor, type TimetableSettings } from './defaults';

export const getTimetableSettings = () => getSetting('timetable');

/* ───────────── period settings ───────────── */

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a time like 10:50');
const period = z.object({ start: time, end: time });
const periodList = z
  .array(period)
  .min(1, 'Add at least one period')
  .max(12, 'At most 12 periods')
  .superRefine((list, ctx) => {
    list.forEach((item, index) => {
      if (item.end <= item.start) ctx.addIssue({ code: 'custom', path: [index], message: 'A period must end after it starts' });
      if (index > 0 && item.start < list[index - 1].end) ctx.addIssue({ code: 'custom', path: [index], message: 'Periods must not overlap' });
    });
  });

const settingsInput = z.object({
  weekday: periodList,
  saturday: periodList,
  classEnds: z.record(z.string(), z.union([z.literal(''), time])),
  saturdayEnds: time,
});

/** Head of school only: the times are the school's rule, not a day-to-day entry. */
export async function saveTimetableSettings(session: Session, raw: z.input<typeof settingsInput>) {
  assertAdmin(session);
  const input = settingsInput.parse(raw);
  const classEnds: Record<string, string> = {};
  for (const grade of SCHOOL.grades) {
    const end = input.classEnds[String(grade)];
    if (end) classEnds[String(grade)] = end;
  }
  const value: TimetableSettings = { weekday: input.weekday, saturday: input.saturday, classEnds, saturdayEnds: input.saturdayEnds };
  await putSetting('timetable', value);
  await audit(session, 'timetable.settings', { entity: 'settings', entityId: 'timetable', summary: `Period times changed: ${value.weekday.length} periods on weekdays, ${value.saturday.length} on Saturday` });
  return value;
}

/* ───────────── reading ───────────── */

export type SlotView = { id: string; day: number; period: number; subjectId: string | null; subject: string; subjectBn: string; staffId: string | null; teacher: string; room: string; sectionId: string };

async function slotsWhere(where: ReturnType<typeof eq>) {
  const db = await getDb();
  const rows = await db
    .select({
      id: timetableSlots.id,
      sectionId: timetableSlots.sectionId,
      day: timetableSlots.day,
      period: timetableSlots.period,
      subjectId: timetableSlots.subjectId,
      subject: subjects.name,
      subjectBn: subjects.nameBn,
      staffId: timetableSlots.staffId,
      teacher: staff.name,
      room: timetableSlots.room,
    })
    .from(timetableSlots)
    .leftJoin(subjects, eq(subjects.id, timetableSlots.subjectId))
    .leftJoin(staff, eq(staff.id, timetableSlots.staffId))
    .where(where)
    .orderBy(asc(timetableSlots.day), asc(timetableSlots.period));
  return rows.map((row) => ({ ...row, subject: row.subject ?? '', subjectBn: row.subjectBn ?? '', teacher: row.teacher ?? '' })) as SlotView[];
}

/** One section's week. Teachers may read the sections they teach. */
export async function sectionTimetable(session: Session, sectionId: string) {
  assertSchool(session);
  const section = await sectionById(uuid.parse(sectionId));
  if (!section) throw new ApiError(404, 'Class not found');
  await assertSectionAccess(session, section.id);
  const [slots, settings] = await Promise.all([slotsWhere(eq(timetableSlots.sectionId, section.id)), getTimetableSettings()]);
  return { section, slots, settings };
}

/** A teacher's week across every section. A teacher sees only their own; the office anyone's. */
export async function teacherTimetable(session: Session, staffId?: string) {
  assertSchool(session);
  const db = await getDb();
  let id: string;
  if (isOffice(session)) {
    if (!staffId) throw new ApiError(400, 'Choose a teacher');
    id = uuid.parse(staffId);
  } else {
    const me = await staffOf(session, db);
    if (!me) throw new ApiError(403, 'Your login is not linked to the staff list. Ask the office.');
    id = me.id;
  }
  const [person] = await db.select({ id: staff.id, name: staff.name, nameBn: staff.nameBn }).from(staff).where(eq(staff.id, id)).limit(1);
  if (!person) throw new ApiError(404, 'Teacher not found');
  const year = await currentYear(db);
  const yearSections = await db.select().from(sections).where(eq(sections.yearId, year.id));
  const ids = yearSections.map((row) => row.id);
  const slots = ids.length ? (await slotsWhere(eq(timetableSlots.staffId, id))).filter((slot) => ids.includes(slot.sectionId)) : [];
  const sectionMap = new Map(yearSections.map((row) => [row.id, row]));
  return { person, slots: slots.map((slot) => ({ ...slot, section: sectionMap.get(slot.sectionId) as Section })), settings: await getTimetableSettings() };
}

/** Teaching staff, for the teacher picker. */
export async function teacherChoices() {
  const db = await getDb();
  return db
    .select({ id: staff.id, name: staff.name, nameBn: staff.nameBn, subjects: staff.subjects })
    .from(staff)
    .where(and(eq(staff.kind, 'teaching'), eq(staff.active, true), isNull(staff.deletedAt)))
    .orderBy(asc(staff.sort), asc(staff.name));
}

/** The subjects taught in a section's class (and stream). */
export async function subjectsForSection(section: Pick<Section, 'grade' | 'stream'>) {
  const db = await getDb();
  const rows = await db.select().from(subjects).where(eq(subjects.active, true)).orderBy(asc(subjects.sort));
  return rows.filter((row) => row.fromGrade <= section.grade && row.toGrade >= section.grade && (!row.stream || row.stream === section.stream));
}

/* ───────────── changing a cell ───────────── */

const slotInput = z.object({
  sectionId: uuid,
  day: z.coerce.number().int().min(1).max(6),
  period: z.coerce.number().int().min(1).max(12),
  subjectId: z.union([z.literal(''), uuid, z.null()]).transform((v) => v || null),
  staffId: z.union([z.literal(''), uuid, z.null()]).transform((v) => v || null),
  room: text(40),
  confirmClash: z.boolean().default(false),
});

/**
 * Sets one cell, or clears it when neither a subject nor a teacher is given.
 * A teacher already in another section at that time is a 409 carrying the
 * other section's id in `fields.clash`, so the screen can ask "save anyway?".
 */
export async function setSlot(session: Session, raw: z.input<typeof slotInput>) {
  assertOffice(session);
  const input = slotInput.parse(raw);
  const db = await getDb();
  const section = await sectionById(input.sectionId, db);
  if (!section) throw new ApiError(404, 'Class not found');
  const settings = await getTimetableSettings();
  if (input.period > periodsFor(settings, section.grade, input.day).length) throw new ApiError(400, 'This class has no such period on that day');

  const where = and(eq(timetableSlots.sectionId, section.id), eq(timetableSlots.day, input.day), eq(timetableSlots.period, input.period));
  const label = sectionLabel(section);
  if (!input.subjectId && !input.staffId) {
    const removed = await db.delete(timetableSlots).where(where).returning({ id: timetableSlots.id });
    if (removed.length) await audit(session, 'timetable.clear', { entity: 'section', entityId: section.id, summary: `Cleared day ${input.day}, period ${input.period} of ${label}` });
    return { cleared: true };
  }

  if (input.subjectId) {
    const allowed = await subjectsForSection(section);
    if (!allowed.some((row) => row.id === input.subjectId)) throw new ApiError(400, 'This subject is not taught in this class');
  }
  if (input.staffId) {
    const [person] = await db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, input.staffId), eq(staff.active, true), isNull(staff.deletedAt))).limit(1);
    if (!person) throw new ApiError(400, 'Choose a teacher from the list');
    if (!input.confirmClash) {
      const yearSections = await db.select({ id: sections.id }).from(sections).where(eq(sections.yearId, section.yearId));
      const [clash] = await db
        .select({ sectionId: timetableSlots.sectionId })
        .from(timetableSlots)
        .where(
          and(
            eq(timetableSlots.staffId, input.staffId),
            eq(timetableSlots.day, input.day),
            eq(timetableSlots.period, input.period),
            ne(timetableSlots.sectionId, section.id),
            inArray(timetableSlots.sectionId, yearSections.map((row) => row.id)),
          ),
        )
        .limit(1);
      if (clash) throw new ApiError(409, 'This teacher already has another class at this time', { clash: clash.sectionId });
    }
  }

  const values = { sectionId: section.id, day: input.day, period: input.period, subjectId: input.subjectId, staffId: input.staffId, room: input.room };
  await db
    .insert(timetableSlots)
    .values(values)
    .onConflictDoUpdate({ target: [timetableSlots.sectionId, timetableSlots.day, timetableSlots.period], set: { subjectId: values.subjectId, staffId: values.staffId, room: values.room } });
  await audit(session, 'timetable.set', { entity: 'section', entityId: section.id, summary: `Set day ${input.day}, period ${input.period} of ${label}` });
  return { cleared: false };
}
