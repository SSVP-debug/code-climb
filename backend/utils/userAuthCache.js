const TTL_MS = Number(process.env.AUTH_USER_CACHE_TTL_MS) || 5000;

// key -> { doc, expiresAt }
const store = new Map();

function read(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.doc;
}

function write(key, doc) {
  store.set(key, { doc, expiresAt: Date.now() + TTL_MS });
}

// ── Primary user, keyed by Firebase UID (what requireAuth verifies) ────────
export function getCachedUserByFirebaseUid(firebaseUid) {
  return read(`uid:${firebaseUid}`);
}

export function setCachedUserByFirebaseUid(firebaseUid, doc) {
  write(`uid:${firebaseUid}`, doc);
}

export function invalidateCachedUserByFirebaseUid(firebaseUid) {
  store.delete(`uid:${firebaseUid}`);
}

// ── Impersonation target, keyed by Mongo _id (looked up by targetUserId) ──
export function getCachedUserById(id) {
  return read(`id:${id}`);
}

export function setCachedUserById(id, doc) {
  write(`id:${id}`, doc);
}

export function invalidateCachedUserById(id) {
  store.delete(`id:${id}`);
}

/** Test-only: reset all entries between test cases. */
export function _clearUserAuthCacheForTests() {
  store.clear();
}
