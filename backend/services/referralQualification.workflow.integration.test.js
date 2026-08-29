import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

// ── Referral Qualification workflow (revised) ──────────────────────────────
//
// Covers, all against real Mongo (mocked Judge0 only):
//   1. The submitHandler wiring — a real server-computed Accepted verdict
//      is what triggers qualification, never a bare client claim.
//   2. Practice-only scope — contest/Battle Room Accepted submissions never
//      qualify a referral, even genuinely Accepted ones.
//   3. Timing rule (Option A) — a referral applied AFTER the referred
//      user's first accepted practice solve is marked ineligible at
//      association time and can never qualify.
//   4. The association race fix — concurrent /apply-equivalent atomic
//      updates against the same account, only one can win.
//   5. Reward failure recovery — retryPendingReferralRewards() picks up
//      and successfully issues a reward that failed/was skipped earlier,
//      without double-issuing anything already issued.

const callJudge0 = vi.fn();

vi.mock("../controllers/compilerController.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, callJudge0 };
});

const { submitHandler } = await import("../controllers/judgeController.js");
const {
  qualifyReferralIfFirstSolve,
  createReferralAssociationQualification,
  retryPendingReferralRewards,
} = await import("./referralQualification.js");
const { saveSubscriptionIfMatch } = await import("./userSubscriptionService.js");
const { default: User } = await import("../models/User.js");
const { default: Submission } = await import("../models/Submission.js");
const { default: ReferralQualification } = await import("../models/ReferralQualification.js");
const { default: RewardLedger } = await import("../models/RewardLedger.js");
const { seedProblem } = await import("../test/fixtures/problem.js");

const REWARD_ENV_KEYS = [
  "REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER",
  "REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED",
];

