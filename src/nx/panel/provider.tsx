"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Lang } from "../i18n";
import { readDemoAdmin, readDemoSession } from "./demo-session";
import { getSchema, siteUrl, withDefaults } from "../schemas";
import type { FieldValue, ItemValue, SiteContent, SiteSchema, StorageMode } from "../types";

export type Session = { id: string; name: string; role: "owner" | "client"; sites: string[]; mustChangePassword?: boolean };
export type SaveState = "idle" | "saving" | "saved" | "error";

type Ctx = {
  site: string;
  schema: SiteSchema;
  lang: Lang;
  setLang: (l: Lang) => void;
  storage: StorageMode;
  session: Session | null;
  /** The draft with defaults filled in. What the panel edits. */
  content: SiteContent;
  /** The published content with defaults filled in. */
  published: SiteContent;
  dirty: boolean;
  saveState: SaveState;
  setField: (sectionId: string, key: string, value: FieldValue) => void;
  setList: (sectionId: string, key: string, items: ItemValue[]) => void;
  publish: () => Promise<"ok" | "nothing" | "error">;
  undo: () => Promise<"ok" | "nothing" | "error">;
  reset: () => Promise<void>;
  siteHref: string;
  previewHref: string;
};

const SiteContext = createContext<Ctx | null>(null);

export function useSite(): Ctx {
  const c = useContext(SiteContext);
  if (!c) throw new Error("useSite outside SiteProvider");
  return c;
}

export function useLangOnly(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nx:lang");
      if (saved === "bn" || saved === "en") setLangState(saved);
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("nx:lang", l);
    } catch {}
  };
  return [lang, setLang];
}

const local = {
  read(key: string): SiteContent | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as SiteContent) : null;
    } catch {
      return null;
    }
  },
  write(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  readHistory(site: string): SiteContent[] {
    try {
      const raw = localStorage.getItem(`nx:history:${site}`);
      return raw ? (JSON.parse(raw) as SiteContent[]) : [];
    } catch {
      return [];
    }
  },
};

