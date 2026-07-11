/**
 * TPO (Training & Placement Officer) routes — B2B college admin features.
 *
 * Entirely gated by B2B_ENABLED feature flag. Reuses the same Firebase auth
 * as students — a TPO is just a User with role="tpo" + a collegeDomain.
 *
 * POST /api/tpo/register        — convert current user into a TPO (one-time)
 * GET  /api/tpo/me               — get TPO profile + college info
 * GET  /api/tpo/students         — list all students from their college domain
 */
import { Router } from "express";
import User from "../models/User.js";
import { B2B_ENABLED } from "../config/featureFlags.js";
import Assignment from "../models/Assignment.js";
import { createRequire } from "module";
import { requireRole } from "../middleware/roleGuard.js";
import College from "../models/College.js";
import { SITE_URL, SUPPORT_EMAIL } from "../config/site.js";
import { requireVerified } from "../middleware/requireVerified.js";
import { getOrSetCache, invalidateCachePrefix } from "../utils/cache.js";

const require = createRequire(import.meta.url);


const router = Router();

// Full-college scans (/students, /dashboard) are the most expensive queries
// in this file — every request re-reads every student row for the domain.
// Cached per-domain via the shared Redis-backed helper so multiple Railway
// instances agree, same pattern as leaderboard.js.
const TPO_CACHE_PREFIX = "tpo:";
const TPO_CACHE_TTL_SECONDS = 2 * 60; // 2 minutes — matches profile cache TTL

/**
 * Invalidate a college's cached TPO views. Called from progressController
 * whenever a student's XP/solved/streak changes, keyed off their email
 * domain. Fire-and-forget by design — same as the leaderboard/profile
 * invalidation it sits alongside.
 */
export async function invalidateTpoCache(domain) {
  if (!domain) return;
  await invalidateCachePrefix(`${TPO_CACHE_PREFIX}students:${domain}`);
  await invalidateCachePrefix(`${TPO_CACHE_PREFIX}dashboard:${domain}`);
}

function b2bGate(req, res) {
  if (!B2B_ENABLED) {
    res.status(200).json({
      enabled: false,
      message: `College dashboard is not live yet. Reach out to ${SUPPORT_EMAIL} for early access.`,
    });
    return true;
  }
  return false;
}

// ── POST /api/tpo/register ──────────────────────────────────────────────────
// A regular user converts their account into a TPO account.
// In practice: a separate signup page asks for college name + verifies the
// email domain matches an institutional domain (not gmail.com etc).
router.post("/register", async (req, res) => {
  if (b2bGate(req, res)) return;

  try {
    const { collegeName } = req.body;
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });
    if (!collegeName) return res.status(400).json({ error: "collegeName is required." });

    const email = req.userDoc.email || "";
    const domain = email.split("@")[1];

    if (!domain || domain.includes("gmail.com") || domain.includes("yahoo.com") || domain.includes("outlook.com")) {
      return res.status(400).json({
        error: "Please sign up with your institutional email (e.g. yourname@college.ac.in), not a personal email.",
      });
    }

    // Prevent multiple claims for the same institution
    // Prevent multiple claims for the same institution
    const existingCollege = await College.findOne({ domain });

    if (existingCollege) {
      return res.status(409).json({
        error: "This college is already registered.",
        status: existingCollege.verified ? "verified" : "pending",
      });
    }

    // Create pending college request
    await College.create({
      domain,
      name: collegeName,
      adminUserId: req.userDoc._id,
    });

    // Mark user as pending TPO
    req.userDoc.role = "tpo";
    req.userDoc.tpoProfile = {
      verificationStatus: "pending",
      verified: false,
      requestedAt: new Date(),
    };

    await req.userDoc.save();

    return res.status(201).json({
      success: true,
      role: "tpo",
      message:
        "Your college registration request has been submitted for verification.",
    });
  } catch (err) {
    console.error("[TPO] register error:", err.message);
    return res.status(500).json({ error: "Failed to register as TPO." });
  }
});

// ── GET /api/tpo/me ──────────────────────────────────────────────────────────
router.get("/me", requireRole("tpo", "admin"),
  requireVerified, async (req, res) => {
    if (b2bGate(req, res)) return;



    return res.json({
      collegeName: req.userDoc.tpoProfile?.collegeName,
      collegeDomain: req.userDoc.tpoProfile?.collegeDomain,
      email: req.userDoc.email,
    });
  });

