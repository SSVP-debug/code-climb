import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../services/settingsService.js", () => ({
  getSettings: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { getSettings } from "../services/settingsService.js";
import { maintenanceModeMiddleware } from "./maintenanceMode.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("maintenanceModeMiddleware", () => {
  let res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    next = vi.fn();
  });

  describe("when maintenance mode is OFF", () => {
    beforeEach(() => {
      getSettings.mockResolvedValue({ maintenanceMode: false });
    });

    it("calls next() for an ordinary route", async () => {
      await maintenanceModeMiddleware({ path: "/api/users/me" }, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("when maintenance mode is ON", () => {
    beforeEach(() => {
      getSettings.mockResolvedValue({ maintenanceMode: true });
    });

    it("returns 503 for an ordinary protected route", async () => {
      await maintenanceModeMiddleware({ path: "/api/problems" }, res, next);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ maintenance: true }));
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 503 for a business route even though getSettings was called", async () => {
      await maintenanceModeMiddleware({ path: "/api/submissions" }, res, next);
      expect(getSettings).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });

    // Allowlist — must stay reachable while maintenance mode is active,
    // so an admin can actually turn it back off.
    it.each([
      "/api/admin/settings",
      "/api/admin/system-health",
      "/api/health",
      "/api/health/compiler",
      "/api/announcement",
      "/",
    ])("still calls next() for allowlisted path %s", async (path) => {
      await maintenanceModeMiddleware({ path }, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("does NOT allowlist a path that merely starts with a similar-looking prefix", async () => {
      // /api/admin-lookalike must NOT be treated as under /api/admin.
      await maintenanceModeMiddleware({ path: "/api/admin-lookalike/x" }, res, next);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it("does not call getSettings at all for allowlisted paths (cheap bypass)", async () => {
      await maintenanceModeMiddleware({ path: "/api/admin/users" }, res, next);
      expect(getSettings).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe("when the settings read itself fails", () => {
    it("fails OPEN — calls next() rather than 503ing on top of an unrelated outage", async () => {
      getSettings.mockRejectedValueOnce(new Error("Mongo down"));
      await maintenanceModeMiddleware({ path: "/api/problems" }, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});