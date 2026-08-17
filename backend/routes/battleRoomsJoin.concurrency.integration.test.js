import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";
import BattleRoom from "../models/BattleRoom.js";
import User from "../models/User.js";
import battleRoomsRouter from "./battleRooms.js";

// ── Concurrency: Battle Room join race (real Mongo) ───────────────────────
//
// BUG FOUND & FIXED during this audit, in two stages (see
// routes/battleRooms.js's own comment on the /join handler for the full
// writeup): the original handler did a plain read → roster.push() →
// .save(). A first attempted fix assumed Mongoose's array-push versioning
// would make the loser's .save() throw a VersionError to retry on — a
// real local Mongo run against THIS EXACT test disproved that: both
// concurrent joins landed ("2 joined", never a VersionError), because
// MongoDB's own $push has no precondition and happily accepts two
// concurrent pushes past whatever capacity was true at each request's own
// read time. The real fix is a single atomic, conditional
// findOneAndUpdate — capacity check, already-joined check, and the $push
// itself all evaluated by MongoDB as ONE operation, so at most one of two
// concurrent requests for the same last slot can match. This file is the
// regression test: it proves against REAL Mongo (not a mock, which can't
// reproduce a genuine document-level write race at all) that two
// simultaneous joins to a near-full room result in exactly one success
// and one clean rejection — never a 500, and never two people occupying
// the same "final slot".

function extractJoinHandler() {
  const layer = battleRoomsRouter.stack.find(
    (l) => l.route && l.route.path === "/join" && l.route.methods.post
  );
  // [requireAuth, handler] — requireAuth itself is covered by its own
  // integration tests; here we inject req.userDoc directly, same pattern
  // used throughout this test suite for route handlers mounted behind it.
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

const joinHandler = extractJoinHandler();

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res._json = null;
  res.json.mockImplementation((body) => {
    res._json = body;
    return res;
  });
  res._status = 200;
  res.status.mockImplementation((code) => {
    res._status = code;
    return res;
  });
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

async function seedUser(overrides = {}) {
  return User.create({
    firebaseUid: `fb-${Math.random().toString(36).slice(2)}`,
    email: "joiner@test.com",
    ...overrides,
  });
}

async function seedLobbyRoom({ host, roster = [], maxTeamSize = 6 }) {
  return BattleRoom.create({
    title: "Race Room",
    createdBy: host._id,
    inviteCode: `INV-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
    status: "lobby",
    problemSlugs: ["two-sum"],
    durationMs: 30 * 60_000,
    maxTeamSize,
    roster,
    teams: [{ name: "Team A", score: 0, solvedSlugs: [] }, { name: "Team B", score: 0, solvedSlugs: [] }],
  });
}

describe("Battle Room /join — concurrency (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("two simultaneous joins for the LAST open slot: exactly one succeeds, the other gets a clean 409, never a 500", async () => {
    const host = await seedUser({ email: "host@test.com" });
    // maxTeamSize 1 → capacity is 2 (maxTeamSize * 2). One filler already
    // in the roster, so exactly one open slot remains for two racers.
    const filler = await seedUser({ email: "filler@test.com" });
    const room = await seedLobbyRoom({
      host,
      maxTeamSize: 1,
      roster: [{ userId: filler._id, teamIndex: null, solvedSlugs: [] }],
    });

    const racerA = await seedUser({ email: "racerA@test.com" });
    const racerB = await seedUser({ email: "racerB@test.com" });

    const resA = mockRes();
    const resB = mockRes();

    await Promise.all([
      joinHandler({ body: { inviteCode: room.inviteCode }, userDoc: racerA, log: mockLog() }, resA),
      joinHandler({ body: { inviteCode: room.inviteCode }, userDoc: racerB, log: mockLog() }, resB),
    ]);

    // Never a 500 — the whole point of the fix.
    expect(resA._status).not.toBe(500);
    expect(resB._status).not.toBe(500);

    const outcomes = [resA, resB].map((r) => (r._json?.success ? "joined" : "rejected"));
    expect(outcomes.filter((o) => o === "joined").length).toBe(1);
    expect(outcomes.filter((o) => o === "rejected").length).toBe(1);

    const rejected = resA._json?.success ? resB : resA;
    expect(rejected._status).toBe(409);
    expect(rejected._json.error).toMatch(/full/i);

    const reloaded = await BattleRoom.findById(room._id).lean();
    // Exactly one racer actually landed in the roster (plus the filler) —
    // never both, never neither.
    expect(reloaded.roster.length).toBe(2);
  });

  it("two simultaneous joins to a room with plenty of room both succeed (no spurious 500 on a non-full race)", async () => {
    const host = await seedUser({ email: "host2@test.com" });
    const room = await seedLobbyRoom({ host, maxTeamSize: 6, roster: [] });

    const racerA = await seedUser({ email: "racerC@test.com" });
    const racerB = await seedUser({ email: "racerD@test.com" });

    const resA = mockRes();
    const resB = mockRes();

    await Promise.all([
      joinHandler({ body: { inviteCode: room.inviteCode }, userDoc: racerA, log: mockLog() }, resA),
      joinHandler({ body: { inviteCode: room.inviteCode }, userDoc: racerB, log: mockLog() }, resB),
    ]);

    expect(resA._json?.success).toBe(true);
    expect(resB._json?.success).toBe(true);

    const reloaded = await BattleRoom.findById(room._id).lean();
    expect(reloaded.roster.length).toBe(2);
    const ids = reloaded.roster.map((r) => r.userId.toString()).sort();
    expect(ids).toEqual([racerA._id.toString(), racerB._id.toString()].sort());
  });
});