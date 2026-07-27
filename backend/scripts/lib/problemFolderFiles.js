/**
 * problemFolderFiles.js
 *
 * Pure function: given one problem object from src/data/problems.js, returns
 * the exact set of files (relative path -> content) that represent it under
 * backend/problems/<slug>/. This is the single source of truth for that
 * mapping — both exportProblemsToFolders.js (writes it to disk) and
 * checkProblemsFolderDrift.js (diffs it against disk without writing)
 * import this instead of duplicating the mapping logic.
 *
 * Extracted from exportProblemsToFolders.js during the Phase 1 (foundation)
 * pass of the execution-pipeline audit — see docs/execution-audit for
 * context. No behavior change: this produces byte-identical output to the
 * original inline version.
 */
export function buildProblemFiles(problem) {
  const starters = problem.starterCode ?? {};

  return {
    "meta.json": JSON.stringify(
      {
        id: problem.id,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        topic: problem.topic,
        pattern: problem.pattern,
        sourceType: problem.sourceType,
        functionName: problem.functionName,
        estimatedTime: problem.estimatedTime,
        companies: problem.companies,
        relatedProblems: problem.relatedProblems,
        // Execution contract (see backend/models/Problem.js
        // returnTypeSchema/paramTypesSchema) — must round-trip through the
        // export/import pipeline or importProblems.js would silently
        // overwrite MongoDB with a document missing the declared contract.
        returnType: problem.returnType ?? {},
        paramTypes: problem.paramTypes ?? {},
        comparisonMode: problem.comparisonMode ?? "exact",
      },
      null,
      2
    ),
    "description.md": problem.description ?? "",
    "testcases.json": JSON.stringify(
      {
        visible: problem.testcases ?? [],
        hidden: problem.hiddentestcases ?? [],
      },
      null,
      2
    ),
    "hints.json": JSON.stringify(problem.hints ?? [], null, 2),
    "starter/python.py": starters.python ?? "",
    "starter/javascript.js": starters.javascript ?? "",
    "starter/java.java": starters.java ?? "",
    "starter/cpp.cpp": starters.cpp ?? "",
    "editorial.md": problem.editorial?.content ?? "",
  };
}
