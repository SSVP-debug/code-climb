/**
 * seedPlaylists.js
 *
 * Seeds a handful of official, topic-based playlists so PlaylistView isn't
 * empty on day one. Pulls real problems straight from MongoDB by topic —
 * no hardcoded slugs — so it stays correct as the catalog grows. Upserts
 * on name (same idempotent-rerun convention as seedProblems.js's
 * upsert-on-slug).
 *
 * Usage:
 *   cd backend
 *   node scripts/seedPlaylists.js
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import Problem from "../models/Problem.js";
import Playlist from "../models/Playlist.js";

// Topic -> official playlist name/description, and how many problems to
// pull (easiest first, since these are meant as a learning on-ramp, not a
// random sample).
const OFFICIAL_PLAYLISTS = [
  {
    name: "Arrays & Hashing",
    topic: "Arrays",
    description: "Start here — the most common building blocks in interview problems.",
    limit: 12,
  },
  {
    name: "Two Pointers",
    topic: "Two Pointers",
    description: "Classic left/right pointer technique for sorted arrays and strings.",
    limit: 10,
  },
  {
    name: "Sliding Window",
    topic: "Sliding Window",
    description: "Substring and subarray problems solved without brute force.",
    limit: 10,
  },
  {
    name: "Trees",
    topic: "Trees",
    description: "Binary trees, traversals, and the recursive patterns behind them.",
    limit: 12,
  },
  {
    name: "Graphs",
    topic: "Graphs",
    description: "BFS/DFS, connectivity, and the graph patterns that show up everywhere.",
    limit: 14,
  },
  {
    name: "Dynamic Programming Starter",
    topic: "Dynamic Programming",
    description: "The DP problems most people learn the technique on, roughly easiest-first.",
    limit: 14,
  },
];

const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

async function seedPlaylists() {
  await connectDB();

  let created = 0;
  let updated = 0;

  for (const spec of OFFICIAL_PLAYLISTS) {
    const problems = await Problem.find({ topic: spec.topic })
      .select("slug difficulty")
      .lean();

    if (problems.length === 0) {
      console.log(`  ! Skipping "${spec.name}" — no problems found for topic "${spec.topic}".`);
      continue;
    }

    const slugs = problems
      .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 3) - (DIFFICULTY_ORDER[b.difficulty] ?? 3))
      .slice(0, spec.limit)
      .map((p) => p.slug);

    const existing = await Playlist.findOne({ name: spec.name, isOfficial: true }).lean();

    await Playlist.findOneAndUpdate(
      { name: spec.name, isOfficial: true },
      {
        $set: {
          name: spec.name,
          description: spec.description,
          isOfficial: true,
          ownerId: null,
          problemSlugs: slugs,
        },
      },
      { upsert: true, new: true }
    );

    if (existing) {
      updated++;
      console.log(`  ~ ${spec.name} (${slugs.length} problems, updated)`);
    } else {
      created++;
      console.log(`  + ${spec.name} (${slugs.length} problems)`);
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`);
  process.exit(0);
}

seedPlaylists().catch((err) => {
  console.error("[seedPlaylists] failed:", err);
  process.exit(1);
});