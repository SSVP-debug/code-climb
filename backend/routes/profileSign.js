import { Router } from "express";
import crypto from "crypto";

const router = Router();

// POST /api/profile/sign — student signs their own profile
router.post("/sign", async (req, res) => {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const secret     = process.env.PROFILE_SIGN_SECRET || "codeclub-verify-secret";
    const solvedCount = req.userDoc.solvedSlugs?.length ?? 0;
    const signedAt   = new Date();
    const payload    = `${req.userDoc._id}:${solvedCount}:${signedAt.toISOString()}`;
    const hash       = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    req.userDoc.profileSignature = { hash, signedAt, solvedCount };
    await req.userDoc.save();

    return res.json({ success: true, signedAt, solvedCount });
  } catch (err) {
    return res.status(500).json({ error: "Failed to sign profile." });
  }
});

export default router;
