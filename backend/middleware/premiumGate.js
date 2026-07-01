/**
 * Premium Gate Middleware
 *
 * Enforces server-side that premium-only features are actually paywalled.
 * Critical: never trust client-side checks alone for paywalls — a user can
 * always bypass frontend JS. This middleware is the real gate.
 *
 * Usage:
 *   import { requirePremium } from "../middleware/premiumGate.js";
 *   router.post("/", requireAuth, requirePremium, handler);
 *
 * Behavior:
 *   - While MONETIZATION_ENABLED=false: always allows through (everyone premium)
 *   - While true: checks req.userDoc.subscription via isUserPremium()
 *
 * PREMIUM_FEATURES documents exactly what's gated — single source of truth
 * referenced by both backend enforcement and frontend UI (via /api/premium/features).
 */
import { MONETIZATION_ENABLED } from "../config/featureFlags.js";
import { isUserPremium } from "../routes/billing.js";

export const PREMIUM_FEATURES = {
  UNLIMITED_AI_HINTS: {
    key: "unlimited_ai_hints",
    label: "Unlimited AI Hints",
    freeLimitPerDay: 3,     // free users get 3 hints/day, premium unlimited
  },
  ALL_THEMES: {
    key: "all_themes",
    label: "All Themes Unlocked",
    description: "Skip the XP grind — unlock every theme instantly.",
  },
  EDITORIAL_ACCESS: {
    key: "editorial_access",
    label: "Editorial Access Without Solving",
    description: "Free users must solve a problem first to see its editorial. Premium users can read editorials anytime.",
  },
  INTERVIEW_MODE: {
    key: "interview_mode",
    label: "Timed Interview Mode + AI Mock Interviewer",
    description: "45-minute timed mode with Claude asking follow-up questions.",
  },
  PROFILE_PDF_UNLIMITED: {
    key: "profile_pdf",
    label: "Unlimited Profile PDF Downloads",
    freeLimitPerMonth: 1,
  },
};

/**
 * Middleware: blocks the route unless the user is premium.
 * Returns 402 Payment Required with upgrade info if not.
 */
export function requirePremium(req, res, next) {
  if (!MONETIZATION_ENABLED) return next(); // monetization off — everyone allowed

  if (isUserPremium(req.userDoc)) return next();

  return res.status(402).json({
    error: "This feature requires Code Club Pro.",
    upgradeUrl: "/pricing",
    currentPlan: req.userDoc?.subscription?.plan || "free",
  });
}

/**
 * Soft gate: allows the request through but attaches `req.isPremium` boolean.
 * Used for features with a free-tier limit (e.g. 3 hints/day) rather than
 * a hard block — the route handler decides what to do with the limit.
 */
export function attachPremiumStatus(req, res, next) {
  req.isPremium = !MONETIZATION_ENABLED || isUserPremium(req.userDoc);
  next();
}
