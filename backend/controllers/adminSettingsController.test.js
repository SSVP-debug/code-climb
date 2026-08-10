import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../services/settingsService.js", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));
vi.mock("../services/adminAuditLog.js", () => ({
  recordAdminAction: vi.fn(),
}));
vi.mock("../config/featureFlags.js", () => ({
  MONETIZATION_ENABLED: false,
  B2B_ENABLED: true,
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { getSettings, updateSettings } from "../services/settingsService.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { getSettingsAdmin, updateSettingsAdmin, getAnnouncement } from "./adminSettingsController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("adminSettingsController", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  describe("getSettingsAdmin", () => {
    it("returns the settings document plus read-only env flags", async () => {
      getSettings.mockResolvedValueOnce({ key: "global", maintenanceMode: false });

      await getSettingsAdmin({}, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          maintenanceMode: false,
          envFlags: expect.objectContaining({
            monetizationEnabled: false,
            b2bEnabled: true,
            readOnly: true,
          }),
        })
      );
    });
  });

  describe("updateSettingsAdmin", () => {
    it("only persists whitelisted fields, dropping anything else in the body", async () => {
      getSettings.mockResolvedValueOnce({ maintenanceMode: false });
      updateSettings.mockResolvedValueOnce({ _id: "s1", maintenanceMode: true });

      await updateSettingsAdmin(
        { body: { maintenanceMode: true, monetizationEnabled: true, arbitraryField: "x" }, userDoc: { _id: "a1", email: "admin@x.com" } },
        res
      );

      expect(updateSettings).toHaveBeenCalledWith({ maintenanceMode: true });
    });

    it("returns 400 with no DB write when the body has no recognized fields", async () => {
      await updateSettingsAdmin({ body: { notARealField: true } }, res);

      expect(updateSettings).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("records an audit log entry with before/after only for the changed fields", async () => {
      getSettings.mockResolvedValueOnce({
        maintenanceMode: false,
        recruiterRegistrationEnabled: true,
      });
      updateSettings.mockResolvedValueOnce({
        _id: "s1",
        maintenanceMode: true,
        recruiterRegistrationEnabled: true,
      });

      await updateSettingsAdmin(
        { body: { maintenanceMode: true }, userDoc: { _id: "a1", email: "admin@x.com" } },
        res
      );

      expect(recordAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "settings.update",
          targetType: "Settings",
          details: { maintenanceMode: { before: false, after: true } },
        })
      );
      // recruiterRegistrationEnabled wasn't part of this request, so it
      // must NOT appear in the audit details even though it's present on
      // both before/after documents.
      const call = recordAdminAction.mock.calls[0][0];
      expect(call.details).not.toHaveProperty("recruiterRegistrationEnabled");
    });

    it("prefers req.actingAdminDoc over req.userDoc for the audit entry (impersonation-safe)", async () => {
      getSettings.mockResolvedValueOnce({ maintenanceMode: false });
      updateSettings.mockResolvedValueOnce({ _id: "s1", maintenanceMode: true });

      await updateSettingsAdmin(
        {
          body: { maintenanceMode: true },
          userDoc: { _id: "impersonated-user" },
          actingAdminDoc: { _id: "real-admin", email: "admin@x.com" },
        },
        res
      );

      expect(recordAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ adminDoc: { _id: "real-admin", email: "admin@x.com" } })
      );
    });
  });

  describe("getAnnouncement (public)", () => {
    it("returns only text and active — nothing else from the settings document", async () => {
      getSettings.mockResolvedValueOnce({
        maintenanceMode: true,
        recruiterRegistrationEnabled: false,
        announcement: { text: "Scheduled downtime Friday", active: true },
      });

      await getAnnouncement({}, res);

      expect(res.json).toHaveBeenCalledWith({ text: "Scheduled downtime Friday", active: true });
    });

    it("defaults to inactive/empty when no announcement sub-document exists yet", async () => {
      getSettings.mockResolvedValueOnce({ maintenanceMode: false });

      await getAnnouncement({}, res);

      expect(res.json).toHaveBeenCalledWith({ text: "", active: false });
    });

    it("fails closed to 'no announcement' (not a 500) if the settings read throws", async () => {
      getSettings.mockRejectedValueOnce(new Error("db down"));

      await getAnnouncement({}, res);

      expect(res.status).not.toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ text: "", active: false });
    });
  });
});