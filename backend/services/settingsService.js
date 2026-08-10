/**
 * settingsService.js — cached accessor for the single Settings document
 * (plan 009).
 *
 * Caching idiom deliberately mirrors backend/utils/userAuthCache.js (the
 * existing precedent for a short-TTL, module-level cache in this codebase)
 * rather than inventing a new pattern: same TTL_MS-via-env-var-with-default
 * shape, same read/write/invalidate structure, same `_clearXForTests()`
 * test hook.
 *
 * updateSettings() writes to Mongo THEN immediately overwrites the cache
 * with the fresh document (not just invalidating it) — so the admin who
 * just changed a setting sees it take effect on their very next read, not
 * up to TTL_MS later. Per the plan's test plan: "a settings change that
 * takes several seconds to take effect for the admin who just made it
 * would look broken."
 */
import Settings from "../models/Settings.js";

const TTL_MS = Number(process.env.SETTINGS_CACHE_TTL_MS) || 5000;
const SETTINGS_KEY = "global";

let cached = null; // { doc, expiresAt } | null

function readCache() {
  if (!cached) return undefined;
  if (Date.now() > cached.expiresAt) {
    cached = null;
    return undefined;
  }
  return cached.doc;
}

function writeCache(doc) {
  cached = { doc, expiresAt: Date.now() + TTL_MS };
}

/**
 * Returns the current settings document (a plain object, not a Mongoose
 * document — callers only ever read these fields). Upserts the singleton
 * on first-ever call so there's always exactly one document, using the
 * schema's own defaults (recruiter/TPO registration default to `true`).
 */
export async function getSettings() {
  const fromCache = readCache();
  if (fromCache) return fromCache;

  const doc = await Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  writeCache(doc);
  return doc;
}

/**
 * Applies a partial update to the settings document and returns the fresh
 * document. Only the caller (adminSettingsController.js) is responsible
 * for whitelisting which fields are allowed through — this function
 * doesn't re-validate that, it just persists whatever partial it's given
 * via Mongoose's schema (so unknown top-level keys are dropped by
 * strict-mode, same as everywhere else in this codebase).
 */
export async function updateSettings(partial) {
  const doc = await Settings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: partial },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  writeCache(doc); // immediate, not a wait-for-TTL invalidation — see header comment
  return doc;
}

/** Test-only: reset the cache between test cases. */
export function _clearSettingsCacheForTests() {
  cached = null;
}