/* Server only. Talks to each client app's control address (/api/platform in
   the app, see projects/_starter/src/app/api/platform/route.ts): reads its
   plan, whether it is running and how much it is used, and changes the plan
   or pauses it.

   Each app has its own key. The app holds it as PLATFORM_SECRET; this site
   holds the same value under the name in the project's `secretEnv`
   (src/lib/projects.ts), for example PLATFORM_SECRET_MANTRAKIDZ. */

import type { Project } from "@/lib/projects";
import { getSession } from "./auth";
import { storageMode } from "./store";

export type Plan = "website" | "panel" | "platinum";
export type AccountStatus = "active" | "suspended";

export type ProjectState =
  | {
      ok: true;
      address: string;
      plan: Plan;
      status: AccountStatus;
      note: string;
      changedAt: string;
      usage: Record<string, string | number | null>;
      lastDailyRun: string | null;
    }
  | { ok: false; address: string; error: string };

export type PlatformChange = { plan?: Plan; status?: AccountStatus; note?: string };

/** On this computer the local copy of each app is used, so it can be tried before the live one. */
export function addressOf(p: Project): string {
  return process.env.NODE_ENV === "development" || !p.live ? p.local : p.live;
}

/** Only the owner may change a client's plan. In browser-only mode every visitor counts as owner, so changes are refused there. */
export function mayControl(): boolean {
  const mode = storageMode();
  if (mode === "file") return true;
  if (mode !== "neon") return false;
  return getSession()?.role === "owner";
}

async function call(p: Project, init?: RequestInit): Promise<Response | string> {
  const key = process.env[p.secretEnv] ?? "";
  if (key.length < 32) return `Set ${p.secretEnv} on this site to the same value as PLATFORM_SECRET in the ${p.name} app (32 characters or more).`;
  try {
    return await fetch(`${addressOf(p)}/api/platform`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    return `${p.name} did not answer at ${addressOf(p)}. Is it running?`;
  }
}

function explain(p: Project, res: Response): string {
  if (res.status === 404) return `${p.name} refused the key. Its PLATFORM_SECRET and this site's ${p.secretEnv} must be the same, and the app must be the new version with /api/platform.`;
  return `${p.name} answered with an error (${res.status}).`;
}

export async function readProject(p: Project): Promise<ProjectState> {
  const address = addressOf(p);
  const res = await call(p);
  if (typeof res === "string") return { ok: false, address, error: res };
  if (!res.ok) return { ok: false, address, error: explain(p, res) };
  const body = (await res.json()) as { data: { plan: Plan; status: AccountStatus; note: string; changedAt: string; usage: Record<string, string | number | null>; dailyJob: { lastRunAt: string | null } } };
  const d = body.data;
  return { ok: true, address, plan: d.plan, status: d.status, note: d.note, changedAt: d.changedAt, usage: d.usage, lastDailyRun: d.dailyJob?.lastRunAt ?? null };
}

export async function changeProject(p: Project, change: PlatformChange): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await call(p, { method: "POST", body: JSON.stringify(change) });
  if (typeof res === "string") return { ok: false, error: res };
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? explain(p, res) };
  }
  return { ok: true };
}
