// The demo login. Without a database the panel still asks for a login, so
// a prospect gets the real feeling: they log in from the sample website and
// land in its dashboard. Accepted: username "demo", password "123", or any
// account created on the sign-up form. All of it stays in this browser.
export type DemoSession = { site: string; name: string; username: string; at: number };

const key = (site: string) => `nx:demo-session:${site}`;
const usersKey = (site: string) => `nx:demo-users:${site}`;

export const DEMO_USER = { username: "demo", password: "123" };

export function readDemoSession(site: string): DemoSession | null {
  try {
    const raw = localStorage.getItem(key(site));
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}
export function writeDemoSession(s: DemoSession) {
  try {
    localStorage.setItem(key(s.site), JSON.stringify(s));
  } catch {}
}
export function clearDemoSession(site: string) {
  try {
    localStorage.removeItem(key(site));
  } catch {}
}

// The super admin of the demo: Nexvora's own login, which opens every
// site's panel and dashboard. admin / 123 on the samples; with a database
// this is the owner account in nx_users.
export const DEMO_ADMIN = { username: "admin", password: "123" };
const adminKey = "nx:demo-admin";

export function readDemoAdmin(): boolean {
  try {
    return localStorage.getItem(adminKey) === "1";
  } catch {
    return false;
  }
}
export function writeDemoAdmin(on: boolean) {
  try {
    if (on) localStorage.setItem(adminKey, "1");
    else localStorage.removeItem(adminKey);
  } catch {}
}

export type DemoUser = { name: string; phone: string; address: string; username: string; password: string };

export function demoUsers(site: string): DemoUser[] {
  try {
    const raw = localStorage.getItem(usersKey(site));
    return raw ? (JSON.parse(raw) as DemoUser[]) : [];
  } catch {
    return [];
  }
}
export function addDemoUser(site: string, u: DemoUser) {
  const list = demoUsers(site).filter((x) => x.username !== u.username);
  list.push(u);
  try {
    localStorage.setItem(usersKey(site), JSON.stringify(list));
  } catch {}
}
export function checkDemoLogin(site: string, username: string, password: string): { ok: true; name: string } | { ok: false } {
  const u = username.trim().toLowerCase();
  if (u === DEMO_USER.username && password === DEMO_USER.password) return { ok: true, name: "Demo owner" };
  const found = demoUsers(site).find((x) => x.username.toLowerCase() === u && x.password === password);
  return found ? { ok: true, name: found.name } : { ok: false };
}
