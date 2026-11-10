// Marks up every demo so the generic Edit Panel can edit it.
//
//   npm run nx:annotate            all demos under public/demo
//   npm run nx:annotate sweets gym  only those
//
// For each public/demo/<slug>/index.html this script:
//   1. Finds every piece of content a shop owner might change: headings,
//      paragraphs, list lines, buttons, links, photos, the phone and WhatsApp
//      numbers, the map, the social links, the page title and description.
//   2. Writes a stable id onto each one as a data-nx attribute, by inserting
//      the attribute into the original file text at the right offset. The
//      rest of the file is left byte for byte as it was, so a demo's layout
//      cannot be disturbed by this step.
//   3. Detects repeated items (price rows, service cards, gallery photos,
//      testimonials) and marks them as a list, so the panel can add, remove
//      and reorder items inside that list.
//   4. Adds one <meta name="nx-site"> and one <script src="/nx/nx-content.js">
//      so the page applies saved content when it loads.
//   5. Writes the schema and the default content to src/nx/demos/<slug>.json
//      and regenerates src/nx/demos/index.ts.
//
// The panel has no code for any particular demo. It reads these JSON files
// and builds its screens from them, which is what makes it one panel for all
// thirty-eight demos and for every client site built the same way later.
//
// Running it again is safe: ids that already exist are kept, and only new
// content gets a new id.

import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";

const ROOT = process.cwd();
const DEMO_DIR = path.join(ROOT, "public", "demo");
const OUT_DIR = path.join(ROOT, "src", "nx", "demos");

// Inline tags that may sit inside an editable text without making it two
// fields. <small> is here because the demos use it for a note after a name.
const INLINE = new Set(["em", "strong", "b", "i", "br", "small", "sup", "sub", "u", "mark"]);
// Tags that can be a text field.
const TEXT_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "span", "a", "b", "strong", "em",
  "small", "td", "th", "dt", "dd", "figcaption", "label", "button", "div", "time",
  "address", "cite", "summary", "legend", "caption", "i", "q",
]);
// Never descend into these.
const SKIP_TAGS = new Set(["script", "style", "svg", "noscript", "template", "iframe", "nav", "select", "option", "input", "textarea"]);
const SKIP_CLASS = ["demo-strip", "demostrip", "demobar", "strip", "nx-strip", "nx-lang", "skip", "dock", "to-top", "backdrop", "sr-only", "nav__close", "burger", "dots"];

const LABELS = {
  h1: ["Main heading", "মূল শিরোনাম"],
  h2: ["Heading", "শিরোনাম"],
  h3: ["Sub heading", "উপ-শিরোনাম"],
  h4: ["Sub heading", "উপ-শিরোনাম"],
  h5: ["Sub heading", "উপ-শিরোনাম"],
  h6: ["Sub heading", "উপ-শিরোনাম"],
  p: ["Paragraph", "অনুচ্ছেদ"],
  kicker: ["Small label", "ছোট লেবেল"],
  price: ["Price", "দাম"],
  button: ["Button text", "বোতামের লেখা"],
  link: ["Button and link", "বোতাম ও লিংক"],
  linktext: ["Link text", "লিংকের লেখা"],
  text: ["Text", "লেখা"],
  image: ["Photo", "ছবি"],
  bg: ["Background photo", "পিছনের ছবি"],
};