// ── GET /api/tpo/students ───────────────────────────────────────────────────
router.get("/students", requireRole("tpo", "admin"),
  requireVerified, async (req, res) => {
    if (b2bGate(req, res)) return;

    try {


      const domain = req.userDoc.tpoProfile?.collegeDomain;
      if (!domain) return res.status(400).json({ error: "No college domain set on this TPO account." });

      const { value: formatted, cacheStatus } = await getOrSetCache(
        `${TPO_CACHE_PREFIX}students:${domain}`,
        TPO_CACHE_TTL_SECONDS,
        async () => {
          const students = await User.find({
            email: { $regex: `@${domain.replace(".", "\\.")}$`, $options: "i" },
            role: "student",
          })
            .select("displayName email totalXP solvedSlugs currentStreak solvedDifficulty topicStats joinedDate")
            .lean();

          return students.map(s => ({
            name: s.displayName,
            email: s.email,
            totalXP: s.totalXP || 0,
            solvedCount: s.solvedSlugs?.length ?? 0,
            currentStreak: s.currentStreak || 0,
            easy: s.solvedDifficulty?.easy || 0,
            medium: s.solvedDifficulty?.medium || 0,
            hard: s.solvedDifficulty?.hard || 0,
            joinedDate: s.joinedDate,
          }));
        }
      );

      res.set("X-Cache", cacheStatus);
      return res.json({
        college: req.userDoc.tpoProfile?.collegeName,
        domain,
        students: formatted,
        total: formatted.length,
      });

    } catch (err) {
      console.error("[TPO] students error:", err.message);
      return res.status(500).json({ error: "Failed to load students." });
    }
  });


// ── GET /api/tpo/dashboard ──────────────────────────────────────────────────
// Returns aggregated class-wide stats for the TPO dashboard view.
router.get("/dashboard", requireRole("tpo", "admin"),
  requireVerified, async (req, res) => {
    if (b2bGate(req, res)) return;

    try {


      const domain = req.userDoc.tpoProfile?.collegeDomain;
      if (!domain) return res.status(400).json({ error: "No college domain set." });

      const { value: dashboard, cacheStatus } = await getOrSetCache(
        `${TPO_CACHE_PREFIX}dashboard:${domain}`,
        TPO_CACHE_TTL_SECONDS,
        async () => {
          const students = await User.find({
            email: { $regex: `@${domain.replace(".", "\\.")}$`, $options: "i" },
            role: "student",
          })
            .select("solvedSlugs solvedDifficulty topicStats currentStreak totalXP")
            .lean();

          const totalStudents = students.length;

          if (totalStudents === 0) {
            return { totalStudents: 0, message: "No students from your college have joined Code Club yet." };
          }

          // ── Aggregate stats ────────────────────────────────────────────────
          let totalSolved = 0, totalEasy = 0, totalMedium = 0, totalHard = 0;
          let activeThisWeek = 0; // streak > 0
          const topicTotals = {};

          students.forEach(s => {
            const solved = s.solvedSlugs?.length ?? 0;
            totalSolved += solved;
            totalEasy += s.solvedDifficulty?.easy ?? 0;
            totalMedium += s.solvedDifficulty?.medium ?? 0;
            totalHard += s.solvedDifficulty?.hard ?? 0;
            if ((s.currentStreak ?? 0) > 0) activeThisWeek++;

            const topics = s.topicStats instanceof Map ? Object.fromEntries(s.topicStats) : (s.topicStats || {});
            Object.entries(topics).forEach(([topic, count]) => {
              topicTotals[topic] = (topicTotals[topic] || 0) + count;
            });
          });

          const avgSolved = Math.round((totalSolved / totalStudents) * 10) / 10;

          // ── Placement Readiness Score (0-100) ────────────────────────────────
          // Heuristic: weighted combination of average solves, hard-problem coverage,
          // and active engagement. This is the #1 number a TPO will look at.
          const solveScore = Math.min(40, (avgSolved / 100) * 40);           // up to 40 pts for solving 100+ avg
          const hardScore = Math.min(30, ((totalHard / totalStudents) / 20) * 30); // up to 30 pts for 20+ hard avg
          const engagementScore = Math.min(30, (activeThisWeek / totalStudents) * 30);  // up to 30 pts for active streaks
          const readinessScore = Math.round(solveScore + hardScore + engagementScore);

          // Topic coverage — sorted by total solves across the class
          const topicCoverage = Object.entries(topicTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, totalSolves: count }));

          return {
            totalStudents,
            avgSolved,
            totalSolved,
            difficultyBreakdown: { easy: totalEasy, medium: totalMedium, hard: totalHard },
            activeThisWeek,
            activePercent: Math.round((activeThisWeek / totalStudents) * 100),
            readinessScore,
            topicCoverage,
          };
        }
      );

      res.set("X-Cache", cacheStatus);
      // college/domain come from the live req.userDoc, not the cached payload,
      // since they're cheap to read and shouldn't go stale even if the
      // aggregate numbers do for a couple minutes.
      return res.json({
        college: req.userDoc.tpoProfile?.collegeName,
        domain,
        ...dashboard,
      });

    } catch (err) {
      console.error("[TPO] dashboard error:", err.message);
      return res.status(500).json({ error: "Failed to load dashboard." });
    }
  });


