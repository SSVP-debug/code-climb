import { describe, expect, it, vi, beforeEach } from "vitest";

const signOut = vi.fn().mockResolvedValue(undefined);
vi.mock("firebase/auth", () => ({
  signOut: (...args) => signOut(...args),
}));

const getIdToken = vi.fn();
// A mutable ref so individual tests can simulate "logged out" by setting
// this to null, without having to redefine the mocked module's getter.
let currentUserRef = { getIdToken };
vi.mock("../firebase/firebase", () => ({
  auth: {
    get currentUser() {
      return currentUserRef;
    },
  },
}));

import { apiFetch } from "./api";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUserRef = { getIdToken };
    global.fetch = vi.fn();

    // jsdom doesn't implement real navigation — stub location.href so the
    // 401-forces-sign-out path doesn't throw "Not implemented".
    delete window.location;
    window.location = { href: "" };
  });

  it("throws immediately if there's no current user", async () => {
    currentUserRef = null;

    await expect(apiFetch("/api/x")).rejects.toThrow("not logged in");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uses the cached token (getIdToken(false)) and does not force-refresh on a normal call", async () => {
    getIdToken.mockResolvedValueOnce("cached-token");
    global.fetch.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await apiFetch("/api/things");

    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(getIdToken).toHaveBeenCalledWith(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer cached-token"
    );
    expect(result).toEqual({ ok: true });
  });

  it("retries once with a forced refresh if the cached token gets a 401, then succeeds", async () => {
    getIdToken
      .mockResolvedValueOnce("stale-token")
      .mockResolvedValueOnce("fresh-token");
    global.fetch
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await apiFetch("/api/things");

    expect(getIdToken).toHaveBeenNthCalledWith(1, false);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer fresh-token"
    );
    expect(result).toEqual({ ok: true });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out and redirects only if the 401 persists after a forced refresh", async () => {
    getIdToken
      .mockResolvedValueOnce("stale-token")
      .mockResolvedValueOnce("still-rejected-token");
    global.fetch
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: "still bad" }, 401));

    await expect(apiFetch("/api/things")).rejects.toThrow("Session expired");

    expect(signOut).toHaveBeenCalledOnce();
    expect(window.location.href).toBe("/login?reason=session_expired");
  });

  it("does not sign out on other error statuses (e.g. 500) — no retry, just surfaces the error", async () => {
    getIdToken.mockResolvedValueOnce("cached-token");
    global.fetch.mockResolvedValueOnce(jsonResponse({ error: "boom" }, 500));

    await expect(apiFetch("/api/things")).rejects.toThrow("boom");

    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("returns null for a 204 response", async () => {
    getIdToken.mockResolvedValueOnce("cached-token");
    global.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await apiFetch("/api/things", { method: "DELETE" });
    expect(result).toBeNull();
  });
});
