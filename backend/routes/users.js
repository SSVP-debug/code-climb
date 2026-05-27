import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMe, updateMe } from "../controllers/userController.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);

export default router;
