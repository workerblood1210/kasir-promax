const CACHE_NAME = 'katering-pro-v4'; 
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/core.css',
  '/script.js',
  '/manifest.json',  
  '/Icon-192.png',   
  '/Icon-512px.png' 
];

// 1. Install & Cache semua aset + Paksa langsung aktif
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Membuka cache lokal...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // <-- Memaksa SW baru langsung menggeser SW lama
  );
});

// 2. Cegat request internet, gunakan Cache jika offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 3. Update Cache jika ada versi baru & langsung ambil kendali halaman
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName); 
          }
        })
      );
    }).then(() => self.clients.claim()) // <-- Langsung klaim halaman tanpa perlu reload tab
  );
});