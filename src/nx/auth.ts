// Who may edit what.
//
//   browser mode  Nobody logs in. The panel only changes the visitor's own
//                 browser, so there is nothing to protect.
//   file mode     Local development. Everyone is the owner.
//   neon mode     Real clients. A signed, httpOnly cookie carries the user
//                 id; nx_users holds name, phone, bcrypt hash, role and the
//                 sites the user may edit. The owner may edit every site.
//
// Five wrong passwords lock an account for fifteen minutes.

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { neonSql, storageMode } from "./store";

export type Session = { id: string; name: string; role: "owner" | "client"; sites: string[]; mustChangePassword?: boolean };

const COOKIE = "nx_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  return process.env.NX_SESSION_SECRET || process.env.DATABASE_URL || "nx-dev-secret";
}
function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(s: Session): string {
  const body = Buffer.from(JSON.stringify({ ...s, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}
export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as Session & { exp: number };
    if (data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, role: data.role, sites: data.sites, mustChangePassword: data.mustChangePassword };
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  const mode = storageMode();
  if (mode === "browser") return { id: "visitor", name: "Visitor", role: "owner", sites: [] };
  if (mode === "file") return { id: "dev", name: "Developer", role: "owner", sites: [] };
  return decodeSession(cookies().get(COOKIE)?.value);
}

export function setSessionCookie(s: Session) {
  cookies().set(COOKIE, encodeSession(s), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: MAX_AGE, path: "/" });
}
export function clearSessionCookie() {
  cookies().set(COOKIE, "", { httpOnly: true, sameSite: "lax", maxAge: 0, path: "/" });
}

export function canEdit(session: Session | null, site: string): boolean {
  if (!session) return false;
  if (session.role === "owner") return true;
  return session.sites.includes(site);
}

type UserRow = {
  id: number;
  name: string;
  phone: string;
  password_hash: string;
  role: "owner" | "client";
  sites: string[];
  must_change_password: boolean;
  failed_logins: number;
  locked_until: string | null;
};

export async function login(phoneOrEmail: string, password: string): Promise<{ ok: true; session: Session } | { ok: false; error: "wrong" | "locked" }> {
  const q = await neonSql();
  const bcrypt = await import("bcryptjs");
  const key = phoneOrEmail.replace(/\D/g, "").slice(-10) || phoneOrEmail.trim().toLowerCase();
  const rows = (await q`SELECT * FROM nx_users WHERE phone = ${key} LIMIT 1`) as unknown as UserRow[];
  const user = rows[0];
  if (!user) return { ok: false, error: "wrong" };
  if (user.locked_until && new Date(user.locked_until) > new Date()) return { ok: false, error: "locked" };
  const good = await bcrypt.compare(password, user.password_hash);
  if (!good) {
    const failed = user.failed_logins + 1;
    if (failed >= 5) await q`UPDATE nx_users SET failed_logins = 0, locked_until = now() + interval '15 minutes' WHERE id = ${user.id}`;
    else await q`UPDATE nx_users SET failed_logins = ${failed} WHERE id = ${user.id}`;
    return { ok: false, error: failed >= 5 ? "locked" : "wrong" };
  }
  await q`UPDATE nx_users SET failed_logins = 0, locked_until = NULL, last_login_at = now() WHERE id = ${user.id}`;
  return { ok: true, session: { id: String(user.id), name: user.name, role: user.role, sites: user.sites, mustChangePassword: user.must_change_password } };
}

export async function changePassword(userId: string, password: string) {
  const q = await neonSql();
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(password, 10);
  await q`UPDATE nx_users SET password_hash = ${hash}, must_change_password = false WHERE id = ${Number(userId)}`;
}

/** Creates or updates a user. Used by the seed script and the admin area. */
export async function upsertUser(u: { name: string; phone: string; password: string; role: "owner" | "client"; sites: string[]; mustChangePassword?: boolean }) {
  const q = await neonSql();
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(u.password, 10);
  const phone = u.phone.replace(/\D/g, "").slice(-10);
  await q`INSERT INTO nx_users (name, phone, password_hash, role, sites, must_change_password)
    VALUES (${u.name}, ${phone}, ${hash}, ${u.role}, ${u.sites}, ${u.mustChangePassword ?? true})
    ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, sites = EXCLUDED.sites, must_change_password = EXCLUDED.must_change_password`;
}
