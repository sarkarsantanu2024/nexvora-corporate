"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEMOS } from "@/lib/demos";
import type { StorageMode } from "../types";
import { DEMO_ADMIN, readDemoAdmin, writeDemoAdmin } from "./demo-session";
import { Button, Card, Icon, Label, Notice, inputCls } from "./ui";

/* The super admin's table of every site. Nexvora opens any client's panel
   and dashboard from here, whatever plan the client is on: a client on a
   plan without the panel still has their content changed by Nexvora
   through the very same screens. */

export type AdminSite = { site: string; name: string; sections: number; saved: string; url: string };

export function AdminView({ mode, sites, sessionName }: { mode: StorageMode; sites: AdminSite[]; sessionName: string | null }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    setOk(mode === "neon" ? true : readDemoAdmin());
  }, [mode]);

  if (ok === null) return <p className="p-6 text-slate-500">...</p>;
  if (!ok) {
    return (
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
    );
  }

  const list = sites.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.site.includes(q.toLowerCase()));
  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {mode === "browser" ? (
        <Notice tone="warn">
          No database is connected, so nothing is saved on the server. Edits made in the panel stay in each visitor&apos;s browser. Set <code>DATABASE_URL</code> to a Neon database to store real client content.
        </Notice>
      ) : null}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">All sites ({sites.length})</h1>
          <p className="text-sm text-slate-600">{sessionName ?? "Nexvora admin"} · storage: {mode}</p>
        </div>
        <div className="flex items-center gap-2">
          <input className={`${inputCls} w-64`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          {mode !== "neon" ? (
            <button
              type="button"
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700"
              onClick={() => {
                writeDemoAdmin(false);
                setOk(false);
              }}
            >
              <Icon name="logout" className="text-[20px]" />
              Log out
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Kind</th>
              <th className="px-4 py-3 font-semibold">Sections</th>
              <th className="px-4 py-3 font-semibold">Saved</th>
              <th className="px-4 py-3 font-semibold">Open as Nexvora</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const d = DEMOS.find((x) => x.slug === s.site);
              return (
                <tr key={s.site} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {d ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : null}
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.site}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d?.kind ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.sections}</td>
                  <td className="px-4 py-3 text-slate-600">{s.saved}</td>
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-slate-600">
        With a database, client logins live in the <code>nx_users</code> table and the owner is created with <code>npm run nx:seed-owner</code>. The owner may edit every site, whatever plan the client bought.
      </p>
    </main>
  );
}
