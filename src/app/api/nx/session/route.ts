import { NextResponse, type NextRequest } from "next/server";
import { changePassword, clearSessionCookie, getSession, login, setSessionCookie } from "@/nx/auth";
import { storageMode } from "@/nx/store";

export const dynamic = "force-dynamic";

// GET    who am I, and how is content stored
// POST   { phone, password }  log in       | { newPassword } change password
// DELETE log out

export async function GET() {
  const session = getSession();
  return NextResponse.json({ storage: storageMode(), session });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { phone?: string; password?: string; newPassword?: string };
  if (storageMode() !== "neon") {
    return NextResponse.json({ ok: true, session: getSession(), storage: storageMode() });
  }
  if (body.newPassword) {
    const session = getSession();
    if (!session) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    if (body.newPassword.length < 4) return NextResponse.json({ error: "Password too short" }, { status: 400 });
    await changePassword(session.id, body.newPassword);
    setSessionCookie({ ...session, mustChangePassword: false });
    return NextResponse.json({ ok: true });
  }
  if (!body.phone || !body.password) return NextResponse.json({ error: "Phone and password needed" }, { status: 400 });
  const result = await login(body.phone, body.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  setSessionCookie(result.session);
  return NextResponse.json({ ok: true, session: result.session });
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
