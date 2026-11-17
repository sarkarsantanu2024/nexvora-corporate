/**
 * The edit panel's rules, against a fresh in-memory database:
 * a draft never reaches visitors, publishing keeps the previous version,
 * restoring is an undo, and nothing the browser sends is trusted for shape.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { desc, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env.APP_DATA_DIR = 'memory';
delete process.env.DATABASE_URL;
delete process.env.BLOB_READ_WRITE_TOKEN;
const uploads = fs.mkdtempSync(path.join(os.tmpdir(), 'starter-uploads-'));
process.env.APP_UPLOAD_DIR = uploads;

import { SECTIONS } from '@/cms/sections';
import { resolveContent } from '@/cms/content';
import type { ContentData, ListField, ScalarField, SectionDef } from '@/cms/types';
import { getDb, type DB } from '@/db';
import * as s from '@/db/schema';
import { ApiError } from '@/lib/api';
import * as gallery from '@/server/cms/gallery';
import { deleteMedia, listMedia, storeImage, updateMediaAlt } from '@/server/cms/media';
import * as cms from '@/server/cms/service';
import { resolveLocal } from '@/server/cms/storage';

let db: DB;
let actor: { uid: string; name: string };

const CONTACT = 'site.contact';
const contactDef = SECTIONS.find((section) => section.key === CONTACT) as SectionDef;

beforeAll(async () => {
  db = await getDb();
  const [admin] = await db.select().from(s.users).where(eq(s.users.username, 'admin'));
  actor = { uid: admin.id, name: admin.name };
}, 120_000);

afterAll(() => fs.rmSync(uploads, { recursive: true, force: true }));

const row = async (key: string) => (await db.select().from(s.siteContent).where(eq(s.siteContent.key, key)))[0];
const fieldsOf = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => null,
    (cause) => cause,
  );
  expect(error).toBeInstanceOf(ApiError);
  return (error as ApiError).fields ?? {};
};

describe('validation', () => {
  const base = contactDef.defaults as ContentData;

  it('drops keys the section does not define', () => {
    const { data, errors } = cms.validateContent(contactDef, { hours: 'All day', evil: '<script>', __proto__: { x: 1 } }, base);
    expect(errors).toEqual({});
    expect(data.hours).toBe('All day');
    expect(Object.keys(data).sort()).toEqual(contactDef.fields.map((field) => field.name).sort());
  });

  it('keeps the current value of fields that were not sent', () => {
    const { data } = cms.validateContent(contactDef, { hours: 'All day' }, { ...base, address: 'Somewhere else' });
    expect(data.address).toBe('Somewhere else');
  });

  it('checks phones, emails and links', () => {
    const { data, errors } = cms.validateContent(contactDef, { phone: '+91 98300 12345', whatsapp: '12345', email: 'not-an-email', mapUrl: 'javascript:alert(1)', facebook: 'facebook.com/sunrisestore' }, base);
    expect(data.phone).toBe('9830012345');
    expect(data.facebook).toBe('https://facebook.com/sunrisestore');
    expect(Object.keys(errors).sort()).toEqual(['email', 'mapUrl', 'whatsapp']);
  });

  it('accepts only site paths and https addresses for photos', () => {
    expect(cms.isSafeImage('/media/website/a.webp')).toBe(true);
    expect(cms.isSafeImage('https://x.public.blob.vercel-storage.com/a.webp')).toBe(true);
    expect(cms.isSafeImage('')).toBe(true);
    for (const bad of ['http://plain.example/a.jpg', '//evil.example/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,AAAA', '/media/../../etc/passwd', '/a b.jpg', 'a.jpg']) {
      expect(cms.isSafeImage(bad), bad).toBe(false);
    }
  });

  it('enforces the length a field sets', () => {
    const def = SECTIONS.find((section) => section.fields.some((field) => field.type === 'text' && field.maxLength)) as SectionDef;
    const field = def.fields.find((item) => item.type === 'text' && item.maxLength) as ScalarField;
    const { errors } = cms.validateContent(def, { [field.name]: 'x'.repeat((field.maxLength ?? 0) + 1) }, def.defaults as ContentData);
    expect(errors[field.name]).toMatch(/within/);
    expect(cms.validateContent(def, { [field.name]: 'x'.repeat(field.maxLength ?? 0) }, def.defaults as ContentData).errors).toEqual({});
  });

  it('rebuilds list rows from the row definition', () => {
    const def = SECTIONS.find((section) => section.fields.some((field) => field.type === 'list')) as SectionDef | undefined;
    if (!def) return; // no list sections registered yet
    const list = def.fields.find((field) => field.type === 'list') as ListField;
    const first = list.fields.find((field) => field.type === 'text' || field.type === 'textarea') as ScalarField;
    const { data, errors } = cms.validateContent(def, { [list.name]: [{ [first.name]: 'Kept', junk: 'dropped' }, {}, 'not a row', { [first.name]: '   ' }] }, def.defaults as ContentData);
    const rows = data[list.name] as Record<string, string>[];
    expect(rows).toHaveLength(1);
    expect(rows[0][first.name]).toBe('Kept');
    expect(Object.keys(rows[0]).sort()).toEqual(list.fields.map((field) => field.name).sort());
    expect(errors).toEqual({});
    if (list.max) {
      const tooMany = Array.from({ length: list.max + 1 }, (_, i) => ({ [first.name]: `Row ${i}` }));
      expect(cms.validateContent(def, { [list.name]: tooMany }, def.defaults as ContentData).errors[list.name]).toMatch(/At most/);
    }
  });

  it('refuses a section that does not exist', async () => {
    await expect(cms.saveDraft(actor, 'no.such', {})).rejects.toMatchObject({ status: 404 });
  });
});

describe('draft, publish, revision, restore', () => {
  const original = contactDef.defaults.hours as string;

  it('saves a draft without touching the live content', async () => {
    const state = await cms.saveDraft(actor, CONTACT, { hours: 'Monday to Friday, 10 am to 4 pm' });
    expect(state.hasDraft).toBe(true);
    expect(state.draft?.hours).toBe('Monday to Friday, 10 am to 4 pm');
    expect(state.published.hours).toBe(original);
    const stored = await row(CONTACT);
    expect((stored.data as ContentData).hours ?? original).toBe(original);
  });

  it('rejects a bad draft and names the field', async () => {
    const fields = await fieldsOf(cms.saveDraft(actor, CONTACT, { phone: '123' }));
    expect(fields.phone).toMatch(/10 digit/);
    expect((await cms.getSectionState(CONTACT)).draft?.phone).toBe(contactDef.defaults.phone);
  });

  it('publishes: live content changes, draft clears, the previous version is kept', async () => {
    const result = await cms.publishSection(actor, CONTACT);
    const state = await cms.getSectionState(CONTACT);
    expect(state.hasDraft).toBe(false);
    expect(state.published.hours).toBe('Monday to Friday, 10 am to 4 pm');

    const [revision] = await db.select().from(s.contentRevisions).where(eq(s.contentRevisions.id, result.revisionId));
    expect(revision.key).toBe(CONTACT);
    expect((revision.data as ContentData).hours).toBe(original);
    expect(revision.via).toBe('panel');
    expect(revision.createdByName).toBe(actor.name);

    const [log] = await db.select().from(s.auditLog).where(eq(s.auditLog.action, 'website.publish')).orderBy(desc(s.auditLog.createdAt)).limit(1);
    expect(log.entityId).toBe(CONTACT);
    expect(log.userId).toBe(actor.uid);
  });

  it('will not publish when there is nothing to publish', async () => {
    await expect(cms.publishSection(actor, CONTACT)).rejects.toMatchObject({ status: 400 });
  });

  it('restores a revision, and the restore can itself be undone', async () => {
    const [latest] = await cms.listRevisions({ key: CONTACT, limit: 1 });
    const undone = await cms.restoreRevision(actor, latest.id);
    expect((await cms.getSectionState(CONTACT)).published.hours).toBe(original);

    await cms.restoreRevision(actor, undone.revisionId);
    expect((await cms.getSectionState(CONTACT)).published.hours).toBe('Monday to Friday, 10 am to 4 pm');

    await cms.restoreRevision(actor, latest.id);
    expect((await cms.getSectionState(CONTACT)).published.hours).toBe(original);
    await expect(cms.restoreRevision(actor, '00000000-0000-4000-8000-000000000000')).rejects.toMatchObject({ status: 404 });
  });

  it('drops the draft when it is typed back to what is live', async () => {
    await cms.saveDraft(actor, CONTACT, { hours: 'Something new' });
    const state = await cms.saveDraft(actor, CONTACT, { hours: original });
    expect(state.hasDraft).toBe(false);
  });

  it('discards a draft', async () => {
    await cms.saveDraft(actor, CONTACT, { hours: 'Never published' });
    const state = await cms.discardDraft(actor, CONTACT);
    expect(state.hasDraft).toBe(false);
    expect(state.published.hours).toBe(original);
  });

  it('marks what was changed by voice, through to the revision', async () => {
    await cms.saveDraft(actor, CONTACT, { hours: 'Said out loud' }, 'voice');
    await cms.saveDraft(actor, CONTACT, { address: 'Typed afterwards' });
    const result = await cms.publishSection(actor, CONTACT);
    const [revision] = await db.select().from(s.contentRevisions).where(eq(s.contentRevisions.id, result.revisionId));
    expect(revision.via).toBe('voice');
    const published = (await row(CONTACT)).data as Record<string, unknown>;
    expect(published._via).toBeUndefined();
    const [log] = await db.select().from(s.auditLog).where(eq(s.auditLog.action, 'website.draft')).orderBy(desc(s.auditLog.createdAt)).limit(1);
    expect(log.summary).toMatch(/by voice/);
    await cms.restoreRevision(actor, result.revisionId);
  });

  it('resets to the original wording as a draft', async () => {
    await cms.saveDraft(actor, CONTACT, { hours: 'Changed' });
    await cms.publishSection(actor, CONTACT);
    const state = await cms.resetToDefault(actor, CONTACT);
    expect(state.published.hours).toBe('Changed');
    expect(state.draft?.hours).toBe(original);
    await cms.publishSection(actor, CONTACT);
    expect((await cms.getSectionState(CONTACT)).published).toEqual(contactDef.defaults);
  });
});

describe('hide and show', () => {
  it('hides in the draft first, on the live site after publishing', async () => {
    const hidden = await cms.setHidden(actor, CONTACT, true);
    expect(hidden.hidden).toBe(false);
    expect(hidden.hiddenInDraft).toBe(true);
    await cms.publishSection(actor, CONTACT);
    expect((await cms.getSectionState(CONTACT)).hidden).toBe(true);
  });

  it('keeps it hidden through an unrelated edit', async () => {
    const state = await cms.saveDraft(actor, CONTACT, { hours: 'Edited while hidden' });
    expect(state.hiddenInDraft).toBe(true);
    await cms.discardDraft(actor, CONTACT);
  });

  it('shows it again', async () => {
    const shown = await cms.setHidden(actor, CONTACT, false);
    expect(shown.hiddenInDraft).toBe(false);
    expect(shown.hidden).toBe(true);
    await cms.publishSection(actor, CONTACT);
    const state = await cms.getSectionState(CONTACT);
    expect(state.hidden).toBe(false);
    expect(state.published._hidden).toBeUndefined();
  });
});

describe('other languages', () => {
  const BN = `${CONTACT}@bn`;
  const live = async () => {
    const rows = await db.select().from(s.siteContent);
    const byKey = new Map(rows.map((item) => [item.key, item.data as ContentData]));
    return (lang: 'en' | 'bn' | 'hi') => resolveContent(contactDef, lang, (key) => byKey.get(key));
  };

  it('resolves suffixed keys to the section, and nothing else', async () => {
    expect(cms.resolveKey(BN)).toMatchObject({ lang: 'bn', key: BN });
    expect(cms.resolveKey(`${CONTACT}@hi`)?.def.key).toBe(CONTACT);
    expect(cms.resolveKey(CONTACT)?.lang).toBe('en');
    for (const bad of [`${CONTACT}@fr`, `${CONTACT}@`, `${CONTACT}@bn@hi`, '@bn', 'no.such@bn', `${CONTACT}@BN`, `${CONTACT} @bn`]) {
      expect(cms.resolveKey(bad), bad).toBeNull();
      await expect(cms.saveDraft(actor, bad, { hours: 'x' })).rejects.toMatchObject({ status: 404 });
    }
  });

  it('saves a translated draft apart from English, and from the live site', async () => {
    const state = await cms.saveDraft(actor, BN, { hours: 'সোম থেকে শনি, সকাল ৯টা থেকে বিকেল ৫টা' });
    expect(state).toMatchObject({ key: BN, section: CONTACT, lang: 'bn', hasDraft: true });
    expect(state.draft?.hours).toBe('সোম থেকে শনি, সকাল ৯টা থেকে বিকেল ৫টা');
    expect(state.reference?.hours).toBe(contactDef.defaults.hours);
    expect((await cms.getSectionState(CONTACT)).hasDraft).toBe(false);
    const read = await live();
    expect(read('bn').hours).not.toBe('সোম থেকে শনি, সকাল ৯টা থেকে বিকেল ৫টা');
    const overview = (await cms.getAllStates()).find((item) => item.key === CONTACT);
    expect(overview?.draftLangs).toEqual(['bn']);
  });

  it('keeps only wording in a translation: photos, links and phones stay shared', async () => {
    const state = await cms.saveDraft(actor, BN, { address: 'দক্ষিণদাঁড়ি রোড, কলকাতা', phone: '9999999999', mapUrl: 'https://evil.example', _hidden: '1', junk: 'x' });
    expect(Object.keys(state.draft ?? {})).not.toContain('phone');
    const stored = (await row(BN)).draft as Record<string, unknown>;
    expect(Object.keys(stored).sort()).toEqual(['address', 'hours']);
    expect((await cms.getSectionState(CONTACT)).hiddenInDraft).toBe(false);
  });

  it('publishes the translation under its own key, with its own history', async () => {
    const result = await cms.publishSection(actor, BN);
    expect(result.key).toBe(BN);
    const [revision] = await db.select().from(s.contentRevisions).where(eq(s.contentRevisions.id, result.revisionId));
    expect(revision.key).toBe(BN);
    expect(revision.data).toEqual({});
    expect((await cms.listRevisions({ key: BN, limit: 1 }))[0]).toMatchObject({ key: BN, section: CONTACT, lang: 'bn' });

    const read = await live();
    expect(read('bn').hours).toBe('সোম থেকে শনি, সকাল ৯টা থেকে বিকেল ৫টা');
    expect(read('bn').address).toBe('দক্ষিণদাঁড়ি রোড, কলকাতা');
    // Shared fields come from English; other languages are untouched.
    expect(read('bn').phone).toBe(read('en').phone);
    expect(read('en').hours).toBe(contactDef.defaults.hours);
    expect(read('hi').address).not.toBe('দক্ষিণদাঁড়ি রোড, কলকাতা');
  });

  it('falls back in order: saved translation, built-in translation, English', async () => {
    const builtIn = ((contactDef.translations?.bn ?? {}) as ContentData).hours;
    // Clearing the box removes the saved wording: the built-in translation (or English) shows again.
    await cms.saveDraft(actor, BN, { hours: '' });
    await cms.publishSection(actor, BN);
    const read = await live();
    expect(read('bn').hours).toBe(typeof builtIn === 'string' && builtIn ? builtIn : read('en').hours);
    expect(read('bn').address).toBe('দক্ষিণদাঁড়ি রোড, কলকাতা');
    expect((await cms.getSectionState(BN)).published.hours).toBe(typeof builtIn === 'string' ? builtIn : '');

    // A change to English shows through wherever the translation has nothing of its own.
    await cms.saveDraft(actor, CONTACT, { phone: '9830012345' });
    await cms.publishSection(actor, CONTACT);
    expect((await live())('bn').phone).toBe('9830012345');
    await cms.resetToDefault(actor, CONTACT);
    await cms.publishSection(actor, CONTACT);
  });

  it('restores a translation from its history, and resets it to the built-in wording', async () => {
    const [latest] = await cms.listRevisions({ key: BN, limit: 1 });
    await cms.restoreRevision(actor, latest.id);
    expect((await live())('bn').hours).toBe('সোম থেকে শনি, সকাল ৯টা থেকে বিকেল ৫টা');

    const reset = await cms.resetToDefault(actor, BN);
    expect(reset.hasDraft).toBe(true);
    await cms.publishSection(actor, BN);
    expect((await row(BN)).data).toEqual({});
    expect((await cms.getSectionState(BN)).hasDraft).toBe(false);
  });

  it('starts a translated list from the English rows, and stores it only once it differs', async () => {
    const def = SECTIONS.find((section) => section.fields.some((field) => field.type === 'list') && !section.translations?.bn) as SectionDef | undefined;
    if (!def) return; // every list section ships a translation
    const list = def.fields.find((field) => field.type === 'list') as ListField;
    const key = `${def.key}@bn`;
    const start = await cms.getSectionState(key);
    expect(start.published[list.name]).toEqual((start.reference as ContentData)[list.name]);
    // Saving the English rows back unchanged stores nothing.
    expect((await cms.saveDraft(actor, key, { [list.name]: start.published[list.name] })).hasDraft).toBe(false);
    const rows = start.published[list.name] as Record<string, string>[];
    const text = list.fields.find((field) => field.type === 'text' || field.type === 'textarea') as ScalarField;
    if (!rows.length) return;
    const changed = rows.map((item, index) => (index === 0 ? { ...item, [text.name]: 'বাংলা' } : item));
    const state = await cms.saveDraft(actor, key, { [list.name]: changed });
    expect(state.hasDraft).toBe(true);
    expect((state.draft?.[list.name] as Record<string, string>[])[0][text.name]).toBe('বাংলা');
    await cms.discardDraft(actor, key);
  });

  it('hides a section from the English row whichever language asked', async () => {
    const state = await cms.setHidden(actor, BN, true);
    expect(state.hiddenInDraft).toBe(true);
    expect((await row(BN))?.draft ?? null).toBeNull();
    expect((await cms.getSectionState(CONTACT)).hasDraft).toBe(true);
    await cms.discardDraft(actor, CONTACT);
  });

  it('publishes every language with "publish all"', async () => {
    await cms.saveDraft(actor, BN, { hours: 'বাংলা সময়' });
    await cms.saveDraft(actor, `${CONTACT}@hi`, { hours: 'हिंदी समय' });
    await cms.saveDraft(actor, CONTACT, { hours: 'English hours' });
    expect((await cms.getAllStates()).find((item) => item.key === CONTACT)?.draftLangs).toEqual(['en', 'bn', 'hi']);
    const published = await cms.publishAll(actor);
    expect(published.map((item) => item.key).sort()).toEqual([CONTACT, BN, `${CONTACT}@hi`].sort());
    const read = await live();
    expect([read('en').hours, read('bn').hours, read('hi').hours]).toEqual(['English hours', 'বাংলা সময়', 'हिंदी समय']);
    // Leave the section as it started for the tests that follow.
    for (const key of [BN, `${CONTACT}@hi`, CONTACT]) {
      await cms.resetToDefault(actor, key);
      await cms.publishSection(actor, key);
    }
  });
});

describe('links and choices in list rows', () => {
  it('accepts YouTube links and .mp4 addresses, and refuses the rest', () => {
    const def: SectionDef = {
      key: 'test.slides',
      page: 'Test',
      label: 'Slides',
      fields: [
        {
          name: 'slides',
          label: 'Slides',
          type: 'list',
          itemLabel: 'slide',
          fields: [
            { name: 'kind', label: 'Kind', type: 'select', options: [{ value: 'photo', label: 'Photo' }, { value: 'video', label: 'Video' }] },
            { name: 'image', label: 'Photo', type: 'image' },
            { name: 'video', label: 'Video link', type: 'url' },
          ],
        },
      ],
      defaults: { slides: [] },
    };
    const check = (video: string) => cms.validateContent(def, { slides: [{ kind: 'video', video }] }, def.defaults);
    for (const good of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://cdn.example.com/day.mp4', '/videos/opening-day.mp4']) {
      const { data, errors } = check(good);
      expect(errors, good).toEqual({});
      expect((data.slides as Record<string, string>[])[0].video).toBe(good);
    }
    expect((check('youtu.be/dQw4w9WgXcQ').data.slides as Record<string, string>[])[0].video).toBe('https://youtu.be/dQw4w9WgXcQ');
    for (const bad of ['javascript:alert(1)', 'data:video/mp4;base64,AAAA', '//evil.example/a.mp4', 'https://a.example/x.mp4" onload="x', 'file:///c:/a.mp4']) {
      expect(Object.keys(check(bad).errors), bad).toEqual(['slides.0.video']);
    }

    // A row with nothing but its default choice is an empty row; an unset choice takes the first option.
    const { data, errors } = cms.validateContent(def, { slides: [{ kind: 'photo' }, { kind: '', image: '/media/website/a.webp' }, { kind: 'film', image: '/media/website/b.webp' }] }, def.defaults);
    expect(data.slides).toEqual([
      { kind: 'photo', image: '/media/website/a.webp', video: '' },
      { kind: 'film', image: '/media/website/b.webp', video: '' },
    ]);
    expect(errors).toEqual({ 'slides.1.kind': 'Pick one of the choices' });
  });
});

describe('all sections at once', () => {
  it('publishes every draft and reports which', async () => {
    const other = SECTIONS.find((section) => section.key !== CONTACT && section.fields.some((field) => field.type === 'text')) as SectionDef;
    const field = other.fields.find((item) => item.type === 'text') as ScalarField;
    await cms.saveDraft(actor, CONTACT, { hours: 'Draft one' });
    await cms.saveDraft(actor, other.key, { [field.name]: 'Draft two' });
    expect((await cms.getAllStates()).filter((state) => state.hasDraft).map((state) => state.key).sort()).toEqual([CONTACT, other.key].sort());

    const published = await cms.publishAll(actor, 'voice');
    expect(published.map((item) => item.key).sort()).toEqual([CONTACT, other.key].sort());
    expect((await cms.getSectionState(other.key)).published[field.name]).toBe('Draft two');
    expect((await cms.getAllStates()).some((state) => state.hasDraft)).toBe(false);
    const [revision] = await db.select().from(s.contentRevisions).where(eq(s.contentRevisions.id, published[0].revisionId));
    expect(revision.via).toBe('voice');
  });

  it('discards every draft', async () => {
    await cms.saveDraft(actor, CONTACT, { hours: 'Throw away' });
    expect(await cms.discardAll(actor)).toBe(1);
    expect(await cms.discardAll(actor)).toBe(0);
  });
});

describe('media', () => {
  let id = '';
  let url = '';

  it('shrinks, converts and stores an upload', async () => {
    const big = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: '#3f348f' } }).jpeg().toBuffer();
    const stored = await storeImage(actor, { bytes: big, filename: 'Opening Day 2026.JPG' }, { folder: 'Web Site!', alt: 'The team on stage' });
    ({ id, url } = stored);
    expect(stored.width).toBe(1920);
    expect(stored.height).toBe(960);
    expect(url).toMatch(/^\/media\/web-site\/opening-day-2026-[0-9a-f]{10}\.webp$/);
    const file = resolveLocal(url.replace('/media/', '').split('/'));
    expect(file && fs.existsSync(file)).toBe(true);
    expect((await sharp(fs.readFileSync(file as string)).metadata()).format).toBe('webp');
    const { items, folders } = await listMedia({ folder: 'web-site' });
    expect(items.map((item) => item.id)).toContain(id);
    expect(folders.find((folder) => folder.folder === 'web-site')?.n).toBe(1);
  });

  it('turns a phone photo the right way up and drops its camera data', async () => {
    const sideways = await sharp({ create: { width: 400, height: 200, channels: 3, background: '#e31e24' } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const stored = await storeImage(actor, { bytes: sideways, filename: 'phone.jpg' });
    expect([stored.width, stored.height]).toEqual([200, 400]);
    const file = resolveLocal(stored.url.replace('/media/', '').split('/')) as string;
    const meta = await sharp(fs.readFileSync(file)).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });

  it('refuses what is not a photo, and what is too large', async () => {
    await expect(storeImage(actor, { bytes: Buffer.from('<?php echo 1; ?>'), filename: 'shell.jpg' })).rejects.toMatchObject({ status: 415 });
    await expect(storeImage(actor, { bytes: Buffer.alloc(0), filename: 'empty.jpg' })).rejects.toMatchObject({ status: 400 });
    await expect(storeImage(actor, { bytes: Buffer.alloc(12 * 1024 * 1024 + 1), filename: 'huge.jpg' })).rejects.toMatchObject({ status: 413 });
  });

  it('will not serve a path outside the upload folder', () => {
    expect(resolveLocal(['..', '..', 'package.json'])).toBeNull();
    expect(resolveLocal(['website', '..%2f..%2fsecret'])).toBeNull();
    expect(resolveLocal(['website', '../x.webp'])).toBeNull();
    expect(resolveLocal(['C:', 'Windows', 'win.ini'])).toBeNull();
    expect(resolveLocal([])).toBeNull();
    expect(resolveLocal(['website', 'a.webp'])).toBe(path.join(uploads, 'website', 'a.webp'));
  });

  it('edits the description, then deletes the row and the file', async () => {
    expect((await updateMediaAlt(actor, id, { alt: '  Stage  ' })).alt).toBe('Stage');
    const file = resolveLocal(url.replace('/media/', '').split('/')) as string;
    await deleteMedia(actor, id);
    expect(fs.existsSync(file)).toBe(false);
    await expect(deleteMedia(actor, id)).rejects.toMatchObject({ status: 404 });
  });
});

describe('gallery and notices', () => {
  it('adds photos to an album in order, reorders, hides and deletes', async () => {
    const before = (await gallery.listGallery()).length;
    const rows = await gallery.addGalleryPhotos(actor, {
      album: '  Opening   day ',
      photos: [
        { url: '/media/gallery/a.webp', width: 10, height: 10 },
        { url: '/media/gallery/b.webp', width: 10, height: 10, caption: 'Cutting the ribbon' },
      ],
    });
    expect(rows.map((item) => [item.album, item.sort])).toEqual([
      ['Opening day', 0],
      ['Opening day', 1],
    ]);
    await expect(gallery.addGalleryPhotos(actor, { album: 'X', photos: [{ url: 'javascript:alert(1)' }] })).rejects.toThrow();

    await gallery.reorderGallery(actor, [rows[1].id, rows[0].id]);
    const album = (await gallery.listGallery()).filter((item) => item.album === 'Opening day');
    expect(album.map((item) => item.url)).toEqual(['/media/gallery/b.webp', '/media/gallery/a.webp']);

    expect((await gallery.updateGalleryItem(actor, rows[0].id, { visible: false })).visible).toBe(false);
    expect(await gallery.albumNames()).toContain('Opening day');
    expect(await gallery.deleteGalleryItems(actor, rows.map((item) => item.id))).toBe(2);
    expect((await gallery.listGallery()).length).toBe(before);
  });

  it('creates a notice for today and works out its status', async () => {
    const notice = await gallery.createNotice(actor, { title: 'Closed on Friday for Kali Puja' }, 'voice');
    expect(gallery.noticeStatus(notice)).toBe('live');
    expect(gallery.noticeStatus({ publishOn: '2026-12-01', expiresOn: null }, '2026-11-16')).toBe('scheduled');
    expect(gallery.noticeStatus({ publishOn: '2026-11-01', expiresOn: '2026-11-10' }, '2026-11-16')).toBe('expired');
    expect(gallery.noticeStatus({ publishOn: '2026-11-01', expiresOn: '2026-11-16' }, '2026-11-16')).toBe('live');

    await expect(gallery.createNotice(actor, { title: '' })).rejects.toThrow();
    await expect(gallery.createNotice(actor, { title: 'Bad dates', publishOn: '2026-11-20', expiresOn: '2026-11-10' })).rejects.toThrow();
    const changed = await gallery.updateNotice(actor, notice.id, { title: 'Closed on Friday', pinned: true, publishOn: notice.publishOn });
    expect(changed.pinned).toBe(true);
    expect((await gallery.listNotices())[0].id).toBe(notice.id);
    await gallery.deleteNotice(actor, notice.id);
    await expect(gallery.deleteNotice(actor, notice.id)).rejects.toMatchObject({ status: 404 });
  });
});
