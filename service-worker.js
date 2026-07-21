const CACHE = 'loon-lakes-v19';
const FILES = ['./','./index.html','./styles.css?v=19','./puzzles.js?v=19','./playtest.js?v=19','./race.js?v=19','./app.js?v=19','./manifest.webmanifest','./loon-icon.svg','./assets/loon-wail.m4a','./assets/loon-tremolo.m4a','./assets/loon-yodel.m4a','./assets/splash.m4a','./assets/background-music.m4a'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
