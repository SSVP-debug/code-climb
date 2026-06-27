/**
 * GET /api/init
 *
 * Single boot endpoint that returns everything the frontend needs on first load:
 *   - User's progress (solvedSlugs, XP, streaks, achievements, …)
 *   - User's recent submission history (last 50)
 *
 * This replaces the 3 sequential API calls that were made on app boot:
 *   initProgress() → getProgress() → getSubmissions()
 *
 * Runs both MongoDB queries in parallel via Promise.all.
 * One Firebase token refresh, one HTTP round-trip, one response.
 */

import { Router } from "express";
import User from "../models/User.js";
import Submission from "../models/Submission.js";
import { progressToClient } from "../controllers/progressController.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    if (!req.userDoc) {
      // MongoDB is down but Firebase auth passed — return empty scaffold
      // so the frontend can still render rather than hard-crashing.
      return res.json({
        progress: {
          solvedSlugs: [],
          topicStats: {},
          activityDates: [],
          achievements: [],
          dailyChallengeHistory: [],
          solvedDifficulty: { easy: 0, medium: 0, hard: 0 },
          recentActivity: [],
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          totalXP: 0,
          joinedDate: null,
          leetcodeUsername: "",
        },
        submissions: [],
        _dbDown: true,
      });
    }

    // Run both queries in parallel — no dependency between them.
    const [submissions] = await Promise.all([
      Submission
        .find({ userId: req.userDoc._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    return res.json({
      progress: progressToClient(req.userDoc),
      submissions: submissions.map((doc) => ({
        id: doc._id.toString(),
        problemSlug: doc.problemSlug,
        problemTitle: doc.problemTitle,
        language: doc.language,
        status: doc.status,
        passed: doc.passed,
        total: doc.total,
        visiblePassed: doc.visiblePassed,
        hiddenPassed: doc.hiddenPassed,
        executionTime: doc.executionTime,
        expectedOutput: doc.expectedOutput,
        actualOutput: doc.actualOutput,
        time: new Date(doc.createdAt).toISOString(),
        date: new Date(doc.createdAt).toISOString().split("T")[0],
        createdAt: doc.createdAt,
      })),
    });

  } catch (err) {
    console.error("[/api/init] Error:", err.message);
    return res.status(500).json({ error: "Failed to load initial data." });
  }
});

export default router;
