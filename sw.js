// Versi baru untuk memaksa update
const CACHE_VERSION = 1;
const CURRENT_CACHE = `jedawarna-network-first-v${CACHE_VERSION}`;
const OFFLINE_PAGE = './offline.html';

// DAFTAR ASET UNTUK DI-CACHE
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/chroma.min.js',
  './js/color-thief.umd.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Saat aktivasi, bersihkan cache lama
self.addEventListener('activate', evt =>
  evt.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CURRENT_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  )
);

// Saat instalasi, simpan semua aset penting ke cache
self.addEventListener('install', evt =>
  evt.waitUntil(
    caches.open(CURRENT_CACHE).then(cache => {
      console.log('SW: Caching aset penting untuk mode offline...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  )
);

// Fungsi untuk mengambil dari jaringan (dengan timeout)
const fromNetwork = (request, timeout) =>
  new Promise((fulfill, reject) => {
    const timeoutId = setTimeout(reject, timeout);
    fetch(request).then(response => {
      clearTimeout(timeoutId);
      fulfill(response);
    }, reject);
  });

// Fungsi untuk mengambil dari cache
const fromCache = request =>
  caches
    .open(CURRENT_CACHE)
    .then(cache =>
      cache
        .match(request)
        .then(matching => matching || cache.match(OFFLINE_PAGE)) // Jika tidak ada, beri halaman offline
    );

// Strategi fetch utama
self.addEventListener('fetch', evt => {
  // Hanya proses request GET
  if (evt.request.method !== 'GET') return;

  evt.respondWith(
    // Coba ambil dari jaringan dulu (timeout 5 detik)
    fromNetwork(evt.request, 5000).catch(() => {
        // Jika gagal, ambil dari cache
        console.log(`SW: Gagal mengambil ${evt.request.url} dari network, beralih ke cache.`);
        return fromCache(evt.request);
    })
  );
});