"use client";

import Link from "next/link";
import { useEffect } from "react";
import { t } from "@/nx/i18n";
import { FieldEditor } from "@/nx/panel/fields";
import { ListEditor } from "@/nx/panel/list-editor";
import { useSite } from "@/nx/panel/provider";
import { Button, Card, HelpButton, Icon, Notice, TopBar } from "@/nx/panel/ui";
import type { FieldValue, ItemValue } from "@/nx/types";
import { isListValue } from "@/nx/types";

/* One section of the website: its fields, then its lists. Every change saves
   as a draft by itself; the Publish button is on the home screen. */

export default function SectionPage({ params }: { params: { section: string } }) {
  const { schema, lang, setLang, content, setField, setList, saveState, dirty, previewHref } = useSite();
  const sec = schema.sections.find((s) => s.id === params.section);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  if (!sec) {
    return (
      <>
        <TopBar lang={lang} setLang={setLang} title={schema.name} back={`/panel/${schema.site}`} />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Notice tone="bad">
            Unknown section. <Link href={`/panel/${schema.site}`} className="underline">{t(lang, "back")}</Link>
          </Notice>
        </main>
      </>
    );
  }
  const values = content[sec.id] ?? {};
  const saveWord = saveState === "saving" ? t(lang, "saving") : saveState === "error" ? t(lang, "saveError") : saveState === "saved" ? t(lang, "saved") : "";

  return (
    <>
      <TopBar
        lang={lang}
        setLang={setLang}
        title={sec.label[lang]}
        back={`/panel/${schema.site}`}
        right={
          <span className={`indic hidden items-center gap-1 text-sm sm:inline-flex ${saveState === "error" ? "text-rose-300" : "text-white/80"}`}>
            {saveState === "saved" ? <Icon name="check_circle" className="text-[18px]" /> : null}
            {saveWord}
          </span>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-5 pb-32">
        {sec.fields.length ? (
          <Card className="grid min-w-0 grid-cols-1 gap-5">
            {sec.fields.map((f) => (
              <FieldEditor key={f.key} field={f} value={values[f.key] as FieldValue | undefined} lang={lang} onChange={(v) => setField(sec.id, f.key, v)} />
            ))}
          </Card>
        ) : null}
        {sec.lists.map((l) => {
          const v = values[l.key];
          const items: ItemValue[] = isListValue(v) ? v.items : [];
          return (
            <div key={l.key} className="mt-6">
              <ListEditor schema={schema} sectionId={sec.id} list={l} items={items} lang={lang} onChange={(next) => setList(sec.id, l.key, next)} />
            </div>
          );
        })}
      </main>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className={`indic flex-1 text-sm ${saveState === "error" ? "text-rose-700" : "text-slate-500"}`}>{saveWord || (dirty ? t(lang, "unpublished") : "")}</span>
          <Button href={previewHref} target="_blank" variant="ghost" icon="visibility" className="min-h-[48px]">
            {t(lang, "preview")}
          </Button>
          <Link href={`/panel/${schema.site}`} className="indic inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#2b5cff] to-[#4b2cf5] px-5 text-base font-semibold text-white shadow-lift">
            <Icon name="check" className="text-[22px]" />
            {t(lang, "done")}
          </Link>
        </div>
      </div>
      <div className="hidden sm:block">
        <HelpButton lang={lang} business={schema.name} />
      </div>
    </>
  );
}
