"use client";

import { useEffect, useState } from "react";
import { PROJECTS } from "@/lib/projects";
import type { ProjectState } from "../platform-control";
import type { StorageMode } from "../types";
import { ProjectControl } from "./project-control";
import { readDemoAdmin } from "./demo-session";
import { Card, Icon } from "./ui";

/* The super admin's list of client projects that are their own app. Each
   card opens the project itself, where its own admin login does the daily
   work, and shows the project's plan and running state read live from the
   app, with buttons to change the plan or pause it (project-control.tsx). */

const linkCls = "inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-800 hover:bg-slate-100";
const headCls = "inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/25 px-3 text-base font-semibold hover:bg-white/10";

export function ProjectsView({ mode, control, states }: { mode: StorageMode; control: boolean; states: Record<string, ProjectState | null> }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const allowed = mode === "neon" ? true : readDemoAdmin();
    if (!allowed) window.location.replace("/admin");
    else setOk(true);
  }, [mode]);

  return (
    <>
      <header className="bg-[#0a1128] text-white">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-9 w-9 rounded-lg bg-white/10 p-1" />
          <div className="text-lg font-bold">Nexvora super admin</div>
          <a href="/admin" className={`ml-auto ${headCls}`}>
            <Icon name="arrow_back" className="text-[20px]" />
            <span className="hidden sm:inline">All sites</span>
          </a>
        </div>
      </header>
      {ok ? (
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Projects ({PROJECTS.length})</h1>
          <p className="mt-1 text-base text-slate-600">Client projects that run as their own app. Open one and log in there to work on it. The plan and the pause switch below change the app itself.</p>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {PROJECTS.map((p) => (
              <Card key={p.slug} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold">{p.name}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${p.status === "live" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{p.status === "live" ? "Live" : "Being built"}</span>
                </div>
                <p className="mt-0.5 text-base text-slate-600">{p.kind}</p>
                <ul className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
                  {p.has.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                  <dt className="font-semibold text-slate-500">Admin username</dt>
                  <dd className="font-mono">{p.adminUser}</dd>
                  <dt className="font-semibold text-slate-500">Folder</dt>
                  <dd className="font-mono">{p.folder}</dd>
                  <dt className="font-semibold text-slate-500">On this computer</dt>
                  <dd className="font-mono">{p.local} (after npm run dev in the folder)</dd>
                </dl>
                {control ? <ProjectControl slug={p.slug} name={p.name} state={states[p.slug] ?? null} /> : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  {p.live ? (
                    <>
                      <a className={linkCls} href={p.live} target="_blank" rel="noopener">
                        <Icon name="public" className="text-[20px]" /> Live website
                      </a>
                      <a className={linkCls} href={p.live + p.loginPath} target="_blank" rel="noopener">
                        <Icon name="login" className="text-[20px]" /> Live login
                      </a>
                    </>
                  ) : null}
                  <a className={linkCls} href={p.local + p.loginPath} target="_blank" rel="noopener">
                    <Icon name="computer" className="text-[20px]" /> Local login
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </main>
      ) : (
        <p className="p-6 text-slate-500">...</p>
      )}
    </>
  );
}