function clearRewardEnv() {
  for (const key of REWARD_ENV_KEYS) delete process.env[key];
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

async function seedUser(overrides = {}) {
  return User.create({
    firebaseUid: `fb-${Math.random().toString(36).slice(2)}`,
    email: `user-${Math.random().toString(36).slice(2)}@test.com`,
    ...overrides,
  });
}

function submitReq({ userDoc, code = "def twoSum(): return []", extraBody = {} }) {
  return {
    userDoc,
    log: mockLog(),
    body: {
      problemSlug: "two-sum",
      code,
      language: "python",
      visibletestcases: [],
      ...extraBody,
    },
  };
}

function acceptedJudge0Response() {
  return { stdout: JSON.stringify([]), stderr: "", compile_output: "" };
}

const FAKE_OBJECT_ID = "507f1f77bcf86cd799439011";

describe("Accepted Submission → Referral Qualification: submitHandler wiring + scope (real Mongo, mocked Judge0)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    vi.clearAllMocks();
    clearRewardEnv();
  });

  afterEach(async () => {
    await clearTestMongo();
    clearRewardEnv();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("qualifies on a genuine first Accepted PRACTICE submission and issues both configured rewards", async () => {
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const referrer = await seedUser({ email: "referrer@test.com" });
    const referred = await seedUser({ email: "referred@test.com" });
    await seedProblem();
    await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    callJudge0.mockResolvedValue(acceptedJudge0Response());
    const res = mockRes();

    await submitHandler(submitReq({ userDoc: referred }), res);

    const qualification = await ReferralQualification.findOne({ referredUserId: referred._id });
    expect(qualification.status).toBe("qualified");
    expect(qualification.qualifiedAt).not.toBeNull();
    expect(qualification.rewardStatus).toBe("issued");

    const referrerLedger = await RewardLedger.findOne({ userId: referrer._id });
    expect(referrerLedger.amount).toBe(100);
    expect(referrerLedger.type).toBe("REFERRAL_QUALIFIED_REFERRER");

    const referredLedger = await RewardLedger.findOne({ userId: referred._id });
    expect(referredLedger.amount).toBe(50);
    expect(referredLedger.type).toBe("REFERRAL_QUALIFIED_REFERRED");
  });

  it("does NOT qualify on a first Accepted CONTEST submission — practice-only scope", async () => {
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const referrer = await seedUser({ email: "referrerContest@test.com" });
    const referred = await seedUser({ email: "referredContest@test.com" });
    await seedProblem();
    await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    callJudge0.mockResolvedValue(acceptedJudge0Response());
    const res = mockRes();

    await submitHandler(
      submitReq({ userDoc: referred, extraBody: { contestId: FAKE_OBJECT_ID } }),
      res
    );

    const qualification = await ReferralQualification.findOne({ referredUserId: referred._id });
    expect(qualification.status).toBe("pending");
    expect(qualification.qualifiedAt).toBeNull();
    expect(await RewardLedger.countDocuments({})).toBe(0);
  });

  it("does NOT qualify on a first Accepted Battle Room submission — practice-only scope", async () => {
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const referrer = await seedUser({ email: "referrerBR@test.com" });
    const referred = await seedUser({ email: "referredBR@test.com" });
    await seedProblem();
    await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    callJudge0.mockResolvedValue(acceptedJudge0Response());
    const res = mockRes();

    await submitHandler(
      submitReq({ userDoc: referred, extraBody: { battleRoomId: FAKE_OBJECT_ID } }),
      res
    );

    const qualification = await ReferralQualification.findOne({ referredUserId: referred._id });
    expect(qualification.status).toBe("pending");
    expect(await RewardLedger.countDocuments({})).toBe(0);
  });

  it("a later Accepted PRACTICE submission still qualifies after an earlier Accepted CONTEST submission by the same referred user", async () => {
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const referrer = await seedUser({ email: "referrerMix@test.com" });
    const referred = await seedUser({ email: "referredMix@test.com" });
    await seedProblem();
    await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    callJudge0.mockResolvedValue(acceptedJudge0Response());

    // First: an Accepted CONTEST submission — must not qualify.
    await submitHandler(
      submitReq({ userDoc: referred, extraBody: { contestId: FAKE_OBJECT_ID } }),
      mockRes()
    );
    // Then: a genuine Accepted PRACTICE submission — should qualify.
    await submitHandler(submitReq({ userDoc: referred }), mockRes());

    const qualification = await ReferralQualification.findOne({ referredUserId: referred._id });
    expect(qualification.status).toBe("qualified");
    expect(await RewardLedger.countDocuments({ userId: referrer._id })).toBe(1);
  });

  it("does not create a second qualification/reward on a second Accepted practice submission by the same referred user", async () => {
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const referrer = await seedUser({ email: "referrer3@test.com" });
    const referred = await seedUser({ email: "referred3@test.com" });
    await seedProblem({ slug: "two-sum" });
    await seedProblem({ id: 2, slug: "three-sum", title: "Three Sum", functionName: "threeSum" });
    await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    callJudge0.mockResolvedValue(acceptedJudge0Response());
    await submitHandler(submitReq({ userDoc: referred }), mockRes());
    await submitHandler(
      { ...submitReq({ userDoc: referred }), body: { ...submitReq({ userDoc: referred }).body, problemSlug: "three-sum" } },
      mockRes()
    );

    expect(await ReferralQualification.countDocuments({ referredUserId: referred._id })).toBe(1);
    expect(await RewardLedger.countDocuments({ userId: referrer._id })).toBe(1);
    expect(await RewardLedger.countDocuments({ userId: referred._id })).toBe(1);
  });

  it("does not qualify or reward for a guest (no req.userDoc)", async () => {
    await seedProblem();
    callJudge0.mockResolvedValue(acceptedJudge0Response());

    await submitHandler(submitReq({ userDoc: null }), mockRes());

    expect(await ReferralQualification.countDocuments({})).toBe(0);
    expect(await RewardLedger.countDocuments({})).toBe(0);
    expect(await Submission.countDocuments({})).toBe(0);
  });

  it("qualifies (records status:qualified) even when reward policy amounts are unconfigured — qualification and reward are decoupled", async () => {
    const referrer = await seedUser({ email: "referrer4@test.com" });
    const referred = await seedUser({ email: "referred4@test.com" });
    await seedProblem();
    await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    callJudge0.mockResolvedValue(acceptedJudge0Response());
    await submitHandler(submitReq({ userDoc: referred }), mockRes());

    const qualification = await ReferralQualification.findOne({ referredUserId: referred._id });
    expect(qualification.status).toBe("qualified");
    expect(qualification.rewardStatus).toBe("skipped_unconfigured");
    expect(await RewardLedger.countDocuments({})).toBe(0);
  });
});

