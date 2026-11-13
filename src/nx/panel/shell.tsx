"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { b } from "../biz/i18n";
import { sectorForSite } from "../biz/sectors";
import { t } from "../i18n";
import { useAccess } from "./access";
import { clearDemoSession } from "./demo-session";
import { useSite } from "./provider";
import { Button, HelpButton, Icon, TopBar } from "./ui";

/* The frame around every panel screen: a sidebar on a laptop, a scrolling
   row of tabs on a phone. One menu for the website and the business, so the
   client has a single place to go. The business screens are locked until
   Nexvora switches the dashboard on (after the monthly subscription is
   paid); Nexvora itself is never locked out. */

/** Whether the business screens are open: switched on by Nexvora, or Nexvora looking. */
export function useDashboardOpen(site: string, admin: boolean): boolean {
  const { access } = useAccess(site);
  return admin || access.dashboard;
}

export type ModuleKey = "website" | "dashboard" | "people" | "payments" | "expenses" | "items" | "reports" | "reminders" | "staff" | "settings";

export function menuFor(site: string, lang: "en" | "bn") {
  const sector = sectorForSite(site);
  const items: { key: ModuleKey; label: string; icon: string; biz: boolean }[] = [
    { key: "website", label: t(lang, "mySite"), icon: "web", biz: false },
    { key: "dashboard", label: b(lang, "dashboard"), icon: "space_dashboard", biz: true },
    { key: "people", label: sector.people[lang], icon: "groups", biz: true },
    { key: "payments", label: b(lang, "payments"), icon: "currency_rupee", biz: true },
    { key: "expenses", label: b(lang, "expenses"), icon: "receipt_long", biz: true },
  ];
  if (sector.items) items.push({ key: "items", label: sector.items[lang], icon: "inventory_2", biz: true });
  items.push(
    { key: "reports", label: b(lang, "reports"), icon: "bar_chart", biz: true },
    { key: "reminders", label: b(lang, "reminders"), icon: "chat", biz: true },
    { key: "staff", label: b(lang, "staff"), icon: "badge", biz: true },
    { key: "settings", label: b(lang, "settings"), icon: "settings", biz: false },
  );
  return items;
}

export function moduleHref(site: string, key: ModuleKey) {
  return key === "website" ? `/panel/${site}` : `/panel/${site}/app/${key}`;
}

export function PanelShell({ active, title, back, children, wide = true }: { active: ModuleKey; title?: ReactNode; back?: string; children: ReactNode; wide?: boolean }) {
  const { schema, lang, setLang, site, siteHref, storage, admin } = useSite();
  const { access, loaded } = useAccess(site);
  const open = admin || access.dashboard;
  // A client with the dashboard but no editing does not see "My website".
  const menu = menuFor(site, lang).filter((m) => m.key !== "website" || admin || !loaded || access.edit || !access.dashboard);
  const logout = async () => {
    if (storage === "neon") await fetch("/api/nx/session", { method: "DELETE" });
    else clearDemoSession(site);
    window.location.href = siteHref;
  };
  return (
    <>
      <TopBar
        lang={lang}
        setLang={setLang}
        title={title ?? schema.name}
        back={back ?? siteHref}
        right={
          <button type="button" onClick={logout} className="indic inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/25 px-3 text-base font-semibold text-white hover:bg-white/10">
            <Icon name="logout" className="text-[20px]" />
            <span className="hidden sm:inline">{t(lang, "logout")}</span>
          </button>
        }
      />
      <div className="mx-auto flex w-full max-w-[1500px] gap-6 px-3 py-4 sm:px-5 lg:px-8 lg:py-6">
        <nav className="hidden w-64 shrink-0 lg:block" aria-label="Panel menu">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {menu.map((m) => {
              const locked = m.biz && !open;
              const isActive = m.key === active;
              return (
                <Link
                  key={m.key}
                  href={moduleHref(site, m.key)}
                  className={`indic mb-0.5 flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-base font-semibold transition ${
                    isActive ? "bg-gradient-to-br from-[#2b5cff] to-[#4b2cf5] text-white shadow-lift" : locked ? "text-slate-400 hover:bg-slate-50" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  <Icon name={m.icon} className="text-[22px]" />
                  <span className="flex-1">{m.label}</span>
                  {locked ? <Icon name="lock" className="text-[18px]" /> : null}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="min-w-0 flex-1">
          <div className="-mx-3 mb-4 overflow-x-auto px-3 lg:hidden">
            <div className="flex w-max gap-2">
              {menu.map((m) => {
                const locked = m.biz && !open;
                const isActive = m.key === active;
                return (
                  <Link
                    key={m.key}
                    href={moduleHref(site, m.key)}
                    className={`indic inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-base font-semibold ${
                      isActive ? "border-transparent bg-[#0a1128] text-white" : locked ? "border-slate-200 bg-white text-slate-400" : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <Icon name={locked ? "lock" : m.icon} className="text-[20px]" />
                    {m.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <main className={`${wide ? "" : "max-w-4xl"} pb-28`}>{children}</main>
        </div>
      </div>
      <HelpButton lang={lang} business={schema.name} />
    </>
  );
}

export function LockedScreen({ what = "dashboard" }: { what?: "dashboard" | "edit" }) {
  const { lang, schema } = useSite();
  const title = what === "edit" ? b(lang, "editLocked") : b(lang, "locked");
  const intro = what === "edit" ? b(lang, "editLockedIntro") : b(lang, "lockedIntro");
  const msg = what === "edit" ? `Hello, I want website editing switched on for ${schema.name}.` : `Hello, I want to start the business dashboard subscription for ${schema.name}.`;
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center sm:p-10">
      <div className="icon-tile mx-auto h-16 w-16">
        <Icon name="lock" className="text-[32px]" />
      </div>
      <h1 className="indic mt-4 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="indic mt-3 text-base leading-relaxed text-slate-700">{intro}</p>
      <div className="mt-6">
        <Button href={`https://wa.me/919804243159?text=${encodeURIComponent(msg)}`} target="_blank" icon="chat">
          {b(lang, "askUpgrade")}
        </Button>
      </div>
    </div>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="indic text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {sub ? <p className="indic mt-1 text-base text-slate-600">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, tone = "plain", icon }: { label: string; value: string; tone?: "plain" | "good" | "bad" | "warn"; icon: string }) {
  const color = { plain: "text-slate-900", good: "text-emerald-700", bad: "text-rose-700", warn: "text-amber-700" }[tone];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="icon-tile-soft h-12 w-12">
        <Icon name={icon} className="text-[24px]" />
      </div>
      <div className="min-w-0">
        <div className="indic truncate text-sm font-medium text-slate-500">{label}</div>
        <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
      </div>
    </div>
  );
}
