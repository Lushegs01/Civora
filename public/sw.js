const CACHE = "civora-shell-v1";
const PRECACHE = ["/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for navigations and data, cache fallback when offline.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (request.mode === "navigate" || url.pathname.startsWith("/_next/static"))) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            (request.mode === "navigate"
              ? new Response(
                  "<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Civora — offline</title><body style=\"font-family:system-ui;background:#F4F4F1;color:#111;display:grid;place-items:center;min-height:100vh\"><div style=\"text-align:center\"><h1 style=\"font-size:20px\">You're offline</h1><p style=\"color:#6F6F6B\">Civora will reconnect automatically. Drafts on this device are safe.</p></div></body>",
                  { headers: { "Content-Type": "text/html" } }
                )
              : Response.error())
        )
      )
  );
});
