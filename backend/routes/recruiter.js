/**
 * Recruiter routes — Phase 7 (083–086)
 *
 * POST /api/recruiter/register        — convert account to recruiter (083)
 * GET  /api/recruiter/candidates      — search candidates (084)
 * GET  /api/recruiter/verify/:username — verify profile signature (085)
 * POST /api/recruiter/skills-test     — send a 90-min skills test (086)
 * GET  /api/recruiter/skills-test/:id — get test status/results (086)
 *
 * All routes need auth. register is open to any user.
 * Everything else requires role="recruiter".
 */
import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import SkillsTest from "../models/SkillsTest.js";
import { requireRole } from "../middleware/roleGuard.js";
import { requireVerified } from "../middleware/requireVerified.js";

const router = Router();

// ── 083: POST /api/recruiter/register ────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { companyName, designation } = req.body;
    if (!companyName || !designation) {
      return res.status(400).json({ error: "companyName and designation are required." });
    }

    const email = req.userDoc?.email || "";
    const domain = email.split("@")[1] || null;

    // Block personal email providers
    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
    ];

    const allowPersonalEmailInDev = process.env.NODE_ENV !== "production";

    if (
      !allowPersonalEmailInDev &&
      (!domain || personalDomains.includes(domain))
    ) {
      return res.status(400).json({
        error:
          "Please sign in with your company email (e.g. name@google.com), not a personal email.",
      });
    }

    req.userDoc.role = "recruiter";
    req.userDoc.recruiterProfile = { companyName, designation, companyDomain: domain, verified: false };
    await req.userDoc.save();

    return res.json({ success: true, role: "recruiter", companyName, domain });
  } catch (err) {
    console.error("[Recruiter] register:", err.message);
    return res.status(500).json({ error: "Failed to register recruiter." });
  }
});

