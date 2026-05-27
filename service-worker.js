// Service Worker — Programme Santé Lorenzo
// Cache les fichiers essentiels pour usage hors ligne

const CACHE_NAME = 'sante-ls-v2-0-calendrier';
const ASSETS = [
  './',
  './index.html',
  './programme-data.json',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg'
];

// Installation : pré-cache les fichiers
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Ajout robuste : tolère qu'une icône manque sans bloquer l'install
      return Promise.all(
        ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('SW: cache failed for', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : cache-first puis network fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Stocker la nouvelle ressource si OK
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// Notifications push (hooks pour activation ultérieure)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Programme Santé', body: 'Rappel' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('./index.html'));
});
