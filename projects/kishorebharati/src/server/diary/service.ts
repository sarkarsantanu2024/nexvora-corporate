/**
 * The class diary: homework and classwork a teacher posts for a section.
 *
 *  - A teacher writes for a subject they teach in that section; the class
 *    teacher may also write a general note with no subject.
 *  - The office writes for any section and subject.
 *  - A teacher edits and deletes only their own entries; the office any.
 *  - Deleting moves the entry to the Trash (deletedAt).
 */
import { and, asc, desc, eq, gte, inArray, isNull, lte, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, type DB } from '@/db';
import { homework, sections, staff, subjects, users, type Section } from '@/db/schema';
import { sectionLabel } from '@/config/school';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { addDays, todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day, optionalDay, requiredText, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, countInt, pageOf } from '../admin/shared';
import { assertSchool, assertSubjectAccess, isOffice, staffOf, teacherScope } from '../school/access';
import { sectionById, visibleSections } from '../daily/shared';
import { subjectsForSection } from '../timetable/service';

export const notTrashed = isNull(homework.deletedAt);

const columns = {
  id: homework.id,
  sectionId: homework.sectionId,
  subjectId: homework.subjectId,
  subject: subjects.name,
  subjectBn: subjects.nameBn,
  staffId: homework.staffId,
  teacher: staff.name,
  givenOn: homework.givenOn,
  dueOn: homework.dueOn,
  title: homework.title,
  details: homework.details,
  attachment: homework.attachment,
  createdBy: homework.createdBy,
  createdByName: users.name,
  updatedAt: homework.updatedAt,
};

function selectEntries(db: DB) {
  return db
    .select(columns)
    .from(homework)
    .leftJoin(subjects, eq(subjects.id, homework.subjectId))
    .leftJoin(staff, eq(staff.id, homework.staffId))
    .leftJoin(users, eq(users.id, homework.createdBy));
}

export type DiaryEntry = Awaited<ReturnType<typeof listDiaryForSections>>[number];

/**
 * Entries for these sections given between two days, newest first. For the
 * parents' corner: it checks nothing about who asks, so the caller passes
 * only the sections of that parent's children.
 */
export async function listDiaryForSections(sectionIds: string[], from: string, to: string) {
  if (!sectionIds.length) return [];
  return selectEntries(await getDb())
    .where(and(notTrashed, inArray(homework.sectionId, sectionIds), gte(homework.givenOn, day.parse(from)), lte(homework.givenOn, day.parse(to))))
    .orderBy(desc(homework.givenOn), desc(homework.createdAt))
    .limit(500);
}

export type DiaryFilters = { section?: string; from?: string; to?: string; page?: string | number };

