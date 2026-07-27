import { describe, expect, it, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { findDrift } from "./checkProblemsFolderDrift.js";
import { buildProblemFiles } from "./lib/problemFolderFiles.js";

const tmpDirs = [];

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => fs.rm(d, { recursive: true, force: true })));
});

async function writeProblemFolder(baseDir, problem, overrides = {}) {
  const files = { ...buildProblemFiles(problem), ...overrides };
  const folderPath = path.join(baseDir, problem.slug);
  await fs.mkdir(path.join(folderPath, "starter"), { recursive: true });
  for (const [relativePath, content] of Object.entries(files)) {
    if (content === undefined) continue; // used to simulate a missing file
    await fs.writeFile(path.join(folderPath, relativePath), content);
  }
}

const fakeProblem = {
  id: 9999,
  slug: "fake-drift-problem",
  title: "Fake Drift Problem",
  difficulty: "Easy",
  topic: "Testing",
  pattern: "n/a",
  sourceType: "core",
  functionName: "solve",
  estimatedTime: "5 min",
  companies: [],
  relatedProblems: [],
  returnType: {},
  paramTypes: {},
  description: "A fake problem used only to test the drift checker.",
  testcases: [{ input: { n: 1 }, expectedOutput: 1 }],
  hiddentestcases: [],
  hints: [],
  starterCode: {
    python: "def solve(n): pass",
    javascript: "function solve(n) {}",
    java: "class Solution { public int solve(int n) { return 0; } }",
    cpp: "class Solution { public: int solve(int n) { return 0; } };",
  },
};

describe("findDrift", () => {
  it("reports no issues when the folder exactly matches what src/data/problems.js would generate", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "problems-drift-"));
    tmpDirs.push(dir);
    await writeProblemFolder(dir, fakeProblem);

    const issues = await findDrift([fakeProblem], dir);
    expect(issues).toEqual([]);
  });

  it("reports a drift issue when a file's content differs", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "problems-drift-"));
    tmpDirs.push(dir);
    await writeProblemFolder(dir, fakeProblem, {
      "description.md": "This has been hand-edited out of sync.",
    });

    const issues = await findDrift([fakeProblem], dir);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("fake-drift-problem/description.md");
  });

  it("reports a drift issue when a file is missing entirely", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "problems-drift-"));
    tmpDirs.push(dir);
    await writeProblemFolder(dir, fakeProblem, { "hints.json": undefined });

    const issues = await findDrift([fakeProblem], dir);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("missing on disk");
  });

  it("the real backend/problems/* folders have zero drift against src/data/problems.js", async () => {
    const { default: problems } = await import("../../src/data/problems.js");
    const realProblemsDir = path.join(process.cwd(), "problems");
    const issues = await findDrift(problems, realProblemsDir);
    expect(issues).toEqual([]);
  });
});
