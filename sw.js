// sw.js - Konfigurasi final dengan path relatif

// Naikkan versi cache untuk memicu update
const CACHE_NAME = 'jedawarna-final-v1.1'; 

// Daftar aset dengan path relatif dari root proyek
const ASSETS_TO_CACHE = [
  './',
  '/',
  './index.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/chroma.min.js',
  './js/color-thief.umd.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Event 'install': Cache semua aset di atas
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Caching aset inti dengan path relatif...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Event 'activate': Bersihkan cache versi lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Event 'fetch': Strategi "Cache First"
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
  
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});