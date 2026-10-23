'use strict';
const PREFIX = 'adhkari-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + '2026-10-23-pwa1';
const ROOT = self.registration.scope;
const FILES = ['index.html', 'book.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
const URLS = FILES.map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(URLS); }
    catch (error) { await caches.delete(CACHE); throw error; }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    clients.filter(client => client.url.startsWith(ROOT)).forEach(client => client.postMessage({type:'ADHKARI_OFFLINE_READY'}));
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.href.startsWith(ROOT) || url.origin !== self.location.origin) return;
  const clean = url.origin + url.pathname;
  const key = clean === ROOT ? new URL('index.html', ROOT).href : clean;
  if (!URLS.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const stored = await cache.match(key);
    return stored || fetch(event.request);
  })());
});