const SECTION_LABELS = {
  header: ["Top bar", "উপরের বার"],
  footer: ["Bottom of the page", "পাতার নিচের অংশ"],
  contact: ["Phone, WhatsApp, map and social links", "ফোন, হোয়াটসঅ্যাপ, মানচিত্র ও সোশ্যাল লিংক"],
  seo: ["Google title and description", "গুগলের শিরোনাম ও বিবরণ"],
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function clean(text) {
  return text.replace(/\s+/g, " ").trim();
}
function classes(el) {
  return (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
}
function hasSkipClass(el) {
  return classes(el).some((c) => SKIP_CLASS.includes(c));
}
function isElement(n) {
  return n.nodeType === 1;
}
function isText(n) {
  return n.nodeType === 3;
}
function directText(el) {
  return el.childNodes.filter(isText).map((t) => t.text).join("");
}
function elementChildren(el) {
  return el.childNodes.filter(isElement);
}
// A span counts as inline when it sits in mixed content ("Lift. <span>Go
// home.</span> tomorrow.") and holds only text or inline tags itself. Then
// the whole heading is one field and the span's styling survives an edit.
function isInlineSpan(k) {
  return k.rawTagName === "span" && elementChildren(k).every((g) => INLINE.has(g.rawTagName) || isInlineSpan(g));
}
function isLeaf(el) {
  if (!TEXT_TAGS.has(el.rawTagName)) return false;
  const kids = elementChildren(el);
  const hasText = clean(directText(el)).length > 0;
  if (!hasText) return false;
  return kids.every((k) => INLINE.has(k.rawTagName) || isInlineSpan(k));
}
function hrefKind(href) {
  if (!href) return null;
  if (href.startsWith("#")) return "anchor";
  if (href.startsWith("tel:")) return "tel";
  if (/wa\.me\/|api\.whatsapp\.com/.test(href)) return "whatsapp";
  if (href.startsWith("mailto:")) return "mail";
  if (/google\.[a-z.]+\/maps|maps\.google|goo\.gl\/maps|maps\.app\.goo\.gl/.test(href)) return "maps";
  if (/facebook\.com|fb\.com/.test(href)) return "facebook";
  if (/instagram\.com/.test(href)) return "instagram";
  if (/youtube\.com|youtu\.be/.test(href)) return "youtube";
  if (/nexvoratechnologies/.test(href)) return "nexvora";
  if (/^https?:\/\//.test(href)) return "external";
  return "other";
}

/** Walks one container and returns its editable leaves, with list detection. */
function collectFields(container, ctx) {
  const fields = [];
  const lists = [];
  const usedKeys = new Set();

  function keyFor(el, fallbackTag) {
    const existing = el.getAttribute("data-nx") || el.getAttribute("data-nx-f");
    if (existing) {
      const k = existing.includes(".") ? existing.split(".").pop() : existing;
      usedKeys.add(k);
      return k;
    }
    const cls = classes(el).find((c) => /^[a-z][a-z0-9]*(?:__[a-z0-9]+)?$/.test(c) && !["reveal", "wrap", "btn", "lead", "h2"].includes(c));
    let base = cls ? slugify(cls.replace("__", "-")) : fallbackTag;
    if (!base || /^\d/.test(base)) base = fallbackTag;
    let k = base;
    let n = 2;
    while (usedKeys.has(k)) k = `${base}${n++}`;
    usedKeys.add(k);
    return k;
  }

  function leafField(el) {
    const tag = el.rawTagName;
    const inline = elementChildren(el).length > 0;
    const value = inline ? el.innerHTML.trim() : clean(el.text);
    if (!value) return null;
    if (/nexvoratechnologies/i.test(el.innerHTML)) return null;
    const cls = classes(el);
    let type = "text";
    let label = LABELS.text;
    if (/^h[1-6]$/.test(tag)) label = LABELS[tag];
    else if (tag === "p") label = LABELS.p;
    if (cls.includes("kicker") || cls.includes("tag") || cls.includes("eyebrow")) label = LABELS.kicker;
    // The business name and the line under it, in the header and footer.
    const inBrand = !!el.closest(".brand, .logo, [class*='brand'], [class*='logo']");
    if (inBrand) {
      const nameLike = tag === "b" || tag === "strong" || /name|title/.test(cls.join(" ")) || (!cls.length && el.parentNode && elementChildren(el.parentNode)[0] === el);
      label = nameLike ? ["Business name", "ব্যবসার নাম"] : ["Line under the name", "নামের নিচের লাইন"];
    }
    if (/^(address|addr)$/.test(cls.join(" ")) || tag === "address") label = ["Address", "ঠিকানা"];
    if (/hours|timing|time/.test(cls.join(" "))) label = ["Timings", "সময়"];
    if (/^[₹]|^&#8377;|^Rs\.?\s?\d/.test(value) || cls.some((c) => /price|amt|amount|fee/.test(c))) label = LABELS.price;
    if (value.length > 90 || tag === "p") type = value.length > 90 ? "textarea" : type;
    const field = { key: null, type, label: { en: label[0], bn: label[1] } };
    if (inline) field.html = true;
    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      const kind = hrefKind(href);
      if (kind === "nexvora") return null;
      if (kind === "external" || kind === "mail" || kind === "other") {
        field.type = "link";
        field.label = { en: LABELS.link[0], bn: LABELS.link[1] };
        return { el, field, value: { text: value, href }, tagForKey: "link" };
      }
      // tel, whatsapp, maps and social links are changed once, in the
      // contact section, for the whole page; only their text is a field here.
      if (kind === "tel" || kind === "whatsapp") return null;
      field.label = cls.includes("btn") ? { en: LABELS.button[0], bn: LABELS.button[1] } : { en: LABELS.linktext[0], bn: LABELS.linktext[1] };
    }
    return { el, field, value, tagForKey: tag === "a" ? "button" : tag };
  }

  function imageField(el) {
    const src = el.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) return null;
    const field = { key: null, type: "image", label: { en: LABELS.image[0], bn: LABELS.image[1] } };
    const w = Number(el.getAttribute("width")) || undefined;
    const h = Number(el.getAttribute("height")) || undefined;
    if (w && h) field.aspect = `${w}:${h}`;
    return { el, field, value: { src, alt: el.getAttribute("alt") || "" }, tagForKey: "photo" };
  }

  function bgField(el) {
    const style = el.getAttribute("style") || "";
    const m = style.match(/background(?:-image)?\s*:[^;]*url\((['"]?)([^'")]+)\1\)/i);
    if (!m) return null;
    const field = { key: null, type: "image", label: { en: LABELS.bg[0], bn: LABELS.bg[1] }, bg: true };
    return { el, field, value: { src: m[2], alt: "" }, tagForKey: "background" };
  }

  // Returns the raw leaves found under `el` (no list detection), used both
  // for list shape comparison and for plain collection.
  function leavesUnder(el, acc) {
    if (SKIP_TAGS.has(el.rawTagName) || hasSkipClass(el)) return acc;
    if (el.getAttribute("data-nx-skip") !== undefined && el.getAttribute("data-nx-skip") !== null) return acc;
    const bg = bgField(el);
    if (bg) acc.push(bg);
    if (el.rawTagName === "img") {
      const f = imageField(el);
      if (f) acc.push(f);
      return acc;
    }
    if (isLeaf(el)) {
      const f = leafField(el);
      if (f) acc.push(f);
      return acc;
    }
    for (const k of elementChildren(el)) leavesUnder(k, acc);
    return acc;
  }

  // text and textarea count as the same shape: one card having a longer
  // paragraph than its neighbours does not make it a different kind of card.
  function shape(el) {
    return leavesUnder(el, []).map((f) => `${f.tagForKey}:${f.field.type === "textarea" ? "text" : f.field.type}`).join("|");
  }
  // Cells are never list items; the row is the item and the cells its fields.
  const NOT_ITEM = new Set(["td", "th", "dt", "dd", "tr", "thead", "tbody", "col"]);

  // Bottom-up: a group of 2+ siblings with the same tag, class and leaf shape
  // is a list, unless its items contain a list themselves (then the inner
  // one wins, because that is where the owner adds a sweet or a service).
  function walk(el) {
    if (SKIP_TAGS.has(el.rawTagName) || hasSkipClass(el)) return;
    const bg = bgField(el);
    if (bg) fields.push(bg);
    if (el.rawTagName === "img") {
      const f = imageField(el);
      if (f) fields.push(f);
      return;
    }
    if (isLeaf(el)) {
      const f = leafField(el);
      if (f) fields.push(f);
      return;
    }
    const kids = elementChildren(el).filter((k) => !SKIP_TAGS.has(k.rawTagName) && !hasSkipClass(k));
    if (kids.length >= 2 && !NOT_ITEM.has(kids[0].rawTagName) && kids[0].rawTagName !== "tr" || (kids.length >= 2 && kids[0].rawTagName === "tr")) {
      const sig = kids.map((k) => `${k.rawTagName}.${classes(k).filter((c) => c !== "reveal").join(".")}#${shape(k)}`);
      const allSame = sig.every((s) => s === sig[0]) && !["td", "th", "dt", "dd"].includes(kids[0].rawTagName);
      const itemLeaves = allSame ? leavesUnder(kids[0], []) : [];
      const hasInnerList = allSame && kids.some((k) => containsRepeat(k));
      if (allSame && itemLeaves.length > 0 && !hasInnerList && !el.getAttribute("data-nx-nolist")) {
        lists.push({ el, items: kids });
        return;
      }
    }
    for (const k of kids) walk(k);
  }

  function containsRepeat(el) {
    const kids = elementChildren(el).filter((k) => !SKIP_TAGS.has(k.rawTagName) && !hasSkipClass(k));
    if (kids.length >= 2 && !["td", "th", "dt", "dd"].includes(kids[0].rawTagName)) {
      const sig = kids.map((k) => `${k.rawTagName}.${classes(k).filter((c) => c !== "reveal").join(".")}#${shape(k)}`);
      if (sig.every((s) => s === sig[0]) && leavesUnder(kids[0], []).length > 0) return true;
    }
    return kids.some(containsRepeat);
  }

  walk(container);

  // Assign keys.
  for (const f of fields) f.field.key = keyFor(f.el, f.tagForKey);
  const listOut = [];
  for (const l of lists) {
    const existingKey = l.el.getAttribute("data-nx-list");
    const lk = existingKey ? existingKey.split(".").pop() : keyFor(l.el, "list");
    const itemKeys = new Set();
    const first = leavesUnder(l.items[0], []);
    const allItemLeaves = l.items.map((it) => leavesUnder(it, []));
    const itemFields = first.map((f, idx) => {
      // A text field becomes a textarea if any item holds a long value.
      if (f.field.type === "text" || f.field.type === "textarea") {
        const long = allItemLeaves.some((ls) => ls[idx] && typeof ls[idx].value === "string" && ls[idx].value.length > 90);
        f.field.type = long ? "textarea" : "text";
      }
      const existing = f.el.getAttribute("data-nx-f");
      let base = existing || (classes(f.el).find((c) => /^[a-z][a-z0-9-]*$/.test(c) && !["reveal", "btn"].includes(c)) || f.tagForKey);
      base = slugify(base.replace("__", "-")) || f.tagForKey;
      let k = base;
      let n = 2;
      while (itemKeys.has(k)) k = `${base}${n++}`;
      itemKeys.add(k);
      return { ...f.field, key: k };
    });
    const items = l.items.map((it) => {
      const leaves = leavesUnder(it, []);
      const obj = {};
      leaves.forEach((f, i) => {
        obj[itemFields[i].key] = f.value;
        f.el._nxF = itemFields[i].key;
      });
      return obj;
    });
    listOut.push({ el: l.el, key: lk, itemEls: l.items, fields: itemFields, items, label: listLabel(l.el) });
  }
  return { fields, lists: listOut };
}

// The heading just above a list names it: "Chhanar mishti", "Our trainers".
// Looks at earlier siblings first, then at the parent's earlier siblings.
function listLabel(el) {
  let node = el;
  for (let depth = 0; depth < 3 && node && node.parentNode; depth++) {
    const siblings = elementChildren(node.parentNode);
    const i = siblings.indexOf(node);
    for (let j = i - 1; j >= 0; j--) {
      const sib = siblings[j];
      const h = /^h[1-6]$/.test(sib.rawTagName)
        ? sib
        : classes(sib).some((c) => /head|title|intro/.test(c))
          ? sib.querySelector("h1, h2, h3, h4, h5, h6")
          : null;
      if (h) {
        const t = clean(h.text).replace(/[.!]+$/, "");
        if (t) return { en: t, bn: t };
      }
    }
    node = node.parentNode;
  }
  return { en: "Items in this list", bn: "এই তালিকার আইটেম" };
}

function sectionLabel(sec, index) {
  const tag = sec.rawTagName;
  if (tag === "header") return SECTION_LABELS.header;
  if (tag === "footer") return SECTION_LABELS.footer;
  if (index <= 2 && (classes(sec).some((c) => /hero/.test(c)) || ["top", "hero", "home"].includes(sec.getAttribute("id") || ""))) {
    return ["Top banner", "উপরের ব্যানার"];
  }
  const h = sec.querySelector("h2") || sec.querySelector("h1") || sec.querySelector("h3");
  if (h) {
    const t = clean(h.text).replace(/[.!]+$/, "");
    if (t) return [t, t];
  }
  const k = sec.querySelector(".kicker");
  if (k) return [clean(k.text), clean(k.text)];
  return [`Section ${index}`, `অংশ ${index}`];
}

function annotate(slug) {
  const file = path.join(DEMO_DIR, slug, "index.html");
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, "utf8");
  const root = parse(html, { comment: true, blockTextElements: { script: true, style: true, noscript: true, pre: true } });

  const title = clean(root.querySelector("title")?.text || "");
  const business = title.split(/\s[|·\-–]\s/)[0].trim() || slug;
  const desc = root.querySelector('meta[name="description"]')?.getAttribute("content") || "";

  const body = root.querySelector("body");
  const containers = [];
  const header = body.querySelector("header");
  if (header) containers.push(header);
  for (const s of body.querySelectorAll("section")) {
    // Only top-level sections (not nested inside another section).
    let p = s.parentNode;
    let nested = false;
    while (p && p !== body) {
      if (p.rawTagName === "section") nested = true;
      p = p.parentNode;
    }
    if (!nested) containers.push(s);
  }
  const footer = body.querySelectorAll("footer").find((f) => f.parentNode && f.parentNode.rawTagName !== "blockquote" && !f.closest("section"));
  if (footer) containers.push(footer);

  const inserts = []; // { pos, text }
  const sections = [];
  const defaults = {};
  const usedSectionIds = new Set();

  containers.forEach((sec, i) => {
    const existingId = sec.getAttribute("data-nx-section");
    let id = existingId || sec.getAttribute("id") || (sec.rawTagName === "header" ? "header" : sec.rawTagName === "footer" ? "footer" : `section-${i + 1}`);
    id = slugify(id);
    let n = 2;
    const base = id;
    while (usedSectionIds.has(id)) id = `${base}-${n++}`;
    usedSectionIds.add(id);

    const { fields, lists } = collectFields(sec, {});
    if (fields.length === 0 && lists.length === 0) return;
    const [en, bn] = sectionLabel(sec, i + 1);
    const sectionDef = { id, label: { en, bn }, fields: [], lists: [] };
    const def = {};
    for (const f of fields) {
      sectionDef.fields.push(f.field);
      def[f.field.key] = f.value;
      if (!f.el.getAttribute("data-nx")) inserts.push({ pos: f.el.range[0] + 1 + f.el.rawTagName.length, text: ` data-nx="${id}.${f.field.key}"` });
    }
    for (const l of lists) {
      sectionDef.lists.push({
        key: l.key,
        label: l.label,
        min: 1,
        max: Math.max(l.items.length * 2, 12),
        fields: l.fields,
      });
      def[l.key] = { items: l.items };
      if (!l.el.getAttribute("data-nx-list")) inserts.push({ pos: l.el.range[0] + 1 + l.el.rawTagName.length, text: ` data-nx-list="${id}.${l.key}"` });
      for (const it of l.itemEls) {
        if (!it.hasAttribute("data-nx-item")) inserts.push({ pos: it.range[0] + 1 + it.rawTagName.length, text: ` data-nx-item` });
        for (const leaf of leavesUnderPublic(it)) {
          if (leaf._nxF && !leaf.hasAttribute("data-nx-f")) inserts.push({ pos: leaf.range[0] + 1 + leaf.rawTagName.length, text: ` data-nx-f="${leaf._nxF}"` });
        }
      }
    }
    if (!existingId) inserts.push({ pos: sec.range[0] + 1 + sec.rawTagName.length, text: ` data-nx-section="${id}"` });
    sections.push(sectionDef);
    defaults[id] = def;
  });

  // The page-wide contact details: one field changes every button.
  const tel = root.querySelector('a[href^="tel:"]');
  const wa = root.querySelector('a[href*="wa.me/"]');
  const maps = root.querySelector('a[href*="google.com/maps"], a[href*="maps.google"], a[href*="maps.app.goo.gl"]');
  const mapEmbed = root.querySelector('iframe[src*="google.com/maps"]');
  const fb = root.querySelector('a[href*="facebook.com"]');
  const ig = root.querySelector('a[href*="instagram.com"]');
  const yt = root.querySelector('a[href*="youtube.com"]');
  const phone = tel ? tel.getAttribute("href").replace("tel:", "") : "";
  let phoneDisplay = "";
  if (phone) {
    const digits = phone.replace(/\D/g, "").slice(-10);
    // How the number is written on the page, taken from the text of the call
    // buttons and the visible body text, never from hrefs.
    const re = new RegExp(`\\+?91[\\s-]?${digits.slice(0, 5)}[\\s-]?${digits.slice(5)}|${digits.slice(0, 5)}[\\s-]${digits.slice(5)}`);
    const texts = [...root.querySelectorAll('a[href^="tel:"]').map((a) => a.text), body.text];
    const m = texts.map((t) => t.match(re)).find(Boolean);
    phoneDisplay = m ? m[0] : `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  let waNumber = "";
  let waText = "";
  if (wa) {
    const href = wa.getAttribute("href");
    const m = href.match(/wa\.me\/(\d+)(?:\?text=([^&"]*))?/);
    if (m) {
      waNumber = m[1];
      try {
        waText = decodeURIComponent(m[2] || "");
      } catch {
        waText = m[2] || "";
      }
    }
  }
  const contactFields = [];
  const contactDef = {};
  if (phone) {
    contactFields.push({ key: "phone", type: "phone", label: { en: "Phone number for calls", bn: "কল করার ফোন নম্বর" }, help: { en: "Every call button on the website uses this number.", bn: "ওয়েবসাইটের সব কল বোতামে এই নম্বর ব্যবহার হয়।" } });
    contactDef.phone = phone.replace(/\D/g, "").slice(-10);
  }
  if (waNumber) {
    contactFields.push({ key: "whatsapp", type: "whatsapp", label: { en: "WhatsApp number", bn: "হোয়াটসঅ্যাপ নম্বর" }, help: { en: "Every WhatsApp button on the website opens a chat with this number.", bn: "ওয়েবসাইটের সব হোয়াটসঅ্যাপ বোতাম এই নম্বরে চ্যাট খোলে।" } });
    contactDef.whatsapp = waNumber.slice(-10);
    contactFields.push({ key: "whatsappText", type: "textarea", label: { en: "Ready-made WhatsApp message", bn: "আগে থেকে লেখা হোয়াটসঅ্যাপ বার্তা" }, help: { en: "The message a customer sees typed out when they tap a WhatsApp button.", bn: "গ্রাহক হোয়াটসঅ্যাপ বোতামে চাপ দিলে এই বার্তা লেখা থাকবে।" } });
    contactDef.whatsappText = waText;
  }
  if (maps || mapEmbed) {
    contactFields.push({ key: "maps", type: "map", label: { en: "Google Maps link", bn: "গুগল ম্যাপ লিংক" }, help: { en: "Open Google Maps, find your shop, tap Share and paste the link here.", bn: "গুগল ম্যাপে আপনার দোকান খুঁজে Share চেপে লিংকটি এখানে বসান।" } });
    contactDef.maps = maps ? maps.getAttribute("href") : mapEmbed.getAttribute("src").replace(/&output=embed$/, "");
  }
  for (const [key, el, en, bn] of [
    ["facebook", fb, "Facebook page link", "ফেসবুক পেজের লিংক"],
    ["instagram", ig, "Instagram link", "ইনস্টাগ্রাম লিংক"],
    ["youtube", yt, "YouTube channel link", "ইউটিউব চ্যানেলের লিংক"],
  ]) {
    if (el) {
      contactFields.push({ key, type: "social", social: key, label: { en, bn } });
      contactDef[key] = el.getAttribute("href");
    }
  }
  if (contactFields.length) {
    sections.push({ id: "contact", label: { en: SECTION_LABELS.contact[0], bn: SECTION_LABELS.contact[1] }, fields: contactFields, lists: [] });
    defaults.contact = contactDef;
  }
  sections.push({
    id: "seo",
    label: { en: SECTION_LABELS.seo[0], bn: SECTION_LABELS.seo[1] },
    fields: [
      { key: "title", type: "text", max: 70, label: { en: "Title shown in Google", bn: "গুগলে দেখানো শিরোনাম" } },
      { key: "description", type: "textarea", max: 170, label: { en: "Short description shown in Google", bn: "গুগলে দেখানো ছোট বিবরণ" } },
    ],
    lists: [],
  });
  defaults.seo = { title, description: desc };

  // Head: meta + script, once.
  const headEl = root.querySelector("head");
  const headClose = html.lastIndexOf("</head>");
  const bodyClose = html.lastIndexOf("</body>");
  const nxDefaults = JSON.stringify({ phone, phoneDisplay, whatsapp: waNumber }).replace(/'/g, "&#39;");
  if (!html.includes('name="nx-site"')) {
    inserts.push({ pos: headClose, text: `<meta name="nx-site" content="${slug}">\n<meta name="nx-defaults" content='${nxDefaults}'>\n` });
  }
  if (!html.includes("/nx/nx-content.js")) {
    inserts.push({ pos: bodyClose, text: `<script src="/nx/nx-content.js" defer></script>\n` });
  }
  void headEl;

  inserts.sort((a, b) => b.pos - a.pos);
  let out = html;
  for (const ins of inserts) out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos);
  if (out !== html) fs.writeFileSync(file, out);

  const schema = {
    site: slug,
    template: "demo-html",
    version: 1,
    name: business,
    sections,
    defaults,
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.json`), JSON.stringify(schema, null, 2) + "\n");
  const fieldCount = sections.reduce((n, s) => n + s.fields.length + s.lists.reduce((m, l) => m + l.fields.length, 0), 0);
  const listCount = sections.reduce((n, s) => n + s.lists.length, 0);
  return { slug, business, sections: sections.length, fields: fieldCount, lists: listCount, inserted: inserts.length };
}

// leavesUnder is defined inside collectFields; this is the same walk, exposed
// for the second pass that writes data-nx-f onto list items.
function leavesUnderPublic(el, acc = []) {
  if (SKIP_TAGS.has(el.rawTagName) || hasSkipClass(el)) return acc;
  const style = el.getAttribute("style") || "";
  if (/background(?:-image)?\s*:[^;]*url\(/i.test(style)) acc.push(el);
  if (el.rawTagName === "img") {
    acc.push(el);
    return acc;
  }
  if (isLeaf(el)) {
    acc.push(el);
    return acc;
  }
  for (const k of elementChildren(el)) leavesUnderPublic(k, acc);
  return acc;
}

function writeIndex(slugs) {
  const lines = [
    "// Generated by scripts/nx-annotate.mjs. Do not edit by hand.",
    'import type { SiteSchema } from "../types";',
    ...slugs.map((s, i) => `import d${i} from "./${s}.json";`),
    "",
    "export const DEMO_SCHEMAS: Record<string, SiteSchema> = {",
    ...slugs.map((s, i) => `  "${s}": d${i} as unknown as SiteSchema,`),
    "};",
    "",
    "export const DEMO_SLUGS = Object.keys(DEMO_SCHEMAS);",
    "",
  ];
  fs.writeFileSync(path.join(OUT_DIR, "index.ts"), lines.join("\n"));
}

const args = process.argv.slice(2);
const slugs = (args.length ? args : fs.readdirSync(DEMO_DIR)).filter((s) => fs.existsSync(path.join(DEMO_DIR, s, "index.html"))).sort();
const results = [];
for (const slug of slugs) {
  const r = annotate(slug);
  if (r) results.push(r);
}
const all = fs.readdirSync(DEMO_DIR).filter((s) => fs.existsSync(path.join(DEMO_DIR, s, "index.html"))).sort();
writeIndex(all.filter((s) => fs.existsSync(path.join(OUT_DIR, `${s}.json`))));
console.table(results);
