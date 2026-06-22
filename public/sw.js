// Service Worker for META 4M1E1I PWA support to enable Badging on Home Screen
const CACHE_NAME = 'meta-4m1e1i-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo_meta.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercept fetch requests (PWA standard prerequisite)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Cache-first or network-first strategies can be customized, but standard pass-through is safest for dynamic apps
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

// Support sync badging background commands if invoked from background push
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_BADGE') {
    const count = event.data.count;
    if (navigator.setAppBadge) {
      navigator.setAppBadge(count).catch((err) => console.error('Error setting badge from SW:', err));
    }
  } else if (event.data && event.data.type === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch((err) => console.error('Error clearing badge from SW:', err));
    }
  }
});
