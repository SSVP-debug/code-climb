import "../config/env.js";
import connectDB from "../config/db.js";
import Problem from "../models/Problem.js";
import hiddenTestcases from "../data/hiddenTestcases.js";

async function migrate() {
    await connectDB();

    let updated = 0;
    let missing = [];

    for (const [slug, testcases] of Object.entries(hiddenTestcases)) {
        const result = await Problem.updateOne(
            { slug },
            {
                $set: {
                    hiddentestcases: testcases,
                },
            }
        );

        console.log(
            slug,
            result.matchedCount,
            result.modifiedCount
        );

        if (result.matchedCount === 0) {
            missing.push(slug);
        } else {
            updated++;
        }
    }

    console.log(`Updated ${updated} problems.`);
    console.log(`Missing ${missing.length} problems.`);
    console.log(missing);

    if (missing.length) {
        console.log("Missing slugs:");
        console.log(missing);
    }

    process.exit(0);
}

migrate().catch(console.error);