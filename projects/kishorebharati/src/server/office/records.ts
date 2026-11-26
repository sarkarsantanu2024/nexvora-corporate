/**
 * A student's achievements, discipline notes and health check-ups. The
 * office writes them; a teacher reads those of the boys in their own
 * sections. Each kind keeps its own fields in `data`:
 *
 *   achievement: competition, level (school/district/state/national), position, note
 *   discipline:  incident, action, guardianInformed, note
 *   health:      heightCm, weightKg, vision, dental, remarks (BMI is worked out when shown)
 */
import { and, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { STUDENT_RECORD_KINDS, enrolments, sections, studentRecords, students, type StudentRecordKind } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { todayIST } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { day as dayField, requiredText, text, uuid } from '@/lib/validators';
import { PAGE_SIZE, countInt, pageOf } from '../admin/shared';
import { assertOffice, assertSchool, currentYear, isOffice, teacherScope } from '../school/access';
import { LEVELS, RECORD_KIND_LABELS, bmi } from './labels';
import { enrolledIn, liveStudent } from './shared';

const isKind = (value: unknown): value is StudentRecordKind => (STUDENT_RECORD_KINDS as readonly string[]).includes(value as string);

const achievement = z.object({
  competition: requiredText('Competition', 120),
  level: z.enum(LEVELS, { errorMap: () => ({ message: 'Choose the level' }) }),
  position: text(60),
  note: text(500),
});
const discipline = z.object({
  incident: requiredText('What happened', 1000),
  action: text(500),
  guardianInformed: z.coerce.boolean().default(false),
  note: text(500),
});
const measure = (label: string, max: number) =>
  z.union([z.literal(''), z.null(), z.coerce.number({ invalid_type_error: `Enter the ${label}` }).positive(`Enter the ${label}`).max(max, 'That number is too large')]).transform((v) => (v === '' || v === null ? null : Math.round(v * 10) / 10));
const health = z
  .object({
    heightCm: measure('height', 250),
    weightKg: measure('weight', 200),
    vision: text(60),
    dental: text(60),
    remarks: text(500),
  })
  .refine((v) => v.heightCm !== null || v.weightKg !== null || v.vision || v.dental || v.remarks, { message: 'Fill in at least one finding', path: ['heightCm'] });

const DATA_SCHEMAS = { achievement, discipline, health } as const;

export const recordInput = z.object({
  studentId: uuid,
  kind: z.enum(STUDENT_RECORD_KINDS),
  day: dayField,
  data: z.record(z.string(), z.unknown()),
});
export type RecordInput = z.input<typeof recordInput>;

function parseData(kind: StudentRecordKind, data: unknown) {
  const result = DATA_SCHEMAS[kind].safeParse(data);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) fields[`data.${issue.path.join('.')}`] ??= issue.message;
    throw new ApiError(400, Object.values(fields)[0] ?? 'Please check the details and try again', fields);
  }
  return result.data as Record<string, unknown>;
}

export async function addRecord(session: Session, raw: RecordInput) {
  assertOffice(session);
  const input = recordInput.parse(raw);
  if (input.day > todayIST()) throw new ApiError(400, 'Pick today or an earlier day');
  const data = parseData(input.kind, input.data);
  const db = await getDb();
  const student = await liveStudent(input.studentId, db);
  if (!student) throw new ApiError(404, 'Student not found');
  const [row] = await db
    .insert(studentRecords)
    .values({ studentId: student.id, kind: input.kind, day: input.day, data, createdBy: session.uid, createdByName: session.name })
    .returning();
  await audit(session, `record.${input.kind}`, { entity: 'student', entityId: student.id, summary: `${RECORD_KIND_LABELS[input.kind]} added for ${student.name}` });
  return row;
}

export async function updateRecord(session: Session, id: string, raw: { day: string; data: Record<string, unknown> }) {
  assertOffice(session);
  const db = await getDb();
  const [row] = await db.select().from(studentRecords).where(eq(studentRecords.id, uuid.parse(id))).limit(1);
  if (!row) throw new ApiError(404, 'Record not found');
  const day = dayField.parse(raw.day);
  if (day > todayIST()) throw new ApiError(400, 'Pick today or an earlier day');
  const data = parseData(row.kind, raw.data);
  await db.update(studentRecords).set({ day, data, updatedAt: new Date() }).where(eq(studentRecords.id, row.id));
  await audit(session, 'record.update', { entity: 'student', entityId: row.studentId, summary: `${RECORD_KIND_LABELS[row.kind]} of ${row.day} changed` });
}

