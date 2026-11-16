'use client';

/**
 * How the voice assistant (which sits in the layout) reaches the section form
 * that happens to be open. When a spoken change is for the open form, it goes
 * through the form, so what is on screen and what is saved never disagree.
 */
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { ContentData } from '@/cms/types';
import type { ActionResult } from '@/lib/api';
import type { SectionState } from '@/server/cms/service';

export type FormHandle = {
  key: string;
  /** What is in the form right now, saved or not. */
  values: () => ContentData;
  /** The draft as last saved on the server (null when there is none), for undo. */
  savedDraft: () => ContentData | null;
  isDirty: () => boolean;
  /** Puts these values in the form and saves them as a draft. */
  applyAndSave: (next: ContentData) => Promise<ActionResult<SectionState>>;
  /** Saves what is in the form as a draft. */
  save: () => Promise<ActionResult<SectionState>>;
  setHidden: (hidden: boolean) => Promise<ActionResult<SectionState>>;
  /** Adds a row and opens it for editing. Not saved until the person saves. */
  appendRow: (list: string, item: Record<string, string>) => void;
  /** Types into the box the cursor was last in. False when there is none. */
  insertText: (text: string) => boolean;
};

/** A row dictated for a form that is not open yet: picked up when it opens. */
export type PendingRow = { key: string; list: string; item: Record<string, string> };
const PENDING_ROW = 'mk_voice_row';

export function stashRow(row: PendingRow) {
  try {
    window.sessionStorage.setItem(PENDING_ROW, JSON.stringify(row));
  } catch {
    /* private mode: the person adds the row by hand */
  }
}

export function takeRow(key: string): PendingRow | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_ROW);
    if (!raw) return null;
    const row = JSON.parse(raw) as PendingRow;
    if (row.key !== key) return null;
    window.sessionStorage.removeItem(PENDING_ROW);
    return row;
  } catch {
    return null;
  }
}

type Bridge = { form: () => FormHandle | null; register: (handle: FormHandle) => () => void };
const BridgeContext = createContext<Bridge | null>(null);

export function VoiceBridgeProvider({ children }: { children: ReactNode }) {
  const current = useRef<FormHandle | null>(null);
  const bridge = useMemo<Bridge>(
    () => ({
      form: () => current.current,
      register: (handle) => {
        current.current = handle;
        return () => {
          if (current.current === handle) current.current = null;
        };
      },
    }),
    [],
  );
  return <BridgeContext.Provider value={bridge}>{children}</BridgeContext.Provider>;
}

export function useVoiceBridge(): Bridge | null {
  return useContext(BridgeContext);
}

/** The section form calls this so the assistant can reach it while it is on screen. */
export function useRegisterForm(handle: FormHandle) {
  const bridge = useVoiceBridge();
  const latest = useRef(handle);
  latest.current = handle;
  const key = handle.key;
  useEffect(() => {
    if (!bridge) return;
    // A stable wrapper, so the assistant always calls the newest closures.
    const proxy: FormHandle = {
      key,
      values: () => latest.current.values(),
      savedDraft: () => latest.current.savedDraft(),
      isDirty: () => latest.current.isDirty(),
      applyAndSave: (next) => latest.current.applyAndSave(next),
      save: () => latest.current.save(),
      setHidden: (hidden) => latest.current.setHidden(hidden),
      appendRow: (list, item) => latest.current.appendRow(list, item),
      insertText: (text) => latest.current.insertText(text),
    };
    return bridge.register(proxy);
  }, [bridge, key]);
}

/** Tells every open screen that website content changed (the assistant fires it). */
export const CMS_CHANGED = 'mk:cms-changed';
export const announceChange = () => window.dispatchEvent(new Event(CMS_CHANGED));
