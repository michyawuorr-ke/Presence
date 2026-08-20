// Minimal offline support: cache the app shell (icons, manifest, offline
// page) at install time, and fall back to /offline only when a navigation
// request fails outright (no network). Everything else — API calls, RSC
// payloads, Supabase requests — passes straight through untouched, since
// caching those would risk serving stale event/guest data.
// Offline support, Instagram-style: the app shell (header, nav, tabs)
// stays visible even with no connection — only the data inside individual
// sections fails to load (handled client-side, see home/page.tsx's
// loadError state). This only works if the shell itself is cached, so:
//
// - SHELL_URLS: cached at install time — the bare-bones /offline page,
//   used only as a last resort if we've truly never cached anything for
//   a given route (e.g. first-ever visit with no connection at all).
// - RUNTIME_CACHE: every successful page navigation gets cached as it
//   happens. When a navigation fails (offline), we serve the last cached
//   copy of that exact page first — that's what keeps the real shell
//   showing instead of the blank fallback.
//
// API calls, RSC payloads, and Supabase requests are never cached here —
// caching those would risk serving stale event/guest data.
const CACHE = "oreeti-shell-v1";
const RUNTIME_CACHE = "oreeti-runtime-v1";
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
      Promise.all(keys.filter((k) => k !== CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.mode !== "navigate") return; // only handle page navigations

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache real, successful HTML responses — not redirects,
        // not error pages.
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cachedPage = await caches.match(request, { cacheName: RUNTIME_CACHE });
        if (cachedPage) return cachedPage;
        return caches.match("/offline");
      })
  );
});
