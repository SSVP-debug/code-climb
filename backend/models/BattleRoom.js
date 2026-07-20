import mongoose from "mongoose";

/**
 * BattleRoom (Phase 12E) — team-vs-team competitions, kept as a separate
 * model from Contest per Bunny's decision: teams don't fit the existing
 * participants[] shape, and Battle Rooms have a lobby/assignment step
 * Contests don't. Reuses Contest's *patterns* (invite code, problemSlugs,
 * SOLVE_SCORE convention, computeRankings-style logic) without sharing
 * the collection.
 *
 * Lifecycle: lobby → active → ended (mirrors Contest's upcoming/active/ended,
 * renamed "lobby" since nothing is scheduled yet — the host assembles
 * teams from whoever's joined, then starts the match manually).
 *
 * Scoring (confirmed): a problem counts toward a team's score the first
 * time ANY teammate solves it — no double-counting if a second teammate
 * solves the same one. Individual solves are still recorded per-member
 * for post-match statistics, even when they don't add team points.
 * That's why there are two solvedSlugs lists below: roster[i].solvedSlugs
 * (personal) and teams[j].solvedSlugs (team-deduped, drives score).
 */
const battleRoomSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inviteCode:  { type: String, required: true, unique: true },

    status: { type: String, enum: ["lobby", "active", "ended"], default: "lobby" },

    problemSlugs: [{ type: String }],

    // Guardrails (mirror the confirmed private-contest limits where they
    // apply — student hosting, verified account, one active room at a
    // time, enforced in the route, not here).
    maxTeamSize: { type: Number, default: 6 },
    durationMs:  { type: Number, required: true }, // fixed at creation; timer starts at /start

    startsAt: { type: Date, default: null }, // set when host starts the match
    endsAt:   { type: Date, default: null }, // startsAt + durationMs, computed at /start

    // Master roster — everyone who has joined via invite code, whether or
    // not they've been placed on a team yet. teamIndex is 0, 1, or null
    // (still in the lobby, unassigned).
    roster: [{
      userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      username:    { type: String },
      displayName: { type: String },
      joinedAt:    { type: Date, default: Date.now },
      teamIndex:   { type: Number, default: null },
      // This member's own solves — always recorded, even for a problem a
      // teammate already solved (that just doesn't add team score twice).
      solvedSlugs: [{ type: String }],
    }],

    // Exactly 2 teams for v1 (confirmed) — created empty at room creation,
    // populated by /assign-teams. solvedSlugs here is team-deduped and is
    // what score is actually derived from.
    teams: [{
      name:        { type: String, required: true },
      score:       { type: Number, default: 0 },
      solvedSlugs: [{ type: String }],
    }],
  },
  { timestamps: true }
);

export default mongoose.model("BattleRoom", battleRoomSchema);