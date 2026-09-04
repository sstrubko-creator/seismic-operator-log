const CACHE = 'seismic-operator-log-v1';
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
    } catch (_) {
      // The app itself remains installable; XLSX will be cached on a later online load.
    }
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
  event.respondWith((async () => {
    const cached = await caches.match(event.request, {ignoreSearch: false});
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      const cache = await caches.open(CACHE);
      cache.put(event.request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      if (event.request.mode === 'navigate') {
        return (await caches.match('./index.html')) || Response.error();
      }
      return Response.error();
    }
  })());
});
