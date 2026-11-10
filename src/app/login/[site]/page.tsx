"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMOS } from "@/lib/demos";
import { t } from "@/nx/i18n";
import { addDemoUser, checkDemoLogin, DEMO_USER, writeDemoSession } from "@/nx/panel/demo-session";
import { LoginForm } from "@/nx/panel/login";
import { useLangOnly } from "@/nx/panel/provider";
import { Button, Card, Icon, Label, Notice, inputCls } from "@/nx/panel/ui";
import { getSchema } from "@/nx/schemas";
import type { StorageMode } from "@/nx/types";

/* /login/<site>: the door from a sample website into its own panel and
   dashboard. Log in with demo / 123, or sign up with the short form. With a
   real database (neon mode) the real login form is shown instead. */

const S = {
  welcome: { en: "Welcome back", bn: "আবার স্বাগতম" },
  login: { en: "Log in", bn: "লগ ইন" },
  signup: { en: "Sign up", bn: "সাইন আপ" },
  username: { en: "Username", bn: "ইউজারনেম" },
  password: { en: "Password", bn: "পাসওয়ার্ড" },
  confirm: { en: "Confirm password", bn: "পাসওয়ার্ড আবার লিখুন" },
  fullName: { en: "Full name", bn: "পুরো নাম" },
  phone: { en: "Phone number", bn: "ফোন নম্বর" },
  address: { en: "Full address", bn: "পুরো ঠিকানা" },
  wrong: { en: "That username or password is not right.", bn: "ইউজারনেম বা পাসওয়ার্ড ঠিক নেই।" },
  mismatch: { en: "The two passwords are not the same.", bn: "দুটি পাসওয়ার্ড এক নয়।" },
  fill: { en: "Please fill in every box.", bn: "সব ঘর পূরণ করুন।" },
  hint: { en: "For this demo, log in with username demo and password 123.", bn: "এই ডেমোতে ইউজারনেম demo আর পাসওয়ার্ড 123 দিয়ে লগ ইন করুন।" },
  intro: { en: "Log in to change your website and run your business from one place.", bn: "এক জায়গা থেকে আপনার ওয়েবসাইট বদলান আর ব্যবসা চালান।" },
  backToSite: { en: "Back to the website", bn: "ওয়েবসাইটে ফিরে যান" },
  create: { en: "Create my account", bn: "আমার অ্যাকাউন্ট তৈরি করুন" },
} as const;

export default function DemoLoginPage({ params }: { params: { site: string } }) {
  const [lang, setLang] = useLangOnly();
  const router = useRouter();
  const search = useSearchParams();
  const schema = getSchema(params.site);
  const demo = DEMOS.find((d) => d.slug === params.site);
  const [storage, setStorage] = useState<StorageMode | null>(null);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ username: "", password: "", name: "", phone: "", address: "", confirm: "" });
  const next = search.get("next") || `/panel/${params.site}/app/dashboard`;
  const s = (k: keyof typeof S) => S[k][lang];

  useEffect(() => {
    fetch("/api/nx/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setStorage(j.storage))
      .catch(() => setStorage("browser"));
  }, []);

  if (!schema) return <div className="p-8">Unknown website.</div>;

  const finish = (name: string, username: string) => {
    writeDemoSession({ site: params.site, name, username, at: Date.now() });
    router.replace(next);
  };

  return (
    <div className="min-h-screen bg-[#0a1128] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <div className="relative hidden lg:block">
          {demo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={demo.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1128] via-[#0a1128]/40 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-white">
            <div className="text-sm font-semibold uppercase tracking-widest text-white/70">{demo?.kind}</div>
            <div className="mt-1 text-4xl font-bold leading-tight">{schema.name}</div>
            <p className="indic mt-3 max-w-md text-white/80">{s("intro")}</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <a href={`/demo/${params.site}`} className="indic inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white">
                <Icon name="arrow_back" className="text-[20px]" />
                {s("backToSite")}
              </a>
              <button type="button" onClick={() => setLang(lang === "en" ? "bn" : "en")} className="indic min-h-[44px] rounded-xl border border-white/25 px-3 text-base font-semibold text-white hover:bg-white/10">
                {t(lang, "language")}
              </button>
            </div>
            {storage === "neon" ? (
              <LoginForm lang={lang} onDone={() => router.replace(next)} />
            ) : (
              <Card className="p-5 sm:p-7">
                <div className="lg:hidden">
                  <div className="text-xs font-semibold uppercase tracking-widest text-brand-600">{demo?.kind}</div>
                  <div className="text-2xl font-bold">{schema.name}</div>
                </div>
                <div className="mt-4 grid grid-cols-2 rounded-full bg-slate-100 p-1 lg:mt-0">
                  {(["login", "signup"] as const).map((k) => (
                    <button key={k} type="button" onClick={() => { setTab(k); setErr(null); }} className={`indic min-h-[44px] rounded-full text-base font-semibold ${tab === k ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}>
                      {s(k)}
                    </button>
                  ))}
                </div>
                {tab === "login" ? (
                  <form
                    className="mt-5 grid gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const r = checkDemoLogin(params.site, f.username, f.password);
                      if (!r.ok) return setErr(s("wrong"));
                      finish(r.name, f.username);
                    }}
                  >
                    <h1 className="indic text-2xl font-bold">{s("welcome")}</h1>
                    <div>
                      <Label>{s("username")}</Label>
                      <input className={inputCls} autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
                    </div>
                    <div>
                      <Label>{s("password")}</Label>
                      <input className={inputCls} type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
                    </div>
                    {err ? <Notice tone="bad">{err}</Notice> : null}
                    <Button type="submit" icon="login">
                      {s("login")}
                    </Button>
                    <p className="indic text-sm text-slate-500">
                      {s("hint")} ({DEMO_USER.username} / {DEMO_USER.password})
                    </p>
                  </form>
                ) : (
                  <form
                    className="mt-5 grid gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!f.name.trim() || !f.phone.trim() || !f.address.trim() || !f.username.trim() || !f.password) return setErr(s("fill"));
                      if (f.password !== f.confirm) return setErr(s("mismatch"));
                      addDemoUser(params.site, { name: f.name.trim(), phone: f.phone.trim(), address: f.address.trim(), username: f.username.trim(), password: f.password });
                      finish(f.name.trim(), f.username.trim());
                    }}
                  >
                    <h1 className="indic text-2xl font-bold">{s("signup")}</h1>
                    <div>
                      <Label>{s("fullName")}</Label>
                      <input className={inputCls} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>{s("phone")}</Label>
                      <input className={inputCls} inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>{s("address")}</Label>
                      <textarea className={`${inputCls} min-h-[80px]`} autoComplete="street-address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
                    </div>
                    <div>
                      <Label>{s("username")}</Label>
                      <input className={inputCls} autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>{s("password")}</Label>
                        <input className={inputCls} type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
                      </div>
                      <div>
                        <Label>{s("confirm")}</Label>
                        <input className={inputCls} type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
                      </div>
                    </div>
                    {err ? <Notice tone="bad">{err}</Notice> : null}
                    <Button type="submit" icon="person_add">
                      {s("create")}
                    </Button>
                  </form>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
