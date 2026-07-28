/**
 * seedDemoAccounts.js
 *
 * Creates a self-contained demo dataset, safe to screen-record or show to
 * investors without touching any real user's data:
 *   - 1 demo college ("Demo Institute of Technology")
 *   - 1 demo TPO contact + 1 demo recruiter contact for that college/company
 *   - 8 demo students at the college domain, with realistic (not random —
 *     drawn from your actual Problem catalog, so difficulty/topic/XP all
 *     agree with the real XP curve) solve histories spanning
 *     beginner → strong, for a believable spread in both the recruiter
 *     candidate search and the TPO placement-readiness dashboard.
 *
 * All of it is idempotent — safe to re-run; re-running just refreshes
 * the same fixtures rather than duplicating them.
 *
 * IMPORTANT — the View-As TPO dashboard is scoped to *the viewing
 * account's own* tpoProfile.collegeDomain (there's no "browse any
 * college" mode for TPOs, unlike recruiter search). So this script also
 * optionally patches your own admin account's tpoProfile to point at the
 * demo college — without touching your `role`, which stays "admin" —
 * so that View-As → TPO shows this demo data live instead of erroring
 * with "No college domain set on this TPO account."
 *
 * Usage:
 *   cd backend
 *   node scripts/seedDemoAccounts.js                  # just seed fixtures
 *   node scripts/seedDemoAccounts.js you@yourcompany.com   # also wire up
 *                                                           # your admin account's
 *                                                           # View-As TPO view
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import College from "../models/College.js";
import Problem from "../models/Problem.js";
import { computeXPFromSlugs, buildDifficultyMap } from "../utils/computeXP.js";
import { extractEmailDomain } from "../utils/domainVerification.js";
import { topicStatsFromObject } from "../utils/topicStats.js";

const DEMO_COLLEGE_DOMAIN = "demo-institute.codeclub.dev";
const DEMO_COLLEGE_NAME = "Demo Institute of Technology";
const DEMO_COMPANY_DOMAIN = "demo-corp.codeclub.dev";
const DEMO_COMPANY_NAME = "Democorp Technologies";

// Spread from beginner to strong so both the recruiter search and the TPO
// dashboard show a believable class, not 8 identical top performers.
const DEMO_STUDENTS = [
  { slug: "ananya-rao", name: "Ananya Rao", solveCount: 110, streak: 34 },
  { slug: "rohan-mehta", name: "Rohan Mehta", solveCount: 78, streak: 21 },
  { slug: "priya-nair", name: "Priya Nair", solveCount: 52, streak: 14 },
  { slug: "karan-singh", name: "Karan Singh", solveCount: 44, streak: 9 },
  { slug: "sneha-iyer", name: "Sneha Iyer", solveCount: 27, streak: 6 },
  { slug: "aditya-kumar", name: "Aditya Kumar", solveCount: 19, streak: 3 },
  { slug: "divya-reddy", name: "Divya Reddy", solveCount: 11, streak: 2 },
  { slug: "vikram-joshi", name: "Vikram Joshi", solveCount: 5, streak: 0 },
];

function shuffledSample(array, count) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function recentActivityDates(streak) {
  // A light, believable activity trail for the last `streak` days —
  // just for public profile / heatmap polish, not used by the recruiter
  // or TPO endpoints themselves.
  const dates = [];
  const today = new Date();
  for (let i = 0; i < streak; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function signProfile(userId, solvedCount) {
  const secret = process.env.PROFILE_SIGN_SECRET || "codeclub-verify-secret";
  const signedAt = new Date();
  const payload = `${userId}:${solvedCount}:${signedAt.toISOString()}`;
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { hash, signedAt, solvedCount };
}

async function seedDemoAccounts() {
  await connectDB();

  const adminEmail = process.argv[2]?.toLowerCase() || null;

  // ── 1. Demo college ──────────────────────────────────────────────────
  let college = await College.findByDomain(DEMO_COLLEGE_DOMAIN);
  if (!college) {
    college = await College.create({
      domains: [DEMO_COLLEGE_DOMAIN],
      name: DEMO_COLLEGE_NAME,
      status: "verified",
      verifiedAt: new Date(),
      submittedByRole: "tpo",
    });
    console.log(`+ created college: ${DEMO_COLLEGE_NAME}`);
  } else {
    college.status = "verified";
    college.verifiedAt = college.verifiedAt || new Date();
    await college.save();
    console.log(`~ college already exists: ${DEMO_COLLEGE_NAME}`);
  }

  // ── 2. Demo TPO contact ──────────────────────────────────────────────
  const now = new Date();
  const tpoUser = await User.findOneAndUpdate(
    { firebaseUid: "demo-firebase-tpo" },
    {
      $set: {
        firebaseUid: "demo-firebase-tpo",
        email: `demo.tpo@${DEMO_COLLEGE_DOMAIN}`,
        emailDomain: DEMO_COLLEGE_DOMAIN.toLowerCase(),
        displayName: "Demo TPO Contact",
        username: "demo-tpo-contact",
        role: "tpo",
        isProfilePublic: false,
        tpoProfile: {
          collegeDomain: DEMO_COLLEGE_DOMAIN,
          collegeName: DEMO_COLLEGE_NAME,
          verified: true,
          requestedAt: now,
          verifiedAt: now,
        },
      },
    },
    { upsert: true, new: true }
  );

  if (!college.submittedBy) {
    college.submittedBy = tpoUser._id;
    await college.save();
  }
  console.log(`+ demo TPO contact ready: ${tpoUser.email}`);

  // ── 3. Demo recruiter contact ────────────────────────────────────────
  const recruiterUser = await User.findOneAndUpdate(
    { firebaseUid: "demo-firebase-recruiter" },
    {
      $set: {
        firebaseUid: "demo-firebase-recruiter",
        email: `demo.recruiter@${DEMO_COMPANY_DOMAIN}`,
        emailDomain: DEMO_COMPANY_DOMAIN.toLowerCase(),
        displayName: "Demo Recruiter Contact",
        username: "demo-recruiter-contact",
        role: "recruiter",
        isProfilePublic: false,
        recruiterProfile: {
          companyName: DEMO_COMPANY_NAME,
          designation: "Technical Recruiter",
          companyDomain: DEMO_COMPANY_DOMAIN,
          verified: true,
          verifiedAt: now,
        },
      },
    },
    { upsert: true, new: true }
  );
  console.log(`+ demo recruiter contact ready: ${recruiterUser.email}`);

  // ── 4. Demo students ─────────────────────────────────────────────────
  const problems = await Problem.find({}, "slug difficulty topic").lean();

  if (problems.length === 0) {
    console.warn(
      "No problems found in the catalog — demo students will be created with 0 solves. Seed the problem catalog first for realistic data."
    );
  }

  const difficultyMap = buildDifficultyMap(problems);
  const slugs = problems.map((p) => p.slug);
  const topicBySlug = new Map(problems.map((p) => [p.slug, p.topic]));

  for (const student of DEMO_STUDENTS) {
    const solvedSlugs = shuffledSample(slugs, student.solveCount);
    const totalXP = computeXPFromSlugs(solvedSlugs, difficultyMap);

    const solvedDifficulty = { easy: 0, medium: 0, hard: 0 };
    const topicStats = new Map();

    for (const slug of solvedSlugs) {
      const difficulty = difficultyMap.get(slug);
      if (difficulty === "Easy") solvedDifficulty.easy++;
      else if (difficulty === "Medium") solvedDifficulty.medium++;
      else if (difficulty === "Hard") solvedDifficulty.hard++;

      const topic = topicBySlug.get(slug);
      if (topic) topicStats.set(topic, (topicStats.get(topic) || 0) + 1);
    }

    const firebaseUid = `demo-firebase-${student.slug}`;
    const email = `demo.${student.slug.replace(/-/g, ".")}@${DEMO_COLLEGE_DOMAIN}`;

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          firebaseUid,
          email,
          emailDomain: extractEmailDomain(email),
          displayName: student.name,
          username: `demo-${student.slug}`,
          role: "student",
          isProfilePublic: true,
          solvedSlugs,
          solvedDifficulty,
          topicStats: topicStatsFromObject(Object.fromEntries(topicStats)),
          totalXP,
          currentStreak: student.streak,
          longestStreak: student.streak,
          activityDates: recentActivityDates(student.streak),
          joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * (90 + student.solveCount)),
        },
      },
      { upsert: true, new: true }
    );

    user.profileSignature = signProfile(user._id, solvedSlugs.length);
    await user.save();

    console.log(
      `+ demo student ready: ${student.name} — ${solvedSlugs.length} solved, ${totalXP} XP`
    );
  }

  // ── 5. Wire up View-As TPO for a given admin account (optional) ─────
  if (adminEmail) {
    const admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.warn(
        `\nNo user found for ${adminEmail} — skipping View-As TPO wiring. Sign in at least once first.`
      );
    } else {
      admin.tpoProfile = {
        collegeDomain: DEMO_COLLEGE_DOMAIN,
        collegeName: DEMO_COLLEGE_NAME,
        verified: true,
        requestedAt: now,
        verifiedAt: now,
      };
      await admin.save();
      console.log(
        `\n${adminEmail}: tpoProfile wired to "${DEMO_COLLEGE_NAME}" — View-As → TPO now shows this demo data. (role unchanged: ${admin.role})`
      );
    }
  } else {
    console.log(
      `\nTip: re-run as "node scripts/seedDemoAccounts.js you@yourcompany.com" to also wire your admin account's View-As → TPO to this demo college.`
    );
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

seedDemoAccounts().catch((err) => {
  console.error("[seedDemoAccounts] failed:", err);
  process.exit(1);
});