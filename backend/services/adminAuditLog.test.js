import { describe, expect, it, vi } from "vitest";

vi.mock("../models/AdminAuditLog.js", () => ({
    default: { create: vi.fn() },
}));
vi.mock("../config/logger.js", () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import AdminAuditLog from "../models/AdminAuditLog.js";
import { logger } from "../config/logger.js";
import { recordAdminAction } from "./adminAuditLog.js";

// Flushes the microtask queue so the fire-and-forget .catch() handler in
// recordAdminAction has had a chance to run before assertions.
function flushMicrotasks() {
    return new Promise((resolve) => setImmediate(resolve));
}

describe("recordAdminAction", () => {
    it("writes an AdminAuditLog entry with the expected shape", () => {
        AdminAuditLog.create.mockResolvedValueOnce({});

        recordAdminAction({
            adminDoc: { _id: "admin1", email: "admin@codeclub.dev" },
            action: "recruiter.approve",
            targetType: "User",
            targetId: "u1",
            details: { previousRole: "student" },
        });

        expect(AdminAuditLog.create).toHaveBeenCalledWith({
            adminId: "admin1",
            adminEmail: "admin@codeclub.dev",
            action: "recruiter.approve",
            targetType: "User",
            targetId: "u1",
            details: { previousRole: "student" },
        });
    });

    it("defaults targetType/targetId/details to null when omitted", () => {
        AdminAuditLog.create.mockResolvedValueOnce({});

        recordAdminAction({
            adminDoc: { _id: "admin1", email: "admin@codeclub.dev" },
            action: "settings.update",
        });

        expect(AdminAuditLog.create).toHaveBeenCalledWith({
            adminId: "admin1",
            adminEmail: "admin@codeclub.dev",
            action: "settings.update",
            targetType: null,
            targetId: null,
            details: null,
        });
    });

    it("does not throw when AdminAuditLog.create rejects — logs the failure instead", async () => {
        const dbError = new Error("db down");
        AdminAuditLog.create.mockRejectedValueOnce(dbError);

        expect(() =>
            recordAdminAction({
                adminDoc: { _id: "admin1", email: "admin@codeclub.dev" },
                action: "recruiter.approve",
            })
        ).not.toThrow();

        await flushMicrotasks();

        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ err: dbError, action: "recruiter.approve" }),
            "[AdminAuditLog] write failed"
        );
    });
});