describe("Timing rule (Option A): referral applied after first accepted practice solve", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    clearRewardEnv();
  });

  afterEach(async () => {
    await clearTestMongo();
    clearRewardEnv();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("marks a late-applied referral ineligible immediately, and it never qualifies even on a later Accepted practice submission", async () => {
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const referrer = await seedUser({ email: "referrerLate@test.com" });
    const referred = await seedUser({ email: "referredLate@test.com" });
    await seedProblem();

    // The referred user already solved a practice problem BEFORE any
    // referral was applied.
    await Submission.create({
      userId: referred._id,
      problemSlug: "two-sum",
      language: "python",
      status: "Accepted",
      passed: 1,
      total: 1,
    });

    // Referral applied only now, after that prior solve.
    const row = await createReferralAssociationQualification({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });
    expect(row.status).toBe("ineligible");
    expect(row.ineligibleReason).toBe("referral_applied_after_first_accepted_practice_solve");

    // Even a later genuine Accepted practice submission must not qualify it.
    // This has to be a real, persisted Submission — qualifyReferralIfFirstSolve
    // determines "first solve" from actual Accepted-practice submission
    // COUNT, so without a second real row here this call would still see
    // count === 1 and misleadingly hit the (different) not_referred_or_not_pending
    // path instead of exercising the "later solve" case this test is
    // actually named for. Its real _id is also what qualificationSourceSubmissionId
    // expects (an ObjectId reference to a real Submission), not a fake string.
    await seedProblem({ id: 2, slug: "three-sum", title: "Three Sum", functionName: "threeSum" });
    const laterSubmission = await Submission.create({
      userId: referred._id,
      problemSlug: "three-sum",
      language: "python",
      status: "Accepted",
      passed: 1,
      total: 1,
    });
    const result = await qualifyReferralIfFirstSolve({
      userId: referred._id,
      submissionId: laterSubmission._id,
    });

    expect(result).toEqual({ qualified: false, reason: "not_first_solve" });
    const reloaded = await ReferralQualification.findById(row._id);
    expect(reloaded.status).toBe("ineligible");
    expect(await RewardLedger.countDocuments({})).toBe(0);
  });

  it("a referral applied BEFORE any accepted practice solve stays pending and can qualify normally", async () => {
    const referrer = await seedUser({ email: "referrerEarly@test.com" });
    const referred = await seedUser({ email: "referredEarly@test.com" });
    await seedProblem();

    const row = await createReferralAssociationQualification({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    expect(row.status).toBe("pending");
    expect(row.ineligibleReason).toBeNull();
  });
});

describe("Association race (atomic conditional update, real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("under real concurrency, only one of two simultaneous association attempts on the same account succeeds", async () => {
    const referred = await seedUser({ email: "raceReferred@test.com", referredBy: null });

    const [resultA, resultB] = await Promise.all([
      saveSubscriptionIfMatch(referred._id, { referredBy: null }, { referredBy: "codeA" }),
      saveSubscriptionIfMatch(referred._id, { referredBy: null }, { referredBy: "codeB" }),
    ]);

    // Exactly one of the two concurrent attempts wins the atomic update.
    const winners = [resultA, resultB].filter((r) => r !== null);
    expect(winners).toHaveLength(1);

    const reloaded = await User.findById(referred._id);
    expect(["codeA", "codeB"]).toContain(reloaded.referredBy);
    // Whichever won is exactly what's persisted — no silent overwrite by
    // the loser landing after.
    expect(reloaded.referredBy).toBe(winners[0].referredBy);
  });

  it("a second attempt after the first succeeds is correctly rejected (already applied)", async () => {
    const referred = await seedUser({ email: "raceReferred2@test.com", referredBy: null });

    const first = await saveSubscriptionIfMatch(referred._id, { referredBy: null }, { referredBy: "codeA" });
    const second = await saveSubscriptionIfMatch(referred._id, { referredBy: null }, { referredBy: "codeB" });

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    const reloaded = await User.findById(referred._id);
    expect(reloaded.referredBy).toBe("codeA");
  });
});

describe("qualifyReferralIfFirstSolve — idempotency under concurrency (real Mongo documents)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    clearRewardEnv();
  });

  afterEach(async () => {
    await clearTestMongo();
    clearRewardEnv();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("is idempotent under real concurrency: two simultaneous calls for the same first-solve event qualify exactly once and reward exactly once", async () => {
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const referrer = await seedUser({ email: "referrerC@test.com" });
    const referred = await seedUser({ email: "referredC@test.com" });
    // A single real Submission — both concurrent calls below represent two
    // callers racing on this SAME first-solve event (e.g. a retried judge
    // request), not two different submissions. qualificationSourceSubmissionId
    // is a real ObjectId reference to Submission._id in production, so the
    // fixture uses the actual persisted _id rather than a fake string.
    const submission = await Submission.create({
      userId: referred._id,
      problemSlug: "two-sum",
      language: "python",
      status: "Accepted",
      passed: 1,
      total: 1,
    });
    const qualRow = await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    await Promise.all([
      qualifyReferralIfFirstSolve({ userId: referred._id, submissionId: submission._id }),
      qualifyReferralIfFirstSolve({ userId: referred._id, submissionId: submission._id }),
    ]);

    const reloaded = await ReferralQualification.findById(qualRow._id);
    expect(reloaded.status).toBe("qualified");
    expect(await RewardLedger.countDocuments({ userId: referrer._id })).toBe(1);
    expect(await RewardLedger.countDocuments({ userId: referred._id })).toBe(1);
  });

  it("enforces one referrer per account at the database level (unique referredUserId)", async () => {
    const referrerA = await seedUser({ email: "refA@test.com" });
    const referrerB = await seedUser({ email: "refB@test.com" });
    const referred = await seedUser({ email: "onlyOneReferrer@test.com" });

    await ReferralQualification.create({
      referrerId: referrerA._id,
      referredUserId: referred._id,
      referralCodeUsed: "codeA",
    });

    await expect(
      ReferralQualification.create({
        referrerId: referrerB._id,
        referredUserId: referred._id,
        referralCodeUsed: "codeB",
      })
    ).rejects.toThrow(/duplicate key/);
  });
});

