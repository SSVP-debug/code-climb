import { describe, expect, it } from "vitest";
import recruiterRouter from "./recruiter.js";
import { requireAuth } from "../middleware/auth.js";

// Same purpose as certification.test.js — see that file's header comment.
// This covers the default-exported `router` only; `candidateTestsRouter`
// (also exported from recruiter.js) is out of scope for plans/01 and is
// intentionally not tested here.

function middlewareHandlesFor(router, path) {
  const layer = router.stack.find((l) => l.route && l.route.path === path);
  if (!layer) throw new Error(`No route registered for path ${path}`);
  return layer.route.stack.map((h) => h.handle);
}

function requiresAuth(router, path) {
  return middlewareHandlesFor(router, path).includes(requireAuth);
}

describe("recruiter.js route auth wiring", () => {
  it("GET /verify/:username has no requireAuth guard — must stay reachable by logged-out visitors", () => {
    expect(requiresAuth(recruiterRouter, "/verify/:username")).toBe(false);
  });

  it("POST /register requires auth (reads req.userDoc.email)", () => {
    expect(requiresAuth(recruiterRouter, "/register")).toBe(true);
  });

  it("GET /candidates requires auth ahead of requireRole", () => {
    expect(requiresAuth(recruiterRouter, "/candidates")).toBe(true);
  });

  it("POST /skills-test requires auth ahead of requireRole", () => {
    expect(requiresAuth(recruiterRouter, "/skills-test")).toBe(true);
  });

  it("GET /skills-tests requires auth ahead of requireRole", () => {
    expect(requiresAuth(recruiterRouter, "/skills-tests")).toBe(true);
  });

  it("GET /skills-test/:id requires auth ahead of requireRole", () => {
    expect(requiresAuth(recruiterRouter, "/skills-test/:id")).toBe(true);
  });

  it("requireAuth runs before requireRole on every role-guarded route (order matters — requireRole depends on req.userDoc)", () => {
    for (const path of ["/candidates", "/skills-test", "/skills-tests", "/skills-test/:id"]) {
      const handles = middlewareHandlesFor(recruiterRouter, path);
      const authIndex = handles.indexOf(requireAuth);
      expect(authIndex).toBeGreaterThanOrEqual(0);
      expect(authIndex).toBe(0);
    }
  });
});