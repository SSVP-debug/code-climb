import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../models/Settings.js", () => ({
  default: { findOneAndUpdate: vi.fn() },
}));

import Settings from "../models/Settings.js";
import { getSettings, updateSettings, _clearSettingsCacheForTests } from "./settingsService.js";

function chainableLean(result) {
  return { lean: vi.fn().mockResolvedValue(result) };
}

describe("settingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _clearSettingsCacheForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getSettings", () => {
    it("fetches (upserting) on a cold cache and returns the document", async () => {
      const doc = { key: "global", maintenanceMode: false };
      Settings.findOneAndUpdate.mockReturnValueOnce(chainableLean(doc));

      const result = await getSettings();

      expect(result).toEqual(doc);
      expect(Settings.findOneAndUpdate).toHaveBeenCalledWith(
        { key: "global" },
        { $setOnInsert: { key: "global" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    it("serves subsequent calls from cache without hitting the DB again", async () => {
      Settings.findOneAndUpdate.mockReturnValueOnce(chainableLean({ key: "global" }));

      await getSettings();
      await getSettings();
      await getSettings();

      expect(Settings.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it("expires the cache after the TTL (default 5000ms) and re-fetches", async () => {
      Settings.findOneAndUpdate.mockReturnValueOnce(chainableLean({ key: "global", maintenanceMode: false }));
      await getSettings();

      vi.advanceTimersByTime(4999);
      await getSettings();
      expect(Settings.findOneAndUpdate).toHaveBeenCalledTimes(1); // still cached

      vi.advanceTimersByTime(2);
      Settings.findOneAndUpdate.mockReturnValueOnce(chainableLean({ key: "global", maintenanceMode: true }));
      const afterExpiry = await getSettings();

      expect(Settings.findOneAndUpdate).toHaveBeenCalledTimes(2);
      expect(afterExpiry.maintenanceMode).toBe(true);
    });
  });

  describe("updateSettings", () => {
    it("persists the partial via $set and returns the fresh document", async () => {
      Settings.findOneAndUpdate.mockReturnValueOnce(chainableLean({ key: "global", maintenanceMode: true }));

      const result = await updateSettings({ maintenanceMode: true });

      expect(Settings.findOneAndUpdate).toHaveBeenCalledWith(
        { key: "global" },
        { $set: { maintenanceMode: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      expect(result.maintenanceMode).toBe(true);
    });

    it("invalidates the cache IMMEDIATELY, not after the TTL elapses", async () => {
      // Warm the cache with the old value.
      Settings.findOneAndUpdate.mockReturnValueOnce(chainableLean({ key: "global", maintenanceMode: false }));
      await getSettings();

      // Update, well within the old entry's TTL window.
      Settings.findOneAndUpdate.mockReturnValueOnce(chainableLean({ key: "global", maintenanceMode: true }));
      await updateSettings({ maintenanceMode: true });

      // A read one millisecond later must see the NEW value, not the
      // still-technically-unexpired old cache entry.
      vi.advanceTimersByTime(1);
      const result = await getSettings();

      expect(result.maintenanceMode).toBe(true);
      // Only the two explicit findOneAndUpdate calls above — no extra
      // DB round-trip on that final getSettings() read.
      expect(Settings.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
  });
});