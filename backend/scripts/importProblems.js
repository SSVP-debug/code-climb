import fs from "fs/promises";
import path from "path";
import { ProblemFolderSchema } from "../schemas/problemSchema.js";
import { LANGUAGES, REQUIRED_STARTER_LANGUAGE_KEYS } from "../config/languages.js";
import "./../config/env.js";
import connectDB from "../config/db.js";
import Problem from "../models/Problem.js";

const PROBLEMS_DIR = path.join(
    process.cwd(),
    "problems"
);
const DRY_RUN =
    process.argv.includes("--dry-run");
const targetProblem =
    process.argv.slice(2).find(
        (arg) => arg !== "--dry-run"
    );
let importedCount = 0;
async function main() {
    await connectDB();
    const folders = await fs.readdir(
        PROBLEMS_DIR
    );

    let problemFolders =
        folders.filter(
            (f) => f !== ".gitkeep"
        );

    if (targetProblem) {
        problemFolders =
            problemFolders.filter(
                (f) =>
                    f === targetProblem
            );
    }
    console.log({ targetProblem });
    console.log({ problemFolders });

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

        // Plan 011 (Batch 2): was five hand-written `fs.readFile(...,
        // "starter", "<lang>.<ext>")` blocks (one `.catch(() => "")` for
        // typescript, none for the required four) — same registry-driven
        // pattern as problemFolderFiles.js's write-side counterpart, so a
        // new language's starter file costs zero edits to either file.
        // Required-vs-optional read behavior (throw vs. fall back to "")
        // is unchanged: still driven by REQUIRED_STARTER_LANGUAGE_KEYS.
        const starterCode = Object.fromEntries(
            await Promise.all(
                Object.entries(LANGUAGES).map(async ([key, lang]) => {
                    const filePath = path.join(
                        folderPath,
                        "starter",
                        `${key}.${lang.extension}`
                    );
                    const content = REQUIRED_STARTER_LANGUAGE_KEYS.includes(key)
                        ? await fs.readFile(filePath, "utf8")
                        : await fs.readFile(filePath, "utf8").catch(() => "");
                    return [key, content];
                })
            )
        );

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

        // Content & Execution Architecture, Phase 3 adapter — same
        // reasoning as the equivalent change in scripts/seedProblems.js:
        // the folder format's testcases.json is unchanged (still
        // {visible, hidden}), this just wraps `testcases.hidden` into
        // Problem.js's actual `hiddenTestcaseSet` sub-document at the one
        // point this script writes to Mongo, preserving whatever
        // `enabled` state already exists there rather than resetting it.
        const existingForHiddenSet = DRY_RUN
            ? null
            : await Problem.findOne({ slug: meta.slug }).lean();

        const problemDoc = {
            ...meta,
            description,
            visibleTestCases:
                testcases.visible,
            testcases:
                testcases.visible,
            hiddenTestcaseSet: {
                enabled: existingForHiddenSet?.hiddenTestcaseSet?.enabled ?? true,
                testcases: testcases.hidden,
            },
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

            importedCount++;
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

            importedCount++;
        }
    }
    if (DRY_RUN) {
        console.log(
            `\nValidated ${importedCount} problem(s).`
        );
    } else {
        console.log(
            `\nImported ${importedCount} problem(s).`
        );
    }
}
main().catch(console.error);