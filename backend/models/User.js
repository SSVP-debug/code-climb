import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      trim: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    isProfilePublic: {
      type: Boolean,
      default: true,
    },

    leetcodeUsername: String,

    // Solve-history stats, separate from leetcodeUsername above (which
    // predates this and is already wired through progress.js/userController.js
    // — left untouched). Populated either by manual entry or by the
    // /api/leetcode/fetch proxy pre-filling the form for the student to
    // confirm. Not fed into totalXP/solvedSlugs — LeetCode problems aren't
    // in this platform's own catalog, so there's nothing to map them to;
    // this exists purely as recruiter-facing supplementary proof of work
    // on the public profile.
    leetcodeStats: {
      easySolved: { type: Number, default: 0, min: 0 },
      mediumSolved: { type: Number, default: 0, min: 0 },
      hardSolved: { type: Number, default: 0, min: 0 },
      totalSolved: { type: Number, default: 0, min: 0 },
      source: { type: String, enum: ["manual", "api"], default: "manual" },
      lastSyncedAt: { type: Date, default: null },
    },


    joinedDate: {
      type: Date,
      default: Date.now,
    },

    solvedSlugs: {
      type: [String],
      default: [],
    },
    topicStats: {
      type: Map,
      of: Number,
      default: {},
    },
    activityDates: {
      type: [String],
      default: [],
    },
    solvedDifficulty: {
      easy: { type: Number, default: 0, min: 0 },
      medium: { type: Number, default: 0, min: 0 },
      hard: { type: Number, default: 0, min: 0 },
    },
    recentActivity: {
      type: [
        {
          title: String,
          time: String,
        },
      ],
      default: [],
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalXP: {
      type: Number,
      default: 0,
      min: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActivityDate: {
      type: String,
      default: null,
    },
    achievements: {
      type: [
        {
          key: String,
          unlockedAt: Date,
        },
      ],
      default: [],
    },

    subscription: {
      plan: { type: String, default: "free" },
      status: { type: String, enum: ["none", "active", "cancelled", "expired"], default: "none" },
      startedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
    },

    // ── Role system ─────────────────────────────────────────────
    role: {
      type: String,
      enum: ["student", "recruiter", "tpo", "admin"],
      default: "student",
      index: true,
    },

    // ── Recruiter-specific fields ─────────────────────────────────────────
    recruiterProfile: {
      companyName: { type: String, default: null },
      designation: { type: String, default: null },
      companyDomain: { type: String, default: null }, // e.g. "google.com"
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
    },

    // ── TPO-specific fields ───────────────────────────────────────────────
    collegeDomain: { type: String, default: null },
    collegeName: { type: String, default: null },

    // ── Profile verification hash (commit 085) ────────────────────────────
    // HMAC-SHA256 of (userId + solvedCount + timestamp) — proves data wasn't
    // tampered. Recruiters can verify at /verify/:username.
    profileSignature: {
      hash: { type: String, default: null },
      signedAt: { type: Date, default: null },
      solvedCount: { type: Number, default: 0 },
    },

    // ── Certifications earned (commit 087) ───────────────────────────────
    certificates: [{
      trackId: { type: String },   // e.g. "arrays", "dynamic-programming"
      trackName: { type: String },
      issuedAt: { type: Date },
      verifyCode: { type: String },   // short unique code for QR verification
    }],

    // ── Referrals (Phase 6 — add here if missing) ────────────────────────
    referralCode: { type: String, default: null, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    referralRewardDays: { type: Number, default: 0 },

    // ── Weekly AI review email (commit 097) ──────────────────────────────
    emailPreferences: {
      weeklyReview: { type: Boolean, default: true }, // opt-out, not opt-in
    },
    lastWeeklyReviewSentAt: { type: Date, default: null },

    dailyChallengeHistory: {
      type: [
        {
          date: String,
          slug: String,
          completed: Boolean,
          completedAt: Date,
        },
      ],
      default: [],
    },


  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;