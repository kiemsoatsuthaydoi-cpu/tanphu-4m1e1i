// Service Worker for META ANDON PWA support to enable Badging on Home Screen
const CACHE_NAME = 'meta-andon-v3';
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

// Handle notification click to focus application window and clear badge
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (self.registration && self.registration.clearBadge) {
    self.registration.clearBadge().catch((err) => console.error('Error clearing badge on click:', err));
  } else if (navigator && navigator.clearAppBadge) {
    navigator.clearAppBadge().catch((err) => console.error('Error clearing badge on click:', err));
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

