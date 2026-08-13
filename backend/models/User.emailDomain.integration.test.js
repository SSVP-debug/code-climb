import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";
import User from "./User.js";

// Regression coverage for the emailDomain gap found in the state-coverage
// audit: routes/tpo.js and routes/recruiter.js have queried/filtered on
// User.emailDomain for a while, but the field was never actually declared
// on the schema, never set at account creation, and never backfilled — so
// every such query silently matched zero users. See models/User.js's
// emailDomain field comment for the full writeup and
// scripts/backfillEmailDomain.js for the migration this test suite exists
// to protect going forward (new writes only; backfill is a separate,
// one-time step for pre-existing documents).
describe("User model — emailDomain field", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("derives and persists emailDomain from email on creation", async () => {
    const created = await User.create({
      firebaseUid: "fb-a",
      email: "student@Nit-Trichy.edu",
    });

    expect(created.emailDomain).toBe("nit-trichy.edu");

    const reloaded = await User.findById(created._id).lean();
    expect(reloaded.emailDomain).toBe("nit-trichy.edu");
  });

  it("keeps emailDomain in sync when email is changed and re-saved", async () => {
    const created = await User.create({
      firebaseUid: "fb-b",
      email: "old@college-a.edu",
    });
    expect(created.emailDomain).toBe("college-a.edu");

    created.email = "new@college-b.edu";
    await created.save();

    expect(created.emailDomain).toBe("college-b.edu");

    const reloaded = await User.findById(created._id).lean();
    expect(reloaded.emailDomain).toBe("college-b.edu");
  });

  it("leaves emailDomain null for a user created without an email", async () => {
    const created = await User.create({ firebaseUid: "fb-c" });

    expect(created.emailDomain).toBeNull();
  });

  it("is queryable — the actual bug this schema fix exists to close", async () => {
    await User.create({ firebaseUid: "fb-d", email: "one@shared-college.edu", role: "student" });
    await User.create({ firebaseUid: "fb-e", email: "two@shared-college.edu", role: "student" });
    await User.create({ firebaseUid: "fb-f", email: "other@different-college.edu", role: "student" });

    const matches = await User.find({ emailDomain: "shared-college.edu" }).lean();

    expect(matches).toHaveLength(2);
  });
});
