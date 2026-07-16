/**
 * Convert topicStats into a plain JavaScript object.
 * Supports:
 * - Mongoose Map
 * - Plain Object
 * - null / undefined
 */
export function topicStatsToObject(topicStats) {
  if (!topicStats) return {};

  if (topicStats instanceof Map) {
    return Object.fromEntries(topicStats);
  }

  if (typeof topicStats === "object") {
    return { ...topicStats };
  }

  return {};
}

/**
 * Convert a plain object back into a Map.
 * Used before saving to Mongo when the schema uses Map.
 */
export function topicStatsFromObject(obj = {}) {
  if (obj instanceof Map) {
    return obj;
  }

  return new Map(Object.entries(obj || {}));
}