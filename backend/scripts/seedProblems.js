import "../config/env.js"; // loads backend/.env via dotenvx

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Firebase Admin init ──────────────────────────────────────────────────────
function parsePrivateKey(raw) {
  if (!raw) throw new Error("FIREBASE_PRIVATE_KEY is not set in backend/.env");
  return raw.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

const db = admin.firestore();

// ── Load problems ────────────────────────────────────────────────────────────
// Dynamic import so we can use the ES module problems.js from the frontend src.
const problemsPath = resolve(__dirname, "../../src/data/problems.js");

let problems;
try {
  const module = await import(pathToFileURL(problemsPath).href);
  problems = module.default;
} catch (err) {
  console.error("❌ Could not load problems from:", problemsPath);
  console.error("   Make sure src/data/problems.js exists and exports default.");
  console.error("   Error:", err.message);
  process.exit(1);
}

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`\n🌱 Seeding ${problems.length} problems to Firestore...\n`);

  // Firestore batch write (max 500 per batch — we have 20, so one batch is fine)
  const batch = db.batch();
  const skipped = [];

  for (const problem of problems) {
    // Validate required fields before writing
    if (!problem.id || !problem.slug || !problem.title) {
      console.warn(`⚠  Skipping problem with missing id/slug/title:`, problem);
      skipped.push(problem);
      continue;
    }

    // SECURITY: strip hiddentestcases — they must never reach the client
    // eslint-disable-next-line no-unused-vars
    const { hiddentestcases, ...safeFields } = problem;

    const ref = db.collection("problems").doc(String(problem.id));
    batch.set(ref, safeFields);

    console.log(
      `  ✓ [${String(problem.id).padStart(2, "0")}] ${problem.difficulty.padEnd(6)} ${problem.title}`
    );
  }

  await batch.commit();

  console.log(`\n✅ Done. ${problems.length - skipped.length} problems written to Firestore.`);

  if (skipped.length > 0) {
    console.warn(`⚠  ${skipped.length} problems were skipped due to missing required fields.`);
  }

  console.log(`\n📋 Firestore collection: problems`);
  console.log(`   Each document ID = problem.id (e.g. "1", "2", ...)`);
  console.log(`   hiddentestcases were NOT written — they remain in src/data/problems.js only.\n`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Seed failed:", err.message);
    console.error(err);
    process.exit(1);
  });
