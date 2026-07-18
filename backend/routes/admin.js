import { Router } from "express";
import { requireAdmin } from "../middleware/roleGuard.js";
import {
  getPendingQueue,
  approveRecruiter,
  rejectRecruiter,
  approveTpo,
  rejectTpo,
  listUsers,
  startImpersonation,
  stopImpersonation,
} from "../controllers/adminController.js";

const router = Router();

// ── Verification queue (Phase B) ────────────────────────────────────────────
router.get("/pending", requireAdmin, getPendingQueue);
router.post("/recruiters/:id/approve", requireAdmin, approveRecruiter);
router.post("/recruiters/:id/reject", requireAdmin, rejectRecruiter);
router.post("/tpo/:collegeId/approve", requireAdmin, approveTpo);
router.post("/tpo/:collegeId/reject", requireAdmin, rejectTpo);

// ── Impersonation — "Login As" ──────────────────────────────────────────────
router.get("/users", requireAdmin, listUsers);
router.post("/impersonate/:userId", requireAdmin, startImpersonation);
router.post("/impersonate/stop", requireAdmin, stopImpersonation);

export default router;
