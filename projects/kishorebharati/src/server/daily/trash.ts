/** Diary entries and calendar entries in the Trash (listed in SOURCES of ../trash/service.ts). */
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { calendarEvents, homework } from '@/db/schema';
import { formatDate } from '@/lib/date';
import type { TrashSource } from '../trash/service';

const LIST_LIMIT = 200;

export const diaryTrash: TrashSource = {
  kind: 'homework',
  label: 'Diary entry',
  async list(db) {
    const rows = await db
      .select({ id: homework.id, title: homework.title, givenOn: homework.givenOn, deletedAt: homework.deletedAt })
      .from(homework)
      .where(isNotNull(homework.deletedAt))
      .orderBy(desc(homework.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({ kind: 'homework', id: row.id, title: row.title, detail: formatDate(row.givenOn), deletedAt: row.deletedAt as Date }));
  },
  async restore(db, id) {
    const [row] = await db.update(homework).set({ deletedAt: null, updatedAt: new Date() }).where(and(eq(homework.id, id), isNotNull(homework.deletedAt))).returning({ title: homework.title });
    return row?.title ?? null;
  },
  async purge(db, id) {
    const [row] = await db.delete(homework).where(and(eq(homework.id, id), isNotNull(homework.deletedAt))).returning({ title: homework.title });
    return row?.title ?? null;
  },
};

export const eventTrash: TrashSource = {
  kind: 'calendar_event',
  label: 'Calendar entry',
  async list(db) {
    const rows = await db
      .select({ id: calendarEvents.id, title: calendarEvents.title, startsOn: calendarEvents.startsOn, deletedAt: calendarEvents.deletedAt })
      .from(calendarEvents)
      .where(isNotNull(calendarEvents.deletedAt))
      .orderBy(desc(calendarEvents.deletedAt))
      .limit(LIST_LIMIT);
    return rows.map((row) => ({ kind: 'calendar_event', id: row.id, title: row.title, detail: formatDate(row.startsOn), deletedAt: row.deletedAt as Date }));
  },
  async restore(db, id) {
    const [row] = await db.update(calendarEvents).set({ deletedAt: null, updatedAt: new Date() }).where(and(eq(calendarEvents.id, id), isNotNull(calendarEvents.deletedAt))).returning({ title: calendarEvents.title });
    return row?.title ?? null;
  },
  async purge(db, id) {
    const [row] = await db.delete(calendarEvents).where(and(eq(calendarEvents.id, id), isNotNull(calendarEvents.deletedAt))).returning({ title: calendarEvents.title });
    return row?.title ?? null;
  },
};
