/**
 * Billing routes — Razorpay integration.
 *
 * GET  /api/billing/plans            — public, returns pricing (only if MONETIZATION_ENABLED)
 * POST /api/billing/create-order     — auth required, creates a Razorpay order
 * POST /api/billing/verify           — auth required, verifies payment signature, activates plan
 * POST /api/billing/webhook          — Razorpay webhook (no auth — verified via signature)
 * GET  /api/billing/subscription     — auth required, returns current user's plan status
 * POST /api/billing/cancel           — auth required, cancels recurring subscription
 *
 * All routes are safe to call even when MONETIZATION_ENABLED=false — they return
 * a clear "monetization not yet live" response instead of erroring.
 *
 * Razorpay SDK is lazy-imported so the app doesn't crash if RAZORPAY keys
 * are missing in dev/pre-launch environments.
 */
import { Router } from "express";
import crypto from "crypto";
import { createRequire } from "module";
import { MONETIZATION_ENABLED, PRICING } from "../config/featureFlags.js";

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
router.get("/subscription", async (req, res) => {
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
router.post("/create-order", async (req, res) => {
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
    console.error("[Billing] create-order error:", err.message);
    return res.status(500).json({ error: "Failed to create order." });
  }
});

// ── POST /api/billing/verify (auth) ─────────────────────────────────────────
// Called from frontend after Razorpay checkout completes — verifies the
// payment signature before activating the plan. This is the source of truth;
// never trust the frontend's "payment succeeded" claim without this check.
router.post("/verify", async (req, res) => {
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

    req.userDoc.subscription = {
      ...req.userDoc.subscription,
      plan: planId,
      status: "active",
      startedAt: now,
      expiresAt,
    };
    await req.userDoc.save();

    if (rewardDays > 0) {
      req.userDoc.referralRewardDays = 0;
      await req.userDoc.save();
    }

    // ── Referral reward: if this user was referred, grant referrer bonus ────
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
    console.error("[Billing] verify error:", err.message);
    return res.status(500).json({ error: "Payment verification failed." });
  }
});

// ── POST /api/billing/cancel (auth) ─────────────────────────────────────────
router.post("/cancel", async (req, res) => {
  if (monetizationGate(req, res)) return;

  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    req.userDoc.subscription.status = "cancelled";
    req.userDoc.subscription.cancelledAt = new Date();
    // Note: we don't immediately revoke access — subscription.expiresAt still
    // governs access. Cancelling just stops renewal.
    await req.userDoc.save();

    return res.json({ success: true, message: "Subscription cancelled. Access continues until expiry." });
  } catch (err) {
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
