/**
 * Contest routes — commits 089–090
 *
 * PUBLIC CONTESTS (089)
 * GET  /api/contests                    — list upcoming/active/ended public contests
 * POST /api/contests                    — create contest (admin/tpo only)
 * GET  /api/contests/:id                — get contest detail + leaderboard
 * POST /api/contests/:id/join           — join a public contest
 * POST /api/contests/:id/solve          — mark problem solved in contest
 *
 * PRIVATE CONTESTS (090)
 * POST /api/contests/private            — TPO creates private contest
 * POST /api/contests/join-private       — join via invite code
 */
import { Router } from "express";
import crypto from "crypto";
import Contest from "../models/Contest.js";
import Problem from "../models/Problem.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────
function syncContestStatus(contest) {
  const now = new Date();
  if (now < new Date(contest.startsAt)) contest.status = "upcoming";
  else if (now > new Date(contest.endsAt)) contest.status = "ended";
  else contest.status = "active";
}

function computeRankings(participants) {
  return [...participants]
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

// ── GET /api/contests ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { status = "active,upcoming", type = "public" } = req.query;
    const statuses = status.split(",");

    const contests = await Contest.find({
      type: type === "all" ? { $in: ["public","private"] } : type,
      status: { $in: statuses },
    })
      .select("title description type status startsAt endsAt problemSlugs participants createdBy")
      .sort({ startsAt: 1 })
      .limit(50)
      .lean();

    // Sync status based on current time
    const now = new Date();
    const result = contests.map(c => ({
      ...c,
      participantCount: c.participants?.length ?? 0,
      problemCount:     c.problemSlugs?.length ?? 0,
      participants:     undefined, // don't leak full participant list in index
      isActive:         now >= new Date(c.startsAt) && now <= new Date(c.endsAt),
    }));

    return res.json({ contests: result });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load contests." });
  }
});

// ── POST /api/contests — create public contest (admin/tpo) ────────────────────
router.post("/", requireRole("admin", "tpo"), async (req, res) => {
  try {
    const { title, description, problemSlugs, startsAt, endsAt } = req.body;

    if (!title || !problemSlugs?.length || !startsAt || !endsAt) {
      return res.status(400).json({ error: "title, problemSlugs, startsAt, endsAt required." });
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      return res.status(400).json({ error: "endsAt must be after startsAt." });
    }

    // Validate all slugs exist
    const found = await Problem.countDocuments({ slug: { $in: problemSlugs } });
    if (found !== problemSlugs.length) {
      return res.status(400).json({ error: "One or more problem slugs are invalid." });
    }

    const start = new Date(startsAt);
    const end   = new Date(endsAt);
    const now   = new Date();

    const contest = await Contest.create({
      title, description: description || "",
      type: "public",
      status: now < start ? "upcoming" : now > end ? "ended" : "active",
      createdBy: req.userDoc._id,
      startsAt: start, endsAt: end,
      durationMs: end - start,
      problemSlugs,
    });

    return res.status(201).json(contest);
  } catch (err) {
    console.error("[Contest] create:", err.message);
    return res.status(500).json({ error: "Failed to create contest." });
  }
});

// ── POST /api/contests/private — TPO creates private contest (090) ────────────
router.post("/private", requireRole("tpo", "admin"), async (req, res) => {
  try {
    const { title, description, problemSlugs, startsAt, endsAt } = req.body;

    if (!title || !problemSlugs?.length || !startsAt || !endsAt) {
      return res.status(400).json({ error: "title, problemSlugs, startsAt, endsAt required." });
    }

    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char e.g. "A3F9B2"
    const start = new Date(startsAt);
    const end   = new Date(endsAt);
    const now   = new Date();

    const contest = await Contest.create({
      title, description: description || "",
      type: "private",
      status: now < start ? "upcoming" : "active",
      createdBy:    req.userDoc._id,
      inviteCode,
      collegeDomain: req.userDoc.collegeDomain || null,
      startsAt: start, endsAt: end,
      durationMs: end - start,
      problemSlugs,
    });

    return res.status(201).json({ ...contest.toObject(), inviteCode });
  } catch (err) {
    console.error("[Contest] create-private:", err.message);
    return res.status(500).json({ error: "Failed to create private contest." });
  }
});

