const CACHE = 'loon-lakes-v20';
const FILES = ['./','./index.html','./styles.css?v=20','./puzzles.js?v=20','./playtest.js?v=20','./race.js?v=20','./app.js?v=20','./manifest.webmanifest','./loon-icon.svg','./assets/loon-wail.wav','./assets/loon-tremolo.wav','./assets/loon-yodel.wav','./assets/splash.wav','./assets/background-music.m4a'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
