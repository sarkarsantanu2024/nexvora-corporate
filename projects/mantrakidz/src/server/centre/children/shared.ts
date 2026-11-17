/**
 * Pieces shared by the children-side services: who is acting, the manager
 * check, scoped loaders, notes and starting passwords.
 */
import { randomInt } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb, type DbOrTx } from '@/db';
import { activityNotes, batches, students, type Centre } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { canManageCentre } from '@/lib/auth';
import type { Session } from '@/lib/session-token';

export type Ctx = { session: Session; centre: Centre };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Postgres throws on a malformed uuid, so ids from the browser are checked first. */
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

export function requireManager(ctx: Ctx) {
  if (!canManageCentre(ctx.session)) throw new ApiError(403, 'Only the school head can do this');
}

/** A child of this centre, or a 404. Never trusts the id alone. */
export async function loadStudent(db: DbOrTx, centreId: string, id: string) {
  if (!isUuid(id)) throw new ApiError(404, 'Child not found');
  const [row] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), eq(students.centreId, centreId), isNull(students.deletedAt)))
    .limit(1);
  if (!row) throw new ApiError(404, 'Child not found');
  return row;
}

export async function loadBatch(db: DbOrTx, centreId: string, id: string) {
  if (!isUuid(id)) throw new ApiError(404, 'Class not found');
  const [row] = await db
    .select()
    .from(batches)
    .where(and(eq(batches.id, id), eq(batches.centreId, centreId)))
    .limit(1);
  if (!row) throw new ApiError(404, 'Class not found');
  return row;
}

/** Escapes what the person typed so % and _ are searched as plain characters. */
export const likeTerm = (q: string) => `%${q.replace(/[%_\\]/g, '\\$&')}%`;

/**
 * A starting password that is easy to read out over the phone. The person is
 * made to change it at first login, and five wrong tries lock the login.
 */
export const startingPassword = () => `mk${String(randomInt(0, 1_000_000)).padStart(6, '0')}`;

type NoteEntity = 'admission_enquiry' | 'student';

export async function insertNote(db: DbOrTx, session: Session, entityType: NoteEntity, entityId: string, note: string) {
  await db.insert(activityNotes).values({ entityType, entityId, note, createdBy: session.uid, createdByName: session.name });
}

export async function listNotes(entityType: NoteEntity, entityId: string) {
  const db = await getDb();
  return db
    .select({ id: activityNotes.id, note: activityNotes.note, by: activityNotes.createdByName, at: activityNotes.createdAt })
    .from(activityNotes)
    .where(and(eq(activityNotes.entityType, entityType), eq(activityNotes.entityId, entityId)))
    .orderBy(desc(activityNotes.createdAt))
    .limit(100);
}
