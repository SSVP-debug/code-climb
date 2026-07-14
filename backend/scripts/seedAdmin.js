/**
 * seedAdmin.js
 *
 * Promotes an existing account (sign in with Google at least once first,
 * so the User document exists) to role: "admin". Admin already passes
 * every requireRole gate in the app, so this alone unlocks:
 *   - /admin (the approval queue + View As console)
 *   - /recruiter/dashboard and /tpo/dashboard, live, no separate account needed
 *
 * Usage:
 *   cd backend
 *   node scripts/seedAdmin.js you@example.com
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/User.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/seedAdmin.js <email>");
  process.exit(1);
}

async function seedAdmin() {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    console.error(
      `No user found for ${email}. Sign in with Google at least once first, then re-run this script.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const previousRole = user.role;
  user.role = "admin";
  await user.save();

  console.log(`${email}: role changed ${previousRole} → admin.`);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("[seedAdmin] failed:", err);
  process.exit(1);
});