/**
 * Referral system — give 7 days premium, get 7 days premium.
 *
 * GET  /api/referral/my-code      — get (or generate) the user's referral code
 * POST /api/referral/apply        — apply a referral code (during signup/onboarding)
 * GET  /api/referral/stats        — see how many people you've referred + days earned
 *
 * Reward logic: when a referred user makes their FIRST purchase (any plan),
 * the referrer gets +7 days added to subscription.expiresAt (handled in
 * billing.js /verify route already — see referredBy logic there).
 *
 * This route handles code generation + application only.
 */
import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import { REFERRAL_REWARD_DAYS } from "../config/featureFlags.js";

const router = Router();

function generateCode(name) {
  const base = (name || "user").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${base || "cc"}${suffix}`;
}

// ── GET /api/referral/my-code ───────────────────────────────────────────────
router.get("/my-code", async (req, res) => {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    if (!req.userDoc.referralCode) {
      let code;
      let attempts = 0;
      do {
        code = generateCode(req.userDoc.displayName);
        attempts++;
      } while (await User.exists({ referralCode: code }) && attempts < 5);

      req.userDoc.referralCode = code;
      await req.userDoc.save();
    }

    const shareUrl = `${process.env.FRONTEND_URL || "https://code-club-one.vercel.app"}/login?ref=${req.userDoc.referralCode}`;

    return res.json({
      code: req.userDoc.referralCode,
      shareUrl,
      rewardDays: REFERRAL_REWARD_DAYS,
    });
  } catch (err) {
    console.error("[Referral] my-code error:", err.message);
    return res.status(500).json({ error: "Failed to get referral code." });
  }
});

// ── POST /api/referral/apply ────────────────────────────────────────────────
// Called once, typically right after first login, if a ?ref= code was present.
router.post("/apply", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "code is required." });

    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    if (req.userDoc.referredBy) {
      return res.status(400).json({ error: "Referral code already applied to this account." });
    }

    if (req.userDoc.referralCode === code) {
      return res.status(400).json({ error: "You can't refer yourself." });
    }

    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) return res.status(404).json({ error: "Invalid referral code." });

    req.userDoc.referredBy = code;
    await req.userDoc.save();

    return res.json({
      success: true,
      message: `Referral applied! You'll both get ${REFERRAL_REWARD_DAYS} bonus days when you upgrade to Pro.`,
    });
  } catch (err) {
    console.error("[Referral] apply error:", err.message);
    return res.status(500).json({ error: "Failed to apply referral code." });
  }
});

// ── GET /api/referral/stats ─────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    if (!req.userDoc?.referralCode) {
      return res.json({ referredCount: 0, rewardDaysEarned: 0 });
    }

    const referredCount = await User.countDocuments({ referredBy: req.userDoc.referralCode });

    return res.json({
      referredCount,
      rewardDaysEarned: req.userDoc.referralRewardDays || 0,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load referral stats." });
  }
});

export default router;
