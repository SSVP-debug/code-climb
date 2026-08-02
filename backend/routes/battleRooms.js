import { Router } from "express";
import { logger } from "../config/logger.js";
import crypto from "crypto";
import BattleRoom from "../models/BattleRoom.js";
import Problem from "../models/Problem.js";
import { requireRole } from "../middleware/roleGuard.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const SOLVE_SCORE = 100;

// Mirrors the confirmed private-contest guardrails (Phase 12B) — same
// spirit, own limits, since Battle Rooms are a separate hosting slot.
const STUDENT_ROOM_LIMITS = {
  MAX_PROBLEMS:     8,
  MIN_TEAM_SIZE:    2,
  MAX_TEAM_SIZE:    6,
  MIN_DURATION_MS:  30 * 60 * 1000,
  MAX_DURATION_MS:  4 * 60 * 60 * 1000,
};

const TEAM_NAMES = ["Team Alpha", "Team Beta"];

function genInviteCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

// ── POST /api/battle-rooms — create a room (lobby state) ───────────────────
router.post("/", requireRole("student", "tpo", "admin"), async (req, res) => {
  try {
    const { title, description, problemSlugs, durationMinutes, maxTeamSize } = req.body;
    const isStudent = req.userDoc.role === "student";

    if (!title?.trim() || !problemSlugs?.length || !durationMinutes) {
      return res.status(400).json({ error: "title, problemSlugs, and durationMinutes are required." });
    }

    let teamSize = Number(maxTeamSize) || 4;
    let durationMs = Number(durationMinutes) * 60 * 1000;

    if (isStudent) {
      if (!req.userDoc.education?.emailVerified) {
        return res.status(403).json({
          error: "Verify your college email before hosting a Battle Room.",
          code: "HOST_NOT_VERIFIED",
        });
      }
      if (problemSlugs.length > STUDENT_ROOM_LIMITS.MAX_PROBLEMS) {
        return res.status(400).json({ error: `Battle Rooms can have at most ${STUDENT_ROOM_LIMITS.MAX_PROBLEMS} problems.` });
      }
      if (durationMs < STUDENT_ROOM_LIMITS.MIN_DURATION_MS || durationMs > STUDENT_ROOM_LIMITS.MAX_DURATION_MS) {
        return res.status(400).json({ error: "Match duration must be between 30 minutes and 4 hours." });
      }
      teamSize = Math.min(
        Math.max(teamSize, STUDENT_ROOM_LIMITS.MIN_TEAM_SIZE),
        STUDENT_ROOM_LIMITS.MAX_TEAM_SIZE
      );

      // One active/lobby hosted Battle Room at a time — a separate slot
      // from private contests (confirmed), so this only checks other
      // Battle Rooms this student is hosting, not their contests.
      const existingActive = await BattleRoom.findOne({
        createdBy: req.userDoc._id,
        status: { $in: ["lobby", "active"] },
      }).lean();
      if (existingActive) {
        return res.status(409).json({
          error: "You already have an active or in-progress Battle Room. It must end before you can host another.",
        });
      }
    }

    const found = await Problem.countDocuments({ slug: { $in: problemSlugs } });
    if (found !== problemSlugs.length) {
      return res.status(400).json({ error: "One or more problem slugs are invalid." });
    }

    const room = await BattleRoom.create({
      title: title.trim(),
      description: description?.trim() || "",
      createdBy: req.userDoc._id,
      inviteCode: genInviteCode(),
      problemSlugs,
      maxTeamSize: teamSize,
      durationMs,
      roster: [],
      teams: TEAM_NAMES.map((name) => ({ name, score: 0, solvedSlugs: [] })),
    });

    return res.status(201).json(room.toObject());
  } catch (err) {
    (req.log || logger).error({ err }, "[BattleRoom] create");
    return res.status(500).json({ error: "Failed to create Battle Room." });
  }
});

// ── POST /api/battle-rooms/join — join the lobby via invite code ───────────
router.post("/join", requireAuth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: "inviteCode required." });

    const room = await BattleRoom.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Invalid invite code." });
    if (room.status !== "lobby") {
      return res.status(400).json({ error: "This Battle Room has already started or ended." });
    }

    const alreadyJoined = room.roster.some((r) => r.userId.toString() === req.userDoc._id.toString());
    if (alreadyJoined) {
      return res.json({ alreadyJoined: true, roomId: room._id });
    }

    if (room.roster.length >= room.maxTeamSize * 2) {
      return res.status(409).json({ error: "This Battle Room is full." });
    }

    room.roster.push({
      userId: req.userDoc._id,
      username: req.userDoc.username,
      displayName: req.userDoc.displayName,
      teamIndex: null,
      solvedSlugs: [],
    });
    await room.save();

    return res.json({ success: true, roomId: room._id, title: room.title });
  } catch (err) {
    (req.log || logger).error({ err }, "[BattleRoom] join");
    return res.status(500).json({ error: "Failed to join Battle Room." });
  }
});

