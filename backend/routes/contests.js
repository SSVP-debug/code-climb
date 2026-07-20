import { Router } from "express";
import crypto from "crypto";
import Contest from "../models/Contest.js";
import Problem from "../models/Problem.js";
import { requireRole } from "../middleware/roleGuard.js";
import { requireAuth } from "../middleware/auth.js";
import { getOrSetCache } from "../utils/cache.js";

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

    // Short TTL: contest status/participant counts change as people join,
    // but this is a browse/list page, not a leaderboard — 30s staleness is
    // fine and avoids re-querying on every page load during rush periods.
    const cacheKey = `contests:list:${status}:${type}`;
    const { value: result, cacheStatus } = await getOrSetCache(
      cacheKey,
      30,
      async () => {
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
        return contests.map(c => ({
          ...c,
          participantCount: c.participants?.length ?? 0,
          problemCount:     c.problemSlugs?.length ?? 0,
          participants:     undefined, // don't leak full participant list in index
          isActive:         now >= new Date(c.startsAt) && now <= new Date(c.endsAt),
        }));
      }
    );

    res.set("X-Cache", cacheStatus);
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

// ── Phase 12B guardrails for student-hosted private contests ──────────────────
// TPO/Admin are exempt (unchanged behavior — they run official, larger-scale
// college contests and are already trusted staff, not the abuse surface this
// is guarding against).
const STUDENT_CONTEST_LIMITS = {
  MAX_PROBLEMS:      8,
  MAX_PARTICIPANTS:  100,
  MIN_DURATION_MS:   30 * 60 * 1000,       // 30 minutes
  MAX_DURATION_MS:   4 * 60 * 60 * 1000,   // 4 hours
};

