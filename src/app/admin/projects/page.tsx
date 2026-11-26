import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PROJECTS } from "@/lib/projects";
import { getSession } from "@/nx/auth";
import { ProjectsView } from "@/nx/panel/projects-view";
import { mayControl, readProject } from "@/nx/platform-control";
import { storageMode } from "@/nx/store";

export const metadata: Metadata = { title: "Projects", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/* /admin/projects: every client project that is its own app, with the
   links to open it, and its plan, running state and usage read live from
   the app itself. Same door as /admin: with a database only the owner
   gets in; without one, the demo login of /admin opens it. */

export default async function ProjectsPage() {
  const mode = storageMode();
  const session = getSession();
  if (mode === "neon" && (!session || session.role !== "owner")) redirect("/panel");
  const control = mayControl();
  // Read only when this person may see it: the answers carry usage figures of each client.
  const states = control ? await Promise.all(PROJECTS.map((p) => readProject(p))) : [];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ProjectsView mode={mode} control={control} states={Object.fromEntries(PROJECTS.map((p, i) => [p.slug, states[i] ?? null]))} />
    </div>
  );
}
