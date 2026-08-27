import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../services/rewardLedger.js", () => ({
  getBalance: vi.fn(),
  getLedger: vi.fn(),
}));

import { getBalance, getLedger } from "../services/rewardLedger.js";
import { getMyBalance, getMyLedger, getUserLedgerAdmin } from "./rewardController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    userDoc: { _id: "user1" },
    query: {},
    log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
    ...overrides,
  };
}

describe("rewardController.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyBalance", () => {
    it("returns the balance for the authenticated user", async () => {
      getBalance.mockResolvedValueOnce(1850);
      const req = mockReq();
      const res = mockRes();

      await getMyBalance(req, res);

      expect(getBalance).toHaveBeenCalledWith("user1");
      expect(res.json).toHaveBeenCalledWith({ balance: 1850 });
    });

    it("returns 503 when req.userDoc is null (DB down)", async () => {
      const req = mockReq({ userDoc: null });
      const res = mockRes();

      await getMyBalance(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(getBalance).not.toHaveBeenCalled();
    });

    it("returns 500 when getBalance throws", async () => {
      getBalance.mockRejectedValueOnce(new Error("boom"));
      const req = mockReq();
      const res = mockRes();

      await getMyBalance(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getMyLedger", () => {
    it("scopes the ledger read to req.userDoc._id, never a client-supplied userId", async () => {
      getLedger.mockResolvedValueOnce({ entries: [], total: 0, page: 1, limit: 20 });
      // Even if a malicious/careless client sent a userId query param, it
      // must be ignored — this endpoint is always "my own ledger".
      const req = mockReq({ query: { userId: "someoneElse", page: "2", limit: "10" } });
      const res = mockRes();

      await getMyLedger(req, res);

      expect(getLedger).toHaveBeenCalledWith("user1", { page: 2, limit: 10 });
    });

    it("defaults page/limit when not provided", async () => {
      getLedger.mockResolvedValueOnce({ entries: [], total: 0, page: 1, limit: 20 });
      const req = mockReq();
      const res = mockRes();

      await getMyLedger(req, res);

      expect(getLedger).toHaveBeenCalledWith("user1", { page: 1, limit: 20 });
    });

    it("returns 503 when req.userDoc is null (DB down)", async () => {
      const req = mockReq({ userDoc: null });
      const res = mockRes();

      await getMyLedger(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(getLedger).not.toHaveBeenCalled();
    });
  });

  describe("getUserLedgerAdmin", () => {
    it("requires a userId query param", async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      await getUserLedgerAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(getLedger).not.toHaveBeenCalled();
    });

    it("returns the target user's ledger and balance", async () => {
      getLedger.mockResolvedValueOnce({ entries: [{ _id: "e1" }], total: 1, page: 1, limit: 20 });
      getBalance.mockResolvedValueOnce(500);
      const req = mockReq({ query: { userId: "targetUser" } });
      const res = mockRes();

      await getUserLedgerAdmin(req, res);

      expect(getLedger).toHaveBeenCalledWith("targetUser", { page: 1, limit: 20 });
      expect(getBalance).toHaveBeenCalledWith("targetUser");
      expect(res.json).toHaveBeenCalledWith({
        entries: [{ _id: "e1" }],
        total: 1,
        page: 1,
        limit: 20,
        balance: 500,
      });
    });
  });
});
