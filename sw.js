// sw.js - Dikonfigurasi untuk GitHub Pages

// NAIKKAN VERSI CACHE UNTUK MEMICU UPDATE
const CACHE_NAME = 'jedawarna-github-v1.0'; 
const BASE_URL = '/JedaWarnaa/';

// Daftar aset yang dibutuhkan aplikasi untuk berjalan, sekarang dengan path yang benar
const ASSETS_TO_CACHE = [
  `${BASE_URL}`,
  `${BASE_URL}index.html`,
  `${BASE_URL}offline.html`,
  `${BASE_URL}css/style.css`,
  `${BASE_URL}js/app.js`,
  `${BASE_URL}js/chroma.min.js`,
  `${BASE_URL}js/color-thief.umd.js`,
  `${BASE_URL}manifest.json`,
  `${BASE_URL}icons/icon-192x192.png`,
  `${BASE_URL}icons/icon-512x512.png`
];

// Event 'install': Cache aset inti
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Caching aset inti untuk GitHub Pages...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Event 'activate': Bersihkan cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('SW: Menghapus cache lama:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Event 'fetch': Terapkan strategi "Cache First"
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match(`${BASE_URL}offline.html`);
        }
      });
    })
  );
});