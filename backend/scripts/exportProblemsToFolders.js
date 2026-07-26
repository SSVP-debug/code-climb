import fs from "fs/promises";
import path from "path";
import problems from "../../src/data/problems.js";

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

        await fs.writeFile(
            path.join(
                folderPath,
                "meta.json"
            ),
            JSON.stringify(
                {
                    id: problem.id,
                    slug: problem.slug,
                    title: problem.title,
                    difficulty:
                        problem.difficulty,
                    topic: problem.topic,
                    pattern:
                        problem.pattern,
                    sourceType:
                        problem.sourceType,
                    functionName:
                        problem.functionName,
                    estimatedTime:
                        problem.estimatedTime,
                    companies:
                        problem.companies,
                    relatedProblems:
                        problem.relatedProblems,
                    // Execution contract (see backend/models/Problem.js
                    // returnTypeSchema) — must round-trip through the
                    // export/import pipeline or importProblems.js would
                    // silently overwrite MongoDB with a document missing
                    // the declared return type.
                    returnType:
                        problem.returnType ?? {},
                },
                null,
                2
            )
        );
        await fs.writeFile(
            path.join(
                folderPath,
                "description.md"
            ),
            problem.description ?? ""
        );
        await fs.writeFile(
            path.join(
                folderPath,
                "testcases.json"
            ),
            JSON.stringify(
                {
                    visible:
                        problem.testcases ?? [],
                    hidden:
                        problem.hiddentestcases ?? [],
                },
                null,
                2
            )
        );
        await fs.writeFile(
            path.join(
                folderPath,
                "hints.json"
            ),
            JSON.stringify(
                problem.hints ?? [],
                null,
                2
            )
        );
        const starters =
            problem.starterCode ?? {};

        await fs.writeFile(
            path.join(
                folderPath,
                "starter",
                "python.py"
            ),
            starters.python ?? ""
        );

        await fs.writeFile(
            path.join(
                folderPath,
                "starter",
                "javascript.js"
            ),
            starters.javascript ?? ""
        );

        await fs.writeFile(
            path.join(
                folderPath,
                "starter",
                "java.java"
            ),
            starters.java ?? ""
        );

        await fs.writeFile(
            path.join(
                folderPath,
                "starter",
                "cpp.cpp"
            ),
            starters.cpp ?? ""
        );
        await fs.writeFile(
            path.join(
                folderPath,
                "editorial.md"
            ),
            problem.editorial?.content ??
            ""
        );

        console.log(
            `Created ${problem.slug}`
        );
    }
}

main().catch(console.error);