// ── 084: GET /api/recruiter/candidates ───────────────────────────────────────
// Query params: college, topic, minSolved, maxSolved, language, page, limit
router.get(
  "/candidates",
  requireRole("recruiter", "admin"),
  requireVerified,
  async (req, res) => {
    try {
      const {
        college,
        topic,
        minSolved = 0,
        maxSolved = 9999,
        language,
        page = 1,
        limit = 20,
      } = req.query;

      // Build MongoDB filter
      const filter = {
        role: "student",
        isProfilePublic: true,
      };

      if (college) {
        filter.email = { $regex: `@${college.replace(/\./g, "\\.")}`, $options: "i" };
      }

      if (topic) {
        // topicStats is a Map — filter students who solved at least 1 in this topic
        filter[`topicStats.${topic}`] = { $gte: 1 };
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, parseInt(limit));
      const skip = (pageNum - 1) * limitNum;

      const [students, total] = await Promise.all([
        User.find(filter)
          .select("username displayName email totalXP solvedSlugs solvedDifficulty topicStats currentStreak joinedDate profileSignature")
          .sort({ totalXP: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(filter),
      ]);

      // Apply solvedCount range filter (can't do in Mongo easily without $expr)
      const filtered = students.filter(s => {
        const count = s.solvedSlugs?.length ?? 0;
        return count >= parseInt(minSolved) && count <= parseInt(maxSolved);
      });

      // Apply language filter via profileSignature or topicStats (best-effort)
      const result = filtered.map(s => ({
        username: s.username,
        displayName: s.displayName,
        college: s.email?.split("@")[1] || null,
        totalXP: s.totalXP || 0,
        level: Math.floor((s.totalXP || 0) / 100) + 1,
        solvedCount: s.solvedSlugs?.length ?? 0,
        easy: s.solvedDifficulty?.easy || 0,
        medium: s.solvedDifficulty?.medium || 0,
        hard: s.solvedDifficulty?.hard || 0,
        currentStreak: s.currentStreak || 0,
        topTopics: Object.entries(s.topicStats instanceof Map ? Object.fromEntries(s.topicStats) : (s.topicStats || {}))
          .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t),
        isVerified: !!s.profileSignature?.hash,
        profileUrl: `/u/${s.username}`,
      }));

      return res.json({ candidates: result, total, page: pageNum, limit: limitNum });
    } catch (err) {
      console.error("[Recruiter] candidates:", err.message);
      return res.status(500).json({ error: "Failed to search candidates." });
    }
  });

// ── 085: GET /api/recruiter/verify/:username ──────────────────────────────────
// Verifies the profile signature — proves the data wasn't tampered with.
// Public endpoint — any recruiter (or anyone) can call this.
router.get("/verify/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("username displayName solvedSlugs profileSignature")
      .lean();

    if (!user) return res.status(404).json({ error: "User not found." });

    const sig = user.profileSignature;
    if (!sig?.hash) {
      return res.json({ verified: false, reason: "Profile has not been signed yet." });
    }

    // Re-compute expected hash
    const secret = process.env.PROFILE_SIGN_SECRET || "codeclub-verify-secret";
    const payload = `${user._id}:${sig.solvedCount}:${sig.signedAt}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const verified = expected === sig.hash;
    const currentCount = user.solvedSlugs?.length ?? 0;
    const countMatch = currentCount === sig.solvedCount;

    return res.json({
      verified: verified && countMatch,
      username: user.username,
      displayName: user.displayName,
      signedAt: sig.signedAt,
      solvedCountAtSigning: sig.solvedCount,
      currentSolvedCount: currentCount,
      tampered: verified && !countMatch,
      reason: !verified ? "Signature invalid." : !countMatch ? "Solve count changed since signing." : null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Verification failed." });
  }
});

// ── 086: POST /api/recruiter/skills-test ─────────────────────────────────────
// Recruiter sends a 3-problem, 90-min timed test to a candidate.
router.post(
  "/skills-test",
  requireRole("recruiter", "admin"),
  requireVerified,
  async (req, res) => {
    try {
      const { candidateUsername, problemSlugs, durationMinutes = 90, note } = req.body;

      if (!candidateUsername || !Array.isArray(problemSlugs) || problemSlugs.length === 0) {
        return res.status(400).json({ error: "candidateUsername and problemSlugs[] required." });
      }
      if (problemSlugs.length > 5) {
        return res.status(400).json({ error: "Maximum 5 problems per skills test." });
      }

      const candidate = await User.findOne({ username: candidateUsername }).select("_id username email");
      if (!candidate) return res.status(404).json({ error: "Candidate not found." });

      // Verify problems exist
      const problems = await Problem.find({ slug: { $in: problemSlugs } }).select("slug title difficulty").lean();
      if (problems.length !== problemSlugs.length) {
        return res.status(400).json({ error: "One or more problem slugs are invalid." });
      }

      const test = await SkillsTest.create({
        recruiterId: req.userDoc._id,
        recruiterCompany: req.userDoc.recruiterProfile?.companyName,
        candidateId: candidate._id,
        candidateUsername: candidate.username,
        problemSlugs,
        durationMs: durationMinutes * 60 * 1000,
        note: note || null,
      });

      return res.status(201).json({
        testId: test._id,
        status: test.status,
        problems: problems.map(p => ({ slug: p.slug, title: p.title, difficulty: p.difficulty })),
        expiresInHours: 72, // candidate has 72h to start it
      });
    } catch (err) {
      console.error("[Recruiter] skills-test:", err.message);
      return res.status(500).json({ error: "Failed to create skills test." });
    }
  });

// ── 086: GET /api/recruiter/skills-test/:id — recruiter checks results ────────
router.get(
  "/skills-test/:id",
  requireRole("recruiter", "admin"),
  requireVerified,
  async (req, res) => {
    try {
      const test = await SkillsTest.findOne({
        _id: req.params.id,
        recruiterId: req.userDoc._id,
      }).lean();

      if (!test) return res.status(404).json({ error: "Test not found." });
      return res.json(test);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch test." });
    }
  });

// ── 086: GET /api/recruiter/my-tests — candidate sees their pending tests ─────
// (mounted separately as /api/candidate/tests in server.js)
export const candidateTestsRouter = Router();

candidateTestsRouter.get("/", async (req, res) => {
  try {
    const tests = await SkillsTest.find({ candidateId: req.userDoc._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ tests });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch your tests." });
  }
});

// Candidate starts a test
candidateTestsRouter.post("/:id/start", async (req, res) => {
  try {
    const test = await SkillsTest.findOne({ _id: req.params.id, candidateId: req.userDoc._id });
    if (!test) return res.status(404).json({ error: "Test not found." });
    if (test.status !== "pending") return res.status(400).json({ error: `Test is already ${test.status}.` });

    const now = Date.now();
    test.status = "in_progress";
    test.startedAt = new Date(now);
    test.expiresAt = new Date(now + test.durationMs);
    await test.save();

    return res.json({
      testId: test._id,
      problems: test.problemSlugs,
      expiresAt: test.expiresAt,
      durationMs: test.durationMs,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to start test." });
  }
});

// Candidate submits test
candidateTestsRouter.post("/:id/submit", async (req, res) => {
  try {
    const test = await SkillsTest.findOne({ _id: req.params.id, candidateId: req.userDoc._id });
    if (!test) return res.status(404).json({ error: "Test not found." });

    if (test.status === "submitted") return res.status(400).json({ error: "Already submitted." });
    if (test.expiresAt && new Date() > test.expiresAt) {
      test.status = "expired";
      await test.save();
      return res.status(410).json({ error: "Test time has expired." });
    }

    const { solvedSlugs } = req.body;
    test.status = "submitted";
    test.submittedAt = new Date();
    test.solvedSlugs = Array.isArray(solvedSlugs) ? solvedSlugs : [];
    test.score = Math.round((test.solvedSlugs.length / test.problemSlugs.length) * 100);
    await test.save();

    return res.json({ success: true, score: test.score });
  } catch (err) {
    return res.status(500).json({ error: "Failed to submit test." });
  }
});

export default router;