export async function deleteRecord(session: Session, id: string) {
  assertOffice(session);
  const db = await getDb();
  const [row] = await db.delete(studentRecords).where(eq(studentRecords.id, uuid.parse(id))).returning();
  if (!row) throw new ApiError(404, 'Record not found');
  await audit(session, 'record.delete', { entity: 'student', entityId: row.studentId, summary: `${RECORD_KIND_LABELS[row.kind]} of ${row.day} removed` });
}

/** The students a teacher may read about: those enrolled this year in their sections. Null for the office (everyone). */
async function teacherStudentIds(session: Session): Promise<string[] | null> {
  assertSchool(session);
  if (isOffice(session)) return null;
  const db = await getDb();
  const year = await currentYear(db);
  const scope = await teacherScope(session, year.id, db);
  if (!scope?.sectionIds.length) return [];
  const rows = await db.select({ id: enrolments.studentId }).from(enrolments).where(and(eq(enrolments.yearId, year.id), inArray(enrolments.sectionId, scope.sectionIds)));
  return rows.map((row) => row.id);
}

export type RecordFilters = { kind?: string; grade?: string; q?: string; page?: string | number };

/** Every record, newest first, with the student and his class this year. */
export async function listRecords(session: Session, filters: RecordFilters = {}) {
  const allowed = await teacherStudentIds(session);
  const db = await getDb();
  const year = await currentYear(db);
  const page = pageOf(filters.page);
  const parts: (SQL | undefined)[] = [];
  if (allowed) {
    if (!allowed.length) return { rows: [], total: 0, page, pageSize: PAGE_SIZE };
    parts.push(inArray(studentRecords.studentId, allowed));
  }
  if (isKind(filters.kind)) parts.push(eq(studentRecords.kind, filters.kind));
  const grade = Number(filters.grade);
  if (filters.grade && Number.isInteger(grade)) parts.push(eq(sections.grade, grade));
  const term = filters.q?.trim();
  if (term) parts.push(or(ilike(students.name, `%${term}%`), ilike(students.admissionNo, `%${term}%`)));
  const where = and(...parts);
  const base = () =>
    db
      .select({
        record: studentRecords,
        studentName: students.name,
        admissionNo: students.admissionNo,
        grade: sections.grade,
        sectionName: sections.name,
        stream: sections.stream,
        shift: sections.shift,
      })
      .from(studentRecords)
      .innerJoin(students, eq(students.id, studentRecords.studentId))
      .leftJoin(enrolments, enrolledIn(year.id))
      .leftJoin(sections, eq(sections.id, enrolments.sectionId));
  const [rows, [{ n }]] = await Promise.all([
    base().where(where).orderBy(desc(studentRecords.day), desc(studentRecords.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: countInt() })
      .from(studentRecords)
      .innerJoin(students, eq(students.id, studentRecords.studentId))
      .leftJoin(enrolments, enrolledIn(year.id))
      .leftJoin(sections, eq(sections.id, enrolments.sectionId))
      .where(where),
  ]);
  return { rows, total: n, page, pageSize: PAGE_SIZE };
}

/** One student's records, newest first (the tab on the student's page). A teacher only for boys in their sections. */
export async function recordsOfStudent(session: Session, studentId: string) {
  if (!uuid.safeParse(studentId).success) return [];
  const allowed = await teacherStudentIds(session);
  if (allowed && !allowed.includes(studentId)) throw new ApiError(403, 'This is not one of your classes');
  const db = await getDb();
  const rows = await db.select().from(studentRecords).where(eq(studentRecords.studentId, studentId)).orderBy(desc(studentRecords.day), desc(studentRecords.createdAt));
  return rows;
}

/** A record's fields as the screens show them. */
export function recordFields(record: { kind: StudentRecordKind; data: Record<string, unknown> }) {
  const d = record.data;
  const str = (key: string) => (typeof d[key] === 'string' ? (d[key] as string) : '');
  const num = (key: string) => (typeof d[key] === 'number' ? (d[key] as number) : null);
  return {
    competition: str('competition'),
    level: str('level'),
    position: str('position'),
    incident: str('incident'),
    action: str('action'),
    guardianInformed: d.guardianInformed === true,
    heightCm: num('heightCm'),
    weightKg: num('weightKg'),
    bmi: bmi(num('heightCm'), num('weightKg')),
    vision: str('vision'),
    dental: str('dental'),
    remarks: str('remarks'),
    note: str('note'),
  };
}
