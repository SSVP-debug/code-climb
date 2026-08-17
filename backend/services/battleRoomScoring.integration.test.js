import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";
import BattleRoom from "../models/BattleRoom.js";
import User from "../models/User.js";
import {
  awardBattleRoomSolve,
  BATTLE_ROOM_SOLVE_REJECTION,
} from "./battleRoomScoring.js";

// ── P0 workflow: Accepted Submission → Battle Room ────────────────────────
//
// services/battleRoomScoring.test.js already covers this rule matrix as a
// mocked unit test. This file is the real-Mongo counterpart: it exists
// specifically to prove the two-step atomic findOneAndUpdate pattern
// (personal solve, then team solve) behaves correctly against MongoDB's
// actual update/query semantics — including genuine concurrent writes,
// which a mock cannot meaningfully simulate (a mocked model can only ever
// return what the test told it to return, not race two real writes
// against each other the way Mongo's own document-level locking does).

async function seedUser(overrides = {}) {
  return User.create({
    firebaseUid: `fb-${Math.random().toString(36).slice(2)}`,
    email: "battler@test.com",
    ...overrides,
  });
}

async function seedRoom({
  status = "active",
  problemSlugs = ["two-sum"],
  roster = [],
  teams = [{ name: "Team A", score: 0, solvedSlugs: [] }, { name: "Team B", score: 0, solvedSlugs: [] }],
  host,
  endsInMs = 60_000,
}) {
  const now = Date.now();
  return BattleRoom.create({
    title: "Test Battle",
    createdBy: host._id,
    inviteCode: `INV-${Math.random().toString(36).slice(2, 8)}`,
    status,
    problemSlugs,
    durationMs: 30 * 60_000,
    startsAt: status === "active" || status === "ended" ? new Date(now - 30_000) : null,
    endsAt: status === "active" ? new Date(now + endsInMs) : status === "ended" ? new Date(now - 1_000) : null,
    roster,
    teams,
  });
}

