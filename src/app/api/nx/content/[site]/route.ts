import { NextResponse, type NextRequest } from "next/server";
import { canEdit, getSession } from "@/nx/auth";
import { validateContent } from "@/nx/schemas";
import { resolveSchema } from "@/nx/sites";
import { getStore, storageMode } from "@/nx/store";

// A real client site lives on its own domain and reads its published
// content from here, so the public GET answers any origin.
const CORS = { "Access-Control-Allow-Origin": "*" };

export const dynamic = "force-dynamic";

// GET  /api/nx/content/<site>?state=published|draft
// PUT  /api/nx/content/<site>            body: { content }   saves the draft
// POST /api/nx/content/<site>            body: { action: "publish" | "undo" | "reset" }
//
// Published content is public: the website itself reads it. Everything else
// needs a session that may edit this site. In browser mode the server holds
// nothing and says so, and the panel keeps the content in localStorage.

// A client may have a login for the business dashboard alone (the add-on
// on Get my business online). The panel hides the website forms from them;
// this is the same rule on the server. Nexvora (owner) always gets in.
async function editingOn(store: NonNullable<ReturnType<typeof getStore>>, session: { role: string }, site: string) {
  if (session.role === "owner") return true;
  return (await store.getAccess(site)).edit;
}

export async function GET(req: NextRequest, { params }: { params: { site: string } }) {
  const schema = await resolveSchema(params.site);
  if (!schema) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  const store = getStore();
  if (!store) return NextResponse.json({ storage: "browser", content: null }, { headers: CORS });
  const state = req.nextUrl.searchParams.get("state") === "draft" ? "draft" : "published";
  if (state === "draft" && !canEdit(getSession(), params.site)) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }
  const content = await store.get(params.site, state);
  return NextResponse.json(
    { storage: store.mode, content },
    // No stale-while-revalidate: a client who has just pressed Publish must
    // see the change on the next load, not a cached copy for a minute.
    { headers: state === "published" ? { ...CORS, "Cache-Control": "public, max-age=0, s-maxage=30, must-revalidate" } : { "Cache-Control": "no-store" } },
  );
}

export async function PUT(req: NextRequest, { params }: { params: { site: string } }) {
  const schema = await resolveSchema(params.site);
  if (!schema) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  const store = getStore();
  if (!store) return NextResponse.json({ storage: "browser" }, { status: 200 });
  const session = getSession();
  if (!canEdit(session, params.site)) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  if (!(await editingOn(store, session!, params.site))) return NextResponse.json({ error: "Website editing is not switched on for this site" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { content?: unknown } | null;
  const checked = validateContent(schema, body?.content);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  await store.saveDraft(params.site, checked.content, session!.name);
  return NextResponse.json({ ok: true, storage: store.mode });
}

export async function POST(req: NextRequest, { params }: { params: { site: string } }) {
  const schema = await resolveSchema(params.site);
  if (!schema) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  const store = getStore();
  if (!store) return NextResponse.json({ storage: "browser" }, { status: 200 });
  const session = getSession();
  if (!canEdit(session, params.site)) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  if (!(await editingOn(store, session!, params.site))) return NextResponse.json({ error: "Website editing is not switched on for this site" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { action?: string } | null;
  const by = session!.name;
  if (body?.action === "publish") {
    const content = await store.publish(params.site, by);
    return NextResponse.json({ ok: true, content });
  }
  if (body?.action === "undo") {
    const content = await store.undoPublish(params.site, by);
    return NextResponse.json({ ok: !!content, content });
  }
  if (body?.action === "reset") {
    if (session!.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });
    await store.reset(params.site);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export function OPTIONS() {
  return NextResponse.json({ storage: storageMode() }, { headers: { ...CORS, "Access-Control-Allow-Methods": "GET, OPTIONS" } });
}
