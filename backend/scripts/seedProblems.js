import connectDB from "../config/db.js";
import Problem from "../models/Problem.js";

import problems from "../../src/data/problems.js";

const seedProblems = async () => {
  try {
    await connectDB();

    console.log(`📦 Loaded ${problems.length} problems`);

    await Problem.deleteMany({});

    await Problem.insertMany(problems);

    console.log(`✅ Seeded ${problems.length} problems`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  }
};

seedProblems();