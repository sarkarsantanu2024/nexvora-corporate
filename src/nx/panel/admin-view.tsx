"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEMOS } from "@/lib/demos";
import type { Access, StorageMode } from "../types";
import { readLocalAccess, saveAccess } from "./access";
import { DEMO_ADMIN, readDemoAdmin, writeDemoAdmin } from "./demo-session";
import { Button, Card, Icon, Label, Notice, inputCls } from "./ui";

/* The super admin's table of every site. Nexvora opens any client's panel
   and dashboard from here, whatever plan the client is on: a client on a
   plan without the panel still has their content changed by Nexvora
   through the very same screens.

   The two switches per site are what the client pays for: website editing
   (Run it yourself paid; shows the Login button on their site) and the
   business dashboard (monthly subscription paid). */

export type AdminSite = {
  site: string;
  name: string;
  sections: number;
  saved: string;
  url: string;
  access: Access | null;
  /** Set for a real client site; null for a demo. */
  client: { template: string; phone: string; createdAt: string } | null;
};

const TEMPLATES = DEMOS.map((d) => ({ slug: d.slug, label: `${d.kind} (${d.slug})` }));

/* The form that registers a real client's website. The site then appears
   in the table like a demo: same switches, same Edit website and Dashboard
   buttons. With a database and a password it also creates the client's
   login (phone + password, changed on first login). */
