import { Router } from "express";
import { MONETIZATION_ENABLED } from "../config/featureFlags.js";
import { PREMIUM_FEATURES } from "../middleware/premiumGate.js";

const router = Router();

router.get("/", (req, res) => {
  return res.json({
    enabled: MONETIZATION_ENABLED,
    features: Object.values(PREMIUM_FEATURES),
  });
});

export default router;
