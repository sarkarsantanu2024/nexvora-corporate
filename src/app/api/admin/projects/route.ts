import { NextResponse } from "next/server";
import { PROJECTS } from "@/lib/projects";
import { changeProject, mayControl, type PlatformChange } from "@/nx/platform-control";

export const dynamic = "force-dynamic";

const PLANS = ["website", "panel", "platinum"];
const STATUSES = ["active", "suspended"];

/* The super admin's buttons on /admin/projects: change a client app's plan,
   pause it or switch it back on. Owner only. */
export async function POST(req: Request) {
  if (!mayControl()) return NextResponse.json({ ok: false, error: "Only the owner can do this." }, { status: 403 });
  const body = (await req.json().catch(() => null)) as ({ slug?: string } & PlatformChange) | null;
  const project = PROJECTS.find((p) => p.slug === body?.slug);
  if (!project || !body) return NextResponse.json({ ok: false, error: "Unknown project." }, { status: 404 });
  const change: PlatformChange = {};
  if (body.plan !== undefined) {
    if (!PLANS.includes(body.plan)) return NextResponse.json({ ok: false, error: "Choose a plan." }, { status: 400 });
    change.plan = body.plan;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ ok: false, error: "Choose active or paused." }, { status: 400 });
    change.status = body.status;
  }
  if (body.note !== undefined) change.note = String(body.note).slice(0, 300);
  const result = await changeProject(project, change);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
