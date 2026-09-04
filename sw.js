const CACHE = 'seismic-operator-log-v6-feedback';
const APP_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_ASSETS);
    try {
      const response = await fetch(XLSX_CDN, {mode: 'no-cors'});
      await cache.put(XLSX_CDN, response);
    } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // For the app itself use network-first so installed iPhones receive new releases.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, {cache: 'no-store'});
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone()).catch(() => {});
        return response;
      } catch (_) {
        return (await caches.match(event.request)) ||
          (event.request.mode === 'navigate' ? await caches.match('./index.html') : Response.error());
      }
    })());
    return;
  }

  // External XLSX library: cached for offline use, refreshed when possible.
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      const cache = await caches.open(CACHE);
      cache.put(event.request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
