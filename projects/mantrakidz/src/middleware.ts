/**
 * Three jobs, all before any page runs.
 *
 * 1. Language. /bn/about and /hi/about are the Bengali and Hindi addresses of
 *    /about. The prefix is stripped here and the language handed on in a
 *    request header, so one set of pages serves all three languages.
 *
 * 2. First gate in front of the dashboards: no valid login cookie, no entry.
 *    (Every page and action still checks the role itself; this only saves a
 *    logged-out visitor from seeing a flash of a private screen.)
 *
 * 3. The dashboard language (English, Hindi, Bengali) from the person's cookie.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { UI_LANG_COOKIE, readUiLang } from '@/i18n/ui';
import { LANG_HEADER, splitLocale } from '@/lib/i18n';
import { SESSION_COOKIE, homeFor, isHq, readSessionToken } from '@/lib/session-token';

const PRIVATE = /^\/(hq|centre|parent|account)(\/|$)/;
/** Never translated: dashboards, login, APIs and files. */
const NO_LOCALE = /^\/(hq|centre|parent|account|login|api|media|brand|images)(\/|$)/;

export async function middleware(req: NextRequest) {
  const { lang, path } = splitLocale(req.nextUrl.pathname);

  if (lang !== 'en') {
    // /bn/login and the like: send to the one real address.
    if (NO_LOCALE.test(path)) {
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
  if (!isLogin && !PRIVATE.test(pathname)) {
    // A plain English site page. Drop any language header a client sent by hand.
    if (!req.headers.has(LANG_HEADER)) return NextResponse.next();
    const headers = new Headers(req.headers);
    headers.delete(LANG_HEADER);
    return NextResponse.next({ request: { headers } });
  }

  // Dashboards and login have no language in their address: each person's
  // choice is kept in a cookie and handed on the same way as the site's.
  const headers = new Headers(req.headers);
  const uiLang = readUiLang(req.cookies.get(UI_LANG_COOKIE)?.value);
  if (uiLang === 'en') headers.delete(LANG_HEADER);
  else headers.set(LANG_HEADER, uiLang);
  const pass = () => NextResponse.next({ request: { headers } });

  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (isLogin) {
    return session ? NextResponse.redirect(new URL(homeFor(session.role), req.url)) : pass();
  }

  if (!session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const allowed =
    pathname.startsWith('/account') ||
    (pathname.startsWith('/hq') && isHq(session.role)) ||
    (pathname.startsWith('/centre') && session.role !== 'parent') ||
    (pathname.startsWith('/parent') && session.role === 'parent');
  if (!allowed) return NextResponse.redirect(new URL(homeFor(session.role), req.url));

  // A first-time password must be changed before anything else.
  if (session.mustChange && !pathname.startsWith('/account')) {
    return NextResponse.redirect(new URL('/account/password?first=1', req.url));
  }
  return pass();
}

export const config = {
  // Everything except Next's own files and anything with a file extension.
  // The section screens of the edit panel have a dot in the address
  // (/hq/website/home.hero) and are pages, not files, so they are named too.
  matcher: ['/((?!_next/|api/|media/|brand/|images/|.*\\.[\\w]+$).*)', '/hq/website/:path*'],
};