// ── POST /api/contests/private — create private contest (090, extended 12B/12C) ─
// TPO/Admin: unrestricted, as before. Student: guardrailed per Phase 12B,
// plus the "verified account required" gate as of Phase 12C (education.verified).
router.post("/private", requireRole("student", "tpo", "admin"), async (req, res) => {
  try {
    const { title, description, problemSlugs, startsAt, endsAt } = req.body;
    const isStudent = req.userDoc.role === "student";

    if (!title || !problemSlugs?.length || !startsAt || !endsAt) {
      return res.status(400).json({ error: "title, problemSlugs, startsAt, endsAt required." });
    }

    const start = new Date(startsAt);
    const end   = new Date(endsAt);
    const now   = new Date();

    if (end <= start) {
      return res.status(400).json({ error: "endsAt must be after startsAt." });
    }

    let maxParticipants = null;
    let allowLateJoin = true;

    if (isStudent) {
      // Phase 12C shipped student college verification — enforcing the
      // "verified account required" guardrail now that it's actually
      // possible to. "Verified" here means education.verified (college
      // email confirmed) since that's the only verification concept
      // students have; there's no separate generic account-verification
      // flag in this codebase to check instead.
      if (!req.userDoc.education?.verified) {
        return res.status(403).json({
          error: "Verify your college email before hosting a contest.",
          code: "HOST_NOT_VERIFIED",
        });
      }

      const durationMs = end - start;
      if (durationMs < STUDENT_CONTEST_LIMITS.MIN_DURATION_MS || durationMs > STUDENT_CONTEST_LIMITS.MAX_DURATION_MS) {
        return res.status(400).json({
          error: "Contest duration must be between 30 minutes and 4 hours.",
        });
      }

      if (problemSlugs.length > STUDENT_CONTEST_LIMITS.MAX_PROBLEMS) {
        return res.status(400).json({
          error: `Hosted contests can have at most ${STUDENT_CONTEST_LIMITS.MAX_PROBLEMS} problems.`,
        });
      }

      const requestedCap = Number(req.body.maxParticipants) || STUDENT_CONTEST_LIMITS.MAX_PARTICIPANTS;
      maxParticipants = Math.min(Math.max(requestedCap, 2), STUDENT_CONTEST_LIMITS.MAX_PARTICIPANTS);

      allowLateJoin = Boolean(req.body.allowLateJoin);

      // One active hosted contest at a time.
      const existingActive = await Contest.findOne({
        createdBy: req.userDoc._id,
        type: "private",
        status: { $in: ["upcoming", "active"] },
      }).lean();

      if (existingActive) {
        return res.status(409).json({
          error: "You already have an active or upcoming hosted contest. It must end before you can host another.",
        });
      }
    }

    // Validate all slugs exist
    const found = await Problem.countDocuments({ slug: { $in: problemSlugs } });
    if (found !== problemSlugs.length) {
      return res.status(400).json({ error: "One or more problem slugs are invalid." });
    }

    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char e.g. "A3F9B2"

    const contest = await Contest.create({
      title, description: description || "",
      type: "private",
      status: now < start ? "upcoming" : "active",
      createdBy:    req.userDoc._id,
      inviteCode,
      // Bug fix: this previously read req.userDoc.collegeDomain, which
      // doesn't exist at the top level — the real field is nested under
      // tpoProfile, so this was always null regardless of the creator's
      // college. Only meaningful for TPO-created contests; students don't
      // have a verified college domain until Phase 12C.
      collegeDomain: req.userDoc.tpoProfile?.collegeDomain || null,
      startsAt: start, endsAt: end,
      durationMs: end - start,
      problemSlugs,
      maxParticipants,
      allowLateJoin,
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

    // Phase 12B guardrails — checked after alreadyJoined so a participant
    // who already joined can always re-fetch their contestId, even if the
    // contest has since filled up or moved past its start time.
    if (contest.maxParticipants && contest.participants.length >= contest.maxParticipants) {
      return res.status(409).json({ error: "This contest is full." });
    }
    if (contest.status === "active" && !contest.allowLateJoin) {
      return res.status(403).json({ error: "This contest has already started and isn't accepting late joins." });
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

// ── GET /api/contests/mine — contests the caller has participated in (12D) ────
// Must stay registered BEFORE GET /:id below — otherwise Express would try
// to match "mine" as the :id param instead of hitting this route.
//
// Fills the gap flagged back in 12A: there was no "contests I've joined"
// query at all, which is why ClubPage's private-contest preview had to be
// an honest empty-state instead of real data. This is that endpoint —
// powers Profile's contest history, and could later back that preview too.
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const contests = await Contest.find({ "participants.userId": req.userDoc._id })
      .sort({ endsAt: -1 })
      .limit(50)
      .select("title type status startsAt endsAt problemSlugs participants")
      .lean();

    const history = contests.map((c) => {
      const ranked = computeRankings(c.participants || []);
      const mine = ranked.find((p) => p.userId?.toString() === req.userDoc._id.toString());
      return {
        _id: c._id,
        title: c.title,
        type: c.type,
        status: c.status,
        endsAt: c.endsAt,
        problemCount: c.problemSlugs.length,
        participantCount: ranked.length,
        myRank: mine?.rank ?? null,
        myScore: mine?.score ?? 0,
        mySolvedCount: mine?.solvedSlugs?.length ?? 0,
      };
    });

    return res.json({ contests: history });
  } catch (err) {
    console.error("[Contest] mine:", err.message);
    return res.status(500).json({ error: "Failed to load your contest history." });
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
      myRank:        myEntry?.rank ?? null,
      myScore:       myEntry?.score ?? 0,
      mySolvedSlugs: myEntry?.solvedSlugs ?? [],
      isJoined:      !!myEntry,
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

    const participant = contest.participants.find(
      p => p.userId.toString() === req.userDoc._id.toString()
    );
    if (!participant) return res.status(403).json({ error: "Not joined this contest." });

    // Score: 100 points per problem (can extend with time-bonus later)
    const SOLVE_SCORE = 100;

    // Atomic update: the filter only matches this participant subdocument
    // when they haven't already solved this slug, so two concurrent solve
    // requests can't both push the slug or double-award points. Previously
    // this was a load-mutate-save on the whole Contest document, which
    // could race and lose an update under concurrent solves.
    const updated = await Contest.findOneAndUpdate(
      {
        _id: req.params.id,
        participants: { $elemMatch: { userId: req.userDoc._id, solvedSlugs: { $ne: slug } } },
      },
      {
        $push: { "participants.$.solvedSlugs": slug },
        $inc: { "participants.$.score": SOLVE_SCORE },
      },
      { new: true }
    );

    if (!updated) {
      // Lost the race to another concurrent solve for this slug, or it was
      // already solved earlier — either way, "already solved" is correct.
      const current = await Contest.findById(req.params.id).lean();
      const currentParticipant = current?.participants.find(
        p => p.userId.toString() === req.userDoc._id.toString()
      );
      return res.json({ alreadySolved: true, score: currentParticipant?.score ?? participant.score });
    }

    const updatedParticipant = updated.participants.find(
      p => p.userId.toString() === req.userDoc._id.toString()
    );
    return res.json({ success: true, score: updatedParticipant.score });
  } catch (err) {
    return res.status(500).json({ error: "Failed to record solve." });
  }
});

export default router;