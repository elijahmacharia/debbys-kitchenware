/*
 * SERVICE WORKER — Debby's Kitchenware
 * =============================================================================
 * The website works completely without this file. It exists so the app shell
 * loads instantly on a repeat visit and so there is a proper offline page
 * instead of the browser's dinosaur.
 *
 * WHAT IS CACHED
 *   - The app shell: the offline page, the manifest and the icons.
 *   - Static build output (/_next/static/...), which is content-hashed and
 *     therefore safe to cache forever.
 *   - Images, cached with a cap so the cache cannot grow without bound.
 *
 * WHAT IS DELIBERATELY NEVER CACHED
 *   - Anything under /api, /account, /admin, /checkout, /cart or
 *     /order-confirmation. That is personal data — names, phone numbers,
 *     addresses, order history. It must not sit in a cache on a shared or
 *     stolen device, and a stale price or stock figure must never be shown at
 *     the moment of purchase.
 *   - Any non-GET request. Orders always go to the network.
 */

const VERSION = 'v1';
const SHELL_CACHE = `dk-shell-${VERSION}`;
const PAGE_CACHE = `dk-pages-${VERSION}`;
const IMAGE_CACHE = `dk-images-${VERSION}`;
const IMAGE_LIMIT = 60;

const OFFLINE_URL = '/offline';
const SHELL_ASSETS = [OFFLINE_URL, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

/** Paths that must always go straight to the network. */
const NEVER_CACHE = ['/api/', '/account', '/admin', '/checkout', '/cart', '/order-confirmation'];

const isPrivate = (pathname) => NEVER_CACHE.some((prefix) => pathname.startsWith(prefix));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll fails the whole install if one entry 404s, so add individually.
      Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !key.endsWith(VERSION)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/** The page asks us to activate a waiting worker — see ServiceWorkerManager. */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET is ever cached or replayed. An order must reach the server.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivate(url.pathname)) return;

  // Content-hashed build output: cache first, it can never go stale.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ??
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        }),
      ),
    );
    return;
  }

  // Images: cache first with a size cap.
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(IMAGE_CACHE).then(async (cache) => {
                await cache.put(request, copy);
                await trimCache(IMAGE_CACHE, IMAGE_LIMIT);
              });
            }
            return response;
          })
          .catch(() => cached);
      }),
    );
    return;
  }

  // Pages: network first so prices and stock are always current, falling back
  // to the last copy we saw and finally to the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then(async (cache) => {
              await cache.put(request, copy);
              await trimCache(PAGE_CACHE, 30);
            });
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match(OFFLINE_URL)) ?? Response.error()),
    );
  }
});