function AddSiteForm({ mode, onDone }: { mode: StorageMode; onDone: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", site: "", template: "", url: "", phone: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slugFrom = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  if (mode === "browser") return null;
  if (!open) {
    return (
      <Button icon="add_business" onClick={() => setOpen(true)}>
        Add a client site
      </Button>
    );
  }
  return (
    <Card className="mt-4">
      <h2 className="text-lg font-bold">Add a client site</h2>
      <p className="mt-1 text-sm text-slate-600">The client&apos;s website uses the sections and forms of the template you pick. Put the same data-nx attributes in their HTML with <code>npm run nx:annotate</code> on their project, and point its <code>nx-api</code> meta tag at this server.</p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const r = await fetch("/api/nx/sites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
          const j = await r.json();
          setBusy(false);
          if (!r.ok) return setErr(j.error ?? "Could not save.");
          onDone(`${f.name} added as ${f.site}.${j.login ? ` Login: phone ${j.login}, the password you typed; they change it on first login.` : ""}`);
          setOpen(false);
          setF({ name: "", site: "", template: "", url: "", phone: "", password: "" });
          window.location.reload();
        }}
      >
        <div>
          <Label>Business name</Label>
          <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, site: f.site || slugFrom(e.target.value) })} />
        </div>
        <div>
          <Label hint="Small letters, digits and dashes. Used in the panel address.">Slug</Label>
          <input className={inputCls} value={f.site} onChange={(e) => setF({ ...f, site: slugFrom(e.target.value) })} />
        </div>
        <div>
          <Label>Template (which sample it is built from)</Label>
          <select className={inputCls} value={f.template} onChange={(e) => setF({ ...f, template: e.target.value })}>
            <option value="">Pick one</option>
            {TEMPLATES.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label hint="Where the live site is, starting with https://">Website address</Label>
          <input className={inputCls} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://" />
        </div>
        <div>
          <Label>Client&apos;s mobile number</Label>
          <input className={inputCls} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        <div>
          <Label hint={mode === "neon" ? "Creates their login. They set their own on first login." : "Logins need the database; ignored in dev."}>First password</Label>
          <input className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>
        {err ? (
          <div className="sm:col-span-2">
            <Notice tone="bad">{err}</Notice>
          </div>
        ) : null}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" icon="save" disabled={busy || !f.name || !f.site || !f.template}>
            Save client site
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-2 pr-3 text-sm font-semibold transition ${on ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`}
    >
      <span className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export function AdminView({ mode, sites, sessionName }: { mode: StorageMode; sites: AdminSite[]; sessionName: string | null }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);
  const [q, setQ] = useState("");
  const [access, setAccessMap] = useState<Record<string, Access>>({});
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    setOk(mode === "neon" ? true : readDemoAdmin());
    const map: Record<string, Access> = {};
    for (const s of sites) map[s.site] = s.access ?? readLocalAccess(s.site);
    setAccessMap(map);
  }, [mode, sites]);

  const change = async (site: string, next: Access) => {
    const prev = access[site];
    setAccessMap((m) => ({ ...m, [site]: next }));
    const good = await saveAccess(site, mode, next);
    if (!good) {
      setAccessMap((m) => ({ ...m, [site]: prev }));
      setToast("Could not save. Try again.");
    } else {
      setToast(`${sites.find((s) => s.site === site)?.name}: editing ${next.edit ? "on" : "off"}, dashboard ${next.dashboard ? "on" : "off"}.`);
    }
    setTimeout(() => setToast(null), 3500);
  };

  const logout = async () => {
    if (mode === "neon") {
      await fetch("/api/nx/session", { method: "DELETE" });
      window.location.href = "/panel";
    } else {
      writeDemoAdmin(false);
      setOk(false);
    }
  };
  const header = (
    <header className="bg-[#0a1128] text-white">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" className="h-9 w-9 rounded-lg bg-white/10 p-1" />
        <div className="text-lg font-bold">Nexvora super admin</div>
        <a href="/demos" className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/25 px-3 text-base font-semibold hover:bg-white/10">
          <Icon name="grid_view" className="text-[20px]" />
          <span className="hidden sm:inline">Demos</span>
        </a>
        {ok ? (
          <button type="button" onClick={logout} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/25 px-3 text-base font-semibold hover:bg-white/10">
            <Icon name="logout" className="text-[20px]" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        ) : null}
      </div>
    </header>
  );

  if (ok === null) return <>{header}<p className="p-6 text-slate-500">...</p></>;
  if (!ok) {
    return (
      <>
      {header}
      <div className="mx-auto max-w-md px-4 py-10">
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold">Nexvora super admin</h1>
          <p className="mt-1 text-base text-slate-600">For this demo, log in with admin / 123.</p>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (u.trim().toLowerCase() === DEMO_ADMIN.username && p === DEMO_ADMIN.password) {
                writeDemoAdmin(true);
                setOk(true);
              } else setErr(true);
            }}
          >
            <div>
              <Label>Username</Label>
              <input className={inputCls} autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <input className={inputCls} type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} />
            </div>
            {err ? <Notice tone="bad">That username or password is not right.</Notice> : null}
            <Button type="submit" icon="login">
              Log in
            </Button>
          </form>
        </Card>
      </div>
      </>
    );
  }

  const list = sites.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.site.includes(q.toLowerCase()));
  return (
    <>
    {header}
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {mode === "browser" ? (
        <Notice tone="warn">
          No database is connected, so nothing is saved on the server. Edits made in the panel and the switches below stay in this browser. Set <code>DATABASE_URL</code> to a Neon database to store real client content.
        </Notice>
      ) : null}
      {toast ? (
        <div className="mt-3">
          <Notice tone="good">{toast}</Notice>
        </div>
      ) : null}
      <div className="mt-4">
        <AddSiteForm mode={mode} onDone={(m) => setToast(m)} />
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            All sites ({sites.length}): {sites.filter((s) => s.client).length} clients, {sites.filter((s) => !s.client).length} samples
          </h1>
          <p className="text-sm text-slate-600">{sessionName ?? "Nexvora admin"} · storage: {mode}</p>
        </div>
        <input className={`${inputCls} w-full sm:w-64`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1040px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Kind</th>
              <th className="px-4 py-3 font-semibold">Sections</th>
              <th className="px-4 py-3 font-semibold">Saved</th>
              <th className="px-4 py-3 font-semibold">Switched on for the client</th>
              <th className="px-4 py-3 font-semibold">Open as Nexvora</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const d = DEMOS.find((x) => x.slug === (s.client ? s.client.template : s.site));
              return (
                <tr key={s.site} className={`border-b border-slate-100 last:border-0 ${s.client ? "bg-emerald-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {d ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : null}
                      <div>
                        <div className="flex items-center gap-2 font-semibold">
                          {s.name}
                          {s.client ? <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Client</span> : null}
                        </div>
                        <div className="text-xs text-slate-500">
                          {s.site}
                          {s.client?.phone ? ` · ${s.client.phone}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.client ? `${d?.kind ?? s.client.template} template` : d?.kind ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.sections}</td>
                  <td className="px-4 py-3 text-slate-600">{s.saved}</td>
                  <td className="px-4 py-3">
                    {access[s.site] ? (
                      <div className="flex flex-col gap-1.5">
                        <Switch on={access[s.site].edit} label="Website editing" onChange={(v) => change(s.site, { ...access[s.site], edit: v })} />
                        <Switch on={access[s.site].dashboard} label="Dashboard (₹500/month)" onChange={(v) => change(s.site, { ...access[s.site], dashboard: v })} />
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/panel/${s.site}`} className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-brand-50 px-3 font-semibold text-brand-700 hover:bg-brand-100">
                        <Icon name="edit" className="text-[18px]" />
                        Edit website
                      </Link>
                      <Link href={`/panel/${s.site}/app/dashboard`} className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-violet-50 px-3 font-semibold text-violet-600 hover:bg-violet-100">
                        <Icon name="space_dashboard" className="text-[18px]" />
                        Dashboard
                      </Link>
                      <a href={s.url} target="_blank" rel="noopener" className="inline-flex min-h-[40px] items-center rounded-lg bg-slate-100 px-3 font-semibold text-slate-700 hover:bg-slate-200">
                        View
                      </a>
                      <a href={`${s.url}?nx-preview=1`} target="_blank" rel="noopener" className="inline-flex min-h-[40px] items-center rounded-lg bg-slate-100 px-3 font-semibold text-slate-700 hover:bg-slate-200">
                        Preview draft
                      </a>
                      {s.client ? (
                        <button
                          type="button"
                          className="inline-flex min-h-[40px] items-center rounded-lg px-3 font-semibold text-rose-700 hover:bg-rose-50"
                          onClick={async () => {
                            if (!window.confirm(`Remove ${s.name} from the panel? Its saved content stays in the database.`)) return;
                            await fetch("/api/nx/sites", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ site: s.site }) });
                            window.location.reload();
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-slate-600">
        Website editing: switch on when the Run it yourself plan is paid. The Login button then appears on the client&apos;s website and they land on My website. Dashboard: switch on when the ₹500 monthly add-on (on top of the monthly service) is paid; switch off if it lapses. Nexvora can always open every site, whatever is switched on.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        With a database, client logins live in the <code>nx_users</code> table and the owner is created with <code>npm run nx:seed-owner</code>.
      </p>
    </main>
    </>
  );
}
