"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { FieldDef, FieldValue, ImageValue, LinkValue } from "../types";
import { isImageValue, isLinkValue } from "../types";
import { Button, Icon, Label, inputCls } from "./ui";

/* One editor per field type. Adding a field type means adding a case here and
   nothing anywhere else in the panel. */

export function FieldEditor({ field, value, onChange, lang }: { field: FieldDef; value: FieldValue | undefined; onChange: (v: FieldValue) => void; lang: Lang }) {
  const label = field.label[lang];
  const help = field.help?.[lang];
  switch (field.type) {
    case "text":
    case "textarea":
      return field.html ? (
        <InlineHtml label={label} help={help} value={typeof value === "string" ? value : ""} onChange={onChange} multiline={field.type === "textarea"} />
      ) : field.type === "textarea" ? (
        <div>
          <Label hint={help}>{label}</Label>
          <AutoTextarea value={typeof value === "string" ? value : ""} onChange={onChange} max={field.max} />
        </div>
      ) : (
        <div>
          <Label hint={help}>{label}</Label>
          <input className={inputCls} value={typeof value === "string" ? value : ""} maxLength={field.max} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "image":
      return <ImageField field={field} value={isImageValue(value) ? value : { src: "", alt: "" }} onChange={onChange} lang={lang} />;
    case "link":
      return <LinkField label={label} help={help} value={isLinkValue(value) ? value : { text: "", href: "" }} onChange={onChange} lang={lang} />;
    case "phone":
    case "whatsapp":
      return <PhoneField label={label} help={help ?? t(lang, "phoneHelp")} value={typeof value === "string" ? value : ""} onChange={onChange} lang={lang} />;
    case "url":
    case "map":
    case "social":
      return <UrlField field={field} value={typeof value === "string" ? value : ""} onChange={onChange} lang={lang} />;
    default:
      return null;
  }
}

function AutoTextarea({ value, onChange, max }: { value: string; onChange: (v: string) => void; max?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 96)}px`;
  }, [value]);
  return <textarea ref={ref} className={`${inputCls} min-h-[96px] resize-none`} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />;
}

const ALLOWED = new Set(["B", "STRONG", "I", "EM", "SMALL", "BR", "U", "SUP", "SUB", "MARK", "SPAN"]);
function sanitize(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild as HTMLElement;
  const walk = (node: Node) => {
    for (const k of Array.from(node.childNodes)) {
      if (k.nodeType === 1) {
        const el = k as HTMLElement;
        if (!ALLOWED.has(el.tagName)) {
          // Divs the browser inserts on Enter become line breaks.
          const isBlock = /^(DIV|P)$/.test(el.tagName);
          const frag = doc.createDocumentFragment();
          if (isBlock && el.previousSibling) frag.appendChild(doc.createElement("br"));
          while (el.firstChild) frag.appendChild(el.firstChild);
          node.replaceChild(frag, el);
          walk(node);
          return;
        }
        for (const a of Array.from(el.attributes)) if (a.name !== "class") el.removeAttribute(a.name);
        walk(el);
      } else if (k.nodeType !== 3) node.removeChild(k);
    }
  };
  walk(root);
  return root.innerHTML;
}

/** Text that carries its own styling (an italic word, a coloured span). The
    owner types over the words; the styling stays. */
function InlineHtml({ label, help, value, onChange, multiline }: { label: string; help?: string; value: string; onChange: (v: string) => void; multiline: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(value);
  useEffect(() => {
    if (ref.current && value !== last.current) {
      ref.current.innerHTML = value;
      last.current = value;
    }
  }, [value]);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      <Label hint={help}>{label}</Label>
      <div
        ref={ref}
        role="textbox"
        aria-multiline={multiline}
        contentEditable
        suppressContentEditableWarning
        className={`${inputCls} min-h-[52px] whitespace-pre-wrap [&_em]:italic [&_b]:font-bold [&_strong]:font-bold [&_small]:text-sm [&_small]:text-slate-500`}
        onInput={(e) => {
          const html = sanitize((e.target as HTMLElement).innerHTML);
          last.current = html;
          onChange(html);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (multiline) document.execCommand("insertHTML", false, "<br>");
          }
        }}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }}
      />
    </div>
  );
}

function LinkField({ label, help, value, onChange, lang }: { label: string; help?: string; value: LinkValue; onChange: (v: LinkValue) => void; lang: Lang }) {
  const bad = value.href !== "" && !/^(https?:\/\/|mailto:|tel:|#)/i.test(value.href);
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <Label hint={help}>{label}</Label>
      <div className="grid gap-2">
        <input className={inputCls} value={value.text} placeholder={t(lang, "linkText")} aria-label={t(lang, "linkText")} onChange={(e) => onChange({ ...value, text: e.target.value })} />
        <input className={inputCls} value={value.href} inputMode="url" placeholder={t(lang, "linkHref")} aria-label={t(lang, "linkHref")} onChange={(e) => onChange({ ...value, href: e.target.value.trim() })} />
        {bad ? <p className="indic text-sm text-rose-700">{t(lang, "urlError")}</p> : null}
      </div>
    </div>
  );
}

function PhoneField({ label, help, value, onChange, lang }: { label: string; help?: string; value: string; onChange: (v: string) => void; lang: Lang }) {
  const digits = value.replace(/\D/g, "");
  const bad = digits.length > 0 && digits.length !== 10;
  return (
    <div>
      <Label hint={help}>{label}</Label>
      <div className="flex items-stretch gap-2">
        <span className="inline-flex items-center rounded-xl border border-slate-300 bg-slate-100 px-3 text-base font-semibold text-slate-700">+91</span>
        <input className={inputCls} inputMode="numeric" value={digits} maxLength={10} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))} />
      </div>
      {bad ? <p className="indic mt-1 text-sm text-rose-700">{t(lang, "phoneError")}</p> : null}
    </div>
  );
}

function UrlField({ field, value, onChange, lang }: { field: FieldDef; value: string; onChange: (v: string) => void; lang: Lang }) {
  const hosts: Record<string, RegExp> = { facebook: /facebook\.com|fb\.com/i, instagram: /instagram\.com/i, youtube: /youtube\.com|youtu\.be/i };
  const badUrl = value !== "" && !/^https?:\/\//i.test(value);
  const badHost = !badUrl && value !== "" && field.social && !hosts[field.social].test(value);
  const icon = field.social === "facebook" ? "thumb_up" : field.social === "instagram" ? "photo_camera" : field.social === "youtube" ? "smart_display" : field.type === "map" ? "location_on" : "link";
  return (
    <div>
      <Label hint={field.help?.[lang]}>
        <span className="inline-flex items-center gap-1.5">
          <Icon name={icon} className="text-[20px] text-brand-600" />
          {field.label[lang]}
        </span>
      </Label>
      <input className={inputCls} inputMode="url" value={value} onChange={(e) => onChange(e.target.value.trim())} />
      {badUrl ? <p className="indic mt-1 text-sm text-rose-700">{t(lang, "urlError")}</p> : null}
      {badHost ? <p className="indic mt-1 text-sm text-rose-700">{t(lang, "socialError")}</p> : null}
    </div>
  );
}

/** Reads a photo from the phone, fixes rotation, crops to the field's shape,
    shrinks it to at most 1600px and under about 300 KB, and returns WebP. */
export async function compressImage(file: File, aspect?: string): Promise<string> {
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  } catch {
    bitmap = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }
  const sw = "width" in bitmap ? bitmap.width : 0;
  const sh = "height" in bitmap ? bitmap.height : 0;
  let cx = 0;
  let cy = 0;
  let cw = sw;
  let ch = sh;
  if (aspect && /^\d+:\d+$/.test(aspect)) {
    const [aw, ah] = aspect.split(":").map(Number);
    const want = aw / ah;
    const have = sw / sh;
    if (Math.abs(want - have) / want > 0.02) {
      if (have > want) {
        cw = Math.round(sh * want);
        cx = Math.round((sw - cw) / 2);
      } else {
        ch = Math.round(sw / want);
        cy = Math.round((sh - ch) / 2);
      }
    }
  }
  const scale = Math.min(1, 1600 / Math.max(cw, ch));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cw * scale));
  canvas.height = Math.max(1, Math.round(ch * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap as CanvasImageSource, cx, cy, cw, ch, 0, 0, canvas.width, canvas.height);
  for (const q of [0.82, 0.7, 0.58, 0.45]) {
    const url = canvas.toDataURL("image/webp", q);
    if (url.length * 0.75 < 300 * 1024 || q === 0.45) return url;
  }
  return canvas.toDataURL("image/webp", 0.45);
}

function ImageField({ field, value, onChange, lang }: { field: FieldDef; value: ImageValue; onChange: (v: ImageValue) => void; lang: Lang }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ratio = field.aspect && /^\d+:\d+$/.test(field.aspect) ? field.aspect.replace(":", " / ") : "4 / 3";
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <Label hint={field.help?.[lang] ?? t(lang, "photoHelp")}>{field.label[lang]}</Label>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-start">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" style={{ aspectRatio: ratio, maxHeight: 260 }}>
          {value.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.src} alt={value.alt} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-slate-400">
              <Icon name="image" className="text-[40px]" />
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 10 * 1024 * 1024) {
                setErr(t(lang, "photoTooBig"));
                return;
              }
              setErr(null);
              setBusy(true);
              try {
                const src = await compressImage(f, field.aspect);
                onChange({ ...value, src });
              } catch {
                setErr(t(lang, "saveError"));
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button variant="secondary" icon="add_a_photo" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "..." : t(lang, "changePhoto")}
          </Button>
          {!field.bg ? (
            <input className={inputCls} value={value.alt} placeholder={t(lang, "photoAlt")} aria-label={t(lang, "photoAlt")} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
          ) : null}
          {err ? <p className="indic text-sm text-rose-700">{err}</p> : null}
        </div>
      </div>
    </div>
  );
}
