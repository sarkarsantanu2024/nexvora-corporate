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
import type { Access, ClientSite, ContentState, SiteContent, StorageMode } from "./types";

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
  /** What is switched on for the site; the default when nothing is saved. */
  getAccess(site: string): Promise<Access>;
  setAccess(site: string, access: Access, by: string): Promise<void>;
  /** The real client sites the super admin has registered. */
  listSites(): Promise<ClientSite[]>;
  upsertSite(s: ClientSite): Promise<void>;
  removeSite(site: string): Promise<void>;
}

/**
 * With a real database nothing is on until Nexvora switches it on after
 * payment. Without one (the samples) everything is on, so a prospect sees
 * the full product; the super admin can still switch a sample off to show
 * what a client sees before paying.
 */
export const DEFAULT_ACCESS: Record<StorageMode, Access> = {
  neon: { edit: false, dashboard: false },
  file: { edit: true, dashboard: true },
  browser: { edit: true, dashboard: true },
};

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
type FileRecord = { draft: SiteContent | null; published: SiteContent | null; history: HistoryEntry[]; access?: Access };

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
    const rec = await readFile(site);
    await writeFile(site, { draft: null, published: null, history: [], access: rec.access });
  },
  async history(site) {
    return (await readFile(site)).history;
  },
  async getAccess(site) {
    return (await readFile(site)).access ?? DEFAULT_ACCESS.file;
  },
  async setAccess(site, access) {
    const rec = await readFile(site);
    rec.access = access;
    await writeFile(site, rec);
  },
  async listSites() {
    try {
      return JSON.parse(await fs.readFile(SITES_FILE, "utf8")) as ClientSite[];
    } catch {
      return [];
    }
  },
  async upsertSite(s) {
    const list = (await fileStore.listSites()).filter((x) => x.site !== s.site);
    list.push(s);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SITES_FILE, JSON.stringify(list, null, 2));
  },
  async removeSite(site) {
    const list = (await fileStore.listSites()).filter((x) => x.site !== site);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SITES_FILE, JSON.stringify(list, null, 2));
  },
};
const SITES_FILE = path.join(DATA_DIR, "_sites.json");

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
      await q`CREATE TABLE IF NOT EXISTS nx_sites (
        site text PRIMARY KEY,
        name text NOT NULL,
        template text NOT NULL,
        url text NOT NULL DEFAULT '',
        phone text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await q`CREATE TABLE IF NOT EXISTS nx_access (
        site text PRIMARY KEY,
        edit boolean NOT NULL DEFAULT false,
        dashboard boolean NOT NULL DEFAULT false,
        updated_by text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL DEFAULT now()
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
  async getAccess(site) {
    const q = await sql();
    const rows = (await q`SELECT edit, dashboard FROM nx_access WHERE site = ${site}`) as unknown as Access[];
    return rows[0] ? { edit: !!rows[0].edit, dashboard: !!rows[0].dashboard } : DEFAULT_ACCESS.neon;
  },
  async setAccess(site, access, by) {
    const q = await sql();
    await q`INSERT INTO nx_access (site, edit, dashboard, updated_by) VALUES (${site}, ${access.edit}, ${access.dashboard}, ${by})
      ON CONFLICT (site) DO UPDATE SET edit = EXCLUDED.edit, dashboard = EXCLUDED.dashboard, updated_by = EXCLUDED.updated_by, updated_at = now()`;
  },
  async listSites() {
    const q = await sql();
    const rows = (await q`SELECT site, name, template, url, phone, created_at FROM nx_sites ORDER BY created_at DESC`) as unknown as { site: string; name: string; template: string; url: string; phone: string; created_at: string }[];
    return rows.map((r) => ({ site: r.site, name: r.name, template: r.template, url: r.url, phone: r.phone, createdAt: r.created_at }));
  },
  async upsertSite(s) {
    const q = await sql();
    await q`INSERT INTO nx_sites (site, name, template, url, phone) VALUES (${s.site}, ${s.name}, ${s.template}, ${s.url}, ${s.phone})
      ON CONFLICT (site) DO UPDATE SET name = EXCLUDED.name, template = EXCLUDED.template, url = EXCLUDED.url, phone = EXCLUDED.phone`;
  },
  async removeSite(site) {
    const q = await sql();
    await q`DELETE FROM nx_sites WHERE site = ${site}`;
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
