import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getProgress,
  putProgress,
} from "../controllers/progressController.js";

const router = Router();

router.get("/", requireAuth, getProgress);
router.put("/", requireAuth, putProgress);

export default router;
