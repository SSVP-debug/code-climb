/**
 * Code Club service worker.
 *
 * Scope, deliberately narrow: offline PROBLEM READING, not solving.
 * - Static HASHED app shell (JS/CSS/icons under /assets/): cache-first,
 *   since Vite content-hashes these filenames — a cached asset is always
 *   the correct asset for its URL, forever, for that URL.
 * - The HTML document (navigation requests, "/", any route the SPA
 *   router handles) is explicitly EXCLUDED from cache-first. It is the
 *   one file whose filename never changes across deploys, so caching it
 *   pins a returning client to a past deploy's hashed asset references —
 *   which then 404 once a new deploy prunes the old /assets/* files.
 *   Navigations always go straight to the network — no cache fallback,
 *   since any cached HTML we could offer could itself point at pruned
 *   assets, which is worse than the browser's own offline handling.
 * - GET /api/problems and GET /api/problems/:slug: network-first with a
 *   cache fallback, so a problem a student already opened stays readable
 *   offline (e.g. patchy hostel wifi).
 * - Everything else — judge, compiler, submissions, progress, auth, any
 *   non-GET request — is NEVER intercepted. Those must always hit the
 *   network live; serving a stale cached judge/submit response would be
 *   actively wrong, not just unhelpful.
 *
 * Bump CACHE_VERSION whenever the caching strategy changes so old caches
 * get cleaned up on activate. Bumped for this fix so every existing
 * client discards its stale HTML-holding cache on next activate.
 */

const CACHE_VERSION = "v2";
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
      // Small, unhashed static files only — NOT "/" and NOT index.html.
      // Precaching these is harmless because favicon/manifest content
      // rarely changes and isn't tied to a specific JS build's hashes.
      cache.addAll(["/manifest.webmanifest", "/favicon.svg"])
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
  // Only Vite's content-hashed build output. This is deliberately an
  // allowlist (not "everything that isn't /api/"), because the HTML
  // document — the one URL whose name never changes across deploys —
  // must never be cache-first (see file header).
  return url.pathname.startsWith("/assets/");
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

  // HTML navigations (the SPA shell, any route). Always prefer a live
  // network fetch so a client always gets the current deploy's asset
  // references; only fall back to a cached shell if truly offline.
  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
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

async function handleNavigate(request) {
  // Always go live for navigations — never serve a stale index.html that
  // references a previous deploy's hashed /assets/* filenames. If the
  // device is genuinely offline, this rejects and the browser shows its
  // normal offline page — which is correct: we have no safe cached HTML
  // to fall back to that's guaranteed to match currently-live assets.
  return fetch(request);
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