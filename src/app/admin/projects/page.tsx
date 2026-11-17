import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/nx/auth";
import { ProjectsView } from "@/nx/panel/projects-view";
import { storageMode } from "@/nx/store";

export const metadata: Metadata = { title: "Projects", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/* /admin/projects: every client project that is its own app, with the
   links to open it. Same door as /admin: with a database only the owner
   gets in; without one, the demo login of /admin opens it. */

export default function ProjectsPage() {
  const mode = storageMode();
  const session = getSession();
  if (mode === "neon" && (!session || session.role !== "owner")) redirect("/panel");
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ProjectsView mode={mode} />
    </div>
  );
}
