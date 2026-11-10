"use client";

import { Dashboard, Expenses, Items, Payments, People, Reminders, Reports, Settings, Staff } from "@/nx/biz/modules";
import { BizProvider } from "@/nx/biz/store";
import { useSite } from "@/nx/panel/provider";
import { LockedScreen, PanelShell, usePlan, type ModuleKey } from "@/nx/panel/shell";

/* /panel/<site>/app/<module>: the business dashboard screens. Everything
   except Settings needs the Run my whole business plan. */

const MODULES: Partial<Record<string, () => JSX.Element>> = {
  dashboard: Dashboard,
  people: People,
  payments: Payments,
  expenses: Expenses,
  items: Items,
  reports: Reports,
  reminders: Reminders,
  staff: Staff,
  settings: Settings,
};

export default function ModulePage({ params }: { params: { site: string; module: string } }) {
  const { schema, site } = useSite();
  const [plan] = usePlan(site);
  const Module = MODULES[params.module];
  const key = (Module ? params.module : "dashboard") as ModuleKey;
  const locked = key !== "settings" && plan !== "business";
  return (
    <PanelShell active={key} back={`/panel/${site}`}>
      <BizProvider site={site} businessName={schema.name}>
        {locked ? <LockedScreen /> : Module ? <Module /> : <LockedScreen />}
      </BizProvider>
    </PanelShell>
  );
}
