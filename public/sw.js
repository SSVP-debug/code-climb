/**
 * Code Club service worker.
 *
 * Scope, deliberately narrow: offline PROBLEM READING, not solving.
 * - Static app shell (JS/CSS/icons): cache-first, since Vite content-hashes
 *   filenames — a cached asset is always the correct asset for its URL.
 * - GET /api/problems and GET /api/problems/:slug: network-first with a
 *   cache fallback, so a problem a student already opened stays readable
 *   offline (e.g. patchy hostel wifi).
 * - Everything else — judge, compiler, submissions, progress, auth, any
 *   non-GET request — is NEVER intercepted. Those must always hit the
 *   network live; serving a stale cached judge/submit response would be
 *   actively wrong, not just unhelpful.
 *
 * Bump CACHE_VERSION whenever the caching strategy changes so old caches
 * get cleaned up on activate.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `codeclub-static-${CACHE_VERSION}`;
const PROBLEMS_CACHE = `codeclub-problems-${CACHE_VERSION}`;

// Routes that are safe to serve from cache when offline. Deliberately a
// short allowlist rather than "cache everything under /api" — see header.
const CACHEABLE_API_PATTERNS = [
  /^\/api\/problems(\/[a-z0-9-]+)?$/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/", "/manifest.webmanifest", "/favicon.svg"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== PROBLEMS_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isCacheableApiGet(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isStaticAsset(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  // Never intercept API calls here — handled separately (or not at all).
  if (url.pathname.startsWith("/api/")) return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never touch anything that isn't a GET — judge submissions, progress
  // writes, auth, everything mutating goes straight to the network.
  if (request.method !== "GET") return;

  if (isCacheableApiGet(request)) {
    event.respondWith(networkFirstWithCache(request, PROBLEMS_CACHE));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  // Anything else (judge, compiler, submissions, progress, auth, etc.)
  // falls through untouched — default browser network behavior.
});

async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  // Offline and not cached — nothing sensible to return for a JS/CSS
  // chunk, so let the browser's own network-error handling take over
  // (no try/catch needed here — a rejected fetch() just propagates).
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
