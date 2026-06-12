const CACHE_VERSION = 'promax-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/core.kasirpromax.css',
    '/css/style.css', // Pastikan css utama juga masuk cache
    '/js/app.js',
    '/js/database/db.js',
    '/js/modules/cart.js',
    '/js/modules/auth.js',    // WAJIB MASUK CACHE
    '/js/modules/catalog.js', // WAJIB MASUK CACHE
    '/js/vendor/dexie.min.js'
];

// Tahap Instalasi
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Tahap Aktivasi
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_VERSION) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Tahap Intersepsi (Cache-First)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});