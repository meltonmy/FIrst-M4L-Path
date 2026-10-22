import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(async e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]))).flat();}
const files=(await walk('dist')).filter(p=>!p.endsWith('/sw.js')).sort();
const hash=createHash('sha256');for(const f of files)hash.update(await readFile(f));
const version=hash.digest('hex').slice(0,16);
const paths=files.map(p=>p.slice(5));
await writeFile('dist/sw.js',`// Generated from the complete production build. Do not hand edit.
const VERSION = ${JSON.stringify(version)};
const PREFIX = 'linux-path-' + self.registration.scope + '-';
const CACHE = PREFIX + VERSION;
const FILES = ${JSON.stringify(paths)};
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
`);
console.log(`Offline: precached ${paths.length} files, version ${version}`);