describe("awardBattleRoomSolve — real Mongo rule matrix", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("awards personal + team credit exactly once for a valid Accepted solve", async () => {
    const host = await seedUser({ email: "host1@test.com" });
    const member = await seedUser({ email: "member1@test.com" });
    const room = await seedRoom({
      host,
      roster: [{ userId: member._id, teamIndex: 0, solvedSlugs: [] }],
    });

    const result = await awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" });

    expect(result.ok).toBe(true);
    expect(result.alreadySolvedPersonally).toBe(false);
    expect(result.countedForTeam).toBe(true);
    expect(result.teamScore).toBe(100);

    const reloaded = await BattleRoom.findById(room._id).lean();
    expect(reloaded.roster[0].solvedSlugs).toEqual(["two-sum"]);
    expect(reloaded.teams[0].score).toBe(100);
    expect(reloaded.teams[0].solvedSlugs).toEqual(["two-sum"]);
  });

  it("does not award a second team credit when a teammate has already solved the same slug", async () => {
    const host = await seedUser({ email: "host2@test.com" });
    const memberA = await seedUser({ email: "memberA2@test.com" });
    const memberB = await seedUser({ email: "memberB2@test.com" });
    const room = await seedRoom({
      host,
      roster: [
        { userId: memberA._id, teamIndex: 0, solvedSlugs: [] },
        { userId: memberB._id, teamIndex: 0, solvedSlugs: [] },
      ],
    });

    const first = await awardBattleRoomSolve({ battleRoomId: room._id, userId: memberA._id, slug: "two-sum" });
    const second = await awardBattleRoomSolve({ battleRoomId: room._id, userId: memberB._id, slug: "two-sum" });

    expect(first.countedForTeam).toBe(true);
    expect(first.teamScore).toBe(100);
    // Second teammate still gets personal credit for their own solve...
    expect(second.ok).toBe(true);
    expect(second.alreadySolvedPersonally).toBe(false);
    // ...but the team is NOT double-scored.
    expect(second.countedForTeam).toBe(false);
    expect(second.teamScore).toBe(100);

    const reloaded = await BattleRoom.findById(room._id).lean();
    expect(reloaded.teams[0].score).toBe(100);
    expect(reloaded.roster.find((r) => r.userId.toString() === memberA._id.toString()).solvedSlugs).toEqual(["two-sum"]);
    expect(reloaded.roster.find((r) => r.userId.toString() === memberB._id.toString()).solvedSlugs).toEqual(["two-sum"]);
  });

  it("is idempotent: a duplicate Accepted for an already-solved slug reports alreadySolvedPersonally, no re-award", async () => {
    const host = await seedUser({ email: "host3@test.com" });
    const member = await seedUser({ email: "member3@test.com" });
    const room = await seedRoom({
      host,
      roster: [{ userId: member._id, teamIndex: 0, solvedSlugs: [] }],
    });

    await awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" });
    const duplicate = await awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" });

    expect(duplicate.ok).toBe(true);
    expect(duplicate.alreadySolvedPersonally).toBe(true);
    expect(duplicate.countedForTeam).toBe(false);
    expect(duplicate.teamScore).toBe(100);

    const reloaded = await BattleRoom.findById(room._id).lean();
    expect(reloaded.teams[0].score).toBe(100);
  });

  it("rejects a solve from a user who never joined the room", async () => {
    const host = await seedUser({ email: "host4@test.com" });
    const outsider = await seedUser({ email: "outsider4@test.com" });
    const room = await seedRoom({ host, roster: [] });

    const result = await awardBattleRoomSolve({ battleRoomId: room._id, userId: outsider._id, slug: "two-sum" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe(BATTLE_ROOM_SOLVE_REJECTION.NOT_PARTICIPANT);
  });

  it("rejects a solve from a joined member who hasn't been assigned to a team yet", async () => {
    const host = await seedUser({ email: "host5@test.com" });
    const member = await seedUser({ email: "member5@test.com" });
    const room = await seedRoom({
      host,
      roster: [{ userId: member._id, teamIndex: null, solvedSlugs: [] }],
    });

    const result = await awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe(BATTLE_ROOM_SOLVE_REJECTION.NOT_ON_TEAM);
  });

  it("rejects a solve for a problem slug that doesn't belong to this room (wrong room)", async () => {
    const host = await seedUser({ email: "host6@test.com" });
    const member = await seedUser({ email: "member6@test.com" });
    const room = await seedRoom({
      host,
      problemSlugs: ["some-other-problem"],
      roster: [{ userId: member._id, teamIndex: 0, solvedSlugs: [] }],
    });

    const result = await awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe(BATTLE_ROOM_SOLVE_REJECTION.NOT_IN_ROOM);
  });

  it("rejects a solve once the battle has ended, even if status still reads 'active'", async () => {
    const host = await seedUser({ email: "host7@test.com" });
    const member = await seedUser({ email: "member7@test.com" });
    // endsInMs negative → endsAt already in the past, status left "active"
    // to prove the time check (not the status flag) is what's enforced.
    const room = await seedRoom({
      host,
      roster: [{ userId: member._id, teamIndex: 0, solvedSlugs: [] }],
      endsInMs: -60_000,
    });

    const result = await awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe(BATTLE_ROOM_SOLVE_REJECTION.NOT_ACTIVE);
  });

  it("rejects a solve against a room still in the lobby (never started)", async () => {
    const host = await seedUser({ email: "host8@test.com" });
    const member = await seedUser({ email: "member8@test.com" });
    const room = await seedRoom({
      host,
      status: "lobby",
      roster: [{ userId: member._id, teamIndex: 0, solvedSlugs: [] }],
    });

    const result = await awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe(BATTLE_ROOM_SOLVE_REJECTION.NOT_ACTIVE);
  });

  it("two truly concurrent solve attempts for the same (member, slug) result in exactly one personal credit and one team award", async () => {
    const host = await seedUser({ email: "host9@test.com" });
    const member = await seedUser({ email: "member9@test.com" });
    const room = await seedRoom({
      host,
      roster: [{ userId: member._id, teamIndex: 0, solvedSlugs: [] }],
    });

    const [a, b] = await Promise.all([
      awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" }),
      awardBattleRoomSolve({ battleRoomId: room._id, userId: member._id, slug: "two-sum" }),
    ]);

    expect([a.alreadySolvedPersonally, b.alreadySolvedPersonally].filter((v) => v === false).length).toBe(1);

    const reloaded = await BattleRoom.findById(room._id).lean();
    expect(reloaded.roster[0].solvedSlugs).toEqual(["two-sum"]);
    expect(reloaded.teams[0].score).toBe(100);
    expect(reloaded.teams[0].solvedSlugs).toEqual(["two-sum"]);
  });

  it("two different teammates racing to solve the same slug still only award the team once", async () => {
    const host = await seedUser({ email: "host10@test.com" });
    const memberA = await seedUser({ email: "memberA10@test.com" });
    const memberB = await seedUser({ email: "memberB10@test.com" });
    const room = await seedRoom({
      host,
      roster: [
        { userId: memberA._id, teamIndex: 0, solvedSlugs: [] },
        { userId: memberB._id, teamIndex: 0, solvedSlugs: [] },
      ],
    });

    const [a, b] = await Promise.all([
      awardBattleRoomSolve({ battleRoomId: room._id, userId: memberA._id, slug: "two-sum" }),
      awardBattleRoomSolve({ battleRoomId: room._id, userId: memberB._id, slug: "two-sum" }),
    ]);

    // Both are real, distinct personal solves — neither is a duplicate of
    // the other (different roster entries) — but only one may count for
    // the shared team score.
    expect(a.alreadySolvedPersonally).toBe(false);
    expect(b.alreadySolvedPersonally).toBe(false);
    expect([a.countedForTeam, b.countedForTeam].filter(Boolean).length).toBe(1);

    const reloaded = await BattleRoom.findById(room._id).lean();
    expect(reloaded.teams[0].score).toBe(100);
  });
});