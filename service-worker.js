const CACHE_NAME = 'conversor-acero-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // si usas bootstrap por CDN, puedes cachearlo también, o cargarlo localmente
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

// Instalación y cacheo de archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación y limpieza de caches antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Interceptar peticiones y responder desde cache o fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devolverlo
        if (response) {
          return response;
        }
        // Si no, hacer fetch y cachear la respuesta
        return fetch(event.request).then(
          responseFetch => {
            // Verificar que la respuesta sea válida
            if(!responseFetch || responseFetch.status !== 200 || responseFetch.type !== 'basic') {
              return responseFetch;
            }
            // Clonar respuesta para cachear
            const responseToCache = responseFetch.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return responseFetch;
          }
        );
      })
  );
});
