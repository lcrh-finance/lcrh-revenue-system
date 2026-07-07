/* LCRH Revenue System — Service Worker */
const CACHE_NAME = "lcrh-revenue-v1";

const STATIC_ASSETS = [
  "/lcrh-revenue-system/",
  "/lcrh-revenue-system/index.html",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
  "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
];

// Install — cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener("fetch", event => {
  // Skip non-GET and Firebase requests (always need live data)
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("firestore.googleapis.com")) return;
  if (event.request.url.includes("firebase")) return;
  if (event.request.url.includes("googleapis.com")) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback — serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // For navigation, return the app shell
          if (event.request.mode === "navigate") {
            return caches.match("/lcrh-revenue-system/index.html");
          }
        });
      })
  );
});
