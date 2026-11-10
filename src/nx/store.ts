// Where saved content lives. One interface, three places:
//
//   neon     DATABASE_URL is set. Real clients. Tables are created on first
//            use, so pointing a deployment at an empty Neon database is enough.
//   file     Local development without a database: .nx-data/<site>.json.
//   browser  A hosted deployment with no database (the public demo panel).
//            The server stores nothing; the panel and the demo page share the
//            visitor's own localStorage, so a prospect can try the panel and
//            see their change on the demo without anything being written on
//            our side.
//
// Swapping Neon for something else later means changing this one file.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { ContentState, SiteContent, StorageMode } from "./types";

export type HistoryEntry = { id: number; content: SiteContent; savedAt: string; note: string };

export interface ContentStore {
  mode: StorageMode;
  get(site: string, state: ContentState): Promise<SiteContent | null>;
  saveDraft(site: string, content: SiteContent, by: string): Promise<void>;
  publish(site: string, by: string): Promise<SiteContent | null>;
  /** Restores the previous published version; returns it, or null if none. */
  undoPublish(site: string, by: string): Promise<SiteContent | null>;
  reset(site: string): Promise<void>;
  history(site: string): Promise<HistoryEntry[]>;
}

export function storageMode(): StorageMode {
  // NX_STORAGE forces a mode, mainly to try the browser-only path locally.
  const forced = process.env.NX_STORAGE;
  if (forced === "browser" || forced === "file" || forced === "neon") return forced;
  if (process.env.DATABASE_URL) return "neon";
  if (process.env.NX_FILE_STORE === "1" || process.env.NODE_ENV !== "production") return "file";
  return "browser";
}

const HISTORY_LIMIT = 30;

// ---------------------------------------------------------------- file store
const DATA_DIR = path.join(process.cwd(), ".nx-data");
type FileRecord = { draft: SiteContent | null; published: SiteContent | null; history: HistoryEntry[] };

