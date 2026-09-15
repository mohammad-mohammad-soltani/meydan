/* Meydan browser worker: private API responses and authenticated HTML are intentionally never cached. */
const VERSION = "meydan-pwa-v1";
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const MEDIA_CACHE = `${VERSION}-media`;
const META_CACHE = `${VERSION}-meta`;
const OFFLINE_URL = "/offline.html";

const IMAGE_MAX_AGE = 15 * 60 * 1000;
const MEDIA_MAX_AGE = 8 * 60 * 1000;
const IMAGE_MAX_ENTRIES = 160;
const MEDIA_MAX_ENTRIES = 24;
const MEDIA_MAX_BYTES = 32 * 1024 * 1024;
const CORE_ASSETS = [OFFLINE_URL, "/icon.svg", "/images/logo/meydan-mark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(
        CORE_ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" }))),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, IMAGE_CACHE, MEDIA_CACHE, META_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("meydan-pwa-") && !keep.has(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }

  // Never persist API/session data in the service-worker cache.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) return;

  const destination = request.destination;
  const isImage = destination === "image" || (url.origin === self.location.origin && url.pathname === "/_next/image");
  const isMedia = destination === "video" || destination === "audio";
  const isStatic =
    destination === "script" ||
    destination === "style" ||
    destination === "font" ||
    destination === "worker" ||
    (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/"));

  if (isImage) {
    event.respondWith(staleWhileRevalidate(event, request, IMAGE_CACHE, IMAGE_MAX_AGE, IMAGE_MAX_ENTRIES));
    return;
  }

  if (isMedia) {
    if (request.headers.has("range")) event.respondWith(rangeAwareMedia(event, request));
    else event.respondWith(mediaNetworkFirst(event, request));
    return;
  }

  if (isStatic && url.origin === self.location.origin) {
    event.respondWith(staticCacheFirst(event, request));
  }
});

async function navigationResponse(request) {
  try {
    // HTML may contain user-specific state, so it is deliberately network-only.
    return await fetch(request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    return (
      (await cache.match(OFFLINE_URL)) ||
      new Response("آفلاین هستید", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function staticCacheFirst(event, request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    event.waitUntil(
      fetch(request)
        .then((response) => {
          if (cacheable(response)) return cache.put(request, response.clone());
          return undefined;
        })
        .catch(() => undefined),
    );
    return cached;
  }

  const response = await fetch(request);
  if (cacheable(response)) event.waitUntil(cache.put(request, response.clone()));
  return response;
}

async function staleWhileRevalidate(event, request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await getFresh(cache, cacheName, request, maxAge);

  const update = fetch(request)
    .then(async (response) => {
      if (cacheable(response)) await putRuntime(cache, cacheName, request, response.clone(), maxEntries, maxAge);
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(update);
    return cached;
  }

  return (await update) || Response.error();
}

async function mediaNetworkFirst(event, request) {
  const cache = await caches.open(MEDIA_CACHE);
  try {
    const response = await fetch(request);
    if (await mediaCacheable(response)) {
      event.waitUntil(
        putRuntime(cache, MEDIA_CACHE, request, response.clone(), MEDIA_MAX_ENTRIES, MEDIA_MAX_AGE),
      );
    }
    return response;
  } catch {
    const cached = await getFresh(cache, MEDIA_CACHE, request, MEDIA_MAX_AGE);
    return cached || Response.error();
  }
}

async function rangeAwareMedia(event, request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await getFresh(cache, MEDIA_CACHE, request.url, MEDIA_MAX_AGE);

  if (cached && cached.type !== "opaque" && cached.status === 200) {
    const partial = await createRangeResponse(request, cached);
    if (partial) return partial;
  }

  // Browsers usually ask videos with Range. Warm a complete copy in the background
  // so subsequent seeks can be served locally when the object is reasonably small.
  event.waitUntil(warmFullMedia(request));
  return fetch(request);
}

async function warmFullMedia(request) {
  try {
    const headers = new Headers(request.headers);
    headers.delete("range");
    const fullRequest = new Request(request.url, {
      method: "GET",
      headers,
      mode: request.mode,
      credentials: request.credentials,
      cache: "no-store",
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      integrity: request.integrity,
    });
    const response = await fetch(fullRequest);
    if (!(await mediaCacheable(response))) return;
    const cache = await caches.open(MEDIA_CACHE);
    await putRuntime(cache, MEDIA_CACHE, request.url, response, MEDIA_MAX_ENTRIES, MEDIA_MAX_AGE);
  } catch {
    // Warming is best-effort and must never break playback.
  }
}

async function createRangeResponse(request, response) {
  const range = request.headers.get("range");
  if (!range) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match) return null;

  const blob = await response.clone().blob();
  const total = blob.size;
  let start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : total - 1;

  if (!match[1] && match[2]) {
    const suffix = Number(match[2]);
    start = Math.max(0, total - suffix);
    end = total - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }

  end = Math.min(end, total - 1);
  const slice = blob.slice(start, end + 1, response.headers.get("content-type") || undefined);
  const headers = new Headers(response.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  headers.set("Content-Length", String(slice.size));
  headers.set("Accept-Ranges", "bytes");

  return new Response(slice, { status: 206, statusText: "Partial Content", headers });
}

function cacheable(response) {
  return Boolean(response && (response.ok || response.type === "opaque"));
}

async function mediaCacheable(response) {
  if (!cacheable(response) || response.status === 206 || response.type === "opaque") return false;
  const length = Number(response.headers.get("content-length") || 0);
  return length > 0 && length <= MEDIA_MAX_BYTES;
}

function metaRequest(cacheName, url) {
  const key = `${self.location.origin}/__meydan_sw_meta__?cache=${encodeURIComponent(cacheName)}&url=${encodeURIComponent(
    typeof url === "string" ? url : url.url,
  )}`;
  return new Request(key);
}

async function touch(cacheName, request) {
  const meta = await caches.open(META_CACHE);
  await meta.put(metaRequest(cacheName, request), new Response(String(Date.now())));
}

async function ageOf(cacheName, request) {
  const meta = await caches.open(META_CACHE);
  const value = await meta.match(metaRequest(cacheName, request));
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = Number(await value.text());
  return Number.isFinite(timestamp) ? Date.now() - timestamp : Number.POSITIVE_INFINITY;
}

async function deleteRuntime(cache, cacheName, request) {
  await cache.delete(request);
  const meta = await caches.open(META_CACHE);
  await meta.delete(metaRequest(cacheName, request));
}

async function getFresh(cache, cacheName, request, maxAge) {
  const cached = await cache.match(request, { ignoreVary: true });
  if (!cached) return null;
  if ((await ageOf(cacheName, request)) <= maxAge) return cached;
  await deleteRuntime(cache, cacheName, request);
  return null;
}

async function putRuntime(cache, cacheName, request, response, maxEntries, maxAge) {
  await cache.put(request, response);
  await touch(cacheName, request);
  await pruneRuntime(cache, cacheName, maxEntries, maxAge);
}

async function pruneRuntime(cache, cacheName, maxEntries, maxAge) {
  let keys = await cache.keys();
  for (const key of keys) {
    if ((await ageOf(cacheName, key)) > maxAge) await deleteRuntime(cache, cacheName, key);
  }

  keys = await cache.keys();
  while (keys.length > maxEntries) {
    const oldest = keys.shift();
    if (oldest) await deleteRuntime(cache, cacheName, oldest);
  }
}
