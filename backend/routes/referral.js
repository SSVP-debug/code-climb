import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import { REFERRAL_REWARD_DAYS } from "../config/featureFlags.js";
import { SITE_URL } from "../config/site.js";
import { saveSubscription } from "../services/userSubscriptionService.js";

const router = Router();

function generateCode(name) {
  const base = (name || "user").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${base || "cc"}${suffix}`;
}

export async function getOrCreateReferralCode(userDoc) {
  if (!userDoc.referralCode) {
    let code;
    let attempts = 0;
    do {
      code = generateCode(userDoc.displayName);
      attempts++;
    } while (await User.exists({ referralCode: code }) && attempts < 5);

    await saveSubscription(userDoc._id, { referralCode: code });
    userDoc.referralCode = code;
  }
  return userDoc.referralCode;
}

// ── GET /api/referral/my-code ───────────────────────────────────────────────
router.get("/my-code", async (req, res) => {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const code = await getOrCreateReferralCode(req.userDoc);
    const shareUrl = `${SITE_URL}/login?ref=${code}`;

    return res.json({
      code,
      shareUrl,
      rewardDays: REFERRAL_REWARD_DAYS,
    });
  } catch (err) {
    req.log.error({ err }, "[Referral] my-code failed");
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

    await saveSubscription(req.userDoc._id, { referredBy: code });
    req.userDoc.referredBy = code;

    return res.json({
      success: true,
      message: `Referral applied! You'll both get ${REFERRAL_REWARD_DAYS} bonus days when you upgrade to Pro.`,
    });
  } catch (err) {
    req.log.error({ err }, "[Referral] apply failed");
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