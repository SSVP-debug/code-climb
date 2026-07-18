import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getCachedUserByFirebaseUid,
  setCachedUserByFirebaseUid,
  invalidateCachedUserByFirebaseUid,
  getCachedUserById,
  setCachedUserById,
  invalidateCachedUserById,
  _clearUserAuthCacheForTests,
} from "./userAuthCache.js";

describe("userAuthCache", () => {
  beforeEach(() => {
    _clearUserAuthCacheForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined for a key that was never cached", () => {
    expect(getCachedUserByFirebaseUid("uid-1")).toBeUndefined();
    expect(getCachedUserById("id-1")).toBeUndefined();
  });

  it("returns the exact same object reference that was cached (not a clone)", () => {
    const doc = { _id: "u1", role: "student" };
    setCachedUserByFirebaseUid("uid-1", doc);

    const hit = getCachedUserByFirebaseUid("uid-1");
    expect(hit).toBe(doc);

    // Mutating the cached reference (as a route calling req.userDoc.save()
    // would) is immediately visible on the next hit — no re-caching needed.
    doc.role = "admin";
    expect(getCachedUserByFirebaseUid("uid-1").role).toBe("admin");
  });

  it("expires entries after AUTH_USER_CACHE_TTL_MS (default 5000ms)", () => {
    const doc = { _id: "u1" };
    setCachedUserByFirebaseUid("uid-1", doc);

    vi.advanceTimersByTime(4999);
    expect(getCachedUserByFirebaseUid("uid-1")).toBe(doc);

    vi.advanceTimersByTime(2);
    expect(getCachedUserByFirebaseUid("uid-1")).toBeUndefined();
  });

  it("invalidateCachedUserByFirebaseUid drops the entry immediately", () => {
    setCachedUserByFirebaseUid("uid-1", { _id: "u1" });
    invalidateCachedUserByFirebaseUid("uid-1");

    expect(getCachedUserByFirebaseUid("uid-1")).toBeUndefined();
  });

  it("keeps the firebaseUid store and the by-id store independent", () => {
    const byUid = { _id: "u1", tag: "from-uid-lookup" };
    const byId = { _id: "u1", tag: "from-id-lookup" };

    setCachedUserByFirebaseUid("uid-1", byUid);
    setCachedUserById("u1", byId);

    expect(getCachedUserByFirebaseUid("uid-1")).toBe(byUid);
    expect(getCachedUserById("u1")).toBe(byId);

    invalidateCachedUserById("u1");
    expect(getCachedUserById("u1")).toBeUndefined();
    // Invalidating the by-id entry must not touch the by-uid entry.
    expect(getCachedUserByFirebaseUid("uid-1")).toBe(byUid);
  });
});
