// sw.js - Strategi Final: "Cache First" yang Sederhana dan Andal

const CACHE_NAME = 'jedawarna-cache-final-v1';

// Daftar aset yang dibutuhkan agar aplikasi berjalan offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/chroma.min.js',
  './js/color-thief.umd.js',
  './icons/192x192.jpg',
  './icons/512x512.jpg'
]


// Event 'install': Simpan semua aset ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching semua aset inti...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Event 'activate': Hapus semua cache versi lama
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

// Event 'fetch': Menyajikan file dari cache terlebih dahulu
self.addEventListener('fetch', event => {
  // Hanya proses permintaan GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Jika ada di cache, langsung berikan (ini yang kita mau)
      if (cachedResponse) {
        return cachedResponse;
      }
      // Jika tidak ada di cache, baru ambil dari network
      return fetch(event.request);
    })
  );
});