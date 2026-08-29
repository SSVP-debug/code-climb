import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Contribution.js", () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../services/contribution.js", () => ({
  createContribution: vi.fn(),
}));

import Contribution from "../models/Contribution.js";
import { createContribution } from "../services/contribution.js";
import { submitContribution, getMyContributions } from "./contributionController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    userDoc: { _id: "user1" },
    body: {},
    query: {},
    log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
    ...overrides,
  };
}

describe("contributionController.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitContribution", () => {
    it("creates a contribution scoped to the authenticated user and returns 201", async () => {
      createContribution.mockResolvedValueOnce({ _id: "c1", status: "pending" });
      const req = mockReq({ body: { kind: "new_problem", payload: { title: "X" } } });
      const res = mockRes();

      await submitContribution(req, res);

      expect(createContribution).toHaveBeenCalledWith({
        contributorId: "user1",
        kind: "new_problem",
        payload: { title: "X" },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ contribution: { _id: "c1", status: "pending" } });
    });

    it("returns 503 when req.userDoc is null (DB down)", async () => {
      const req = mockReq({ userDoc: null, body: { kind: "new_problem", payload: {} } });
      const res = mockRes();

      await submitContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(createContribution).not.toHaveBeenCalled();
    });

    it("returns 500 when creation throws", async () => {
      createContribution.mockRejectedValueOnce(new Error("boom"));
      const req = mockReq({ body: { kind: "new_problem", payload: {} } });
      const res = mockRes();

      await submitContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(req.log.error).toHaveBeenCalled();
    });
  });

  describe("getMyContributions", () => {
    function mockQueryChain(result) {
      const chain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(result),
      };
      Contribution.find.mockReturnValueOnce(chain);
      return chain;
    }

    it("scopes the read to req.userDoc._id, never a client-supplied contributorId", async () => {
      mockQueryChain([{ _id: "c1" }]);
      Contribution.countDocuments.mockResolvedValueOnce(1);
      // Even if a malicious/careless client sent a contributorId query
      // param, it must be ignored — this endpoint is always "my own".
      const req = mockReq({ query: { contributorId: "someoneElse", page: "2", limit: "10" } });
      const res = mockRes();

      await getMyContributions(req, res);

      expect(Contribution.find).toHaveBeenCalledWith({ contributorId: "user1" });
      expect(Contribution.countDocuments).toHaveBeenCalledWith({ contributorId: "user1" });
      expect(res.json).toHaveBeenCalledWith({
        contributions: [{ _id: "c1" }],
        page: 2,
        limit: 10,
        total: 1,
      });
    });

    it("defaults page/limit when not provided, and caps limit at 100", async () => {
      const chain = mockQueryChain([]);
      Contribution.countDocuments.mockResolvedValueOnce(0);
      const req = mockReq({ query: { limit: "500" } });
      const res = mockRes();

      await getMyContributions(req, res);

      expect(chain.skip).toHaveBeenCalledWith(0);
      expect(chain.limit).toHaveBeenCalledWith(100);
    });

    it("returns 503 when req.userDoc is null (DB down)", async () => {
      const req = mockReq({ userDoc: null });
      const res = mockRes();

      await getMyContributions(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(Contribution.find).not.toHaveBeenCalled();
    });
  });
});