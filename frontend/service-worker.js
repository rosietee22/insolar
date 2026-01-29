/**
 * Service Worker for Insolar
 * Handles offline caching and network-first strategy for API calls
 */

const CACHE_NAME = 'insolar-v11';

// Static assets to precache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/main.js',
  '/js/api.js',
  '/js/location.js',
  '/js/ui.js',
  '/js/theme.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/**
 * Install Event: Precache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Precache complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

/**
 * Activate Event: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event: Network-first for API, Cache-first for static assets
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    // Exception: Cache Chart.js CDN
    if (url.host === 'cdn.jsdelivr.net' && url.pathname.includes('chart.js')) {
      event.respondWith(cacheFirstStrategy(request));
    }
    return;
  }

  // API requests: Network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // HTML, JS, CSS: Network-first to always get latest
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Other static assets: Cache-first, fallback to network
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Network-First Strategy (for API requests)
 * Try network first, fallback to cache if offline
 */
async function networkFirstStrategy(request) {
  try {
    // Try network
    const networkResponse = await fetch(request);

    // Only cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      // Clone response before caching (response can only be used once)
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }

    // No cache available
    throw error;
  }
}

/**
 * Cache-First Strategy (for static assets)
 * Try cache first, fallback to network
 */
async function cacheFirstStrategy(request) {
  // Try cache
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Cache miss, try network
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.error('[SW] Fetch failed:', request.url, error);
    throw error;
  }
}

/**
 * Message Event: Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
