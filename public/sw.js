/* Meydan browser worker: media is intentionally network-only. */
const VERSION = "meydan-pwa-v4";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";
const SPLASH_URLS = ["/splash/splash-light.json", "/splash/splash-dark.json"];
const CORE_ASSETS = [OFFLINE_URL, "/icon.svg", "/fonts/IRANSansXV.woff2", ...SPLASH_URLS];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(CORE_ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("meydan-pwa-") && name !== STATIC_CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  // Do not intercept media. WordPress wp-content videos/images must use native
  // browser requests, Range requests and CDN/server headers.
  if (["video", "audio", "image"].includes(request.destination)) return;

  // First-load splash animation: serve from cache so it plays offline too,
  // refreshing the cache in the background when the network is available.
  if (SPLASH_URLS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      const network = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => undefined);
      return cached || (await network) || Response.error();
    })());
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(STATIC_CACHE);
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }));
  }
});
