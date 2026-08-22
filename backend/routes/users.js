import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMe,
  updateMe,
  pinProblem,
  unpinProblem,
  saveProblem,
  unsaveProblem,
  switchActiveRole,
} from "../controllers/userController.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);
router.post("/me/pinned-problems", requireAuth, pinProblem);
router.delete("/me/pinned-problems/:slug", requireAuth, unpinProblem);
router.post("/me/saved-problems", requireAuth, saveProblem);
router.delete("/me/saved-problems/:slug", requireAuth, unsaveProblem);
router.post("/me/switch-role", requireAuth, switchActiveRole);

export default router;