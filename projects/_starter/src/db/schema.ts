/**
 * The whole data model, in one file.
 *
 * Rules that hold for every table:
 *  - Money is whole rupees in an `integer` column. Never a float.
 *  - Dates without a time are `date` columns read as 'YYYY-MM-DD' strings.
 *  - A month is the text 'YYYY-MM'.
 *  - `meta` is a jsonb escape hatch for extras that do not deserve a column.
 *
 * A client-specific module adds its tables at the marked place below, then
 * `npm run db:generate` writes the migration (see docs/CONVENTIONS.md).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const meta = () => jsonb('meta').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`);

/* ───────────────────────────── value lists ───────────────────────────── */

export const ROLES = ['admin', 'staff'] as const;
export type Role = (typeof ROLES)[number];

export const ENQUIRY_STATUSES = ['new', 'contacted', 'closed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/* ───────────────────────────── people ───────────────────────────── */

export const users = pgTable(
  'users',
  {
    id: id(),
    name: text('name').notNull(),
    username: text('username').notNull(), // stored lower-case
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<Role>().notNull(),
    active: boolean('active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    failedLogins: integer('failed_logins').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('users_username_uq').on(t.username)],
);

/* ───────────────────────────── enquiries ───────────────────────────── */

/** What a visitor sends from the contact form of the website. */
export const enquiries = pgTable(
  'enquiries',
  {
    id: id(),
    name: text('name').notNull(),
    phone: text('phone').notNull().default(''),
    email: text('email').notNull().default(''),
    subject: text('subject').notNull().default(''),
    message: text('message').notNull(),
    source: text('source').notNull().default('website'),
    status: text('status').$type<EnquiryStatus>().notNull().default('new'),
    meta: meta(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('enquiries_status_idx').on(t.status, t.createdAt)],
);

/** Follow-up notes on an enquiry, newest first on screen. */
export const enquiryNotes = pgTable(
  'enquiry_notes',
  {
    id: id(),
    enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
    note: text('note').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdByName: text('created_by_name').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('enquiry_notes_enquiry_idx').on(t.enquiryId, t.createdAt)],
);

/* ───────────────────────────── communication ───────────────────────────── */

/** Notices and events shown on the website. */
export const announcements = pgTable(
  'announcements',
  {
    id: id(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    image: text('image').notNull().default(''),
    pinned: boolean('pinned').notNull().default(false),
    /** For events: the day it happens. */
    eventDate: date('event_date'),
    publishOn: date('publish_on').notNull(),
    expiresOn: date('expires_on'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('announcements_publish_idx').on(t.publishOn)],
);

/* ───────────────────────────── website content ───────────────────────────── */

/**
 * One row per editable section of the website (see src/cms). `data` is what
 * visitors see; `draft` is what the editor has saved but not published.
 */
export const siteContent = pgTable('site_content', {
  key: text('key').primaryKey(), // 'home.hero'
  data: jsonb('data').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  draft: jsonb('draft').$type<Record<string, unknown> | null>(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: updatedAt(),
});

/** Every publish keeps the previous version, so a change can be undone. */
export const contentRevisions = pgTable(
  'content_revisions',
  {
    id: id(),
    key: text('key').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    /** 'panel' or 'voice' */
    via: text('via').notNull().default('panel'),
    summary: text('summary').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdByName: text('created_by_name').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('content_revisions_key_idx').on(t.key, t.createdAt)],
);

export const media = pgTable(
  'media',
  {
    id: id(),
    url: text('url').notNull(),
    filename: text('filename').notNull().default(''),
    alt: text('alt').notNull().default(''),
    width: integer('width').notNull().default(0),
    height: integer('height').notNull().default(0),
    bytes: integer('bytes').notNull().default(0),
    folder: text('folder').notNull().default('general'),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [index('media_folder_idx').on(t.folder)],
);

export const galleryItems = pgTable(
  'gallery_items',
  {
    id: id(),
    url: text('url').notNull(),
    caption: text('caption').notNull().default(''),
    album: text('album').notNull().default('General'),
    width: integer('width').notNull().default(0),
    height: integer('height').notNull().default(0),
    sort: integer('sort').notNull().default(0),
    visible: boolean('visible').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index('gallery_album_idx').on(t.album)],
);

/* ───────────────────────────── system ───────────────────────────── */

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    userName: text('user_name').notNull().default(''),
    action: text('action').notNull(), // 'enquiry.status'
    entity: text('entity').notNull().default(''),
    entityId: text('entity_id').notNull().default(''),
    summary: text('summary').notNull().default(''),
    meta: meta(),
    createdAt: createdAt(),
  },
  (t) => [index('audit_log_created_idx').on(t.createdAt)],
);

/* ───────────────────────────── business modules ───────────────────────────── */

// Tables of a client-specific module go here.

/* ───────────────────────────── row types ───────────────────────────── */

export type User = typeof users.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type EnquiryNote = typeof enquiryNotes.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type MediaItem = typeof media.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
