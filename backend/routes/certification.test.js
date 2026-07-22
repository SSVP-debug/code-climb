import { describe, expect, it } from "vitest";
import certificationRouter from "./certification.js";
import { requireAuth } from "../middleware/auth.js";

// This suite exists to catch exactly the bug fixed in plans/01: a public
// route silently trapped behind a router-level blanket `requireAuth`. It
// doesn't test business logic (that's covered separately) — it tests
// *reachability*: which routes require auth and which don't, checked by
// inspecting the real Express router's middleware stack rather than
// re-implementing the routing logic in a mock.

function middlewareNamesFor(router, path) {
  const layer = router.stack.find((l) => l.route && l.route.path === path);
  if (!layer) throw new Error(`No route registered for path ${path}`);
  return layer.route.stack.map((h) => h.handle);
}

function requiresAuth(router, path) {
  return middlewareNamesFor(router, path).includes(requireAuth);
}

describe("certification.js route auth wiring", () => {
  it("GET /verify/:code has no requireAuth guard — must stay reachable by logged-out visitors", () => {
    expect(requiresAuth(certificationRouter, "/verify/:code")).toBe(false);
  });

  it("GET /tracks requires auth (reads req.userDoc for per-user progress)", () => {
    expect(requiresAuth(certificationRouter, "/tracks")).toBe(true);
  });

  it("POST /claim/:trackId requires auth (writes req.userDoc)", () => {
    expect(requiresAuth(certificationRouter, "/claim/:trackId")).toBe(true);
  });

  it("GET /:code/pdf requires auth (authenticated download, unlike /verify/:code)", () => {
    expect(requiresAuth(certificationRouter, "/:code/pdf")).toBe(true);
  });
});