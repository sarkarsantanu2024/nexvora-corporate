'use server';

/**
 * What the edit panel and the voice assistant call. Each one checks the
 * login, runs the service, then tells Next which pages are stale.
 * Anyone on the team may edit the website.
 */
import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { CMS_TAG, PREVIEW_COOKIE } from '@/cms/content';
import { action } from '@/lib/api';
import { TEAM_ROLES, requireSession } from '@/lib/auth';
import * as gallery from './gallery';
import * as mediaLib from './media';
import * as cms from './service';
import type { Via } from './service';

const asVia = (via: unknown): Via => (via === 'voice' ? 'voice' : 'panel');

/** The panel's own screens show drafts, so they are stale after any change. */
function panelChanged() {
  revalidatePath('/admin/website', 'layout');
}

/** The live site changed: drop the cached content and the pages built from it. */
function siteChanged() {
  revalidateTag(CMS_TAG);
  revalidatePath('/', 'layout');
}

/* ───────────── sections ───────────── */

export const saveDraftAction = action(async (key: string, values: unknown, via?: Via) => {
  const session = await requireSession(TEAM_ROLES);
  const state = await cms.saveDraft(session, key, values, asVia(via));
  panelChanged();
  return state;
});

export const publishAction = action(async (key: string, values: unknown | null, via?: Via) => {
  const session = await requireSession(TEAM_ROLES);
  // The form sends what is on screen, so "Publish" also saves anything not yet saved.
  if (values !== null) await cms.saveDraft(session, key, values, asVia(via));
  const state = await cms.getSectionState(key);
  if (state.hasDraft) await cms.publishSection(session, key, { via: asVia(via) });
  siteChanged();
  panelChanged();
  return cms.getSectionState(key);
});

export const discardDraftAction = action(async (key: string) => {
  const session = await requireSession(TEAM_ROLES);
  const state = await cms.discardDraft(session, key);
  panelChanged();
  return state;
});

export const resetToDefaultAction = action(async (key: string) => {
  const session = await requireSession(TEAM_ROLES);
  const state = await cms.resetToDefault(session, key);
  panelChanged();
  return state;
});

export const setHiddenAction = action(async (key: string, hidden: boolean, via?: Via) => {
  const session = await requireSession(TEAM_ROLES);
  const state = await cms.setHidden(session, key, hidden, asVia(via));
  panelChanged();
  return state;
});

export const publishAllAction = action(async (via?: Via) => {
  const session = await requireSession(TEAM_ROLES);
  const published = await cms.publishAll(session, asVia(via));
  siteChanged();
  panelChanged();
  return published;
});

export const discardAllAction = action(async () => {
  const session = await requireSession(TEAM_ROLES);
  const n = await cms.discardAll(session);
  panelChanged();
  return n;
});

export const restoreRevisionAction = action(async (revisionId: string, via?: Via) => {
  const session = await requireSession(TEAM_ROLES);
  const result = await cms.restoreRevision(session, revisionId, asVia(via));
  siteChanged();
  panelChanged();
  return result;
});

/** For "undo" by voice: put a section's draft back to what it was before the last spoken change. */
export const restoreDraftAction = action(async (key: string, previous: unknown | null) => {
  const session = await requireSession(TEAM_ROLES);
  const state = previous === null ? await cms.discardDraft(session, key) : await cms.saveDraft(session, key, previous, 'voice');
  panelChanged();
  return state;
});

export const latestRevisionAction = action(async () => {
  await requireSession(TEAM_ROLES);
  return cms.latestRevision();
});

/* ───────────── preview ───────────── */

export const setPreviewAction = action(async (on: boolean) => {
  await requireSession(TEAM_ROLES);
  const jar = await cookies();
  if (on) jar.set(PREVIEW_COOKIE, '1', { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 4 });
  else jar.delete(PREVIEW_COOKIE);
  return on;
});

/* ───────────── media ───────────── */

export const updateMediaAltAction = action(async (id: string, alt: string) => {
  const session = await requireSession(TEAM_ROLES);
  return mediaLib.updateMediaAlt(session, id, { alt });
});

export const deleteMediaAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await mediaLib.deleteMedia(session, id);
  revalidatePath('/admin/website/media');
});

/* ───────────── gallery ───────────── */

function galleryChanged() {
  revalidatePath('/admin/website/gallery');
  revalidateTag('site-data');
  revalidatePath('/gallery');
  revalidatePath('/');
}

export const addGalleryPhotosAction = action(async (input: unknown, via?: Via) => {
  const session = await requireSession(TEAM_ROLES);
  const rows = await gallery.addGalleryPhotos(session, input, asVia(via));
  galleryChanged();
  return rows.length;
});

export const updateGalleryItemAction = action(async (id: string, input: unknown) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await gallery.updateGalleryItem(session, id, input);
  galleryChanged();
  return row;
});

export const reorderGalleryAction = action(async (ids: string[]) => {
  const session = await requireSession(TEAM_ROLES);
  await gallery.reorderGallery(session, ids);
  galleryChanged();
});

export const deleteGalleryItemsAction = action(async (ids: string[]) => {
  const session = await requireSession(TEAM_ROLES);
  const n = await gallery.deleteGalleryItems(session, ids);
  galleryChanged();
  return n;
});

/* ───────────── notices ───────────── */

function noticesChanged() {
  revalidatePath('/admin/website/notices');
  revalidateTag('site-data');
  revalidatePath('/', 'layout');
}

export const createNoticeAction = action(async (input: unknown, via?: Via) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await gallery.createNotice(session, input, asVia(via));
  noticesChanged();
  return row;
});

export const updateNoticeAction = action(async (id: string, input: unknown) => {
  const session = await requireSession(TEAM_ROLES);
  const row = await gallery.updateNotice(session, id, input);
  noticesChanged();
  return row;
});

export const deleteNoticeAction = action(async (id: string) => {
  const session = await requireSession(TEAM_ROLES);
  await gallery.deleteNotice(session, id);
  noticesChanged();
});
