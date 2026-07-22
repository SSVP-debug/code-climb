import { Router } from "express";
import crypto from "crypto";
import { createRequire } from "module";
import { MONETIZATION_ENABLED, PRICING } from "../config/featureFlags.js";
import { saveSubscription } from "../services/userSubscriptionService.js";
import { logger } from "../config/logger.js";
import { requireAuth } from "../middleware/auth.js";

const require = createRequire(import.meta.url);
const router = Router();

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  try {
    const Razorpay = require("razorpay");
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch {
    return null; // razorpay package not installed yet — graceful no-op
  }
}

function monetizationGate(req, res) {
  if (!MONETIZATION_ENABLED) {
    res.status(200).json({
      enabled: false,
      message: "Monetization is not live yet. Code Club is currently free for everyone.",
    });
    return true; // signal: response already sent
  }
  return false;
}

// ── GET /api/billing/plans (public) ─────────────────────────────────────────
router.get("/plans", (req, res) => {
  if (monetizationGate(req, res)) return;

  const plans = Object.entries(PRICING).map(([key, p]) => ({
    id: key,
    label: p.label,
    amountRupees: p.amountPaise / 100,
    interval: p.interval,
  }));

  return res.json({ enabled: true, plans });
});

// ── GET /api/billing/subscription (auth) ────────────────────────────────────
router.get("/subscription", requireAuth, async (req, res) => {
  if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

  const sub = req.userDoc.subscription || { plan: "free", status: "none" };

  return res.json({
    enabled: MONETIZATION_ENABLED,
    plan: sub.plan,
    status: sub.status,
    expiresAt: sub.expiresAt,
    isPremium: isUserPremium(req.userDoc),
  });
});

// ── POST /api/billing/create-order (auth) ───────────────────────────────────
router.post("/create-order", requireAuth, async (req, res) => {
  if (monetizationGate(req, res)) return;

  try {
    const { planId } = req.body;
    const plan = PRICING[planId];

    if (!plan) {
      return res.status(400).json({ error: "Invalid plan ID." });
    }

    // Founding Lifetime: enforce 500-redemption cap
    if (planId === "founding_lifetime" && plan.maxRedemptions) {
      const User = (await import("../models/User.js")).default;
      const redeemed = await User.countDocuments({ "subscription.plan": "founding_lifetime" });
      if (redeemed >= plan.maxRedemptions) {
        return res.status(410).json({ error: "Founding Lifetime offer is sold out. Try Lifetime instead." });
      }
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({
        error: "Payment provider not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const order = await razorpay.orders.create({
      amount: plan.amountPaise,
      currency: "INR",
      receipt: `cc_${req.userDoc._id}_${Date.now()}`,
      notes: { userId: req.userDoc._id.toString(), planId },
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planId,
    });

  } catch (err) {
    logger.error({ err }, "[Billing] create-order error");
    return res.status(500).json({ error: "Failed to create order." });
  }
});

// ── POST /api/billing/verify (auth) ─────────────────────────────────────────
// Called from frontend after Razorpay checkout completes — verifies the
// payment signature before activating the plan. This is the source of truth;
// never trust the frontend's "payment succeeded" claim without this check.
router.post("/verify", requireAuth, async (req, res) => {
  if (monetizationGate(req, res)) return;

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return res.status(400).json({ error: "Missing payment verification fields." });
    }

    const plan = PRICING[planId];
    if (!plan) return res.status(400).json({ error: "Invalid plan ID." });

    // ── Signature verification — this is what actually proves payment happened ──
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed. Signature mismatch." });
    }

    // ── Activate plan on user ───────────────────────────────────────────────
    const now = new Date();
    let expiresAt = plan.durationDays
      ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
      : null;

    const rewardDays = req.userDoc.referralRewardDays || 0;

    if (expiresAt && rewardDays > 0) {
      expiresAt = new Date(
        expiresAt.getTime() + rewardDays * 24 * 60 * 60 * 1000
      );
    }

    const nextSubscription = {
      ...req.userDoc.subscription,
      plan: planId,
      status: "active",
      startedAt: now,
      expiresAt,
    };

    // Dual-writes to User (still authoritative — see userSubscriptionService)
    // and UserSubscription (docs/migrations/user-model-split.md, Phase 1).
    // referralRewardDays rides along in the same write when it needs
    // resetting, instead of a second round trip.
    const patch = { subscription: nextSubscription };
    if (rewardDays > 0) patch.referralRewardDays = 0;
    await saveSubscription(req.userDoc._id, patch);

    req.userDoc.subscription = nextSubscription;
    if (rewardDays > 0) req.userDoc.referralRewardDays = 0;

    // ── Referral reward: if this user was referred, grant referrer bonus ────
    // This increments a *different* user's counter via an atomic $inc, which
    // doesn't fit saveSubscription's $set-only patch shape — left as a raw
    // User update for now. This means UserSubscription can drift for
    // referrers until the next scripts/backfillUserSubscription.js
    // reconciliation pass; acceptable during Phase 1 since User remains the
    // authoritative read and nothing reads UserSubscription yet.
    if (req.userDoc.referredBy) {
      const User = (await import("../models/User.js")).default;
      const { REFERRAL_REWARD_DAYS } = await import("../config/featureFlags.js");
      await User.updateOne(
        { referralCode: req.userDoc.referredBy },
        { $inc: { referralRewardDays: REFERRAL_REWARD_DAYS } }
      );
    }

    return res.json({ success: true, plan: planId, expiresAt });

  } catch (err) {
    logger.error({ err }, "[Billing] verify error");
    return res.status(500).json({ error: "Payment verification failed." });
  }
});

// ── POST /api/billing/cancel (auth) ─────────────────────────────────────────
router.post("/cancel", requireAuth, async (req, res) => {
  if (monetizationGate(req, res)) return;

  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const nextSubscription = {
      ...req.userDoc.subscription,
      status: "cancelled",
      cancelledAt: new Date(),
    };
    // Note: we don't immediately revoke access — subscription.expiresAt still
    // governs access. Cancelling just stops renewal.
    await saveSubscription(req.userDoc._id, { subscription: nextSubscription });
    req.userDoc.subscription = nextSubscription;

    return res.json({ success: true, message: "Subscription cancelled. Access continues until expiry." });
  } catch (err) {
    logger.error({ err }, "[Billing] cancel error");
    return res.status(500).json({ error: "Failed to cancel subscription." });
  }
});

// ── Helper, exported for use in premium gate middleware ─────────────────────
export function isUserPremium(userDoc) {
  if (!MONETIZATION_ENABLED) return true; // everyone is "premium" while monetization is off
  if (!userDoc?.subscription) return false;

  const { plan, status, expiresAt } = userDoc.subscription;
  if (plan === "free" || status !== "active") return false;
  if (expiresAt && new Date(expiresAt) < new Date()) return false; // expired

  return true;
}

export default router;