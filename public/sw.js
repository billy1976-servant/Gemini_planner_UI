/* HI Clarify — minimal installable service worker. Cache-first for same-origin static assets. */
const CACHE_NAME = "hiclarify-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url);
  if (u.origin !== self.location.origin || event.request.method !== "GET") return;
  if (u.pathname.startsWith("/api/")) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const clone = res.clone();
        if (res.status === 200 && res.type === "basic")
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      });
    })
  );
});
