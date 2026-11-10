"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";

/* Shared pieces of the panel. Large targets, 16px minimum text, the Nexvora
   navy and blue. No icon without a word next to it. */

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded select-none leading-none ${className}`}>
      {name}
    </span>
  );
}

export function TopBar({ lang, setLang, title, back, right }: { lang: Lang; setLang: (l: Lang) => void; title: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-[#0a1128] text-white shadow-md">
      <div className="flex w-full items-center gap-2 px-3 py-2.5 sm:px-5 lg:px-8">
        {back ? (
          <a href={back} className="flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-xl px-2 text-base font-semibold text-white/90 hover:bg-white/10" aria-label={t(lang, "back")}>
            <Icon name="arrow_back" className="text-[24px]" />
            <span className="hidden sm:inline">{back.startsWith("/demo/") ? (lang === "bn" ? "ওয়েবসাইট" : "Website") : t(lang, "back")}</span>
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo-mark.png" alt="Nexvora" width={36} height={36} className="h-9 w-9 rounded-lg bg-white/10 p-1" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold leading-tight sm:text-lg">{title}</div>
        </div>
        {right}
        {/* Straight back to the sample websites from any panel screen, so a
            demo never dead-ends inside the panel. */}
        <Link href="/demos" className="indic inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/25 px-3 text-base font-semibold text-white hover:bg-white/10">
          <Icon name="grid_view" className="text-[20px]" />
          <span className="hidden sm:inline">{lang === "bn" ? "ডেমো" : "Demos"}</span>
        </Link>
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "bn" : "en")}
          className="indic min-h-[44px] rounded-xl border border-white/25 px-3 text-base font-semibold hover:bg-white/10"
          aria-label="Change language"
        >
          {t(lang, "language")}
        </button>
      </div>
    </header>
  );
}

export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  disabled,
  type = "button",
  className = "",
  target,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  target?: string;
  icon?: string;
}) {
  const base = "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-gradient-to-br from-[#2b5cff] to-[#4b2cf5] text-white shadow-lift hover:brightness-110",
    secondary: "border-2 border-[#2b5cff] bg-white text-[#243a99] hover:bg-brand-50",
    ghost: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    danger: "border-2 border-rose-300 bg-white text-rose-700 hover:bg-rose-50",
  }[variant];
  const cls = `${base} ${styles} ${className}`;
  const inner = (
    <>
      {icon ? <Icon name={icon} className="text-[22px]" /> : null}
      <span className="indic">{children}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} target={target} rel={target ? "noopener" : undefined} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

export function HelpButton({ lang, business }: { lang: Lang; business: string }) {
  const msg = encodeURIComponent(`${t(lang, "helpMessage")} ${business}.`);
  return (
    <a
      href={`https://wa.me/919804243159?text=${msg}`}
      target="_blank"
      rel="noopener"
      className="indic fixed bottom-4 right-4 z-40 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#25D366] px-4 text-base font-bold text-white shadow-lift hover:brightness-105"
    >
      <Icon name="chat" className="text-[22px]" />
      {t(lang, "help")}
    </a>
  );
}

export function Notice({ tone, children }: { tone: "info" | "warn" | "good" | "bad"; children: ReactNode }) {
  const cls = {
    info: "border-brand-100 bg-brand-50 text-brand-800",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    good: "border-emerald-200 bg-emerald-50 text-emerald-900",
    bad: "border-rose-200 bg-rose-50 text-rose-900",
  }[tone];
  return <div className={`indic rounded-2xl border px-4 py-3 text-base leading-snug ${cls}`}>{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</div>;
}

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5">
      <div className="indic text-base font-semibold text-slate-900">{children}</div>
      {hint ? <div className="indic mt-0.5 text-sm text-slate-600">{hint}</div> : null}
    </div>
  );
}

export const inputCls =
  "indic w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-[#2b5cff] focus:ring-2 focus:ring-[#2b5cff]/30";

/** Strips tags for a one-line preview. */
export function plain(value: unknown): string {
  if (typeof value === "string") return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (value && typeof value === "object") {
    const o = value as { text?: string; alt?: string; src?: string };
    return o.text ?? o.alt ?? (o.src ? "Photo" : "");
  }
  return "";
}
