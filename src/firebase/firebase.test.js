import { describe, expect, it, vi, afterEach } from "vitest";

// firebase.js throws at MODULE-EVALUATION time (a top-level for-loop, not
// inside a function), so the only way to test both branches is to reset
// the module registry and re-import fresh for each scenario, with
// import.meta.env stubbed differently each time. vi.stubEnv covers
// import.meta.env in Vitest (it patches both process.env and
// import.meta.env under the hood).
//
// firebase/app and firebase/auth are mocked here so this file exercises
// ONLY the env-var guard — not a real Firebase SDK call — matching the
// project's "separate Firebase initialization from Firebase behavior"
// approach (see Navbar.test.jsx / AdminLayout.test.jsx / ProblemLayout.test.jsx,
// which mock the boundary one level up instead, since they don't test
// firebase.js itself at all).
const initializeApp = vi.fn(() => ({ name: "test-app" }));
const getAuth = vi.fn(() => ({ currentUser: null }));
vi.mock("firebase/app", () => ({ initializeApp: (...args) => initializeApp(...args) }));
vi.mock("firebase/auth", () => ({ getAuth: (...args) => getAuth(...args) }));

async function importFresh() {
  vi.resetModules();
  return import("./firebase.js");
}

describe("firebase.js — init-time env-var guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws a clear, specific error when a required env var is missing (e.g. a fresh checkout with no .env yet)", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "");
    vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "example.firebaseapp.com");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "example-project");

    await expect(importFresh()).rejects.toThrow("[Firebase] Missing env var: VITE_FIREBASE_API_KEY");
  });

  it("initializes cleanly once all three required vars are present, and doesn't require the optional ones", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "test-key");
    vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "example.firebaseapp.com");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "example-project");
    vi.stubEnv("VITE_FIREBASE_STORAGE_BUCKET", "");
    vi.stubEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "");
    vi.stubEnv("VITE_FIREBASE_APP_ID", "");

    const mod = await importFresh();

    expect(initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "test-key",
        authDomain: "example.firebaseapp.com",
        projectId: "example-project",
      })
    );
    expect(mod.auth).toBeDefined();
  });

  it("this suite's own test-environment defaults (.env.test) satisfy the guard — proves the fix, not just the guard logic in isolation", async () => {
    // No vi.stubEnv here at all: relies purely on whatever Vite/Vitest
    // already loaded from .env.test for this test run, same as any other
    // test file that transitively imports firebase.js without its own
    // per-file mock would experience.
    await expect(importFresh()).resolves.toBeDefined();
  });
});