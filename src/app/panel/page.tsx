"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEMOS } from "@/lib/demos";
import { t } from "@/nx/i18n";
import { LoginForm } from "@/nx/panel/login";
import { useLangOnly, type Session } from "@/nx/panel/provider";
import { Card, Icon, Notice, TopBar } from "@/nx/panel/ui";
import { allSites } from "@/nx/schemas";
import type { StorageMode } from "@/nx/types";

/* /panel
   With a database: log in, then pick your website.
   Without one (the public demo): every sample website has its own Login
   button, so this page just points back to the samples. */

export default function PanelHome() {
  const [lang, setLang] = useLangOnly();
  const [state, setState] = useState<{ storage: StorageMode; session: Session | null } | null>(null);
  const load = () =>
    fetch("/api/nx/session", { cache: "no-store" })
      .then((r) => r.json())
      .then(setState)
      .catch(() => setState({ storage: "browser", session: null }));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (state && state.storage !== "neon") window.location.replace("/demos");
  }, [state]);

  const sites = allSites();

  return (
    <>
      <TopBar lang={lang} setLang={setLang} title={t(lang, "panelName")} back="/demos" />
      <main className="mx-auto max-w-[1500px] px-4 py-6 pb-24 sm:px-6 lg:px-8">
        {!state || state.storage !== "neon" ? (
          <p className="text-slate-500">...</p>
        ) : !state.session ? (
          <LoginForm lang={lang} onDone={load} />
        ) : (
          <>
            <h1 className="indic text-2xl font-bold">{t(lang, "mySite")}</h1>
            <div className="mt-4">
              <Notice tone="info">
                {state.session.name} ·{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={async () => {
                    await fetch("/api/nx/session", { method: "DELETE" });
                    load();
                  }}
                >
                  {t(lang, "logout")}
                </button>
              </Notice>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {sites
                .filter((s) => state.session!.role === "owner" || state.session!.sites.includes(s.site))
                .map((s) => {
                  const d = DEMOS.find((x) => x.slug === s.site);
                  return (
                    <Link key={s.site} href={`/panel/${s.site}`} className="group block min-w-0">
                      <Card className="flex items-center gap-3 transition hover:border-[#2b5cff]">
                        {d ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base font-bold">{s.name}</div>
                          <div className="truncate text-sm text-slate-500">{d?.kind ?? s.site}</div>
                        </div>
                        <Icon name="chevron_right" className="text-[26px] text-slate-400 group-hover:text-[#2b5cff]" />
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