// ── POST /api/contests/join-private — join via invite code (090) ──────────────
router.post("/join-private", async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: "inviteCode required." });

    const contest = await Contest.findOne({ inviteCode: inviteCode.toUpperCase(), type: "private" });
    if (!contest) return res.status(404).json({ error: "Invalid invite code." });
    if (contest.status === "ended") return res.status(410).json({ error: "Contest has ended." });

    const alreadyJoined = contest.participants.some(
      p => p.userId.toString() === req.userDoc._id.toString()
    );
    if (alreadyJoined) {
      return res.json({ alreadyJoined: true, contestId: contest._id });
    }

    contest.participants.push({
      userId:      req.userDoc._id,
      username:    req.userDoc.username,
      displayName: req.userDoc.displayName,
      solvedSlugs: [], score: 0, joinedAt: new Date(),
    });
    await contest.save();

    return res.json({ success: true, contestId: contest._id, title: contest.title });
  } catch (err) {
    return res.status(500).json({ error: "Failed to join contest." });
  }
});

// ── GET /api/contests/:id — contest detail + ranked leaderboard ───────────────
router.get("/:id", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).lean();
    if (!contest) return res.status(404).json({ error: "Contest not found." });

    // Sync status
    const now = new Date();
    const status = now < new Date(contest.startsAt) ? "upcoming"
                 : now > new Date(contest.endsAt)   ? "ended"
                 : "active";

    const ranked = computeRankings(contest.participants || []);

    // Find requesting user's position
    const myEntry = ranked.find(p => p.userId?.toString() === req.userDoc?._id?.toString());

    return res.json({
      ...contest,
      status,
      leaderboard: ranked.slice(0, 100),
      myRank:      myEntry?.rank ?? null,
      myScore:     myEntry?.score ?? 0,
      isJoined:    !!myEntry,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to load contest." });
  }
});

// ── POST /api/contests/:id/join — join a public contest ──────────────────────
router.post("/:id/join", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ error: "Contest not found." });
    if (contest.type === "private") return res.status(403).json({ error: "Use invite code to join private contests." });
    if (contest.status === "ended") return res.status(410).json({ error: "Contest has ended." });

    const alreadyJoined = contest.participants.some(
      p => p.userId.toString() === req.userDoc._id.toString()
    );
    if (alreadyJoined) return res.json({ alreadyJoined: true });

    contest.participants.push({
      userId: req.userDoc._id, username: req.userDoc.username,
      displayName: req.userDoc.displayName, solvedSlugs: [], score: 0,
    });
    await contest.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to join contest." });
  }
});

// ── POST /api/contests/:id/solve — mark problem solved in contest ─────────────
// Called from ProblemDetailsPage when a submission is accepted during a contest.
router.post("/:id/solve", async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required." });

    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ error: "Contest not found." });
    if (contest.status !== "active") return res.status(400).json({ error: "Contest is not active." });
    if (!contest.problemSlugs.includes(slug)) return res.status(400).json({ error: "Problem not in contest." });

    const pIdx = contest.participants.findIndex(
      p => p.userId.toString() === req.userDoc._id.toString()
    );
    if (pIdx === -1) return res.status(403).json({ error: "Not joined this contest." });

    const participant = contest.participants[pIdx];
    if (participant.solvedSlugs.includes(slug)) {
      return res.json({ alreadySolved: true, score: participant.score });
    }

    // Score: 100 points per problem (can extend with time-bonus later)
    participant.solvedSlugs.push(slug);
    participant.score += 100;
    contest.participants[pIdx] = participant;
    contest.markModified("participants");
    await contest.save();

    return res.json({ success: true, score: participant.score });
  } catch (err) {
    return res.status(500).json({ error: "Failed to record solve." });
  }
});

export default router;
