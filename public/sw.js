// Service Worker for META 4M1E1I PWA support to enable Badging on Home Screen
const CACHE_NAME = 'meta-4m1e1i-v2';
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

// Intercept fetch requests (Network First strategy to avoid stale whitescreens on code updates)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If we got a valid response, cache it for offline use and return
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network is offline/fails, look up in cache
          return caches.match(event.request);
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
    if (self.registration && self.registration.setBadge) {
      self.registration.setBadge(count).catch((err) => console.error('Error setting badge via SW registration:', err));
    } else if (navigator && navigator.setAppBadge) {
      navigator.setAppBadge(count).catch((err) => console.error('Error setting badge from SW:', err));
    }
  } else if (event.data && event.data.type === 'CLEAR_BADGE') {
    if (self.registration && self.registration.clearBadge) {
      self.registration.clearBadge().catch((err) => console.error('Error clearing badge via SW registration:', err));
    } else if (navigator && navigator.clearAppBadge) {
      navigator.clearAppBadge().catch((err) => console.error('Error clearing badge from SW:', err));
    }
  }
});
