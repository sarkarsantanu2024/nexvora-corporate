"use client";

import { useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import { Button, Card, Label, Notice, inputCls } from "./ui";

export function LoginForm({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<"wrong" | "locked" | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="indic text-2xl font-bold text-slate-900">{t(lang, "login")}</h1>
      <p className="indic mt-1 text-base text-slate-600">{t(lang, "loginIntro")}</p>
      <form
        className="mt-5 grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const r = await fetch("/api/nx/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, password }) });
          const j = await r.json();
          setBusy(false);
          if (!r.ok) setErr(j.error === "locked" ? "locked" : "wrong");
          else onDone();
        }}
      >
        <div>
          <Label>{t(lang, "phone")}</Label>
          <input className={inputCls} inputMode="tel" autoComplete="username" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>{t(lang, "password")}</Label>
          <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err ? <Notice tone="bad">{t(lang, err === "locked" ? "locked" : "wrongLogin")}</Notice> : null}
        <Button type="submit" disabled={busy || !phone || !password}>
          {t(lang, "login")}
        </Button>
        <p className="indic text-sm leading-relaxed text-slate-600">{t(lang, "forgot")}</p>
      </form>
    </Card>
  );
}

export function ChangePasswordForm({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const mismatch = p2.length > 0 && p1 !== p2;
  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="indic text-2xl font-bold text-slate-900">{t(lang, "newPassword")}</h1>
      <p className="indic mt-1 text-base text-slate-600">{t(lang, "newPasswordIntro")}</p>
      <form
        className="mt-5 grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (mismatch || p1.length < 4) return;
          setBusy(true);
          await fetch("/api/nx/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ newPassword: p1 }) });
          setBusy(false);
          onDone();
        }}
      >
        <input className={inputCls} type="password" autoComplete="new-password" placeholder={t(lang, "password")} value={p1} onChange={(e) => setP1(e.target.value)} />
        <input className={inputCls} type="password" autoComplete="new-password" placeholder={t(lang, "password")} value={p2} onChange={(e) => setP2(e.target.value)} />
        {mismatch ? <Notice tone="bad">{lang === "bn" ? "দুটি পাসওয়ার্ড এক নয়।" : "The two passwords are not the same."}</Notice> : null}
        <Button type="submit" disabled={busy || p1.length < 4 || mismatch}>
          {t(lang, "done")}
        </Button>
      </form>
    </Card>
  );
}
