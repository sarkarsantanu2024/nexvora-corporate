"use client";

import { Dashboard, Expenses, Items, Payments, People, Reminders, Reports, Settings, Staff } from "@/nx/biz/modules";
import { BizProvider } from "@/nx/biz/store";
import { useSite } from "@/nx/panel/provider";
import { LockedScreen, PanelShell, useDashboardOpen, type ModuleKey } from "@/nx/panel/shell";

/* /panel/<site>/app/<module>: the business dashboard screens. Everything
   except Settings stays locked until Nexvora switches the dashboard on,
   which happens when the monthly subscription is paid. */

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
  const { schema, site, admin } = useSite();
  const open = useDashboardOpen(site, admin);
  const Module = MODULES[params.module];
  const key = (Module ? params.module : "dashboard") as ModuleKey;
  const locked = key !== "settings" && !open;
  return (
    <PanelShell active={key} back={`/panel/${site}`}>
      <BizProvider site={site} businessName={schema.name}>
        {locked ? <LockedScreen /> : Module ? <Module /> : <LockedScreen />}
      </BizProvider>
    </PanelShell>
  );
}
