/**
 * Three jobs, all before any page runs.
 *
 * 1. Language (set in src/config/languages.ts). The default language lives at
 *    the plain address (/about); every other language has a prefix (/en/about,
 *    /bn/about). The prefix is stripped here and the language handed on in a
 *    request header, so one set of pages serves every language. A prefix of the
 *    default language is sent to the plain address; a language that is not in
 *    use has no prefix at all, so /hi/about is simply not found.
 *
 * 2. First gate in front of the dashboards: no valid login cookie, no entry.
 *    (Every page and action still checks the role itself; this only saves a
 *    logged-out visitor from seeing a flash of a private screen.)
 *
 * 3. The dashboard language from the person's cookie (the default language
 *    when there is none).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { UI_LANG_COOKIE, readUiLang } from '@/i18n/ui';
import { DEFAULT_LANG, LANG_HEADER, splitLocale } from '@/lib/i18n';
import { SESSION_COOKIE, homeFor, readSessionToken } from '@/lib/session-token';

// A business module with its own area (say /shop) adds it to both lists.
const PRIVATE = /^\/(admin|account)(\/|$)/;
/** Never translated: dashboards, login, APIs and files. */
const NO_LOCALE = /^\/(admin|account|login|suspended|api|media|brand|images)(\/|$)/;

export async function middleware(req: NextRequest) {
  const { lang, path, prefixed } = splitLocale(req.nextUrl.pathname);

  if (prefixed) {
    // /bn/login and the like, and /bn/about when Bengali is the default: send to the one real address.
    if (lang === DEFAULT_LANG || NO_LOCALE.test(path)) {
      const url = req.nextUrl.clone();
      url.pathname = path;
      return NextResponse.redirect(url);
    }
    const url = req.nextUrl.clone();
    url.pathname = path;
    const headers = new Headers(req.headers);
    headers.set(LANG_HEADER, lang);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const pathname = path;
  const isLogin = pathname === '/login';
  // The "account paused" page speaks the dashboard language but needs no login.
  const isPaused = pathname === '/suspended';
  if (!isLogin && !isPaused && !PRIVATE.test(pathname)) {
    // A site page at its plain address is in the default language, whatever header a client sent.
    const headers = new Headers(req.headers);
    headers.set(LANG_HEADER, DEFAULT_LANG);
    return NextResponse.next({ request: { headers } });
  }

  // Dashboards and login have no language in their address: each person's
  // choice is kept in a cookie and handed on the same way as the site's.
  const headers = new Headers(req.headers);
  headers.set(LANG_HEADER, readUiLang(req.cookies.get(UI_LANG_COOKIE)?.value));
  const pass = () => NextResponse.next({ request: { headers } });
  if (isPaused) return pass();

  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (isLogin) {
    return session ? NextResponse.redirect(new URL(homeFor(session.role), req.url)) : pass();
  }

  if (!session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // A first-time password must be changed before anything else.
  if (session.mustChange && !pathname.startsWith('/account')) {
    return NextResponse.redirect(new URL('/account/password?first=1', req.url));
  }
  return pass();
}

export const config = {
  // Everything except Next's own files and anything with a file extension.
  // The section screens of the edit panel have a dot in the address
  // (/admin/website/home.hero) and are pages, not files, so they are named too.
  matcher: ['/((?!_next/|api/|media/|brand/|images/|.*\\.[\\w]+$).*)', '/admin/website/:path*'],
};
