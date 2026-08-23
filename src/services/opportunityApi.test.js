import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "./api";
import {
  fetchOpportunities,
  fetchOpportunity,
  trackOpportunityView,
  trackOpportunityApplyClick,
  createOpportunityAdmin,
  publishOpportunityAdmin,
  rejectOpportunityAdmin,
  extractOpportunitiesAdmin,
  importSelectedOpportunitiesAdmin,
} from "./opportunityApi";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("opportunityApi.js — public functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("fetchOpportunities hits the public (unauthenticated) endpoint, not /api/admin", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ opportunities: [] }));

    await fetchOpportunities();

    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain("/api/opportunities");
    expect(url).not.toContain("/api/admin");
  });

  it("fetchOpportunity returns null on 404 rather than throwing", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ error: "not found" }, 404));

    const result = await fetchOpportunity("999");

    expect(result).toBeNull();
  });

  it("trackOpportunityView POSTs to the view-tracking endpoint for the given ccId", () => {
    global.fetch.mockResolvedValue(jsonResponse({}));

    trackOpportunityView(27);

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/opportunities/27/view");
    expect(options.method).toBe("POST");
  });

  it("trackOpportunityApplyClick sends the source in the request body", () => {
    global.fetch.mockResolvedValue(jsonResponse({}));

    trackOpportunityApplyClick(27, "whatsapp");

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/opportunities/27/apply-click");
    expect(JSON.parse(options.body)).toEqual({ source: "whatsapp" });
  });

  it("view/click tracking never throws even if the network request fails", () => {
    global.fetch.mockRejectedValue(new Error("network down"));

    expect(() => trackOpportunityView(27)).not.toThrow();
    expect(() => trackOpportunityApplyClick(27, "direct")).not.toThrow();
  });
});

describe("opportunityApi.js — admin functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createOpportunityAdmin goes through apiFetch (authenticated) against the admin route", async () => {
    apiFetch.mockResolvedValue({ opportunity: { ccId: "CC/001" } });

    await createOpportunityAdmin({ title: "Test" });

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/admin/opportunities",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("publishOpportunityAdmin calls the publish transition endpoint", async () => {
    apiFetch.mockResolvedValue({ opportunity: {} });

    await publishOpportunityAdmin("opp1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/admin/opportunities/opp1/publish",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("rejectOpportunityAdmin sends the reason in the request body", async () => {
    apiFetch.mockResolvedValue({ opportunity: {} });

    await rejectOpportunityAdmin("opp1", "Deadline already passed");

    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ reason: "Deadline already passed" });
  });

  it("extractOpportunitiesAdmin POSTs the pasted research text to the extract endpoint", async () => {
    apiFetch.mockResolvedValue({ opportunities: [] });

    await extractOpportunitiesAdmin("some research text");

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/admin/opportunities/import/extract",
      expect.objectContaining({ method: "POST" })
    );
    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ researchText: "some research text" });
  });

  it("importSelectedOpportunitiesAdmin POSTs the selected candidates to the bulk-import endpoint", async () => {
    apiFetch.mockResolvedValue({ imported: [], failed: [] });
    const candidates = [{ title: "MLH Fellowship" }];

    await importSelectedOpportunitiesAdmin(candidates);

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/admin/opportunities/import/bulk",
      expect.objectContaining({ method: "POST" })
    );
    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ opportunities: candidates });
  });
});
