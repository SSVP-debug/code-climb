import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createSubmission,
  listSubmissions,
} from "../controllers/submissionController.js";

const router = Router();

router.get("/", requireAuth, listSubmissions);
router.post("/", requireAuth, createSubmission);

export default router;
