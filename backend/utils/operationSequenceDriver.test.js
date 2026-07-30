import { describe, expect, it } from "vitest";
import { execFileSync } from "child_process";
import { writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { generateOperationSequenceDriver } from "./operationSequenceDriver.js";
import { identifyOperationSequence } from "./operationSequenceShape.js";

// python3 and g++ are standard on GitHub Actions' ubuntu runners (and this
// sandbox), but tests still degrade gracefully rather than hard-failing in
// an environment that genuinely lacks them — these are the strongest
// regression proof available (they run the ACTUAL generated code, not just
// inspect its text), but the structural tests below don't depend on them.
function toolAvailable(cmd) {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const HAS_PYTHON3 = toolAvailable("python3");
const HAS_GPP = toolAvailable("g++");

const minStackShape = identifyOperationSequence({
  ops: ["push", "push", "push", "getMin", "pop", "top", "getMin"],
  vals: [[-2], [0], [-3], [], [], [], []],
});

describe("generateOperationSequenceDriver — structural checks", () => {
  it("javascript: constructs the instance and calls each op in sequence", () => {
    const code = generateOperationSequenceDriver(
      "javascript", "class MinStack {}", minStackShape, "MinStack", "all"
    );
    expect(code).toContain("new MinStack()");
    expect(code).toContain("_instance.push(-2)");
    expect(code).toContain("_instance.getMin()");
  });

  it("python: constructs the instance and calls each op in sequence", () => {
    const code = generateOperationSequenceDriver(
      "python", "class MinStack: pass", minStackShape, "MinStack", "all"
    );
    expect(code).toContain("MinStack()");
    expect(code).toContain("_instance.push(-2)");
  });

  it("java: uses reflection (no per-problem method table) and boxes literal args", () => {
    const code = generateOperationSequenceDriver(
      "java", "class MinStack {}", minStackShape, "MinStack", "all"
    );
    expect(code).toContain("new MinStack()");
    expect(code).toContain("Method _method = null");
    expect(code).toContain('"push", "push", "push", "getMin", "pop", "top", "getMin"');
    expect(code).toContain("_method.invoke(_instance, _opArgs[_i])");
  });

  it("cpp: uses SFINAE dispatch (portable to C++11, no if-constexpr/C++17 dependency)", () => {
    const code = generateOperationSequenceDriver(
      "cpp", "class MinStack {};", minStackShape, "MinStack", "all"
    );
    expect(code).toContain("MinStack _instance{};");
    expect(code).toContain("callOp(_results, true, [&]{ return _instance.push(-2); });");
    expect(code).not.toContain("if constexpr"); // must not rely on C++17
  });

  it("resultMode \"returningOnly\" omits void-call entries instead of nulling them", () => {
    const jsCode = generateOperationSequenceDriver(
      "javascript", "class C {}", minStackShape, "C", "returningOnly"
    );
    expect(jsCode).toContain("if (_r !== undefined) _results.push(_r);");
    expect(jsCode).not.toContain("?? null");
  });
});

describe("generateOperationSequenceDriver — end-to-end execution (audit P0-2 regression proof)", () => {
  it.skipIf(!HAS_PYTHON3)(
    "python: a correct MinStack implementation produces the real stored expectedOutput",
    () => {
      const userCode = `class MinStack:
    def __init__(self):
        self.s = []; self.mn = []
    def push(self, val):
        self.s.append(val)
        if not self.mn or val <= self.mn[-1]: self.mn.append(val)
    def pop(self):
        if self.s[-1] == self.mn[-1]: self.mn.pop()
        self.s.pop()
    def top(self):
        return self.s[-1]
    def getMin(self):
        return self.mn[-1]`;

      const code = generateOperationSequenceDriver("python", userCode, minStackShape, "MinStack", "all");
      const dir = mkdtempSync(join(tmpdir(), "opseq-test-"));
      const file = join(dir, "driver.py");
      writeFileSync(file, code);

      const out = execFileSync("python3", [file], { encoding: "utf-8" }).trim();

      // Real stored expectedOutput for minimum-stack's visible testcase
      // (src/data/problems.js) — see phase-4 changes doc.
      expect(JSON.parse(out)).toEqual([null, null, null, -3, null, 0, -2]);
    }
  );

  it.skipIf(!HAS_GPP)(
    "cpp: a correct MinStack implementation compiles (C++11) and produces the real stored expectedOutput",
    () => {
      const userCode = `class MinStack {
public:
    MinStack() {}
    void push(int val) { s.push_back(val); if (mn.empty() || val <= mn.back()) mn.push_back(val); }
    void pop() { if (s.back() == mn.back()) mn.pop_back(); s.pop_back(); }
    int top() { return s.back(); }
    int getMin() { return mn.back(); }
private:
    vector<int> s, mn;
};`;

      const code = generateOperationSequenceDriver(
        "cpp",
        userCode,
        minStackShape,
        "MinStack",
        "all"
      );

      const dir = mkdtempSync(join(tmpdir(), "opseq-test-"));
      const cppFile = join(dir, "driver.cpp");
      const binFile = join(dir, "driver");
      writeFileSync(cppFile, code);

      execFileSync("g++", ["-std=c++11", "-o", binFile, cppFile]);

      const out = execFileSync(binFile, {
        encoding: "utf-8",
      }).trim();

      expect(JSON.parse(out)).toEqual([
        null,
        null,
        null,
        -3,
        null,
        0,
        -2,
      ]);
    },
    15_000
  );

  it.skipIf(!HAS_PYTHON3)(
    "python: a Twitter implementation returning vector/List results matches the real stored expectedOutput",
    () => {
      const userCode = `class Twitter:
    def __init__(self):
        self.time = 0; self.tweets = {}; self.following = {}
    def postTweet(self, userId, tweetId):
        self.tweets.setdefault(userId, []).append((self.time, tweetId)); self.time += 1
    def getNewsFeed(self, userId):
        all_t = list(self.tweets.get(userId, []))
        for f in self.following.get(userId, set()):
            all_t += self.tweets.get(f, [])
        all_t.sort(reverse=True)
        return [t[1] for t in all_t[:10]]
    def follow(self, followerId, followeeId):
        self.following.setdefault(followerId, set()).add(followeeId)
    def unfollow(self, followerId, followeeId):
        self.following.setdefault(followerId, set()).discard(followeeId)`;

      const shape = identifyOperationSequence({
        ops: ["postTweet", "getNewsFeed", "follow", "postTweet", "getNewsFeed", "unfollow", "getNewsFeed"],
        vals: [[1, 5], [1], [1, 2], [2, 6], [1], [1, 2], [1]],
      });

      const code = generateOperationSequenceDriver("python", userCode, shape, "Twitter", "all");
      const dir = mkdtempSync(join(tmpdir(), "opseq-test-"));
      const file = join(dir, "driver.py");
      writeFileSync(file, code);

      const out = execFileSync("python3", [file], { encoding: "utf-8" }).trim();
      expect(JSON.parse(out)).toEqual([null, [5], null, null, [6, 5], null, [5]]);
    }
  );
});
