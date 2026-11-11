import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/nx/auth";
import { AdminView, type AdminSite } from "@/nx/panel/admin-view";
import { allSites, siteUrl } from "@/nx/schemas";
import { loadClients } from "@/nx/sites";
import { getStore, storageMode } from "@/nx/store";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/* /admin: the super admin's view of every site the panel knows. With a
   database only the owner gets in; a client is sent to their own panel.
   Without one, admin / 123 opens it for the demo. */

export default async function AdminPage() {
  const session = getSession();
  const mode = storageMode();
  if (mode === "neon" && (!session || session.role !== "owner")) redirect("/panel");
  const store = getStore();
  const clients = await loadClients();
  const sites: AdminSite[] = await Promise.all(
    allSites(clients).map(async (s) => {
      let saved = "browser only";
      let access = null;
      if (store) {
        const [d, p, h, a] = await Promise.all([store.get(s.site, "draft"), store.get(s.site, "published"), store.history(s.site), store.getAccess(s.site)]);
        saved = p ? `published${d ? ", draft" : ""} · ${h.length} old versions` : d ? "draft only" : "original";
        access = a;
      }
      const c = clients.find((x) => x.site === s.site);
      return { site: s.site, name: s.name, sections: s.sections.length, saved, url: siteUrl(s), access, client: c ? { template: c.template, phone: c.phone, createdAt: c.createdAt } : null };
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminView mode={mode} sites={sites} sessionName={mode === "neon" ? session?.name ?? null : null} />
    </div>
  );
}
