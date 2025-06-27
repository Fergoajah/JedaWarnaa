// sw.js - Disesuaikan dengan Pola yang Anda Inginkan

// NAIKKAN VERSI CACHE SETIAP KALI ADA PERUBAHAN
const CACHE_NAME = 'jedawarna-network-first-v1.0';

// ====================================================================
//          ↓↓↓      KONFIGURASI BASE URL PROYEK ANDA      ↓↓↓
// ====================================================================
// Sesuaikan jika perlu. Harus ada '/' di awal dan di akhir.
const BASE = '/J/';
// ====================================================================

// Aset inti yang wajib di-cache saat instalasi
const ASSETS_TO_CACHE = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}offline.html`, // Wajib ada untuk fallback
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

// Event 'activate': Bersihkan cache lama dan ambil alih kontrol
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
    ).then(() => self.clients.claim()) // Ambil alih kontrol halaman
  );
});

// Event 'fetch': Terapkan strategi "Network falling back to cache"
self.addEventListener('fetch', event => {
  // Abaikan request non-GET dan request dari ekstensi chrome
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    // 1. Coba ambil dari network terlebih dahulu
    fetch(event.request)
      .then(networkResponse => {
        // Jika berhasil, update cache dengan respons terbaru
        // Ini adalah bagian dari strategi "Stale-While-Revalidate"
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(async () => {
        // 2. Jika network gagal (offline), coba ambil dari cache
        console.log('SW: Network gagal, mencoba mengambil dari cache...');
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // 3. Jika request adalah halaman HTML dan tidak ada di cache, berikan offline.html
        if (event.request.headers.get('accept').includes('text/html')) {
          console.log('SW: Memberikan halaman fallback offline.');
          return cache.match(`${BASE}offline.html`);
        }
        
        // Jika request adalah aset lain (CSS, JS, gambar) dan tidak ada di cache, biarkan gagal
        return new Response(null, { status: 404 });
      })
  );
});