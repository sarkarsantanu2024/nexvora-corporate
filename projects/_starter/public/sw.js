/*
 * The service worker of the installed app. It does two small things:
 *
 * 1. Keeps the files that never change (scripts, styles, fonts, logo) on the
 *    phone, so screens open quickly on a slow connection.
 * 2. Shows a plain "no internet" screen when a page cannot be reached.
 *
 * It never keeps a copy of a dashboard screen or of any data: those hold
 * private information and must always come fresh from the server.
 */
const VERSION = 'v1';
const FILES = `app-files-${VERSION}`;
const OFFLINE = '/offline.html';
const FIRST = [OFFLINE, '/brand/app-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(FILES)
      .then((cache) => cache.addAll(FIRST))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== FILES).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

/** Files whose address changes whenever their content does, plus the logo. */
const isFixedFile = (url) => url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/brand/');

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
    return;
  }

  if (isFixedFile(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(FILES).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
