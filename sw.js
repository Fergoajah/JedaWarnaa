const CACHE_NAME = 'paletta-cache-v1.1';

// Daftar aset yang akan di-cache saat instalasi
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/js/chroma.min.js',        // <-- TAMBAHKAN BARIS INI
    '/js/color-thief.umd.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap'
];

// Event 'install': Menyimpan aset ke dalam cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache dibuka');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Gagal melakukan caching file:', err);
            })
    );
});

// Event 'fetch': Menyajikan aset dari cache jika tersedia (Cache First Strategy)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Jika aset ada di cache, kembalikan dari cache
                if (response) {
                    return response;
                }
                // Jika tidak, ambil dari network
                return fetch(event.request).catch(() => {
                    // Jika fetch gagal (offline), Anda bisa memberikan fallback page
                    // return caches.match('/offline.html'); 
                });
            })
    );
});

// Event 'activate': Membersihkan cache lama agar tidak menumpuk
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});