// ── POST /api/tpo/assignments ───────────────────────────────────────────────
// TPO creates a new problem assignment for their college.
router.post("/assignments", requireRole("tpo", "admin"), async (req, res) => {
  if (b2bGate(req, res)) return;

  try {


    const { title, problemSlugs, dueDate } = req.body;

    if (!title || !Array.isArray(problemSlugs) || problemSlugs.length === 0 || !dueDate) {
      return res.status(400).json({ error: "title, problemSlugs (array), and dueDate are required." });
    }

    const assignment = await Assignment.create({
      tpoId: req.userDoc._id,
      collegeDomain: req.userDoc.tpoProfile?.collegeDomain,
      title,
      problemSlugs,
      dueDate: new Date(dueDate),
    });

    return res.status(201).json(assignment);
  } catch (err) {
    console.error("[TPO] create assignment error:", err.message);
    return res.status(500).json({ error: "Failed to create assignment." });
  }
});

// ── GET /api/tpo/assignments ────────────────────────────────────────────────
// TPO view: all assignments they've created, with per-student completion %.
router.get("/assignments", requireRole("tpo", "admin"), async (req, res) => {
  if (b2bGate(req, res)) return;

  try {


    const assignments = await Assignment.find({
      collegeDomain: req.userDoc.tpoProfile?.collegeDomain,
    })
      .sort({ dueDate: -1 })
      .lean();

    // Compute completion % per assignment
    const domain = req.userDoc.collegeDomain;
    const students = await User.find({
      email: { $regex: `@${domain.replace(".", "\\.")}$`, $options: "i" },
      role: "student",
    }).select("solvedSlugs").lean();

    const totalStudents = students.length || 1;

    const enriched = assignments.map(a => {
      const completedCount = students.filter(s =>
        a.problemSlugs.every(slug => (s.solvedSlugs || []).includes(slug))
      ).length;

      return {
        ...a,
        completedCount,
        totalStudents,
        completionPercent: Math.round((completedCount / totalStudents) * 100),
        isOverdue: new Date(a.dueDate) < new Date(),
      };
    });

    return res.json({ assignments: enriched });
  } catch (err) {
    console.error("[TPO] list assignments error:", err.message);
    return res.status(500).json({ error: "Failed to load assignments." });
  }
});

// ── GET /api/assignments/student ────────────────────────────────────────────
// Student view: assignments relevant to their college, with their own progress.
// Mounted separately (not /api/tpo/* — students aren't TPOs).
export const studentAssignmentsRouter = Router();

studentAssignmentsRouter.get("/", async (req, res) => {
  if (!B2B_ENABLED) return res.json({ enabled: false, assignments: [] });

  try {
    if (!req.userDoc?.email) return res.json({ assignments: [] });

    const domain = req.userDoc.email.split("@")[1];
    const assignments = await Assignment.find({ collegeDomain: domain })
      .sort({ dueDate: 1 })
      .lean();

    const solvedSet = new Set(req.userDoc.solvedSlugs || []);

    const enriched = assignments.map(a => {
      const solvedCount = a.problemSlugs.filter(slug => solvedSet.has(slug)).length;
      return {
        _id: a._id,
        title: a.title,
        dueDate: a.dueDate,
        problemSlugs: a.problemSlugs,
        solvedCount,
        totalProblems: a.problemSlugs.length,
        isComplete: solvedCount === a.problemSlugs.length,
        isOverdue: new Date(a.dueDate) < new Date(),
      };
    });

    return res.json({ enabled: true, assignments: enriched });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load assignments." });
  }
});


