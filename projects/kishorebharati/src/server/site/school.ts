/**
 * The school's own website reads: teachers, the calendar and public notices.
 *
 * Plain functions over a database handle, with no Next.js cache in them, so
 * the tests can call them directly; ./queries.ts wraps each one in the
 * site's one-minute cache for the pages. Only the columns the website shows
 * are selected: no phone numbers, emails or anything else private.
 */
import { and, asc, desc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import type { DbOrTx } from '@/db';
import { announcements, calendarEvents, staff, type CalendarKind } from '@/db/schema';

/* ───────────── teachers and staff ───────────── */

export type SiteStaff = {
  id: string;
  name: string;
  nameBn: string;
  kind: string;
  designation: string;
  subjects: string;
  photo: string;
};

/** Everyone the school has marked to show on the website: active, not in the Trash, in the school's own order. */
export async function loadWebsiteStaff(db: DbOrTx): Promise<SiteStaff[]> {
  return db
    .select({
      id: staff.id,
      name: staff.name,
      nameBn: staff.nameBn,
      kind: staff.kind,
      designation: staff.designation,
      subjects: staff.subjects,
      photo: staff.photo,
    })
    .from(staff)
    .where(and(eq(staff.showOnWebsite, true), eq(staff.active, true), isNull(staff.deletedAt)))
    .orderBy(asc(staff.sort), asc(staff.name));
}

// "Headmaster", "Head Master", "Head teacher", "Teacher-in-charge", or the same in Bengali.
const HEAD = /head\s*-?\s*(master|mistress|teacher)|teacher[\s-]*in[\s-]*charge|প্রধান\s*শিক্ষক|ভারপ্রাপ্ত\s*শিক্ষক/i;

export const isHead = (person: Pick<SiteStaff, 'designation'>) => HEAD.test(person.designation);

/** Headmaster first, then the teachers, then the office and support staff; each keeps the school's own order. */
export function groupStaff<T extends Pick<SiteStaff, 'designation' | 'kind'>>(rows: T[]) {
  const head = rows.filter(isHead);
  const rest = rows.filter((row) => !isHead(row));
  return {
    head,
    teaching: rest.filter((row) => row.kind !== 'non_teaching'),
    nonTeaching: rest.filter((row) => row.kind === 'non_teaching'),
  };
}

/** The name a visitor reads: the Bengali one on the Bengali site when it is filled in. */
export const staffName = (person: Pick<SiteStaff, 'name' | 'nameBn'>, lang: string) => (lang === 'bn' && person.nameBn.trim() ? person.nameBn : person.name);

/* ───────────── calendar ───────────── */

export type SiteEvent = {
  id: string;
  title: string;
  kind: CalendarKind;
  startsOn: string;
  endsOn: string | null;
  venue: string;
  details: string;
  image: string;
  galleryAlbum: string;
};

/** Everything on the public calendar from the start of `fromDay` onwards, oldest first. */
export async function loadPublicEvents(db: DbOrTx, fromDay: string): Promise<SiteEvent[]> {
  return db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      kind: calendarEvents.kind,
      startsOn: calendarEvents.startsOn,
      endsOn: calendarEvents.endsOn,
      venue: calendarEvents.venue,
      details: calendarEvents.details,
      image: calendarEvents.image,
      galleryAlbum: calendarEvents.galleryAlbum,
    })
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.showOnWebsite, true),
        isNull(calendarEvents.deletedAt),
        // An event that started before `fromDay` but is still running counts too.
        or(gte(calendarEvents.startsOn, fromDay), gte(calendarEvents.endsOn, fromDay)),
      ),
    )
    .orderBy(asc(calendarEvents.startsOn), asc(calendarEvents.title));
}

/** Splits the calendar for the Events page: what is coming, the holidays of the year, what already happened this year. */
export function splitEvents(events: SiteEvent[], today: string) {
  const ended = (e: SiteEvent) => (e.endsOn ?? e.startsOn) < today;
  return {
    upcoming: events.filter((e) => !ended(e) && e.kind !== 'holiday'),
    holidays: events.filter((e) => e.kind === 'holiday' && e.startsOn.slice(0, 4) === today.slice(0, 4)),
    past: events.filter((e) => ended(e) && e.kind !== 'holiday').reverse(),
  };
}

/* ───────────── notices ───────────── */

export type SiteNotice = {
  id: string;
  title: string;
  body: string;
  image: string;
  attachment: string;
  pinned: boolean;
  eventDate: string | null;
  publishOn: string;
};

/** Notices meant for the public that are published by `today` and have not expired. Pinned first, then newest. */
export async function loadPublicNotices(db: DbOrTx, today: string): Promise<SiteNotice[]> {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      image: announcements.image,
      attachment: announcements.attachment,
      pinned: announcements.pinned,
      eventDate: announcements.eventDate,
      publishOn: announcements.publishOn,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.audience, 'public'),
        lte(announcements.publishOn, today),
        or(isNull(announcements.expiresOn), gte(announcements.expiresOn, today)),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.publishOn), desc(announcements.createdAt));
}

/** The notices page's search box and year filter, applied to the cached list. */
export function filterNotices(notices: SiteNotice[], q: string, year: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return notices.filter((n) => {
    if (year && n.publishOn.slice(0, 4) !== year && n.eventDate?.slice(0, 4) !== year) return false;
    const hay = `${n.title} ${n.body}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
