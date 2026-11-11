import { NextResponse, type NextRequest } from "next/server";
import { getSession, upsertUser } from "@/nx/auth";
import { DEMO_SCHEMAS } from "@/nx/demos";
import { isValidSlug } from "@/nx/schemas";
import { getStore, storageMode } from "@/nx/store";
import type { ClientSite } from "@/nx/types";

export const dynamic = "force-dynamic";

// GET    /api/nx/sites   the registered client sites (name, slug, template,
//                        url): what the panel needs to open one. Public, the
//                        way a demo's name is public.
// POST   /api/nx/sites   { site, name, template, url, phone, password? }
//                        owner only. Registers the site; with a database and
//                        a password it also creates the client's login.
// DELETE /api/nx/sites   { site }  owner only.

export async function GET() {
  const store = getStore();
  if (!store) return NextResponse.json({ storage: "browser", sites: [] });
  const sites = (await store.listSites()).map(({ site, name, template, url }) => ({ site, name, template, url }));
  return NextResponse.json({ storage: store.mode, sites }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const store = getStore();
  if (!store) return NextResponse.json({ error: "No database" }, { status: 400 });
  const session = getSession();
  if (!session || session.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Partial<ClientSite & { password: string }> | null;
  const site = String(b?.site ?? "").trim().toLowerCase();
  const name = String(b?.name ?? "").trim();
  const template = String(b?.template ?? "").trim();
  const url = String(b?.url ?? "").trim();
  const phone = String(b?.phone ?? "").replace(/\D/g, "").slice(-10);
  if (!isValidSlug(site)) return NextResponse.json({ error: "The slug may only have small letters, digits and dashes." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Business name needed." }, { status: 400 });
  if (!DEMO_SCHEMAS[template]) return NextResponse.json({ error: "Pick a template." }, { status: 400 });
  if (url && !/^https?:\/\//i.test(url)) return NextResponse.json({ error: "The website address must start with https://" }, { status: 400 });
  const record: ClientSite = { site, name, template, url, phone, createdAt: new Date().toISOString() };
  await store.upsertSite(record);
  let login: string | null = null;
  if (storageMode() === "neon" && phone.length === 10 && b?.password) {
    await upsertUser({ name, phone, password: String(b.password), role: "client", sites: [site], mustChangePassword: true });
    login = phone;
  }
  return NextResponse.json({ ok: true, site: record, login });
}

export async function DELETE(req: NextRequest) {
  const store = getStore();
  if (!store) return NextResponse.json({ error: "No database" }, { status: 400 });
  const session = getSession();
  if (!session || session.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { site?: string } | null;
  if (!b?.site) return NextResponse.json({ error: "Which site?" }, { status: 400 });
  await store.removeSite(b.site);
  return NextResponse.json({ ok: true });
}