// ── GET /api/tpo/report/pdf ─────────────────────────────────────────────────
// Generates a class performance PDF — the document a TPO shows their
// placement director to justify the Code Club subscription.
router.get("/report/pdf", requireRole("tpo", "admin"),
  requireVerified, async (req, res) => {
    if (b2bGate(req, res)) return;

    let PDFDocument;
    try {
      PDFDocument = require("pdfkit");
    } catch {
      return res.status(503).json({ error: "PDF generation unavailable. Run: cd backend && npm install pdfkit" });
    }

    try {


      const domain = req.userDoc.tpoProfile?.collegeDomain;
      const students = await User.find({
        email: { $regex: `@${domain.replace(".", "\\.")}$`, $options: "i" },
        role: "student",
      })
        .select("displayName totalXP solvedSlugs solvedDifficulty currentStreak topicStats")
        .sort({ totalXP: -1 })
        .lean();

      const totalStudents = students.length;
      const totalSolved = students.reduce((sum, s) => sum + (s.solvedSlugs?.length ?? 0), 0);
      const avgSolved = totalStudents ? Math.round((totalSolved / totalStudents) * 10) / 10 : 0;
      const activeCount = students.filter(s => (s.currentStreak ?? 0) > 0).length;

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${(req.userDoc.tpoProfile?.collegeName || "college").replace(/[^a-z0-9]/gi, "_")}_codeclub_report.pdf"`);
      doc.pipe(res);

      // Header
      doc.rect(0, 0, doc.page.width, 90).fill("#18181b");
      doc.fontSize(22).fillColor("#22c55e").font("Helvetica-Bold").text("Code Club", 50, 24);
      doc.fontSize(11).fillColor("#a1a1aa").font("Helvetica").text("Class Performance Report", 50, 52);
      doc.fontSize(10).fillColor("#71717a")
        .text(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), doc.page.width - 200, 52, { align: "right", width: 150 });

      doc.fontSize(18).fillColor("#000").font("Helvetica-Bold").text(req.userDoc.tpoProfile?.collegeName || "College", 50, 110);
      doc.fontSize(10).fillColor("#71717a").font("Helvetica").text(domain, 50, 134);

      // Summary stats
      let sy = 165;
      const summary = [
        { label: "Total Students", value: totalStudents },
        { label: "Avg Problems Solved", value: avgSolved },
        { label: "Active This Week", value: `${activeCount} (${totalStudents ? Math.round(activeCount / totalStudents * 100) : 0}%)` },
        { label: "Total Problems Solved", value: totalSolved },
      ];
      let sx = 50;
      summary.forEach(s => {
        doc.rect(sx, sy, 120, 50).fill("#f4f4f5");
        doc.fontSize(18).fillColor("#16a34a").font("Helvetica-Bold").text(String(s.value), sx + 10, sy + 8);
        doc.fontSize(8).fillColor("#71717a").font("Helvetica").text(s.label, sx + 10, sy + 30, { width: 100 });
        sx += 130;
      });

      // Student table
      let ty = sy + 75;
      doc.fontSize(12).fillColor("#000").font("Helvetica-Bold").text("STUDENT RANKINGS", 50, ty);
      ty += 22;

      doc.fontSize(8).fillColor("#71717a").font("Helvetica-Bold");
      doc.text("Rank", 50, ty); doc.text("Name", 90, ty); doc.text("Solved", 320, ty);
      doc.text("Streak", 380, ty); doc.text("XP", 450, ty);
      ty += 14;
      doc.moveTo(50, ty).lineTo(doc.page.width - 50, ty).strokeColor("#e4e4e7").stroke();
      ty += 8;

      students.slice(0, 40).forEach((s, i) => {
        if (ty > doc.page.height - 60) { doc.addPage(); ty = 50; }
        doc.fontSize(8).fillColor("#3f3f46").font("Helvetica");
        doc.text(String(i + 1), 50, ty);
        doc.text(s.displayName || "—", 90, ty, { width: 220 });
        doc.text(String(s.solvedSlugs?.length ?? 0), 320, ty);
        doc.text(String(s.currentStreak ?? 0), 380, ty);
        doc.text(String(s.totalXP ?? 0), 450, ty);
        ty += 16;
      });

      // Footer
      const footerY = doc.page.height - 40;
      doc.fontSize(8).fillColor("#a1a1aa").text(`Generated by Code Club · ${SITE_URL.replace("https://","")}`, 50, footerY, { align: "center", width: doc.page.width - 100 });

      doc.end();
    } catch (err) {
      console.error("[TPO] report PDF error:", err.message);
      if (!res.headersSent) res.status(500).json({ error: "Failed to generate report." });
    }
  });

export default router;