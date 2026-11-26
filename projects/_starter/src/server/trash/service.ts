/**
 * The Trash: records that were deleted, kept so a mistake can be undone.
 *
 * A deleted record keeps its row with `deleted_at` set, and every list leaves
 * it out. From the Trash screen an admin brings it back, or removes it for
 * good. Nothing leaves the Trash by itself.
 *
 * ADDING YOUR OWN (a business module with things people delete)
 *   1. Give the table a `deletedAt` column, set it instead of deleting, and
 *      leave such rows out of every list and count.
 *   2. Write a TrashSource like `enquirySource` below and add it to SOURCES.
 *      If removing a record for good would break something (a customer with
 *      receipts), make `purge` refuse with a plain message: money records are
 *      never removed.
 */
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { getDb, type DB } from '@/db';
import { enquiries } from '@/db/schema';
import { ApiError } from '@/lib/api';
import { audit } from '@/lib/audit';
import type { Session } from '@/lib/session-token';
import { uuid } from '@/lib/validators';
import { assertAdmin } from '../admin/shared';

export type TrashRow = { kind: string; id: string; title: string; detail: string; deletedAt: Date };

export type TrashSource = {
  kind: string;
  /** English; the screen passes it through t(). */
  label: string;
  list: (db: DB) => Promise<TrashRow[]>;
  /** Brings the record back. Returns its name, or null when it is not in the Trash. */
  restore: (db: DB, id: string) => Promise<string | null>;
  /** Removes it for good. Returns its name, or null when it is not in the Trash. */
  purge: (db: DB, id: string) => Promise<string | null>;
};

/** The newest this many of each kind are shown. */
const LIST_LIMIT = 200;

const enquirySource: TrashSource = {
  kind: 'enquiry',
  label: 'Enquiry',
  async list(db) {
    const rows = await db
      .select({ id: enquiries.id, name: enquiries.name, phone: enquiries.phone, subject: enquiries.subject, message: enquiries.message, deletedAt: enquiries.deletedAt })
      .from(enquiries)
      .where(isNotNull(enquiries.deletedAt))
      .orderBy(desc(enquiries.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({ kind: 'enquiry', id: row.id, title: row.name, detail: [row.phone, row.subject || row.message].filter(Boolean).join(' · '), deletedAt: row.deletedAt as Date }));
  },
  async restore(db, id) {
    const [row] = await db.update(enquiries).set({ deletedAt: null, updatedAt: new Date() }).where(and(eq(enquiries.id, id), isNotNull(enquiries.deletedAt))).returning({ name: enquiries.name });
    return row?.name ?? null;
  },
  async purge(db, id) {
    // Its notes go with it (the table cascades).
    const [row] = await db.delete(enquiries).where(and(eq(enquiries.id, id), isNotNull(enquiries.deletedAt))).returning({ name: enquiries.name });
    return row?.name ?? null;
  },
};

/** Every kind of record that can be in the Trash. A business module adds its own here. */
const SOURCES: TrashSource[] = [enquirySource];

export const TRASH_KINDS = SOURCES.map((source) => ({ kind: source.kind, label: source.label }));

const sourceOf = (kind: string) => {
  const source = SOURCES.find((item) => item.kind === kind);
  if (!source) throw new ApiError(400, 'Unknown kind of record');
  return source;
};

export async function listTrash(session: Session, kind?: string) {
  assertAdmin(session);
  const db = await getDb();
  const chosen = kind ? SOURCES.filter((source) => source.kind === kind) : SOURCES;
  const parts = await Promise.all(chosen.map((source) => source.list(db)));
  return parts.flat().sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}

export async function restoreFromTrash(session: Session, kind: string, id: string) {
  assertAdmin(session);
  const source = sourceOf(kind);
  const name = await source.restore(await getDb(), uuid.parse(id));
  if (name === null) throw new ApiError(404, 'It is no longer in the Trash');
  await audit(session, `${kind}.restore`, { entity: kind, entityId: id, summary: `Brought back ${name} from the Trash` });
  return name;
}

export async function purgeFromTrash(session: Session, kind: string, id: string) {
  assertAdmin(session);
  const source = sourceOf(kind);
  const name = await source.purge(await getDb(), uuid.parse(id));
  if (name === null) throw new ApiError(404, 'It is no longer in the Trash');
  await audit(session, `${kind}.purge`, { entity: kind, entityId: id, summary: `Removed ${name} for good from the Trash` });
  return name;
}
