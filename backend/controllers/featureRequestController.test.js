import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../services/featureRequests.js", () => ({
  createFeatureRequest: vi.fn(),
  listFeatureRequests: vi.fn(),
  getMyFeatureRequests: vi.fn(),
  toggleVote: vi.fn(),
  editFeatureRequest: vi.fn(),
  withdrawFeatureRequest: vi.fn(),
  getVotedRequestIds: vi.fn(),
}));

import {
  createFeatureRequest,
  listFeatureRequests,
  getMyFeatureRequests,
  toggleVote,
  editFeatureRequest,
  withdrawFeatureRequest,
  getVotedRequestIds,
} from "../services/featureRequests.js";
import {
  submitFeatureRequest,
  listFeatureRequestsPublic,
  getMyFeatureRequestsController,
  voteFeatureRequestController,
  editFeatureRequestController,
  withdrawFeatureRequestController,
} from "./featureRequestController.js";

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
    params: {},
    log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitFeatureRequest", () => {
  it("creates a feature request scoped to the authenticated user and returns 201", async () => {
    createFeatureRequest.mockResolvedValueOnce({ _id: "fr1", status: "open" });
    const req = mockReq({ body: { title: "Dark mode", description: "Add a dark theme." } });
    const res = mockRes();

    await submitFeatureRequest(req, res);

    expect(createFeatureRequest).toHaveBeenCalledWith({
      submittedBy: "user1",
      title: "Dark mode",
      description: "Add a dark theme.",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ featureRequest: { _id: "fr1", status: "open" } });
  });

  it("returns 503 when req.userDoc is null (DB down)", async () => {
    const req = mockReq({ userDoc: null });
    const res = mockRes();

    await submitFeatureRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(createFeatureRequest).not.toHaveBeenCalled();
  });

  it("returns 500 when creation throws", async () => {
    createFeatureRequest.mockRejectedValueOnce(new Error("boom"));
    const req = mockReq({ body: { title: "T", description: "D" } });
    const res = mockRes();

    await submitFeatureRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(req.log.error).toHaveBeenCalled();
  });
});

describe("listFeatureRequestsPublic", () => {
  function entry(id) {
    return { _id: id, toObject: () => ({ _id: id }) };
  }

  it("hydrates hasVoted for each entry from getVotedRequestIds in one call", async () => {
    listFeatureRequests.mockResolvedValueOnce({
      entries: [entry("fr1"), entry("fr2")],
      total: 2,
    });
    getVotedRequestIds.mockResolvedValueOnce(new Set(["fr1"]));
    const req = mockReq({ query: { status: "open", sort: "recent", page: "2", limit: "10" } });
    const res = mockRes();

    await listFeatureRequestsPublic(req, res);

    expect(listFeatureRequests).toHaveBeenCalledWith({
      status: "open",
      sort: "recent",
      page: 2,
      limit: 10,
    });
    expect(getVotedRequestIds).toHaveBeenCalledWith("user1", ["fr1", "fr2"]);
    expect(res.json).toHaveBeenCalledWith({
      featureRequests: [
        { _id: "fr1", hasVoted: true },
        { _id: "fr2", hasVoted: false },
      ],
      page: 2,
      limit: 10,
      total: 2,
    });
  });

  it("caps limit at 100", async () => {
    listFeatureRequests.mockResolvedValueOnce({ entries: [], total: 0 });
    getVotedRequestIds.mockResolvedValueOnce(new Set());
    const req = mockReq({ query: { limit: "500" } });
    const res = mockRes();

    await listFeatureRequestsPublic(req, res);

    expect(listFeatureRequests).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 })
    );
  });

  it("returns 503 when req.userDoc is null (DB down)", async () => {
    const req = mockReq({ userDoc: null });
    const res = mockRes();

    await listFeatureRequestsPublic(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(listFeatureRequests).not.toHaveBeenCalled();
  });
});

describe("getMyFeatureRequestsController", () => {
  it("scopes the read to req.userDoc._id, never a client-supplied submittedBy", async () => {
    getMyFeatureRequests.mockResolvedValueOnce({ entries: [{ _id: "fr1" }], total: 1 });
    // Even if a malicious/careless client sent a submittedBy query param,
    // it must be ignored — this endpoint is always "my own".
    const req = mockReq({ query: { submittedBy: "someoneElse", page: "3", limit: "5" } });
    const res = mockRes();

    await getMyFeatureRequestsController(req, res);

    expect(getMyFeatureRequests).toHaveBeenCalledWith({
      submittedBy: "user1",
      page: 3,
      limit: 5,
    });
    expect(res.json).toHaveBeenCalledWith({
      featureRequests: [{ _id: "fr1" }],
      page: 3,
      limit: 5,
      total: 1,
    });
  });

  it("returns 503 when req.userDoc is null (DB down)", async () => {
    const req = mockReq({ userDoc: null });
    const res = mockRes();

    await getMyFeatureRequestsController(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(getMyFeatureRequests).not.toHaveBeenCalled();
  });
});

describe("voteFeatureRequestController", () => {
  it("delegates to toggleVote with the authenticated user and the :id param", async () => {
    toggleVote.mockResolvedValueOnce({ voted: true });
    const req = mockReq({ params: { id: "fr1" } });
    const res = mockRes();

    await voteFeatureRequestController(req, res);

    expect(toggleVote).toHaveBeenCalledWith({ featureRequestId: "fr1", userId: "user1" });
    expect(res.json).toHaveBeenCalledWith({ voted: true });
  });

  it("returns 503 when req.userDoc is null (DB down)", async () => {
    const req = mockReq({ userDoc: null, params: { id: "fr1" } });
    const res = mockRes();

    await voteFeatureRequestController(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(toggleVote).not.toHaveBeenCalled();
  });
});

describe("editFeatureRequestController", () => {
  it("delegates to editFeatureRequest and returns the result on success", async () => {
    editFeatureRequest.mockResolvedValueOnce({ updated: true });
    const req = mockReq({ params: { id: "fr1" }, body: { title: "New title" } });
    const res = mockRes();

    await editFeatureRequestController(req, res);

    expect(editFeatureRequest).toHaveBeenCalledWith({
      featureRequestId: "fr1",
      requesterId: "user1",
      title: "New title",
      description: undefined,
    });
    expect(res.json).toHaveBeenCalledWith({ updated: true });
  });

  it("returns 409 with the service's reason when not updated", async () => {
    editFeatureRequest.mockResolvedValueOnce({
      updated: false,
      reason: "not_found_not_owner_or_not_open",
    });
    const req = mockReq({ params: { id: "fr1" }, body: { title: "New title" } });
    const res = mockRes();

    await editFeatureRequestController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "not_found_not_owner_or_not_open" })
    );
  });
});

describe("withdrawFeatureRequestController", () => {
  it("delegates to withdrawFeatureRequest and returns the result on success", async () => {
    withdrawFeatureRequest.mockResolvedValueOnce({ withdrawn: true });
    const req = mockReq({ params: { id: "fr1" } });
    const res = mockRes();

    await withdrawFeatureRequestController(req, res);

    expect(withdrawFeatureRequest).toHaveBeenCalledWith({
      featureRequestId: "fr1",
      requesterId: "user1",
    });
    expect(res.json).toHaveBeenCalledWith({ withdrawn: true });
  });

  it("returns 409 with the service's reason when not withdrawn", async () => {
    withdrawFeatureRequest.mockResolvedValueOnce({
      withdrawn: false,
      reason: "not_found_not_owner_or_not_open",
    });
    const req = mockReq({ params: { id: "fr1" } });
    const res = mockRes();

    await withdrawFeatureRequestController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});