async function readFile(site: string): Promise<FileRecord> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${safe(site)}.json`), "utf8");
    return JSON.parse(raw) as FileRecord;
  } catch {
    return { draft: null, published: null, history: [] };
  }
}
async function writeFile(site: string, rec: FileRecord) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, `${safe(site)}.json`), JSON.stringify(rec, null, 2));
}
function safe(site: string) {
  return site.replace(/[^a-z0-9-]/g, "");
}

const fileStore: ContentStore = {
  mode: "file",
  async get(site, state) {
    return (await readFile(site))[state];
  },
  async saveDraft(site, content) {
    const rec = await readFile(site);
    rec.draft = content;
    await writeFile(site, rec);
  },
  async publish(site, by) {
    const rec = await readFile(site);
    if (!rec.draft) return null;
    // The first publish saves "the original" ({} means all defaults), so
    // Undo always has somewhere to go back to.
    rec.history.unshift({ id: Date.now(), content: rec.published ?? {}, savedAt: new Date().toISOString(), note: rec.published ? `Replaced by publish from ${by}` : "Original" });
    rec.history = rec.history.slice(0, HISTORY_LIMIT);
    rec.published = rec.draft;
    await writeFile(site, rec);
    return rec.published;
  },
  async undoPublish(site) {
    const rec = await readFile(site);
    const prev = rec.history.shift();
    if (!prev) return null;
    rec.published = prev.content;
    rec.draft = prev.content;
    await writeFile(site, rec);
    return prev.content;
  },
  async reset(site) {
    await writeFile(site, { draft: null, published: null, history: [] });
  },
  async history(site) {
    return (await readFile(site)).history;
  },
};

// ---------------------------------------------------------------- neon store
type Sql = import("@neondatabase/serverless").NeonQueryFunction<false, false>;
let sqlPromise: Promise<Sql> | null = null;

async function sql(): Promise<Sql> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const { neon } = await import("@neondatabase/serverless");
      const q = neon(process.env.DATABASE_URL as string);
      await q`CREATE TABLE IF NOT EXISTS nx_content (
        site text NOT NULL,
        state text NOT NULL,
        content jsonb NOT NULL,
        updated_by text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (site, state)
      )`;
      await q`CREATE TABLE IF NOT EXISTS nx_history (
        id bigserial PRIMARY KEY,
        site text NOT NULL,
        content jsonb NOT NULL,
        saved_by text NOT NULL DEFAULT '',
        saved_at timestamptz NOT NULL DEFAULT now(),
        note text NOT NULL DEFAULT ''
      )`;
      await q`CREATE INDEX IF NOT EXISTS nx_history_site ON nx_history (site, saved_at DESC)`;
      await q`CREATE TABLE IF NOT EXISTS nx_users (
        id bigserial PRIMARY KEY,
        name text NOT NULL,
        phone text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'client',
        sites text[] NOT NULL DEFAULT '{}',
        must_change_password boolean NOT NULL DEFAULT true,
        failed_logins int NOT NULL DEFAULT 0,
        locked_until timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        last_login_at timestamptz
      )`;
      return q;
    })();
  }
  return sqlPromise;
}

const neonStore: ContentStore = {
  mode: "neon",
  async get(site, state) {
    const q = await sql();
    const rows = (await q`SELECT content FROM nx_content WHERE site = ${site} AND state = ${state}`) as unknown as { content: SiteContent }[];
    return rows[0]?.content ?? null;
  },
  async saveDraft(site, content, by) {
    const q = await sql();
    await q`INSERT INTO nx_content (site, state, content, updated_by) VALUES (${site}, 'draft', ${JSON.stringify(content)}::jsonb, ${by})
      ON CONFLICT (site, state) DO UPDATE SET content = EXCLUDED.content, updated_by = EXCLUDED.updated_by, updated_at = now()`;
  },
  async publish(site, by) {
    const q = await sql();
    const draft = await neonStore.get(site, "draft");
    if (!draft) return null;
    const published = await neonStore.get(site, "published");
    await q`INSERT INTO nx_history (site, content, saved_by, note) VALUES (${site}, ${JSON.stringify(published ?? {})}::jsonb, ${by}, ${published ? "Replaced by publish" : "Original"})`;
    await q`DELETE FROM nx_history WHERE site = ${site} AND id NOT IN (SELECT id FROM nx_history WHERE site = ${site} ORDER BY saved_at DESC LIMIT ${HISTORY_LIMIT})`;
    await q`INSERT INTO nx_content (site, state, content, updated_by) VALUES (${site}, 'published', ${JSON.stringify(draft)}::jsonb, ${by})
      ON CONFLICT (site, state) DO UPDATE SET content = EXCLUDED.content, updated_by = EXCLUDED.updated_by, updated_at = now()`;
    return draft;
  },
  async undoPublish(site, by) {
    const q = await sql();
    const rows = (await q`SELECT id, content FROM nx_history WHERE site = ${site} ORDER BY saved_at DESC LIMIT 1`) as unknown as { id: number; content: SiteContent }[];
    const prev = rows[0];
    if (!prev) return null;
    await q`DELETE FROM nx_history WHERE id = ${prev.id}`;
    for (const state of ["published", "draft"] as const) {
      await q`INSERT INTO nx_content (site, state, content, updated_by) VALUES (${site}, ${state}, ${JSON.stringify(prev.content)}::jsonb, ${by})
        ON CONFLICT (site, state) DO UPDATE SET content = EXCLUDED.content, updated_by = EXCLUDED.updated_by, updated_at = now()`;
    }
    return prev.content;
  },
  async reset(site) {
    const q = await sql();
    await q`DELETE FROM nx_content WHERE site = ${site}`;
    await q`DELETE FROM nx_history WHERE site = ${site}`;
  },
  async history(site) {
    const q = await sql();
    const rows = (await q`SELECT id, content, saved_at, note FROM nx_history WHERE site = ${site} ORDER BY saved_at DESC`) as unknown as { id: number; content: SiteContent; saved_at: string; note: string }[];
    return rows.map((r) => ({ id: r.id, content: r.content, savedAt: r.saved_at, note: r.note }));
  },
};

/** Null in browser mode: the server keeps nothing. */
export function getStore(): ContentStore | null {
  const mode = storageMode();
  if (mode === "neon") return neonStore;
  if (mode === "file") return fileStore;
  return null;
}

export async function neonSql() {
  return sql();
}
