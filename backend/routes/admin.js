import { Router } from "express";
import { requireAdmin } from "../middleware/roleGuard.js";
import {
  getPendingQueue,
  approveRecruiter,
  rejectRecruiter,
  approveTpo,
  rejectTpo,
  approveStudentCollege,
  rejectStudentCollege,
  listUsers,
  startImpersonation,
  stopImpersonation,
} from "../controllers/adminController.js";

const router = Router();

// ── Verification queue (Phase B, extended for student college requests) ────
router.get("/pending", requireAdmin, getPendingQueue);
router.post("/recruiters/:id/approve", requireAdmin, approveRecruiter);
router.post("/recruiters/:id/reject", requireAdmin, rejectRecruiter);
router.post("/tpo/:collegeId/approve", requireAdmin, approveTpo);
router.post("/tpo/:collegeId/reject", requireAdmin, rejectTpo);
router.post("/student-colleges/:collegeId/approve", requireAdmin, approveStudentCollege);
router.post("/student-colleges/:collegeId/reject", requireAdmin, rejectStudentCollege);

// ── Impersonation — "Login As" ──────────────────────────────────────────────
router.get("/users", requireAdmin, listUsers);
router.post("/impersonate/:userId", requireAdmin, startImpersonation);
router.post("/impersonate/stop", requireAdmin, stopImpersonation);

export default router;