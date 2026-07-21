const CACHE = 'loon-lakes-v6';
const FILES = ['./','./index.html','./styles.css?v=6','./puzzles.js?v=6','./playtest.js?v=6','./app.js?v=6','./manifest.webmanifest','./loon-icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
