import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMe, updateMe, pinProblem, unpinProblem } from "../controllers/userController.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);
router.post("/me/pinned-problems", requireAuth, pinProblem);
router.delete("/me/pinned-problems/:slug", requireAuth, unpinProblem);

export default router;