// ── POST /api/battle-rooms/:id/assign-teams — host assigns roster to teams ─
router.post("/:id/assign-teams", requireAuth, async (req, res) => {
  try {
    const room = await BattleRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Battle Room not found." });
    if (room.createdBy.toString() !== req.userDoc._id.toString()) {
      return res.status(403).json({ error: "Only the host can assign teams." });
    }
    if (room.status !== "lobby") {
      return res.status(400).json({ error: "Teams can only be assigned before the match starts." });
    }

    const { mode, assignments } = req.body;

    if (mode === "random") {
      // Fisher–Yates shuffle, then alternate 0/1/0/1... — keeps team sizes
      // within 1 of each other regardless of roster size.
      const shuffled = [...room.roster];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      shuffled.forEach((member, i) => {
        const target = room.roster.find((r) => r.userId.toString() === member.userId.toString());
        target.teamIndex = i % 2;
      });
    } else if (mode === "manual") {
      if (!Array.isArray(assignments)) {
        return res.status(400).json({ error: "assignments array required for manual mode." });
      }
      for (const { userId, teamIndex } of assignments) {
        if (teamIndex !== null && teamIndex !== 0 && teamIndex !== 1) {
          return res.status(400).json({ error: "teamIndex must be 0, 1, or null." });
        }
        const member = room.roster.find((r) => r.userId.toString() === String(userId));
        if (member) member.teamIndex = teamIndex;
      }
      // Enforce the size cap after manual assignment, not per-assignment,
      // since a host might be mid-rebalance across two calls.
      for (const idx of [0, 1]) {
        const count = room.roster.filter((r) => r.teamIndex === idx).length;
        if (count > room.maxTeamSize) {
          return res.status(400).json({ error: `${room.teams[idx].name} would exceed the ${room.maxTeamSize}-person cap.` });
        }
      }
    } else {
      return res.status(400).json({ error: 'mode must be "random" or "manual".' });
    }

    await room.save();
    return res.json(room.toObject());
  } catch (err) {
    (req.log || logger).error({ err }, "[BattleRoom] assign-teams");
    return res.status(500).json({ error: "Failed to assign teams." });
  }
});

// ── POST /api/battle-rooms/:id/start — host starts the match ───────────────
router.post("/:id/start", requireAuth, async (req, res) => {
  try {
    const room = await BattleRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Battle Room not found." });
    if (room.createdBy.toString() !== req.userDoc._id.toString()) {
      return res.status(403).json({ error: "Only the host can start the match." });
    }
    if (room.status !== "lobby") {
      return res.status(400).json({ error: "This match has already started." });
    }

    const teamCounts = [0, 1].map((idx) => room.roster.filter((r) => r.teamIndex === idx).length);
    if (teamCounts[0] === 0 || teamCounts[1] === 0) {
      return res.status(400).json({ error: "Both teams need at least one member before starting." });
    }

    const now = new Date();
    room.status = "active";
    room.startsAt = now;
    room.endsAt = new Date(now.getTime() + room.durationMs);
    await room.save();

    return res.json(room.toObject());
  } catch (err) {
    (req.log || logger).error({ err }, "[BattleRoom] start");
    return res.status(500).json({ error: "Failed to start match." });
  }
});

// ── GET /api/battle-rooms/mine — rooms the caller created or joined ────────
// Registered before /:id — same reason as Contest's /mine route.
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const rooms = await BattleRoom.find({
      $or: [{ createdBy: req.userDoc._id }, { "roster.userId": req.userDoc._id }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("title status startsAt endsAt teams roster createdBy")
      .lean();

    const mine = rooms.map((r) => {
      const myEntry = r.roster.find((m) => m.userId.toString() === req.userDoc._id.toString());
      const myTeam = myEntry?.teamIndex != null ? r.teams[myEntry.teamIndex] : null;
      return {
        _id: r._id,
        title: r.title,
        status: r.status,
        isHost: r.createdBy.toString() === req.userDoc._id.toString(),
        myTeamName: myTeam?.name ?? null,
        myTeamScore: myTeam?.score ?? null,
      };
    });

    return res.json({ rooms: mine });
  } catch (err) {
    (req.log || logger).error({ err }, "[BattleRoom] mine");
    return res.status(500).json({ error: "Failed to load your Battle Rooms." });
  }
});

