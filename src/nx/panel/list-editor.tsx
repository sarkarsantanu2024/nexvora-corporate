"use client";

import { useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import { blankItem } from "../schemas";
import type { ItemValue, ListDef, SiteSchema } from "../types";
import { isImageValue } from "../types";
import { FieldEditor } from "./fields";
import { Button, Icon, Notice, plain } from "./ui";

/* A repeatable list: price rows, services, trainers, gallery photos. Items
   are cards with a thumbnail and a first line. Up and down arrows reorder;
   there is no drag and drop because thumbs on a small screen cannot do it. */

export function ListEditor({ schema, sectionId, list, items, onChange, lang }: { schema: SiteSchema; sectionId: string; list: ListDef; items: ItemValue[]; onChange: (items: ItemValue[]) => void; lang: Lang }) {
  const [open, setOpen] = useState<number | null>(null);
  const atMax = items.length >= list.max;
  const atMin = items.length <= list.min;
  const imgKey = list.fields.find((f) => f.type === "image")?.key;
  const textKeys = list.fields.filter((f) => f.type !== "image").map((f) => f.key);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    if (open === i) setOpen(j);
  };
  const remove = (i: number) => {
    if (atMin) return;
    if (!window.confirm(t(lang, "confirmRemove"))) return;
    onChange(items.filter((_, k) => k !== i));
    setOpen(null);
  };
  const add = () => {
    if (atMax) return;
    onChange([...items, blankItem(schema, sectionId, list.key)]);
    setOpen(items.length);
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <h2 className="indic min-w-0 break-words text-lg font-bold text-slate-900">{list.label[lang]}</h2>
        <span className="indic text-sm text-slate-500">
          {items.length} {t(lang, "items")}
        </span>
      </div>
      {items.map((item, i) => {
        const img = imgKey && isImageValue(item[imgKey]) ? (item[imgKey] as { src: string }).src : null;
        const first = textKeys.map((k) => plain(item[k])).find(Boolean) || `#${i + 1}`;
        const second = textKeys.map((k) => plain(item[k])).filter(Boolean)[1];
        const isOpen = open === i;
        return (
          <div key={i} className={`min-w-0 rounded-2xl border bg-white shadow-sm ${isOpen ? "border-[#2b5cff] ring-1 ring-[#2b5cff]" : "border-slate-200"}`}>
            <div className="flex items-center gap-3 p-3">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-base font-bold text-slate-500">{i + 1}</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="indic truncate text-base font-semibold text-slate-900">{first}</div>
                {second ? <div className="indic truncate text-sm text-slate-500">{second}</div> : null}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t(lang, "moveUp")} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700 disabled:opacity-30">
                  <Icon name="keyboard_arrow_up" className="text-[22px]" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={t(lang, "moveDown")} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700 disabled:opacity-30">
                  <Icon name="keyboard_arrow_down" className="text-[22px]" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-3 py-2">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="indic inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-50 text-base font-semibold text-brand-700">
                <Icon name={isOpen ? "expand_less" : "edit"} className="text-[20px]" />
                {isOpen ? t(lang, "done") : t(lang, "edit")}
              </button>
              <button type="button" onClick={() => remove(i)} disabled={atMin} className="indic inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 text-base font-semibold text-rose-700 disabled:opacity-40">
                <Icon name="delete" className="text-[20px]" />
                {t(lang, "remove")}
              </button>
            </div>
            {isOpen ? (
              <div className="grid gap-4 border-t border-slate-100 p-3 sm:p-4">
                {list.fields.map((f) => (
                  <FieldEditor
                    key={f.key}
                    field={f}
                    value={item[f.key]}
                    lang={lang}
                    onChange={(v) => {
                      const next = items.slice();
                      next[i] = { ...item, [f.key]: v };
                      onChange(next);
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      {atMin && items.length > 0 ? <p className="indic text-sm text-slate-500">{t(lang, "minReached")}</p> : null}
      {atMax ? <Notice tone="info">{t(lang, "maxReached")}</Notice> : <Button variant="secondary" icon="add" onClick={add}>{t(lang, "addNew")}</Button>}
    </div>
  );
}
