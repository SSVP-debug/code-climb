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

    // ── Role system (Phase 7) ─────────────────────────────────────────────
    role: {
      type: String,
      enum: ["student", "recruiter", "tpo", "admin"],
      default: "student",
      index: true,
    },

    // ── Recruiter-specific fields ─────────────────────────────────────────
    recruiterProfile: {
      companyName:  { type: String, default: null },
      designation:  { type: String, default: null },
      companyDomain:{ type: String, default: null }, // e.g. "google.com"
      verified:     { type: Boolean, default: false },
      verifiedAt:   { type: Date,    default: null },
    },

    // ── TPO-specific fields ───────────────────────────────────────────────
    collegeDomain: { type: String, default: null },
    collegeName:   { type: String, default: null },

    // ── Profile verification hash (commit 085) ────────────────────────────
    // HMAC-SHA256 of (userId + solvedCount + timestamp) — proves data wasn't
    // tampered. Recruiters can verify at /verify/:username.
    profileSignature: {
      hash:        { type: String, default: null },
      signedAt:    { type: Date,   default: null },
      solvedCount: { type: Number, default: 0 },
    },

    // ── Certifications earned (commit 087) ───────────────────────────────
    certificates: [{
      trackId:    { type: String },   // e.g. "arrays", "dynamic-programming"
      trackName:  { type: String },
      issuedAt:   { type: Date },
      verifyCode: { type: String },   // short unique code for QR verification
    }],

    // ── Referrals (Phase 6 — add here if missing) ────────────────────────
    referralCode:       { type: String, default: null, unique: true, sparse: true },
    referredBy:         { type: String, default: null },
    referralRewardDays: { type: Number, default: 0 },

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