export function SiteProvider({ site, children, fallback }: { site: string; children: ReactNode; fallback: (state: { loading: boolean; storage: StorageMode; session: Session | null; schema: SiteSchema | null; needsDemoLogin?: boolean }) => ReactNode }) {
  const schema = useMemo(() => getSchema(site), [site]);
  const [lang, setLang] = useLangOnly();
  const [storage, setStorage] = useState<StorageMode>("browser");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [publishedRaw, setPublishedRaw] = useState<SiteContent | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<SiteContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetch("/api/nx/session", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ storage: "browser", session: null }));
      if (cancelled) return;
      setStorage(s.storage);
      setSession(s.session);
      if (s.storage === "browser") {
        setDraft(local.read(`nx:draft:${site}`));
        setPublishedRaw(local.read(`nx:published:${site}`));
      } else if (s.session) {
        const [d, p] = await Promise.all([
          fetch(`/api/nx/content/${site}?state=draft`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { content: null })),
          fetch(`/api/nx/content/${site}?state=published`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { content: null })),
        ]);
        if (cancelled) return;
        setDraft(d.content ?? null);
        setPublishedRaw(p.content ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [site]);

  const persist = useCallback(
    (next: SiteContent) => {
      pending.current = next;
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const toSave = pending.current;
        if (!toSave) return;
        try {
          if (storage === "browser") {
            local.write(`nx:draft:${site}`, toSave);
          } else {
            const r = await fetch(`/api/nx/content/${site}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: toSave }) });
            if (!r.ok) throw new Error("save failed");
          }
          setSaveState("saved");
        } catch {
          setSaveState("error");
        }
      }, 700);
    },
    [site, storage],
  );

  const content = useMemo(() => (schema ? withDefaults(schema, draft) : {}), [schema, draft]);
  const published = useMemo(() => (schema ? withDefaults(schema, publishedRaw) : {}), [schema, publishedRaw]);
  const dirty = useMemo(() => JSON.stringify(content) !== JSON.stringify(published), [content, published]);

  const update = useCallback(
    (fn: (c: SiteContent) => SiteContent) => {
      if (!schema) return;
      const base = withDefaults(schema, draft);
      const next = fn(base);
      setDraft(next);
      persist(next);
    },
    [schema, draft, persist],
  );

  const setField = useCallback(
    (sectionId: string, key: string, value: FieldValue) => update((c) => ({ ...c, [sectionId]: { ...c[sectionId], [key]: value } })),
    [update],
  );
  const setList = useCallback(
    (sectionId: string, key: string, items: ItemValue[]) => update((c) => ({ ...c, [sectionId]: { ...c[sectionId], [key]: { items } } })),
    [update],
  );

  const publish = useCallback(async (): Promise<"ok" | "nothing" | "error"> => {
    if (!schema) return "error";
    if (!dirty) return "nothing";
    // Flush any pending autosave first.
    if (timer.current) clearTimeout(timer.current);
    const current = withDefaults(schema, draft);
    try {
      if (storage === "browser") {
        const prev = local.read(`nx:published:${site}`) ?? {};
        const hist = local.readHistory(site);
        local.write(`nx:history:${site}`, [prev, ...hist].slice(0, 30));
        local.write(`nx:draft:${site}`, current);
        local.write(`nx:published:${site}`, current);
      } else {
        const r1 = await fetch(`/api/nx/content/${site}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: current }) });
        if (!r1.ok) throw new Error();
        const r2 = await fetch(`/api/nx/content/${site}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "publish" }) });
        if (!r2.ok) throw new Error();
      }
      setPublishedRaw(current);
      setSaveState("saved");
      return "ok";
    } catch {
      return "error";
    }
  }, [schema, dirty, draft, site, storage]);

  const undo = useCallback(async (): Promise<"ok" | "nothing" | "error"> => {
    try {
      if (storage === "browser") {
        const hist = local.readHistory(site);
        const prev = hist.shift();
        if (!prev) return "nothing";
        local.write(`nx:history:${site}`, hist);
        local.write(`nx:published:${site}`, prev);
        local.write(`nx:draft:${site}`, prev);
        setPublishedRaw(prev);
        setDraft(prev);
        return "ok";
      }
      const r = await fetch(`/api/nx/content/${site}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "undo" }) });
      const j = await r.json();
      if (!j.ok) return "nothing";
      setPublishedRaw(j.content);
      setDraft(j.content);
      return "ok";
    } catch {
      return "error";
    }
  }, [site, storage]);

  const reset = useCallback(async () => {
    if (storage === "browser") {
      for (const k of ["draft", "published", "history"]) localStorage.removeItem(`nx:${k}:${site}`);
    } else {
      await fetch(`/api/nx/content/${site}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reset" }) });
    }
    setDraft(null);
    setPublishedRaw(null);
  }, [site, storage]);

  // Without a database, the demo login (demo / 123 or a sign-up) is the key.
  // The super admin (admin / 123) opens every site.
  const demoSession = storage !== "neon" && !loading ? readDemoSession(site) ?? (readDemoAdmin() ? { site, name: "Nexvora admin", username: "admin", at: Date.now() } : null) : null;
  const allowed = storage === "neon" ? !!session && (session.role === "owner" || session.sites.includes(site)) : !!demoSession;
  if (!schema || loading || !allowed || (session?.mustChangePassword && storage === "neon")) {
    return <>{fallback({ loading, storage, session, schema, needsDemoLogin: !loading && storage !== "neon" && !demoSession })}</>;
  }

  const href = siteUrl(schema);
  const value: Ctx = {
    site,
    schema,
    lang,
    setLang,
    storage,
    session,
    content,
    published,
    dirty,
    saveState,
    setField,
    setList,
    publish,
    undo,
    reset,
    siteHref: href,
    previewHref: `${href}?nx-preview=1`,
  };
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
