import { Router } from "express";
import crypto from "crypto";
import Contest from "../models/Contest.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { requireRole } from "../middleware/roleGuard.js";
import { requireAuth } from "../middleware/auth.js";
import { getOrSetCache } from "../utils/cache.js";
import { awardContestSolve } from "../services/contestScoring.js";

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
        return contests.map(c => {
          const isUpcoming = now < new Date(c.startsAt);
          return {
            ...c,
            participantCount: c.participants?.length ?? 0,
            problemCount:     c.problemSlugs?.length ?? 0,
            participants:     undefined, // don't leak full participant list in index
            // Fest Readiness Audit, P0-2: this list is a single shared,
            // unpersonalized cache (see cacheKey above) served to every
            // caller regardless of who they are — there's no way to
            // special-case "unless you're the organizer" here without
            // breaking that sharing. An upcoming contest's problemSlugs
            // (which, notably, `type=private` callers can request for
            // EVERY private contest at once, not just ones they're
            // involved in) must not be exposed here at all; problemCount
            // above already covers "how many problems," which is the
            // documented acceptable level of detail pre-start.
            problemSlugs:     isUpcoming ? undefined : c.problemSlugs,
            isActive:         now >= new Date(c.startsAt) && now <= new Date(c.endsAt),
          };
        });
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
// plus the "verified account required" gate as of Phase 12C
// (education.emailVerified).
//
// Deliberate: this checks emailVerified only, NOT collegeStatus === "verified".
// Hosting a student-created private contest doesn't grant the creator
// "official college" status or list the contest under an institution's
// official rankings (Contest.collegeDomain is sourced only from tpoProfile,
// never from student education — confirmed unused here). The gate's real
// purpose is "prove this is a real student with a real institutional inbox,"
// which emailVerified alone satisfies. Requiring full college approval here
// would be a stricter regression for students at not-yet-reviewed
// institutions, who have every right to host their own private contest.
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
      // possible to. "Verified" here means education.emailVerified (college
      // email confirmed) since that's the only verification concept
      // students have; there's no separate generic account-verification
      // flag in this codebase to check instead. See the module-level note
      // above for why this is emailVerified and not full collegeStatus.
      if (!req.userDoc.education?.emailVerified) {
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

    // Fest Readiness Audit, P1-5: retry once on the (astronomically
    // unlikely — 1-in-16.7M) chance of a collision, now that inviteCode
    // has a real uniqueness constraint (models/Contest.js) instead of
    // silently allowing two contests to share one code. A single retry is
    // enough — a second collision in a row is not worth engineering
    // around for a collection this small.
    const MAX_INVITE_CODE_ATTEMPTS = 2;
    let contest;
    for (let attempt = 1; attempt <= MAX_INVITE_CODE_ATTEMPTS; attempt++) {
      const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char e.g. "A3F9B2"
      try {
        contest = await Contest.create({
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
        break;
      } catch (err) {
        const isDuplicateInviteCode = err.code === 11000 && err.keyPattern?.inviteCode;
        if (isDuplicateInviteCode && attempt < MAX_INVITE_CODE_ATTEMPTS) {
          continue;
        }
        throw err;
      }
    }

    return res.status(201).json({ ...contest.toObject(), inviteCode: contest.inviteCode });
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

    // Fest Readiness Audit implementation, found while writing contest
    // lifecycle tests (P1-4): `contest.status` as stored is only ever set
    // once, at creation time ("upcoming" or "active" — see POST /private
    // above). It was never refreshed against the clock before these
    // status checks ran, so a contest created as "upcoming" would still
    // read as "upcoming" here forever, even long after it had actually
    // gone active or ended — meaning the "contest has ended" and "late
    // join disabled" checks just below could silently never fire.
    // syncContestStatus() already existed for exactly this (defined at the
    // top of this file) but was never actually called anywhere. Wiring it
    // in here is the fix — not a new mechanism, just using the one that
    // was already built.
    syncContestStatus(contest);
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

    // ── Contest detail leak (Fest Readiness Audit, P0-2) ────────────────────
    // Before start, only the organizer gets the real problemSlugs — even a
    // joined participant must wait for the contest to actually go active.
    // problemCount is always safe to return ("3 problems" is fine; the
    // actual slugs, before anyone is meant to see them, are not).
    const isOrganizer = contest.createdBy?.toString() === req.userDoc?._id?.toString();
    const revealProblems = status !== "upcoming" || isOrganizer;

    return res.json({
      ...contest,
      status,
      problemSlugs:  revealProblems ? contest.problemSlugs : undefined,
      problemCount:  contest.problemSlugs?.length ?? 0,
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

    // Same fix as POST /join-private above — see that route's comment.
    syncContestStatus(contest);
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

// ── POST /api/contests/:id/solve — legacy contest-solve endpoint ──────────────
// Fest Readiness Audit, P0-1: this used to award contest credit purely on
// the strength of a client-sent `{ slug }` — no proof the caller ever
// actually solved anything was required. That is no longer true.
//
// The real, trusted scoring path is now controllers/judgeController.js's
// submitHandler, which calls services/contestScoring.js's
// awardContestSolve() itself, immediately after computing a real Accepted
// verdict — see that file. This endpoint is kept only for any caller that
// hasn't migrated to sending `contestId` directly on POST /api/judge/submit
// (see src/hooks/useProblemSolver.js, which no longer calls this route as
// of the same change). It is NOT a second, independent way to score:
// before calling the same awardContestSolve(), it first requires proof —
// a real Submission document, written by the judge itself, showing this
// exact user was Accepted on this exact problem within this exact contest.
// No such Submission exists → no credit, full stop.
router.post("/:id/solve", async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required." });

    const proof = await Submission.exists({
      userId: req.userDoc._id,
      problemSlug: slug,
      contestId: req.params.id,
      status: "Accepted",
    });

    if (!proof) {
      return res.status(403).json({
        error: "No verified Accepted submission found for this problem in this contest.",
      });
    }

    const result = await awardContestSolve({
      contestId: req.params.id,
      userId: req.userDoc._id,
      slug,
    });

    if (!result.ok) {
      const statusByReason = {
        contest_not_found: 404,
        contest_not_active: 400,
        problem_not_in_contest: 400,
        not_joined: 403,
      };
      return res
        .status(statusByReason[result.reason] ?? 400)
        .json({ error: "Unable to record contest solve.", reason: result.reason });
    }

    return res.json({
      success: !result.alreadySolved,
      alreadySolved: result.alreadySolved,
      score: result.score,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to record solve." });
  }
});

export default router;