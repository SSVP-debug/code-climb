/**
 * Feature Flags — Code Club
 *
 * MONETIZATION_ENABLED controls the entire payment/paywall system.
 * Default: false (off). The product has zero real users yet — pricing,
 * paywalls, and upgrade prompts are fully built but invisible until
 * this flag is flipped to "true" in production env vars.
 *
 * This lets the team ship Phase 6 code now and turn on monetization
 * later with zero additional deploys — just an env var change.
 */
export const MONETIZATION_ENABLED = process.env.MONETIZATION_ENABLED === "true";

/**
 * B2B_ENABLED controls TPO/college admin features.
 * Can be enabled independently of consumer monetization — a college
 * pilot can go live before individual subscriptions do.
 */
export const B2B_ENABLED = process.env.B2B_ENABLED === "true";

/**
 * Pricing — single source of truth, read by both backend (webhook/order
 * creation) and exposed via /api/billing/plans for frontend display.
 * All prices in paise (Razorpay's smallest unit) — 100 paise = ₹1.
 */
export const PRICING = {
  pro_monthly: {
    label: "Pro Monthly",
    amountPaise: 19900,        // ₹199
    interval: "monthly",
    durationDays: 30,
  },
  pro_yearly: {
    label: "Pro Yearly",
    amountPaise: 199900,       // ₹1,999
    interval: "yearly",
    durationDays: 365,
  },
  founding_lifetime: {
    label: "Founding Lifetime",
    amountPaise: 199900,       // ₹1,999 — first 500 users only
    interval: "lifetime",
    durationDays: null,        // never expires
    maxRedemptions: 500,
  },
  lifetime: {
    label: "Lifetime",
    amountPaise: 299900,       // ₹2,999 (post-founding-batch price)
    interval: "lifetime",
    durationDays: null,
  },
};

export const REFERRAL_REWARD_DAYS = 7; // both referrer and referee get 7 days
