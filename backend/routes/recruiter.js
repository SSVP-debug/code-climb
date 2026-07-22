import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import { getProfileSignSecret } from "../config/env.js";
import Problem from "../models/Problem.js";
import SkillsTest from "../models/SkillsTest.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";
import { requireVerified } from "../middleware/requireVerified.js";
import { getOrSetCache } from "../utils/cache.js";
import { getLevel } from "../utils/xpLevel.js";
import { createNotification } from "../services/notificationService.js";
import { isDomainAutoVerified } from "../utils/domainVerification.js";
import { topicStatsToObject } from "../utils/topicStats.js";

const router = Router();

// Candidate search has many distinct filter/page combinations, so we cache
// per exact query string rather than per prefix. TTL is short (60s) and we
// deliberately don't do active invalidation on student progress updates —
// with this many possible query keys, prefix-invalidating on every solve
// would thrash the cache for little benefit. A recruiter browsing/paging
// results tolerates ~60s staleness fine; this is a search UX, not a
// pass/fail decision surface.
const CANDIDATES_CACHE_TTL_SECONDS = 60;

// ── 083: POST /api/recruiter/register ────────────────────────────────────────
router.post("/register", requireAuth, async (req, res) => {
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

    // Hybrid verification (Phase B): known company domains skip the queue
    // entirely. Everything else is created pending, same as before, and
    // shows up in GET /api/admin/pending for manual approval.
    const autoVerified = await isDomainAutoVerified(domain, "company");

    req.userDoc.recruiterProfile = {
      companyName,
      designation,
      companyDomain: domain,
      verified: autoVerified,
      verifiedAt: autoVerified ? new Date() : null,
    };
    await req.userDoc.save();

    return res.json({
      success: true,
      role: "recruiter",
      companyName,
      domain,
      verified: autoVerified,
      status: autoVerified ? "verified" : "pending",
    });
  } catch (err) {
    console.error("[Recruiter] register:", err.message);
    return res.status(500).json({ error: "Failed to register recruiter." });
  }
});

