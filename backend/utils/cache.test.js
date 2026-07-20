import { describe, expect, it, vi, beforeEach } from "vitest";

const mockRedis = {
  get: vi.fn(),
  set: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
  scan: vi.fn(),
};

vi.mock("../config/redis.js", () => ({
  getRedisClient: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

import { getRedisClient } from "../config/redis.js";
import { getOrSetCache, invalidateCache, invalidateCachePrefix } from "./cache.js";

describe("cache.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrSetCache — no Redis (in-memory fallback)", () => {
    beforeEach(() => {
      getRedisClient.mockResolvedValue(null);
    });

    it("calls fetchFn on a miss and returns MISS", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ a: 1 });
      const result = await getOrSetCache(`mem:${Math.random()}`, 60, fetchFn);

      expect(fetchFn).toHaveBeenCalledOnce();
      expect(result).toEqual({ value: { a: 1 }, cacheStatus: "MISS" });
    });

    it("returns HIT from memory on the second call without re-calling fetchFn", async () => {
      const key = `mem:${Math.random()}`;
      const fetchFn = vi.fn().mockResolvedValue({ a: 1 });

      await getOrSetCache(key, 60, fetchFn);
      const second = await getOrSetCache(key, 60, fetchFn);

      expect(fetchFn).toHaveBeenCalledOnce();
      expect(second).toEqual({ value: { a: 1 }, cacheStatus: "HIT" });
    });
  });

  describe("getOrSetCache — with Redis", () => {
    beforeEach(() => {
      getRedisClient.mockResolvedValue(mockRedis);
    });

    it("returns HIT when Redis has the key", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ a: 1 }));
      const fetchFn = vi.fn();

      const result = await getOrSetCache("k1", 60, fetchFn);

      expect(fetchFn).not.toHaveBeenCalled();
      expect(result).toEqual({ value: { a: 1 }, cacheStatus: "HIT" });
    });

    it("falls back to stale Redis value if fetchFn throws", async () => {
      mockRedis.get
        .mockResolvedValueOnce(null) // initial GET — miss
        .mockResolvedValueOnce(JSON.stringify({ a: "stale" })); // stale fallback GET
      const fetchFn = vi.fn().mockRejectedValue(new Error("db down"));

      const result = await getOrSetCache("k2", 60, fetchFn);

      expect(result).toEqual({ value: { a: "stale" }, cacheStatus: "STALE" });
    });
  });

  describe("invalidateCache", () => {
    it("calls redis.del when Redis is available", async () => {
      getRedisClient.mockResolvedValue(mockRedis);
      await invalidateCache("some:key");
      expect(mockRedis.del).toHaveBeenCalledWith("some:key");
    });

    it("no-ops safely when Redis is unavailable", async () => {
      getRedisClient.mockResolvedValue(null);
      await expect(invalidateCache("some:key")).resolves.not.toThrow();
    });
  });

  describe("invalidateCachePrefix — SCAN, not KEYS", () => {
    beforeEach(() => {
      getRedisClient.mockResolvedValue(mockRedis);
    });

    it("uses redis.scan (cursor-based), never redis.keys", async () => {
      mockRedis.scan.mockResolvedValueOnce(["0", ["leaderboard:college:a", "leaderboard:college:b"]]);

      await invalidateCachePrefix("leaderboard:college:");

      expect(mockRedis.scan).toHaveBeenCalledWith(
        "0",
        "MATCH",
        "leaderboard:college:*",
        "COUNT",
        100
      );
      expect(mockRedis.del).toHaveBeenCalledWith("leaderboard:college:a", "leaderboard:college:b");
    });

    it("walks multiple cursor pages until SCAN returns cursor 0", async () => {
      mockRedis.scan
        .mockResolvedValueOnce(["17", ["k1"]])
        .mockResolvedValueOnce(["42", ["k2"]])
        .mockResolvedValueOnce(["0", ["k3"]]);

      await invalidateCachePrefix("prefix:");

      expect(mockRedis.scan).toHaveBeenCalledTimes(3);
      expect(mockRedis.del).toHaveBeenCalledTimes(3);
    });

    it("does not call del when a scan page returns no keys", async () => {
      mockRedis.scan.mockResolvedValueOnce(["0", []]);

      await invalidateCachePrefix("empty:");

      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it("logs and swallows errors instead of throwing", async () => {
      mockRedis.scan.mockRejectedValueOnce(new Error("redis down"));

      await expect(invalidateCachePrefix("prefix:")).resolves.not.toThrow();
    });
  });
});
