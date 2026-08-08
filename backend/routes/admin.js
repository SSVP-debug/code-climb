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
  getAuditLogs,
  getDashboardMetrics,
  suspendUser,
  activateUser,
  deleteUser,
  resetUserProgress,
  changeUserRole,
  startImpersonation,
  stopImpersonation,
} from "../controllers/adminController.js";
import { getColleges } from "../controllers/collegeController.js";

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

// ── Colleges ─────────────────────────────────────────────────────────────────
router.get("/colleges", requireAdmin, getColleges);
router.post("/impersonate/:userId", requireAdmin, startImpersonation);
router.post("/impersonate/stop", requireAdmin, stopImpersonation);

// ── User management actions ─────────────────────────────────────────────────
router.post("/users/:id/suspend", requireAdmin, suspendUser);
router.post("/users/:id/activate", requireAdmin, activateUser);
router.delete("/users/:id", requireAdmin, deleteUser);
router.post("/users/:id/reset-progress", requireAdmin, resetUserProgress);
router.post("/users/:id/role", requireAdmin, changeUserRole);

// ── Audit log ────────────────────────────────────────────────────────────────
router.get("/audit-logs", requireAdmin, getAuditLogs);

// ── Dashboard metrics ────────────────────────────────────────────────────────
router.get("/dashboard-metrics", requireAdmin, getDashboardMetrics);

export default router;