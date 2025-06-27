// sw.js - Konfigurasi Definitif untuk GitHub Pages

// 1. NAMA CACHE & VERSI BARU
// Mengubah nama ini akan memaksa browser menginstal ulang SW dan membuat cache baru.
const CACHE_NAME = 'jedawarna-cache-v3';

// 2. DAFTAR ASET UNTUK DI-CACHE
// Semua path ditulis seolah-olah kita berada di folder root proyek.
// Ini adalah daftar semua file yang dibutuhkan agar aplikasi berjalan offline.
const ASSETS_TO_CACHE = [
  './',
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

// 3. EVENT 'INSTALL': SIMPAN ASET KE CACHE
// Ini terjadi hanya sekali saat Service Worker baru diinstal.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching semua aset inti...');
        // addAll adalah "semua atau tidak sama sekali". Jika satu file gagal, semua gagal.
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        self.skipWaiting(); // Aktifkan SW baru sesegera mungkin.
      })
  );
});

// 4. EVENT 'ACTIVATE': BERSIHKAN CACHE LAMA
// Setelah SW baru aktif, kita hapus cache dari versi sebelumnya.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('SW: Menghapus cache lama:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 5. EVENT 'FETCH': MENYEDIAKAN ASET SAAT OFFLINE
// Ini adalah inti dari fungsionalitas offline.
self.addEventListener('fetch', event => {
  // Hanya proses permintaan GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategi: Cache First (Cari di Cache Dulu)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Jika file ditemukan di cache, langsung berikan. Ini yang membuatnya bekerja offline.
        if (cachedResponse) {
          return cachedResponse;
        }

        // Jika tidak ada di cache, coba ambil dari internet.
        // Ini penting agar kita bisa mendapat update jika ada.
        return fetch(event.request);
      })
  );
});