import { invalidateCachePrefix } from "../utils/cache.js";

const TPO_CACHE_PREFIX = "tpo:";

/**
 * Invalidate a college's cached TPO views.
 * Called whenever a student's XP, solved count, or streak changes.
 */
export async function invalidateTpoCache(domain) {
  if (!domain) return;

  await invalidateCachePrefix(`${TPO_CACHE_PREFIX}students:${domain}`);
  await invalidateCachePrefix(`${TPO_CACHE_PREFIX}dashboard:${domain}`);
}