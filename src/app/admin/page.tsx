import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/nx/auth";
import { AdminView, type AdminSite } from "@/nx/panel/admin-view";
import { allSites, siteUrl } from "@/nx/schemas";
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
  const sites: AdminSite[] = await Promise.all(
    allSites().map(async (s) => {
      let saved = "browser only";
      if (store) {
        const [d, p, h] = await Promise.all([store.get(s.site, "draft"), store.get(s.site, "published"), store.history(s.site)]);
        saved = p ? `published${d ? ", draft" : ""} · ${h.length} old versions` : d ? "draft only" : "original";
      }
      return { site: s.site, name: s.name, sections: s.sections.length, saved, url: siteUrl(s) };
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-[#0a1128] text-white">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-9 w-9 rounded-lg bg-white/10 p-1" />
          <div className="text-lg font-bold">Nexvora super admin</div>
          <a href="/demos" className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/25 px-3 text-base font-semibold hover:bg-white/10">
            Demos
          </a>
        </div>
      </header>
      <AdminView mode={mode} sites={sites} sessionName={mode === "neon" ? session?.name ?? null : null} />
    </div>
  );
}
