import fs from "fs/promises";
import path from "path";
import problems from "../../src/data/problems.js";
import { buildProblemFiles } from "./lib/problemFolderFiles.js";

// Rewritten during the Phase 1 (foundation) pass of the execution-pipeline
// audit to delegate the actual file-content mapping to
// scripts/lib/problemFolderFiles.js, which is now the single source of
// truth shared with scripts/checkProblemsFolderDrift.js — see that file's
// header comment for why. Output is unchanged except for the new
// `paramTypes` field in meta.json (see backend/models/Problem.js).
async function main() {
    for (const problem of problems) {
        const folderPath = path.join(
            process.cwd(),
            "problems",
            problem.slug
        );

        await fs.mkdir(
            path.join(folderPath, "starter"),
            { recursive: true }
        );

        const files = buildProblemFiles(problem);

        for (const [relativePath, content] of Object.entries(files)) {
            await fs.writeFile(
                path.join(folderPath, relativePath),
                content
            );
        }

        console.log(
            `Created ${problem.slug}`
        );
    }
}

main().catch(console.error);
