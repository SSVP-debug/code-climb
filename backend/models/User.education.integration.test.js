import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";
import User from "./User.js";

// Regression coverage for a schema-drift incident (found while implementing
// admin-console-plans/plans/005-colleges-management.md, fixed as a
// prerequisite before that plan could proceed — see that plan's notes for
// the full incident writeup):
//
// education.collegeId/emailVerified/emailVerifiedAt/collegeStatus were used
// throughout live code (routes/collegeVerification.js,
// controllers/adminController.js's approveStudentCollege/rejectStudentCollege)
// via direct Mongoose document property access — but the `education`
// sub-schema never declared them. Under Mongoose's default `strict: true`,
// assigning an undeclared subdocument path is silently dropped from the
// `$set` payload on `.save()` — it doesn't throw, the write just never
// reaches MongoDB.
//
// This is invisible to plain-object-mock unit tests (adminController.test.js,
// collegeVerification.test.js) because a mocked `{ education: {...},
// save: vi.fn() }` doesn't enforce Mongoose schema semantics at all — any
// field assignment "succeeds" on a plain object regardless of what a real
// schema would allow through. Only a test against a real Mongoose model,
// with a real save-and-refetch round trip, can catch this class of bug —
// which is exactly what this file is for.
describe("User model — education subdocument field persistence (schema-drift regression)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("persists education.collegeId/emailVerified/emailVerifiedAt/collegeStatus across a real save + fresh refetch", async () => {
    const collegeId = new mongoose.Types.ObjectId();

    const created = await User.create({
      firebaseUid: "fb-edu-1",
      email: "edu1@test.com",
      education: { collegeName: "XYZ Institute", collegeEmail: "student@xyz.edu" },
    });

    created.education.collegeId = collegeId;
    created.education.emailVerified = true;
    created.education.emailVerifiedAt = new Date("2026-08-01T00:00:00.000Z");
    created.education.collegeStatus = "pending";
    await created.save();

    // A FRESH document, from a brand new query — not the same in-memory
    // instance. This is the part a `.modifiedPaths()`/`$__delta()`-level
    // check (or a mock) can't prove: that the data genuinely round-tripped
    // through MongoDB, not just that Mongoose "thinks" it set the value.
    const refetched = await User.findById(created._id);

    expect(refetched.education.collegeId?.toString()).toBe(collegeId.toString());
    expect(refetched.education.emailVerified).toBe(true);
    expect(refetched.education.emailVerifiedAt?.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(refetched.education.collegeStatus).toBe("pending");
  });

  it("makes approveStudentCollege's exact query pattern actually match the student it should", async () => {
    const collegeId = new mongoose.Types.ObjectId();

    const student = await User.create({
      firebaseUid: "fb-edu-2",
      email: "edu2@test.com",
      role: "student",
      education: { collegeName: "XYZ Institute" },
    });
    student.education.collegeId = collegeId;
    student.education.emailVerified = true;
    student.education.collegeStatus = "pending";
    await student.save();

    // Identical filter shape to adminController.js's approveStudentCollege/
    // rejectStudentCollege — this is the query that always matched zero
    // documents before the schema fix, because the field was never
    // actually persisted for it to match against.
    const matched = await User.find({
      "education.collegeId": collegeId,
      "education.emailVerified": true,
    });

    expect(matched).toHaveLength(1);
    expect(matched[0]._id.toString()).toBe(student._id.toString());
  });

  it("leaves education.collegeId null for the auto-verified-domain path (no College doc link expected)", async () => {
    // Mirrors routes/collegeVerification.js's recognized-domain branch:
    // collegeStatus becomes "verified" directly, with collegeId staying
    // null — this is intentional, not a bug (see User.js's education
    // comment on why a per-college count can't rely on this field alone).
    const student = await User.create({
      firebaseUid: "fb-edu-3",
      email: "edu3@test.com",
      role: "student",
      education: { collegeName: "Recognized University" },
    });
    student.education.emailVerified = true;
    student.education.collegeStatus = "verified";
    await student.save();

    const refetched = await User.findById(student._id);
    expect(refetched.education.collegeId).toBeNull();
    expect(refetched.education.collegeStatus).toBe("verified");
  });

  it("does not persist the old (pre-migration) education.verified/verifiedAt field names", async () => {
    const created = await User.create({
      firebaseUid: "fb-edu-4",
      email: "edu4@test.com",
      education: { collegeName: "Test College" },
    });

    // These paths no longer exist in the schema at all (removed as the
    // other half of this same fix — see User.js's education comment).
    // Setting them should behave exactly like any other undeclared path:
    // never reach MongoDB.
    created.education.verified = true;
    created.education.verifiedAt = new Date();
    await created.save();

    const reloaded = await User.findById(created._id).lean();
    expect(Object.prototype.hasOwnProperty.call(reloaded.education, "verified")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(reloaded.education, "verifiedAt")).toBe(false);
  });
});