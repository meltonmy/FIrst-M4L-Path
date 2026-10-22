// Generated from the complete production build. Do not hand edit.
const VERSION = "0566e2c82420f1a8";
const PREFIX = 'linux-path-' + self.registration.scope + '-';
const CACHE = PREFIX + VERSION;
const FILES = ["assets/index-Ct_qSlvm.js","assets/index-DH6neBWf.css","icon-192.png","icon-512.png","icon-maskable.png","icon.svg","index.html","manifest.webmanifest"];
const url = p => new URL(p, self.registration.scope).href;
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(FILES.map(url));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(event.request); }
      catch { return (await caches.open(CACHE)).match(url('index.html')); }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(event.request, {ignoreVary: true});
    return cached || fetch(event.request);
  })());
});
