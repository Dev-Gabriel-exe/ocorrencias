const CACHE_NAME = "app-cache-v1";

const urlsToCache = [
  "/",
  "/login",
  "/icon-192.png",
  "/icon-512.png"
];

// instala e salva cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// responde usando cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});