// ── 084: GET /api/recruiter/candidates ───────────────────────────────────────
// Query params: college, topic, minSolved, maxSolved, language, page, limit
router.get(
  "/candidates",
  requireAuth,
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
        // Anchored-prefix regex on the indexed emailDomain field — Mongo can
        // use the index for a regex anchored at the start (unlike the old
        // unanchored `email: { $regex: "@..." }`, which forced a full
        // collection scan). Kept as a regex rather than an exact match so
        // recruiters can still type a partial domain (e.g. "marwadi") and
        // match "marwadiuniversity.ac.in" — same behavior as before.
        filter.emailDomain = { $regex: `^${college.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, $options: "i" };
      }

      if (topic) {
        // topicStats is an array of { topic, count } subdocuments — needs
        // $elemMatch to find "at least one element with this topic and
        // count >= 1". The old dot-path filter (`topicStats.${topic}`)
        // was left over from when this was a Mongoose Map field and never
        // matched anything after the migration to an array — this filter
        // silently returned zero candidates whenever a topic was selected.
        filter.topicStats = { $elemMatch: { topic, count: { $gte: 1 } } };
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, parseInt(limit));
      const skip = (pageNum - 1) * limitNum;

      const minSolvedNum = parseInt(minSolved) || 0;
      const maxSolvedNum = parseInt(maxSolved) || 9999;

      const cacheKey = `recruiter:candidates:${JSON.stringify({ college, topic, minSolved, maxSolved, language, pageNum, limitNum })}`;

      const { value: payload, cacheStatus } = await getOrSetCache(
        cacheKey,
        CANDIDATES_CACHE_TTL_SECONDS,
        async () => {
          // solvedCount range filter now runs inside Mongo, before $skip/$limit,
          // so pagination and `total` both reflect the filtered set (previously
          // this filter ran in JS *after* skip/limit had already been applied,
          // which could silently return fewer than `limit` results per page and
          // report an inflated `total`).
          const [aggResult] = await User.aggregate([
            { $match: filter },
            { $addFields: { solvedCount: { $size: { $ifNull: ["$solvedSlugs", []] } } } },
            { $match: { solvedCount: { $gte: minSolvedNum, $lte: maxSolvedNum } } },
            { $sort: { totalXP: -1 } },
            {
              $facet: {
                data: [
                  { $skip: skip },
                  { $limit: limitNum },
                  {
                    $project: {
                      username: 1,
                      displayName: 1,
                      email: 1,
                      totalXP: 1,
                      solvedCount: 1,
                      solvedDifficulty: 1,
                      topicStats: 1,
                      currentStreak: 1,
                      profileSignature: 1,
                    },
                  },
                ],
                totalCount: [{ $count: "count" }],
              },
            },
          ]);

          const students = aggResult?.data ?? [];
          const total = aggResult?.totalCount?.[0]?.count ?? 0;

          // Apply language filter via profileSignature or topicStats (best-effort)
          const result = students.map(s => ({
            username: s.username,
            displayName: s.displayName,
            college: s.email?.split("@")[1] || null,
            totalXP: s.totalXP || 0,
            level: getLevel(s.totalXP || 0),
            solvedCount: s.solvedCount ?? 0,
            easy: s.solvedDifficulty?.easy || 0,
            medium: s.solvedDifficulty?.medium || 0,
            hard: s.solvedDifficulty?.hard || 0,
            currentStreak: s.currentStreak || 0,
            topTopics: Object.entries(topicStatsToObject(s.topicStats))
              .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t),
            isVerified: !!s.profileSignature?.hash,
            profileUrl: `/u/${s.username}`,
          }));

          return { candidates: result, total, page: pageNum, limit: limitNum };
        }
      );

      res.set("X-Cache", cacheStatus);
      return res.json(payload);
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
    const secret = getProfileSignSecret();
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
    req.log?.error?.({ err }, "[Recruiter] verify failed");
    return res.status(500).json({ error: "Verification failed." });
  }
});

// ── 086: POST /api/recruiter/skills-test ─────────────────────────────────────
// Recruiter sends a 3-problem, 90-min timed test to a candidate.
router.post(
  "/skills-test",
  requireAuth,
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

      createNotification({
        userId: candidate._id,
        type: "skills_test_received",
        title: "You've received a skills test",
        message: req.userDoc.recruiterProfile?.companyName
          ? `${req.userDoc.recruiterProfile.companyName} sent you a ${problemSlugs.length}-problem skills test.`
          : `A recruiter sent you a ${problemSlugs.length}-problem skills test.`,
        link: "/candidate/tests",
        meta: { testId: test._id },
      }).catch((err) => console.error("[Recruiter] Skills-test notification failed:", err.message));

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

// ── GET /api/recruiter/skills-tests — list tests this recruiter has sent ────
// (distinct from GET /skills-test/:id below, which fetches one by id — this
// backs the "Sent Tests" tab so a recruiter can see everything they've sent
// without knowing individual test ids.)
router.get(
  "/skills-tests",
  requireAuth,
  requireRole("recruiter", "admin"),
  requireVerified,
  async (req, res) => {
    try {
      const tests = await SkillsTest.find({ recruiterId: req.userDoc._id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return res.json({
        tests: tests.map((t) => ({
          id: t._id,
          candidateUsername: t.candidateUsername,
          problemSlugs: t.problemSlugs,
          status: t.status,
          score: t.score,
          note: t.note,
          createdAt: t.createdAt,
          expiresAt: t.expiresAt,
          submittedAt: t.submittedAt,
        })),
      });
    } catch (err) {
      console.error("[Recruiter] skills-tests list:", err.message);
      return res.status(500).json({ error: "Failed to fetch sent tests." });
    }
  }
);

// ── 086: GET /api/recruiter/skills-test/:id — recruiter checks results ────────
router.get(
  "/skills-test/:id",
  requireAuth,
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