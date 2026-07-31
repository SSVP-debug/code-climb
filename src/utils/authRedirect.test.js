import { describe, expect, it } from "vitest";
import { buildLoginRedirect, isSafeNextPath, getSafeNextPath } from "./authRedirect";

describe("isSafeNextPath", () => {
  it("accepts a normal relative path", () => {
    expect(isSafeNextPath("/club/public-contests/abc123")).toBe(true);
  });

  it("accepts a relative path with a query string", () => {
    expect(isSafeNextPath("/problems/two-sum?contest=abc123")).toBe(true);
  });

  it("rejects an absolute URL (open-redirect guard)", () => {
    expect(isSafeNextPath("https://evil.example/phish")).toBe(false);
  });

  it("rejects a protocol-relative URL (open-redirect guard)", () => {
    expect(isSafeNextPath("//evil.example/phish")).toBe(false);
  });

  it("rejects a non-string value", () => {
    expect(isSafeNextPath(null)).toBe(false);
    expect(isSafeNextPath(undefined)).toBe(false);
  });
});

describe("buildLoginRedirect", () => {
  it("encodes a safe path as ?next=", () => {
    expect(buildLoginRedirect("/club/public-contests/abc123")).toBe(
      "/login?next=%2Fclub%2Fpublic-contests%2Fabc123"
    );
  });

  it("preserves the destination's own query string inside next=", () => {
    const url = buildLoginRedirect("/problems/two-sum?contest=abc123");
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("next")).toBe("/problems/two-sum?contest=abc123");
  });

  it("omits next= entirely for an unsafe path", () => {
    expect(buildLoginRedirect("https://evil.example")).toBe("/login");
  });

  it("merges extra params (e.g. session-expired reason) alongside next=", () => {
    const url = buildLoginRedirect("/dashboard", { reason: "session_expired" });
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("reason")).toBe("session_expired");
    expect(params.get("next")).toBe("/dashboard");
  });

  it("returns bare /login when there's nothing to preserve", () => {
    expect(buildLoginRedirect(undefined)).toBe("/login");
  });
});

describe("getSafeNextPath", () => {
  it("returns the decoded path when present and safe", () => {
    const params = new URLSearchParams({ next: "/club/public-contests/abc123" });
    expect(getSafeNextPath(params)).toBe("/club/public-contests/abc123");
  });

  it("returns null when next= is absent", () => {
    expect(getSafeNextPath(new URLSearchParams())).toBeNull();
  });

  it("returns null when next= is an open-redirect attempt", () => {
    const params = new URLSearchParams({ next: "https://evil.example" });
    expect(getSafeNextPath(params)).toBeNull();
  });

  it("round-trips through buildLoginRedirect + URLSearchParams unchanged", () => {
    const original = "/problems/two-sum?contest=abc123&lang=python";
    const url = buildLoginRedirect(original);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(getSafeNextPath(params)).toBe(original);
  });
});
