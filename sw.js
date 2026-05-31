const CACHE_NAME = 'ledgerflow-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/api.js',
  '/js/main.js',
  '/js/finance.js',
  '/js/ai-assistant.js',
  '/manifest.json',
  '/icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls — network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          if (request.method === 'GET') cache.put(request, response.clone());
          return response;
        });
      });
    })
  );
});
