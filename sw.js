// sw.js - Strategi "Cache First" yang Ditingkatkan

// NAIKKAN VERSI CACHE SETIAP KALI ADA PERUBAHAN BESAR
const CACHE_NAME = 'jedawarna-cache-first-v1.2'; 
const BASE = '/'; // Pastikan ini adalah root path

// Aset inti yang dibutuhkan aplikasi untuk berjalan
const ASSETS_TO_CACHE = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}offline.html`,
  `${BASE}css/style.css`,
  `${BASE}js/app.js`,
  `${BASE}js/chroma.min.js`,
  `${BASE}js/color-thief.umd.js`,
  `${BASE}manifest.json`,
  `${BASE}icons/icon-192x192.png`,
  `${BASE}icons/icon-512x512.png`
];

// Event 'install': Cache aset inti dan langsung aktif
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Caching aset inti...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      self.skipWaiting(); // Langsung aktifkan SW baru
    })
  );
});

// Event 'activate': Bersihkan cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          // Hapus cache yang tidak sama dengan nama cache yang sekarang
          if (key !== CACHE_NAME) {
            console.log('SW: Menghapus cache lama:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Event 'fetch': Terapkan strategi "Cache First, then Network"
self.addEventListener('fetch', event => {
  // Abaikan request selain GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // 1. Coba cari di cache terlebih dahulu
    caches.match(event.request).then(cachedResponse => {
      // 2. Jika ada di cache, langsung berikan (cepat dan bekerja offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 3. Jika tidak ada di cache, coba ambil dari network
      return fetch(event.request).catch(() => {
        // 4. Jika network juga gagal (misal: halaman baru saat offline),
        //    berikan halaman fallback offline.html
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match(`${BASE}offline.html`);
        }
      });
    })
  );
});