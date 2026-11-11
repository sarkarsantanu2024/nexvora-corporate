import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/nx/auth";
import { resolveSchema } from "@/nx/sites";
import { getStore } from "@/nx/store";

export const dynamic = "force-dynamic";

// GET /api/nx/access/<site>   what is switched on for the site. Public: the
//                             website itself reads it to decide whether to
//                             show the Login button (a real client site does
//                             so from its own domain, hence CORS).
// PUT /api/nx/access/<site>   body: { edit, dashboard }. Owner (Nexvora) only.
//
// In browser mode the server keeps nothing and says so; the admin screen
// and the website then share the visitor's localStorage.

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(_req: NextRequest, { params }: { params: { site: string } }) {
  if (!(await resolveSchema(params.site))) return NextResponse.json({ error: "Unknown site" }, { status: 404, headers: CORS });
  const store = getStore();
  if (!store) return NextResponse.json({ storage: "browser", access: null }, { headers: CORS });
  const access = await store.getAccess(params.site);
  return NextResponse.json({ storage: store.mode, access }, { headers: { ...CORS, "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest, { params }: { params: { site: string } }) {
  if (!(await resolveSchema(params.site))) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  const store = getStore();
  if (!store) return NextResponse.json({ storage: "browser" });
  const session = getSession();
  if (!session || session.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { edit?: unknown; dashboard?: unknown } | null;
  const access = { edit: body?.edit === true, dashboard: body?.dashboard === true };
  await store.setAccess(params.site, access, session.name);
  return NextResponse.json({ ok: true, access });
}

export function OPTIONS() {
  return new NextResponse(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "GET, OPTIONS" } });
}
