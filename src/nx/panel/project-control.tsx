"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan, ProjectState } from "../platform-control";
import { Icon } from "./ui";

/* The live part of a project card on /admin/projects: what plan the client
   is on, whether the app is running, how much it is used, and the buttons to
   change the plan or pause it. Each change goes to the app's own control
   address through /api/admin/projects. */

const PLAN_NAMES: Record<Plan, string> = { website: "Website", panel: "Website and edit panel", platinum: "Platinum" };

/** activeLogins → Active logins */
const words = (key: string) => {
  const spaced = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

function show(value: string | number | null) {
  if (value === null || value === "") return "None yet";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  }
  return String(value);
}

const btn = "inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-base font-semibold disabled:opacity-50";

export function ProjectControl({ slug, name, state }: { slug: string; name: string; state: ProjectState | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [note, setNote] = useState(state?.ok ? state.note : "");

  if (!state) return null;
  if (!state.ok) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Could not read the app ({state.address})</p>
        <p className="mt-1">{state.error}</p>
      </div>
    );
  }

  const send = async (change: { plan?: Plan; status?: "active" | "suspended"; note?: string }, done: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, ...change }) });
      const body = (await res.json()) as { ok: boolean; error?: string };
      setMessage(body.ok ? { ok: true, text: done } : { ok: false, text: body.error ?? "Something went wrong." });
      if (body.ok) router.refresh();
    } catch {
      setMessage({ ok: false, text: "Could not reach this site. Check the connection." });
    } finally {
      setBusy(false);
    }
  };

  const paused = state.status === "suspended";
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${paused ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{paused ? "Paused" : "Running"}</span>
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-sm font-semibold text-violet-800">{PLAN_NAMES[state.plan]}</span>
        <span className="text-sm text-slate-500">Read live from {state.address}</span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        {Object.entries(state.usage).map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="font-semibold text-slate-500">{words(key)}</dt>
            <dd>{show(value)}</dd>
          </div>
        ))}
        <dt className="font-semibold text-slate-500">Daily check last ran</dt>
        <dd>{state.lastDailyRun ? show(state.lastDailyRun) : "Not yet (it runs once the app is live with CRON_SECRET set)"}</dd>
      </dl>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-sm font-semibold text-slate-600">
          Plan
          <select
            className="mt-1 block min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-base"
            value={state.plan}
            disabled={busy}
            onChange={(e) => void send({ plan: e.target.value as Plan }, `${name} is now on ${PLAN_NAMES[e.target.value as Plan]}.`)}
          >
            {(Object.keys(PLAN_NAMES) as Plan[]).map((plan) => (
              <option key={plan} value={plan}>
                {PLAN_NAMES[plan]}
              </option>
            ))}
          </select>
        </label>
        {paused ? (
          <button type="button" disabled={busy} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`} onClick={() => void send({ status: "active" }, `${name} is switched on again.`)}>
            <Icon name="play_arrow" className="text-[20px]" /> Switch on
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className={`${btn} border border-red-200 bg-white text-red-700 hover:bg-red-50`}
            onClick={() => {
              if (window.confirm(`Pause ${name}? Everyone who logs in to its dashboard sees "Account paused" until you switch it on. The website stays up.`)) void send({ status: "suspended", note }, `${name} is paused.`);
            }}
          >
            <Icon name="pause" className="text-[20px]" /> Pause
          </button>
        )}
      </div>

      <label className="mt-3 block text-sm font-semibold text-slate-600">
        Note shown on the "Account paused" page
        <span className="mt-1 flex flex-wrap gap-2">
          <input className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base font-normal" value={note} maxLength={300} placeholder="For example: the November care fee is due" onChange={(e) => setNote(e.target.value)} />
          <button type="button" disabled={busy || note === state.note} className={`${btn} border border-slate-200 bg-white text-slate-800 hover:bg-slate-100`} onClick={() => void send({ note }, "Note saved.")}>
            Save note
          </button>
        </span>
      </label>

      {message ? <p className={`mt-3 text-sm font-semibold ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p> : null}
    </div>
  );
}
