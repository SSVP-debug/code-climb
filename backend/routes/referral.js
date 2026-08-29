import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import ReferralQualification from "../models/ReferralQualification.js";
import { REFERRAL_REWARD_DAYS } from "../config/featureFlags.js";
import { SITE_URL } from "../config/site.js";
import { saveSubscription, saveSubscriptionIfMatch } from "../services/userSubscriptionService.js";
import { createReferralAssociationQualification } from "../services/referralQualification.js";

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

    // ── Atomic conditional association (race-condition fix) ────────────────
    // Replaces the old check-then-act pair (the `if (req.userDoc.referredBy)`
    // check above is now just a fast-path/nicer-error pre-check, not the
    // actual guarantee). Two concurrent /apply requests could previously
    // both read referredBy as null before either write landed — this
    // closes that by baking the precondition into the update's filter, so
    // only one concurrent call can ever succeed. See
    // services/userSubscriptionService.js's saveSubscriptionIfMatch() doc
    // comment for the full reasoning. No transaction needed.
    const updatedUser = await saveSubscriptionIfMatch(
      req.userDoc._id,
      { referredBy: null },
      { referredBy: code }
    );
    if (!updatedUser) {
      // Lost the race (or the pre-check above was stale) — same response
      // as the existing "already applied" case.
      return res.status(400).json({ error: "Referral code already applied to this account." });
    }
    req.userDoc.referredBy = code;

    // ── Referral Qualification tracking (Plan 2, additive) ────────────────
    // Independent of the day-bonus reward above — this is the new,
    // engagement-gated track that eventually feeds the token RewardLedger
    // once the referred user's first Accepted PRACTICE submission fires
    // (see services/referralQualification.js, called from
    // controllers/judgeController.js). Best-effort: a failure here must
    // not undo the referredBy association that already succeeded above.
    // Also determines eligibility up front (timing rule — see that
    // service's module comment): if this user already solved a practice
    // problem before applying, the row is created already marked
    // ineligible rather than left in a state that can never actually
    // qualify. referredUserId's unique index is the real guard against a
    // duplicate row (e.g. a concurrent double /apply); a race losing that
    // insert is expected and safely ignored, not an error.
    try {
      await createReferralAssociationQualification({
        referrerId: referrer._id,
        referredUserId: req.userDoc._id,
        referralCodeUsed: code,
      });
    } catch (err) {
      if (err?.code !== 11000) {
        req.log.error({ err }, "[Referral] Failed to create ReferralQualification record");
      }
    }

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
      return res.json({ referredCount: 0, rewardDaysEarned: 0, qualifiedCount: 0 });
    }

    const [referredCount, qualifiedCount] = await Promise.all([
      User.countDocuments({ referredBy: req.userDoc.referralCode }),
      ReferralQualification.countDocuments({
        referrerId: req.userDoc._id,
        status: "qualified",
      }),
    ]);

    return res.json({
      referredCount,
      rewardDaysEarned: req.userDoc.referralRewardDays || 0,
      qualifiedCount,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load referral stats." });
  }
});

export default router;