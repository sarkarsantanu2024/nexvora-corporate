/**
 * Pieces the daily screens share (attendance, timetable, diary, events, My
 * day): the sections a login may open, holidays from the school calendar,
 * and the India-time clock.
 */
import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { getDb, type DbOrTx } from '@/db';
import { calendarEvents, sections, type Section } from '@/db/schema';
import { weekday } from '@/lib/date';
import type { Session } from '@/lib/session-token';
import { assertSchool, currentYear, teacherScope, type TeacherScope } from '../school/access';

/** Class order everywhere: class, then shift, stream and section name. */
export const bySection = (a: Section, b: Section) =>
  a.grade - b.grade || a.shift.localeCompare(b.shift) || a.stream.localeCompare(b.stream) || a.name.localeCompare(b.name);

export type VisibleSections = { yearId: string; sections: Section[]; scope: TeacherScope | null };

/**
 * The sections of the current year this login may open. A teacher gets their
 * own (class teacher's sections first); the office gets every one.
 */
export async function visibleSections(session: Session, db?: DbOrTx): Promise<VisibleSections> {
  assertSchool(session);
  const conn = db ?? (await getDb());
  const year = await currentYear(conn);
  const all = (await conn.select().from(sections).where(eq(sections.yearId, year.id))).sort(bySection);
  const scope = await teacherScope(session, year.id, conn);
  if (!scope) return { yearId: year.id, sections: all, scope };
  const mine = all.filter((row) => scope.sectionIds.includes(row.id));
  const first = mine.filter((row) => scope.classTeacherOf.includes(row.id));
  const rest = mine.filter((row) => !scope.classTeacherOf.includes(row.id));
  return { yearId: year.id, sections: [...first, ...rest], scope };
}

export async function sectionById(id: string, db?: DbOrTx): Promise<Section | null> {
  const conn = db ?? (await getDb());
  const [row] = await conn.select().from(sections).where(eq(sections.id, id)).limit(1);
  return row ?? null;
}

/** A holiday in the calendar that covers this day, if any. */
export async function holidayOn(day: string, db?: DbOrTx): Promise<{ id: string; title: string } | null> {
  const conn = db ?? (await getDb());
  const [row] = await conn
    .select({ id: calendarEvents.id, title: calendarEvents.title })
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.kind, 'holiday'),
        isNull(calendarEvents.deletedAt),
        lte(calendarEvents.startsOn, day),
        or(and(isNull(calendarEvents.endsOn), eq(calendarEvents.startsOn, day)), gte(calendarEvents.endsOn, day)),
      ),
    )
    .orderBy(asc(calendarEvents.startsOn))
    .limit(1);
  return row ?? null;
}

/** Every holiday day between two days (both included), with its name. */
export async function holidaysBetween(from: string, to: string, db?: DbOrTx): Promise<Map<string, string>> {
  const conn = db ?? (await getDb());
  const rows = await conn
    .select({ title: calendarEvents.title, startsOn: calendarEvents.startsOn, endsOn: calendarEvents.endsOn })
    .from(calendarEvents)
    .where(and(eq(calendarEvents.kind, 'holiday'), isNull(calendarEvents.deletedAt), lte(calendarEvents.startsOn, to), or(gte(calendarEvents.endsOn, from), gte(calendarEvents.startsOn, from))));
  const out = new Map<string, string>();
  for (const row of rows) {
    const end = row.endsOn && row.endsOn > row.startsOn ? row.endsOn : row.startsOn;
    for (let day = row.startsOn; day <= end; day = nextDay(day)) if (day >= from && day <= to && !out.has(day)) out.set(day, row.title);
  }
  return out;
}

const nextDay = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** Why the school is shut on this day, or null on a school day. */
export type Closed = { reason: 'sunday' } | { reason: 'holiday'; title: string } | null;

export async function closedOn(day: string, db?: DbOrTx): Promise<Closed> {
  if (weekday(day) === 0) return { reason: 'sunday' };
  const holiday = await holidayOn(day, db);
  return holiday ? { reason: 'holiday', title: holiday.title } : null;
}

/** Minutes since midnight in India: 11:30 → 690. */
export function istMinutes(now: Date = new Date()): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(now)
    .split(':')
    .map(Number);
  return h * 60 + m;
}

/** Every day of a month up to `until` (so a register never shows days still to come). */
export function daysOf(month: string, until: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: string[] = [];
  for (let d = 1; d <= last; d++) {
    const day = `${month}-${String(d).padStart(2, '0')}`;
    if (day > until) break;
    out.push(day);
  }
  return out;
}

export const isDay = (value: string | undefined | null): value is string => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(value as string));
export const isMonth = (value: string | undefined | null): value is string => /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? '');
