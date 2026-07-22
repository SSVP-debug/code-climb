import { describe, expect, it } from "vitest";
import billingRouter from "./billing.js";
import { requireAuth } from "../middleware/auth.js";

// Same purpose as certification.test.js — see that file's header comment.
// /plans is the one route in this file meant to be public (a pricing page
// a prospective, not-yet-signed-up user should be able to see); every other
// route here handles a real payment/subscription action and must stay
// behind auth.

function middlewareHandlesFor(router, path) {
  const layer = router.stack.find((l) => l.route && l.route.path === path);
  if (!layer) throw new Error(`No route registered for path ${path}`);
  return layer.route.stack.map((h) => h.handle);
}

function requiresAuth(router, path) {
  return middlewareHandlesFor(router, path).includes(requireAuth);
}

describe("billing.js route auth wiring", () => {
  it("GET /plans has no requireAuth guard — a pricing page must be visible to logged-out visitors", () => {
    expect(requiresAuth(billingRouter, "/plans")).toBe(false);
  });

  it("GET /subscription requires auth — regression guard against accidentally leaving this open", () => {
    expect(requiresAuth(billingRouter, "/subscription")).toBe(true);
  });

  it("POST /create-order requires auth", () => {
    expect(requiresAuth(billingRouter, "/create-order")).toBe(true);
  });

  it("POST /verify requires auth", () => {
    expect(requiresAuth(billingRouter, "/verify")).toBe(true);
  });

  it("POST /cancel requires auth", () => {
    expect(requiresAuth(billingRouter, "/cancel")).toBe(true);
  });
});