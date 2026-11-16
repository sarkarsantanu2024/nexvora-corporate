/**
 * Everything the public website reads from the database.
 *
 * Each read is cached for a minute and tagged SITE_TAG, so a busy page does
 * not query the database on every visit, and a change made in the dashboard
 * shows within a minute (or at once, if the dashboard calls
 * revalidateTag('site-data') after saving).
 *
 * Only the columns the website shows are selected: nothing about owners,
 * royalty or suggested fees ever leaves the server through these functions.
 */
import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/db';
import { announcements, batches, centres, galleryItems, programmes, type CentreStatus, type ProgrammeI18n } from '@/db/schema';
import { seedSite } from '@/db/seed-site';
import { todayIST } from '@/lib/date';
import type { Lang } from '@/lib/i18n';
import { getLang, localizeProgramme } from '@/lib/lang';

export const SITE_TAG = 'site-data';
const cached = <A extends unknown[], T>(fn: (...args: A) => Promise<T>, key: string) =>
  unstable_cache(fn, ['site', key], { tags: [SITE_TAG], revalidate: 60 });

/* ───────────── programmes ───────────── */

export type SiteProgramme = {
  id: string;
  slug: string;
  name: string;
  ageLabel: string;
  ageFromMonths: number;
  ageToMonths: number;
  tagline: string;
  description: string;
  highlights: string[];
  image: string;
  color: string;
  seatsPerClass: number;
  timing: string;
  /** Bengali and Hindi wording, kept so the row can be shown in any language. */
  i18n: ProgrammeI18n;
};

const loadProgrammes = cached(async (): Promise<SiteProgramme[]> => {
  const db = await getDb();
  return db
    .select({
      id: programmes.id,
      slug: programmes.slug,
      name: programmes.name,
      ageLabel: programmes.ageLabel,
      ageFromMonths: programmes.ageFromMonths,
      ageToMonths: programmes.ageToMonths,
      tagline: programmes.tagline,
      description: programmes.description,
      highlights: programmes.highlights,
      image: programmes.image,
      color: programmes.color,
      seatsPerClass: programmes.seatsPerClass,
      timing: programmes.timing,
      i18n: programmes.i18n,
    })
    .from(programmes)
    .where(eq(programmes.active, true))
    .orderBy(asc(programmes.sort), asc(programmes.name));
}, 'programmes');

/**
 * The active programmes, worded in the visitor's language (English fills any
 * gap). The database rows are cached once; the language is applied per request.
 */
export async function getProgrammes(lang?: Lang): Promise<SiteProgramme[]> {
  const [rows, language] = await Promise.all([loadProgrammes(), lang ?? getLang()]);
  return rows.map((row) => localizeProgramme(row, language));
}

export async function getProgramme(slug: string): Promise<SiteProgramme | null> {
  return (await getProgrammes()).find((p) => p.slug === slug) ?? null;
}

/* ───────────── centres ───────────── */

export type SiteCentre = {
  id: string;
  name: string;
  slug: string;
  status: CentreStatus;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  mapUrl: string;
  photo: string;
};

/** Centres a visitor may see: switched on for the website, not removed, open or about to open. */
export const getCentres = cached(async (): Promise<SiteCentre[]> => {
  const db = await getDb();
  return db
    .select({
      id: centres.id,
      name: centres.name,
      slug: centres.slug,
      status: centres.status,
      address: centres.address,
      area: centres.area,
      city: centres.city,
      state: centres.state,
      pincode: centres.pincode,
      phone: centres.phone,
      whatsapp: centres.whatsapp,
      email: centres.email,
      mapUrl: centres.mapUrl,
      photo: centres.photo,
    })
    .from(centres)
    .where(and(eq(centres.showOnWebsite, true), isNull(centres.deletedAt), inArray(centres.status, ['active', 'onboarding'])))
    .orderBy(asc(centres.createdAt));
}, 'centres');

export async function getCentre(slug: string): Promise<SiteCentre | null> {
  return (await getCentres()).find((c) => c.slug === slug) ?? null;
}

/** Ids of the programmes a centre has a running class for. Empty when it has set up none yet. */
export const getCentreProgrammeIds = cached(async (centreId: string): Promise<string[]> => {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ programmeId: batches.programmeId })
    .from(batches)
    .where(and(eq(batches.centreId, centreId), eq(batches.active, true)));
  return rows.map((r) => r.programmeId);
}, 'centre-programmes');

/** "17/106, Dakshindari Road, Kolkata 700048" from the separate columns. */
export function centreAddress(c: Pick<SiteCentre, 'address' | 'area' | 'city' | 'pincode'>): string {
  const parts = [c.address.trim()];
  // The area is often already part of the street address ("Dakshindari Road").
  if (c.area && !c.address.toLowerCase().includes(c.area.toLowerCase())) parts.push(c.area);
  const cityLine = [c.city, c.pincode].filter(Boolean).join(' ');
  if (cityLine) parts.push(cityLine);
  return parts.filter(Boolean).join(', ');
}

/* ───────────── gallery ───────────── */

export type SitePhoto = { id: string; url: string; caption: string; album: string; width: number; height: number };

let sampleCheck: Promise<void> | null = null;
/**
 * The sample photos are added by seedSite on a brand-new database. A database
 * that was created before the website existed missed that step, so the first
 * gallery read of each server start gives seedSite one more chance. It keeps
 * a marker in `settings` and does nothing the second time, which also means
 * photos an owner deletes never come back.
 */
function ensureSamplePhotos(): Promise<void> {
  sampleCheck ??= getDb()
    .then((db) => seedSite(db))
    .catch((error) => {
      sampleCheck = null;
      console.error('[site] could not add the sample photos', error);
    });
  return sampleCheck;
}

export const getGallery = cached(async (): Promise<SitePhoto[]> => {
  await ensureSamplePhotos();
  const db = await getDb();
  return db
    .select({
      id: galleryItems.id,
      url: galleryItems.url,
      caption: galleryItems.caption,
      album: galleryItems.album,
      width: galleryItems.width,
      height: galleryItems.height,
    })
    .from(galleryItems)
    .where(eq(galleryItems.visible, true))
    .orderBy(asc(galleryItems.sort), desc(galleryItems.createdAt));
}, 'gallery');

/* ───────────── notices ───────────── */

export type SiteNotice = {
  id: string;
  /** Null when the notice is for every centre. */
  centreId: string | null;
  title: string;
  body: string;
  image: string;
  pinned: boolean;
  eventDate: string | null;
  publishOn: string;
};

// The day is part of the cache key, so a notice dated tomorrow appears tomorrow.
const noticesOn = cached(async (today: string): Promise<SiteNotice[]> => {
  const db = await getDb();
  return db
    .select({
      id: announcements.id,
      centreId: announcements.centreId,
      title: announcements.title,
      body: announcements.body,
      image: announcements.image,
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
}, 'notices');

/** Public notices that are published and have not expired. */
export const getNotices = () => noticesOn(todayIST());
