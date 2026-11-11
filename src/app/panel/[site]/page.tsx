"use client";

import Link from "next/link";
import { useState } from "react";
import { t } from "@/nx/i18n";
import { useAccess } from "@/nx/panel/access";
import { useSite } from "@/nx/panel/provider";
import { LockedScreen, PageTitle, PanelShell } from "@/nx/panel/shell";
import { Button, Card, Icon, Notice, plain } from "@/nx/panel/ui";
import type { SectionDef, SiteContent } from "@/nx/types";
import { isHidden, isListValue } from "@/nx/types";

/* The website screen of the panel: View, Preview, Publish, Undo, and one
   card per section of the website in page order, laid out as a grid. */

function sectionIcon(sec: SectionDef): string {
  const s = `${sec.id} ${sec.label.en}`.toLowerCase();
  if (sec.id === "contact") return "call";
  if (sec.id === "seo") return "search";
  if (sec.id === "header") return "vertical_align_top";
  if (sec.id === "footer") return "vertical_align_bottom";
  if (/banner|hero|top/.test(s)) return "web";
  if (/team|trainer|teacher|doctor|staff|about|story|generation/.test(s)) return "groups";
  if (/gallery|photo/.test(s)) return "photo_library";
  if (/say|review|word|customer|parent/.test(s)) return "format_quote";
  if (/price|fee|rate|cost|charge/.test(s)) return "currency_rupee";
  if (/visit|address|find|hour|timing|open/.test(s)) return "location_on";
  if (/class|course|batch|service|treatment|menu|sweet|product/.test(s)) return "list_alt";
  if (/offer|box|festival|package|plan/.test(s)) return "local_offer";
  if (/order|book|call|enquire|contact|whatsapp/.test(s)) return "chat";
  return "article";
}

function previewLine(sec: SectionDef, content: SiteContent, itemsWord: string): string {
  const c = content[sec.id] ?? {};
  for (const f of sec.fields) {
    if (f.type === "text" || f.type === "textarea") {
      const p = plain(c[f.key]);
      if (p) return p;
    }
  }
  const list = sec.lists[0];
  if (list) {
    const v = c[list.key];
    if (isListValue(v)) return `${v.items.length} ${itemsWord}`;
  }
  for (const f of sec.fields) {
    const p = plain(c[f.key]);
    if (p) return p;
  }
  return "";
}

export default function SiteHome() {
  const { schema, lang, content, dirty, saveState, publish, undo, siteHref, previewHref, storage, admin, site } = useSite();
  const { access, loaded } = useAccess(site);
  const [msg, setMsg] = useState<{ tone: "good" | "info" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const itemsWord = t(lang, "items");

  // A client whose plan has no editing yet sees why, not the forms.
  // Nexvora always gets in.
  if (loaded && !admin && !access.edit) {
    return (
      <PanelShell active="website">
        <PageTitle title={t(lang, "mySite")} sub={schema.name} />
        <LockedScreen what="edit" />
      </PanelShell>
    );
  }

  return (
    <PanelShell active="website">
      <PageTitle title={t(lang, "mySite")} sub={schema.name} />
      {storage === "browser" ? (
        <div className="mb-4">
          <Notice tone="info">{t(lang, "tryIntro")}</Notice>
        </div>
      ) : null}

      <Card className="flex flex-wrap items-center gap-3">
        <Button href={siteHref} target="_blank" variant="secondary" icon="open_in_new">
          {t(lang, "viewSite")}
        </Button>
        <Button href={previewHref} target="_blank" variant="ghost" icon="visibility">
          {t(lang, "preview")}
        </Button>
        <Button
          icon="publish"
          disabled={busy || !dirty}
          onClick={async () => {
            setBusy(true);
            const r = await publish();
            setBusy(false);
            setMsg(r === "ok" ? { tone: "good", text: t(lang, "published") } : r === "nothing" ? { tone: "info", text: t(lang, "nothingToPublish") } : { tone: "bad", text: t(lang, "saveError") });
          }}
        >
          {busy ? t(lang, "publishing") : t(lang, "publish")}
        </Button>
        <button
          type="button"
          className="indic inline-flex min-h-[52px] items-center gap-1 rounded-xl px-3 text-base font-semibold text-slate-700 hover:bg-slate-100"
          onClick={async () => {
            const r = await undo();
            setMsg(r === "ok" ? { tone: "good", text: t(lang, "undone") } : r === "nothing" ? { tone: "info", text: t(lang, "nothingToUndo") } : { tone: "bad", text: t(lang, "saveError") });
          }}
        >
          <Icon name="undo" className="text-[20px]" />
          {t(lang, "undo")}
        </button>
        <span className="indic ml-auto text-sm text-slate-500">{saveState === "saving" ? t(lang, "saving") : saveState === "error" ? t(lang, "saveError") : saveState === "saved" ? t(lang, "saved") : ""}</span>
      </Card>
      {msg ? (
        <div className="mt-3">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      ) : dirty ? (
        <div className="mt-3">
          <Notice tone="warn">{t(lang, "unpublished")}</Notice>
        </div>
      ) : null}

      <h2 className="indic mt-8 text-xl font-bold">{t(lang, "sections")}</h2>
      <p className="indic mt-1 text-base text-slate-600">{t(lang, "sectionHelp")}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {schema.sections.map((sec) => (
          <Link key={sec.id} href={`/panel/${schema.site}/${sec.id}`} className="group block min-w-0">
            <Card className={`flex h-full items-center gap-4 transition hover:border-[#2b5cff] ${isHidden(content[sec.id]) ? "bg-slate-50" : ""}`}>
              <div className={`icon-tile h-14 w-14 shrink-0 ${isHidden(content[sec.id]) ? "opacity-40 grayscale" : ""}`}>
                <Icon name={isHidden(content[sec.id]) ? "visibility_off" : sectionIcon(sec)} className="text-[28px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="indic break-words text-lg font-bold leading-tight text-slate-900">{sec.label[lang]}</div>
                <div className="indic mt-0.5 truncate text-base text-slate-500">{isHidden(content[sec.id]) ? t(lang, "hiddenBadge") : previewLine(sec, content, itemsWord)}</div>
              </div>
              <Icon name="chevron_right" className="text-[28px] text-slate-400 group-hover:text-[#2b5cff]" />
            </Card>
          </Link>
        ))}
      </div>
    </PanelShell>
  );
}