describe("Reward failure recovery: retryPendingReferralRewards (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    clearRewardEnv();
  });

  afterEach(async () => {
    await clearTestMongo();
    clearRewardEnv();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("successfully issues a reward on retry that was skipped_unconfigured at qualification time", async () => {
    const referrer = await seedUser({ email: "retryReferrer@test.com" });
    const referred = await seedUser({ email: "retryReferred@test.com" });
    // Real Submission ObjectId — see the concurrency test above for why a
    // fake string like "sub1" isn't valid against the schema.
    const submission = await Submission.create({
      userId: referred._id,
      problemSlug: "two-sum",
      language: "python",
      status: "Accepted",
      passed: 1,
      total: 1,
    });
    const row = await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    // Qualify with no reward amounts configured yet.
    const firstAttempt = await qualifyReferralIfFirstSolve({
      userId: referred._id,
      submissionId: submission._id,
    });
    expect(firstAttempt).toEqual({ qualified: true, rewardStatus: "skipped_unconfigured" });
    expect(await RewardLedger.countDocuments({})).toBe(0);

    // Now configure amounts and retry.
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const retryResult = await retryPendingReferralRewards();
    expect(retryResult).toEqual({ attempted: 1, issued: 1, stillUnissued: 0 });

    const reloaded = await ReferralQualification.findById(row._id);
    expect(reloaded.rewardStatus).toBe("issued");
    expect(await RewardLedger.countDocuments({ userId: referrer._id })).toBe(1);
    expect(await RewardLedger.countDocuments({ userId: referred._id })).toBe(1);
  });

  it("does not double-issue on a second retry call after a reward has already been issued", async () => {
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    const referrer = await seedUser({ email: "retryReferrer2@test.com" });
    const referred = await seedUser({ email: "retryReferred2@test.com" });
    // Real Submission ObjectId — see the concurrency test above for why a
    // fake string like "sub1" isn't valid against the schema.
    const submission = await Submission.create({
      userId: referred._id,
      problemSlug: "two-sum",
      language: "python",
      status: "Accepted",
      passed: 1,
      total: 1,
    });
    await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
    });

    await qualifyReferralIfFirstSolve({ userId: referred._id, submissionId: submission._id });
    expect(await RewardLedger.countDocuments({})).toBe(2); // referrer + referred

    // retryPendingReferralRewards only selects rows where rewardStatus !=
    // "issued", so an already-issued row isn't even picked up — but call
    // it anyway to prove it's a safe no-op regardless.
    const retryResult = await retryPendingReferralRewards();
    expect(retryResult).toEqual({ attempted: 0, issued: 0, stillUnissued: 0 });
    expect(await RewardLedger.countDocuments({})).toBe(2);
  });

  it("retrying twice in a row (simulating a repeated manual admin trigger) never produces more than one reward per side, even for a genuinely failed row", async () => {
    const referrer = await seedUser({ email: "retryReferrer3@test.com" });
    const referred = await seedUser({ email: "retryReferred3@test.com" });
    const row = await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: referred._id,
      referralCodeUsed: "abc123",
      status: "qualified",
      qualifiedAt: new Date(),
      rewardStatus: "failed",
    });

    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER = "100";
    process.env.REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED = "50";

    await retryPendingReferralRewards();
    await retryPendingReferralRewards();

    const reloaded = await ReferralQualification.findById(row._id);
    expect(reloaded.rewardStatus).toBe("issued");
    expect(await RewardLedger.countDocuments({ userId: referrer._id })).toBe(1);
    expect(await RewardLedger.countDocuments({ userId: referred._id })).toBe(1);
  });
});