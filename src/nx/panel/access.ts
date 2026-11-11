"use client";

import { useEffect, useState } from "react";
import type { Access, StorageMode } from "../types";

/* What Nexvora has switched on for a site, read by the panel, the admin
   screen and (through the same API) the website's own Login button.

   Website editing is switched on once the Run it yourself plan is paid, and
   the business dashboard once the monthly dashboard subscription is paid.
   Without a database (the samples) both are on by default and live in this
   browser's localStorage, so the super admin can switch a sample off to
   show a prospect what a client sees before paying. */

const DEMO_DEFAULT: Access = { edit: true, dashboard: true };
const key = (site: string) => `nx:access:${site}`;

export function readLocalAccess(site: string): Access {
  try {
    const raw = localStorage.getItem(key(site));
    if (!raw) return DEMO_DEFAULT;
    const a = JSON.parse(raw) as Partial<Access>;
    return { edit: a.edit !== false, dashboard: a.dashboard !== false };
  } catch {
    return DEMO_DEFAULT;
  }
}

export async function fetchAccess(site: string): Promise<{ storage: StorageMode; access: Access }> {
  try {
    const r = await fetch(`/api/nx/access/${encodeURIComponent(site)}`, { cache: "no-store" });
    const j = (await r.json()) as { storage: StorageMode; access: Access | null };
    if (j.storage === "browser" || !j.access) return { storage: "browser", access: readLocalAccess(site) };
    return { storage: j.storage, access: j.access };
  } catch {
    return { storage: "browser", access: readLocalAccess(site) };
  }
}

export async function saveAccess(site: string, storage: StorageMode, access: Access): Promise<boolean> {
  if (storage === "browser") {
    try {
      localStorage.setItem(key(site), JSON.stringify(access));
      return true;
    } catch {
      return false;
    }
  }
  const r = await fetch(`/api/nx/access/${encodeURIComponent(site)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(access) });
  return r.ok;
}

/** The site's access, with "loaded" false until the first answer arrives. */
export function useAccess(site: string): { access: Access; loaded: boolean; storage: StorageMode; setAccess: (a: Access) => Promise<boolean> } {
  const [state, setState] = useState<{ access: Access; loaded: boolean; storage: StorageMode }>({ access: DEMO_DEFAULT, loaded: false, storage: "browser" });
  useEffect(() => {
    let cancelled = false;
    fetchAccess(site).then((r) => {
      if (!cancelled) setState({ ...r, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, [site]);
  const setAccess = async (a: Access) => {
    const ok = await saveAccess(site, state.storage, a);
    if (ok) setState((s) => ({ ...s, access: a }));
    return ok;
  };
  return { ...state, setAccess };
}