/** The diary screen: a teacher sees their sections, the office every section. */
export async function listDiary(session: Session, filters: DiaryFilters = {}) {
  const visible = await visibleSections(session);
  const ids = visible.sections.map((row) => row.id);
  const page = pageOf(filters.page);
  const chosen = filters.section && ids.includes(filters.section) ? [filters.section] : ids;
  if (!chosen.length) return { rows: [], total: 0, page, pageSize: PAGE_SIZE, sections: visible.sections };
  const where: SQL[] = [notTrashed, inArray(homework.sectionId, chosen)];
  if (filters.from && day.safeParse(filters.from).success) where.push(gte(homework.givenOn, filters.from));
  if (filters.to && day.safeParse(filters.to).success) where.push(lte(homework.givenOn, filters.to));
  const db = await getDb();
  const [rows, [{ n }]] = await Promise.all([
    selectEntries(db)
      .where(and(...where))
      .orderBy(desc(homework.givenOn), desc(homework.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: countInt() }).from(homework).where(and(...where)),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE, sections: visible.sections };
}

/**
 * What this login may write in: per section, the subjects they may pick and
 * whether a general note (no subject) is allowed.
 */
export async function diaryChoices(session: Session) {
  const visible = await visibleSections(session);
  const all = await Promise.all(
    visible.sections.map(async (section) => {
      const subjectsHere = await subjectsForSection(section);
      if (!visible.scope) return { section, subjects: subjectsHere, general: true };
      const mine = visible.scope.subjectsBySection.get(section.id) ?? [];
      return { section, subjects: subjectsHere.filter((row) => mine.includes(row.id)), general: visible.scope.classTeacherOf.includes(section.id) };
    }),
  );
  return all.filter((choice) => choice.general || choice.subjects.length);
}

const entryInput = z.object({
  sectionId: uuid,
  subjectId: z.union([z.literal(''), uuid, z.null()]).transform((v) => v || null),
  givenOn: day.optional(),
  dueOn: optionalDay,
  title: requiredText('Title', 160),
  details: text(4000),
  attachment: text(500),
});
export type DiaryInput = z.input<typeof entryInput>;

/** Refuses unless this login may write this subject (or a general note) in this section. */
async function assertMayWrite(session: Session, section: Section, subjectId: string | null) {
  assertSchool(session);
  if (subjectId) {
    const allowed = await subjectsForSection(section);
    if (!allowed.some((row) => row.id === subjectId)) throw new ApiError(400, 'This subject is not taught in this class');
    await assertSubjectAccess(session, section.id, subjectId);
    return;
  }
  if (isOffice(session)) return;
  const scope = await teacherScope(session, section.yearId);
  if (!scope?.classTeacherOf.includes(section.id)) throw new ApiError(403, 'Only the class teacher can post a note without a subject');
}

async function checked(session: Session, raw: DiaryInput) {
  const input = entryInput.parse(raw);
  const section = await sectionById(input.sectionId);
  if (!section) throw new ApiError(404, 'Class not found');
  await assertMayWrite(session, section, input.subjectId);
  const today = todayIST();
  const givenOn = input.givenOn ?? today;
  if (givenOn > today) throw new ApiError(400, 'The date given cannot be in the future');
  if (givenOn < addDays(today, -60)) throw new ApiError(400, 'Pick a date within the last two months');
  if (input.dueOn && input.dueOn < givenOn) throw new ApiError(400, 'The due date cannot be before the date given', { dueOn: 'The due date cannot be before the date given' });
  return { input, section, givenOn };
}

export async function createDiaryEntry(session: Session, raw: DiaryInput) {
  const { input, section, givenOn } = await checked(session, raw);
  const db = await getDb();
  const me = await staffOf(session, db);
  const [row] = await db
    .insert(homework)
    .values({ sectionId: section.id, subjectId: input.subjectId, staffId: me?.id ?? null, givenOn, dueOn: input.dueOn, title: input.title, details: input.details, attachment: input.attachment, createdBy: session.uid })
    .returning();
  await audit(session, 'diary.create', { entity: 'homework', entityId: row.id, summary: `Diary for ${sectionLabel(section)}: ${row.title}` });
  return row;
}

/** The entry, if it exists and this login may change it. */
async function ownEntry(session: Session, id: string) {
  assertSchool(session);
  const db = await getDb();
  const parsed = uuid.safeParse(id);
  const [row] = parsed.success ? await db.select().from(homework).where(and(eq(homework.id, parsed.data), notTrashed)).limit(1) : [];
  if (!row) throw new ApiError(404, 'Diary entry not found');
  if (!isOffice(session) && row.createdBy !== session.uid) throw new ApiError(403, 'You can change only your own diary entries');
  return row;
}

export async function updateDiaryEntry(session: Session, id: string, raw: DiaryInput) {
  const before = await ownEntry(session, id);
  const { input, section, givenOn } = await checked(session, { ...raw, givenOn: raw.givenOn ?? before.givenOn });
  const db = await getDb();
  const [row] = await db
    .update(homework)
    .set({ sectionId: section.id, subjectId: input.subjectId, givenOn, dueOn: input.dueOn, title: input.title, details: input.details, attachment: input.attachment, updatedAt: new Date() })
    .where(eq(homework.id, before.id))
    .returning();
  await audit(session, 'diary.update', { entity: 'homework', entityId: row.id, summary: `Changed the diary entry ${row.title}` });
  return row;
}

export async function deleteDiaryEntry(session: Session, id: string) {
  const before = await ownEntry(session, id);
  const db = await getDb();
  await db.update(homework).set({ deletedAt: new Date() }).where(eq(homework.id, before.id));
  await audit(session, 'diary.delete', { entity: 'homework', entityId: before.id, summary: `Moved the diary entry ${before.title} to the Trash` });
}

/** Sections in order, for labels on the parents' side. */
export async function sectionsByIds(ids: string[]) {
  if (!ids.length) return [];
  const db = await getDb();
  return db.select().from(sections).where(inArray(sections.id, ids)).orderBy(asc(sections.grade), asc(sections.name));
}
