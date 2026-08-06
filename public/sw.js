// Minimal offline support: cache the app shell (icons, manifest, offline
// page) at install time, and fall back to /offline only when a navigation
// request fails outright (no network). Everything else — API calls, RSC
// payloads, Supabase requests — passes straight through untouched, since
// caching those would risk serving stale event/guest data.
const CACHE = "oreeti-shell-v1";
const SHELL_URLS = ["/offline", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.mode !== "navigate") return; // only handle page navigations

  event.respondWith(
    fetch(request).catch(() => caches.match("/offline"))
  );
});
