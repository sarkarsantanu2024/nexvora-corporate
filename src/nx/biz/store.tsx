"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DATA_VERSION, sampleData, type BizData } from "./data";
import { sectorForSite, type Sector } from "./sectors";

/* The dashboard's records for one site. In the demo they live in this
   browser's localStorage, seeded with sample data the first time. The
   functions here are the only way the screens change anything, so moving
   them to a server API later touches this one file. */

type Ctx = {
  site: string;
  sector: Sector;
  data: BizData;
  update: (fn: (d: BizData) => BizData) => void;
  resetSample: () => void;
};

const BizContext = createContext<Ctx | null>(null);

export function useBiz(): Ctx {
  const c = useContext(BizContext);
  if (!c) throw new Error("useBiz outside BizProvider");
  return c;
}

const key = (site: string) => `nx:biz:${site}`;

export function BizProvider({ site, businessName, children }: { site: string; businessName: string; children: ReactNode }) {
  const sector = useMemo(() => sectorForSite(site), [site]);
  const [data, setData] = useState<BizData | null>(null);

  useEffect(() => {
    let loaded: BizData | null = null;
    try {
      const raw = localStorage.getItem(key(site));
      if (raw) loaded = JSON.parse(raw) as BizData;
    } catch {}
    if (!loaded || loaded.version !== DATA_VERSION) loaded = sampleData(site, businessName, sector);
    setData(loaded);
  }, [site, businessName, sector]);

  const update = useCallback(
    (fn: (d: BizData) => BizData) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        try {
          localStorage.setItem(key(site), JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [site],
  );

  const resetSample = useCallback(() => {
    const fresh = sampleData(site, businessName, sector);
    try {
      localStorage.setItem(key(site), JSON.stringify(fresh));
    } catch {}
    setData(fresh);
  }, [site, businessName, sector]);

  if (!data) return <div className="p-6 text-slate-500">...</div>;
  return <BizContext.Provider value={{ site, sector, data, update, resetSample }}>{children}</BizContext.Provider>;
}

export function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}