// ── GET /api/battle-rooms/:id — detail + poll target ────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const room = await BattleRoom.findById(req.params.id).lean();
    if (!room) return res.status(404).json({ error: "Battle Room not found." });

    // Display-only status sync, same pattern as Contest's /:id — the DB
    // field flips permanently at /start, but "active past its endsAt"
    // should read as ended in the UI even before any write happens.
    const now = new Date();
    const displayStatus =
      room.status === "active" && room.endsAt && now > new Date(room.endsAt)
        ? "ended"
        : room.status;

    const myId = req.userDoc?._id?.toString();
    const myEntry = myId ? room.roster.find((r) => r.userId.toString() === myId) : null;

    return res.json({
      ...room,
      status: displayStatus,
      isHost: myId ? room.createdBy.toString() === myId : false,
      myTeamIndex: myEntry?.teamIndex ?? null,
      mySolvedSlugs: myEntry?.solvedSlugs ?? [],
      isJoined: Boolean(myEntry),
    });
  } catch (err) {
    (req.log || logger).error({ err }, "[BattleRoom] detail");
    return res.status(500).json({ error: "Failed to load Battle Room." });
  }
});

// ── POST /api/battle-rooms/:id/solve — report a solve ───────────────────────
router.post("/:id/solve", requireAuth, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: "slug required." });

    const room = await BattleRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Battle Room not found." });

    // Time-based check, not just the status flag — a Battle Room can sit
    // "active" in the DB past its actual endsAt if nothing else has
    // written to it since (same gap Contest has; not copying it here).
    const now = new Date();
    if (room.status !== "active" || (room.endsAt && now > room.endsAt)) {
      return res.status(400).json({ error: "This Battle Room isn't active." });
    }
    if (!room.problemSlugs.includes(slug)) {
      return res.status(400).json({ error: "Problem not in this Battle Room." });
    }

    // Step 1 (atomic): record this member's own solve. Filter requires
    // teamIndex to be set (must be on a team) and this slug not already
    // personally solved — protects against double-submit races.
    const afterPersonal = await BattleRoom.findOneAndUpdate(
      {
        _id: req.params.id,
        roster: { $elemMatch: { userId: req.userDoc._id, teamIndex: { $ne: null }, solvedSlugs: { $ne: slug } } },
      },
      { $push: { "roster.$.solvedSlugs": slug } },
      { new: true }
    );

    if (!afterPersonal) {
      // Either not on a team, or already personally recorded this slug —
      // check which, for a clearer response.
      const current = await BattleRoom.findById(req.params.id).lean();
      const entry = current?.roster.find((r) => r.userId.toString() === req.userDoc._id.toString());
      if (!entry || entry.teamIndex == null) {
        return res.status(403).json({ error: "Join a team before submitting solves." });
      }
      return res.json({ success: true, alreadySolvedPersonally: true, countedForTeam: false });
    }

    const myEntry = afterPersonal.roster.find((r) => r.userId.toString() === req.userDoc._id.toString());
    const teamIndex = myEntry.teamIndex;

    // Step 2 (atomic): only the first teammate to solve this slug bumps
    // the team's score — the filter fails for anyone who loses the race
    // (or arrives after a teammate already solved it), and that's correct.
    const teamPath = `teams.${teamIndex}.solvedSlugs`;
    const afterTeam = await BattleRoom.findOneAndUpdate(
      { _id: req.params.id, [teamPath]: { $ne: slug } },
      {
        $push: { [teamPath]: slug },
        $inc: { [`teams.${teamIndex}.score`]: SOLVE_SCORE },
      },
      { new: true }
    );

    const countedForTeam = Boolean(afterTeam);
    const finalRoom = afterTeam || afterPersonal;
    const teamScore = finalRoom.teams[teamIndex].score;

    return res.json({ success: true, countedForTeam, teamScore, teamIndex });
  } catch (err) {
    (req.log || logger).error({ err }, "[BattleRoom] solve");
    return res.status(500).json({ error: "Failed to record solve." });
  }
});

export default router;