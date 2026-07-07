import fs from "fs/promises";
import path from "path";
import { ProblemFolderSchema } from "../schemas/problemSchema.js";
import "./../config/env.js";
import connectDB from "../config/db.js";
import Problem from "../models/Problem.js";

const PROBLEMS_DIR = path.join(
    process.cwd(),
    "problems"
);
const DRY_RUN =
    process.argv.includes("--dry-run");
async function main() {
    await connectDB();
    const folders = await fs.readdir(
        PROBLEMS_DIR
    );

    const problemFolders =
        folders.filter(
            (f) => f !== ".gitkeep"
        );

    for (const folder of problemFolders) {
        const folderPath = path.join(
            PROBLEMS_DIR,
            folder
        );

        const meta = JSON.parse(
            await fs.readFile(
                path.join(folderPath, "meta.json"),
                "utf8"
            )
        );

        const description =
            await fs.readFile(
                path.join(folderPath, "description.md"),
                "utf8"
            );

        const testcases = JSON.parse(
            await fs.readFile(
                path.join(folderPath, "testcases.json"),
                "utf8"
            )
        );

        const hints = JSON.parse(
            await fs.readFile(
                path.join(folderPath, "hints.json"),
                "utf8"
            )
        );

        const editorial =
            await fs.readFile(
                path.join(folderPath, "editorial.md"),
                "utf8"
            );

        const starterCode = {
            python: await fs.readFile(
                path.join(
                    folderPath,
                    "starter",
                    "python.py"
                ),
                "utf8"
            ),
            javascript: await fs.readFile(
                path.join(
                    folderPath,
                    "starter",
                    "javascript.js"
                ),
                "utf8"
            ),
            java: await fs.readFile(
                path.join(
                    folderPath,
                    "starter",
                    "java.java"
                ),
                "utf8"
            ),
            cpp: await fs.readFile(
                path.join(
                    folderPath,
                    "starter",
                    "cpp.cpp"
                ),
                "utf8"
            ),
        };

        const parsed =
            ProblemFolderSchema.safeParse({
                meta,
                description,
                visibleTestcases:
                    testcases.visible,
                hiddenTestcases:
                    testcases.hidden,
                starterCode,
                editorial,
                hints,
            });

        if (!parsed.success) {
            console.error(
                `Validation failed for ${folder}`
            );

            console.dir(
                parsed.error.flatten(),
                { depth: null }
            );

            process.exit(1);
        }

        const problemDoc = {
            ...meta,
            description,
            visibleTestCases:
                testcases.visible,
            testcases:
                testcases.visible,
            hiddentestcases:
                testcases.hidden,
            starterCode,
            editorial: {
                content: editorial,
                author: "Code Club",
                updatedAt: null,
            },
            hints,
        };

        if (DRY_RUN) {
            console.log(
                `[DRY RUN] ${problemDoc.slug}`
            );
        } else {
            await Problem.findOneAndUpdate(
                { slug: problemDoc.slug },
                { $set: problemDoc },
                {
                    upsert: true,
                }
            );

            console.log(
                `✓ Imported ${problemDoc.slug}`
            );
        }
    }
}
main().catch(console.error);