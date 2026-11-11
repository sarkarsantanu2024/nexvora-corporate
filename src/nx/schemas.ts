import { DEMO_SCHEMAS, DEMO_SLUGS } from "./demos";
import type { ClientSite, SiteContent, SiteSchema, ItemValue } from "./types";
import { HIDDEN_KEY, isListValue } from "./types";

/**
 * Sections a client may hide from the live site when they have no content
 * for them yet. The header, the footer and the two pseudo-sections
 * (contact details, Google text) are never hidden.
 */
export function canHideSection(sectionId: string): boolean {
  return !["header", "footer", "contact", "seo", "top"].includes(sectionId);
}

/**
 * A real client site's schema: the template demo's sections and forms,
 * under the client's own name and address. Null if the template is unknown.
 */
export function clientSchema(c: ClientSite): SiteSchema | null {
  const base = DEMO_SCHEMAS[c.template];
  if (!base) return null;
  return { ...base, site: c.site, name: c.name, url: c.url || undefined };
}

/**
 * Every site the panel knows: the demos, and the real client sites the
 * super admin registered (passed in, since they live in the database).
 * A client slug that clashes with a demo slug wins, so a client can keep
 * the slug of the demo they chose.
 */
export function getSchema(site: string, clients: ClientSite[] = []): SiteSchema | null {
  const c = clients.find((x) => x.site === site);
  if (c) return clientSchema(c);
  return DEMO_SCHEMAS[site] ?? null;
}

export function allSites(clients: ClientSite[] = []): SiteSchema[] {
  const own = clients.map(clientSchema).filter((s): s is SiteSchema => !!s);
  const taken = new Set(own.map((s) => s.site));
  return [...own, ...DEMO_SLUGS.filter((s) => !taken.has(s)).map((s) => DEMO_SCHEMAS[s])];
}

/** Where the live page for a site is served. */
export function siteUrl(schema: SiteSchema): string {
  return schema.url || `/demo/${schema.site}`;
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}$/.test(s);
}

/**
 * Saved content laid over the defaults, so a value that was never edited
 * still shows the demo text and a page never ends up with a hole in it.
 * Lists are taken whole from the saved content when present.
 */
export function withDefaults(schema: SiteSchema, saved: SiteContent | null | undefined): SiteContent {
  const out: SiteContent = {};
  for (const sec of schema.sections) {
    const base = schema.defaults[sec.id] ?? {};
    const over = saved?.[sec.id] ?? {};
    const merged: Record<string, unknown> = { ...base };
    for (const f of sec.fields) if (over[f.key] !== undefined) merged[f.key] = over[f.key];
    for (const l of sec.lists) if (isListValue(over[l.key])) merged[l.key] = over[l.key];
    if (over[HIDDEN_KEY] === "1" && canHideSection(sec.id)) merged[HIDDEN_KEY] = "1";
    out[sec.id] = merged as SiteContent[string];
  }
  return out;
}

/** A blank item for "Add new", copied from the first default item's shape. */
export function blankItem(schema: SiteSchema, sectionId: string, listKey: string): ItemValue {
  const sec = schema.sections.find((s) => s.id === sectionId);
  const list = sec?.lists.find((l) => l.key === listKey);
  const first = (schema.defaults[sectionId]?.[listKey] as { items?: ItemValue[] } | undefined)?.items?.[0];
  const item: ItemValue = {};
  for (const f of list?.fields ?? []) {
    const sample = first?.[f.key];
    if (f.type === "image") item[f.key] = { src: (sample as { src?: string } | undefined)?.src ?? "", alt: "" };
    else if (f.type === "link") item[f.key] = { text: "", href: (sample as { href?: string } | undefined)?.href ?? "" };
    else item[f.key] = "";
  }
  return item;
}

/**
 * Server-side check before anything is saved: only known sections, keys and
 * value shapes get through, lengths are capped, numbers are Indian mobiles,
 * links are http(s), and social links belong to their own network.
 */
export function validateContent(schema: SiteSchema, input: unknown): { ok: true; content: SiteContent } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Content must be an object" };
  const src = input as Record<string, Record<string, unknown>>;
  const out: SiteContent = {};
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);
  const checkValue = (type: string, v: unknown, opts: { social?: string; max?: number }): unknown | undefined => {
    switch (type) {
      case "text":
        return str(v, opts.max ?? 400) ?? undefined;
      case "textarea":
        return str(v, opts.max ?? 4000) ?? undefined;
      case "phone":
      case "whatsapp": {
        const d = typeof v === "string" ? v.replace(/\D/g, "").slice(-10) : "";
        return d.length === 10 ? d : undefined;
      }
      case "url":
      case "map": {
        const s = str(v, 2000);
        return s && /^https?:\/\//i.test(s) ? s : s === "" ? "" : undefined;
      }
      case "social": {
        const s = str(v, 2000);
        if (s === "") return "";
        if (!s || !/^https?:\/\//i.test(s)) return undefined;
        const hosts: Record<string, RegExp> = {
          facebook: /facebook\.com|fb\.com/i,
          instagram: /instagram\.com/i,
          youtube: /youtube\.com|youtu\.be/i,
        };
        return opts.social && hosts[opts.social] && !hosts[opts.social].test(s) ? undefined : s;
      }
      case "image": {
        const o = v as { src?: unknown; alt?: unknown };
        if (!o || typeof o !== "object") return undefined;
        const s = str(o.src, 3_000_000);
        if (s === null || !(s === "" || /^(https?:\/\/|\/|data:image\/(webp|jpeg|png);base64,)/i.test(s))) return undefined;
        return { src: s, alt: str(o.alt, 200) ?? "" };
      }
      case "link": {
        const o = v as { text?: unknown; href?: unknown };
        if (!o || typeof o !== "object") return undefined;
        const href = str(o.href, 2000);
        if (href === null || !(href === "" || /^(https?:\/\/|mailto:|tel:|#)/i.test(href))) return undefined;
        return { text: str(o.text, 400) ?? "", href };
      }
      default:
        return undefined;
    }
  };
  for (const sec of schema.sections) {
    const inSec = src[sec.id];
    if (!inSec || typeof inSec !== "object") continue;
    const outSec: Record<string, unknown> = {};
    if (inSec[HIDDEN_KEY] === "1" && canHideSection(sec.id)) outSec[HIDDEN_KEY] = "1";
    for (const f of sec.fields) {
      if (!(f.key in inSec)) continue;
      const v = checkValue(f.type, inSec[f.key], { social: f.social, max: f.max });
      if (v === undefined) return { ok: false, error: `Bad value for ${sec.id}.${f.key}` };
      outSec[f.key] = v;
    }
    for (const l of sec.lists) {
      const lv = inSec[l.key];
      if (lv === undefined) continue;
      if (!isListValue(lv)) return { ok: false, error: `Bad list ${sec.id}.${l.key}` };
      if (lv.items.length < l.min || lv.items.length > l.max) return { ok: false, error: `List ${sec.id}.${l.key} must have ${l.min} to ${l.max} items` };
      const items: ItemValue[] = [];
      for (const it of lv.items) {
        const o: ItemValue = {};
        for (const f of l.fields) {
          if (!(f.key in it)) continue;
          const v = checkValue(f.type, it[f.key], { social: f.social, max: f.max });
          if (v === undefined) return { ok: false, error: `Bad value in list ${sec.id}.${l.key}.${f.key}` };
          o[f.key] = v as ItemValue[string];
        }
        items.push(o);
      }
      outSec[l.key] = { items };
    }
    out[sec.id] = outSec as SiteContent[string];
  }
  return { ok: true, content: out };
}
