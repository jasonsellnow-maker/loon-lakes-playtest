const CACHE = 'loon-lakes-v27';
const FILES = ['./','./index.html','./styles.css?v=27','./puzzles.js?v=27','./playtest.js?v=27','./race.js?v=27','./app.js?v=27','./manifest.webmanifest','./loon-icon.svg','./assets/loon-wail.wav','./assets/loon-tremolo.wav','./assets/loon-yodel.wav','./assets/splash.wav','./assets/background-music.mp3'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
