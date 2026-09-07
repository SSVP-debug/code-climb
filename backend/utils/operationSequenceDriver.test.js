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
const HAS_GCC = toolAvailable("gcc");

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

  it("typescript: reuses generateJsDriver verbatim (Phase 6, plan 010 — this file was missed by the original TypeScript rollout, which only touched generateDriverCode.js; found via a real content-validation run, not by inspection)", () => {
    const tsCode = generateOperationSequenceDriver(
      "typescript", "class MinStack {}", minStackShape, "MinStack", "all"
    );
    const jsCode = generateOperationSequenceDriver(
      "javascript", "class MinStack {}", minStackShape, "MinStack", "all"
    );
    expect(tsCode).toBe(jsCode);
    expect(tsCode).toContain("new MinStack()");
    expect(tsCode).toContain("_instance.push(-2)");
    expect(tsCode).toContain("_instance.getMin()");
  });

  it("resultMode \"returningOnly\" omits void-call entries instead of nulling them", () => {
    const jsCode = generateOperationSequenceDriver(
      "javascript", "class C {}", minStackShape, "C", "returningOnly"
    );
    expect(jsCode).toContain("if (_r !== undefined) _results.push(_r);");
    expect(jsCode).not.toContain("?? null");
  });

  // C has no classes — uses a struct + prefixed-function convention
  // instead (MinStack_create, MinStack_push, ...) and, unlike every other
  // language here, has no reflection/SFINAE-equivalent to detect a void
  // return, so results are always collected as `long` regardless of
  // resultMode. See languageDrivers/c.js's own header comment for why —
  // this is a real, documented gap, not an oversight.
  it("c: uses a struct + prefixed-function convention and collects scalar (long) results only", () => {
    const code = generateOperationSequenceDriver(
      "c", "typedef struct { int top; } MinStack;", minStackShape, "MinStack", "all"
    );
    expect(code).toContain("MinStack* _instance = MinStack_create();");
    expect(code).toContain("_results[0] = (long) MinStack_push(_instance, _op0_arg0);");
    expect(code).toContain("_results[3] = (long) MinStack_getMin(_instance);");
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

  // Same MinStack sequence as the C++ case above, but using C's struct +
  // prefixed-function convention (see languageDrivers/c.js) and its
  // documented "scalar results only, no void detection" limitation — void
  // calls (push/pop) come back as a dummy 0, not null. This is the direct,
  // real proof that generateOperationSequence()'s output actually compiles
  // and runs correctly for C, not just that it string-matches an expected
  // template.
  it.skipIf(!HAS_GCC)(
    "c: a correct MinStack implementation (struct + prefixed functions) compiles and runs correctly",
    () => {
      const userCode = `
typedef struct {
  int data[100];
  int size;
} MinStack;

MinStack* MinStack_create() {
  MinStack* s = malloc(sizeof(MinStack));
  s->size = 0;
  return s;
}
long MinStack_push(MinStack* self, int val) {
  self->data[self->size++] = val;
  return 0;
}
long MinStack_pop(MinStack* self) {
  self->size--;
  return 0;
}
long MinStack_top(MinStack* self) {
  return self->data[self->size - 1];
}
long MinStack_getMin(MinStack* self) {
  long min = self->data[0];
  for (int i = 1; i < self->size; i++) if (self->data[i] < min) min = self->data[i];
  return min;
}
`;

      const code = generateOperationSequenceDriver("c", userCode, minStackShape, "MinStack", "all");

      const dir = mkdtempSync(join(tmpdir(), "opseq-test-"));
      const cFile = join(dir, "driver.c");
      const binFile = join(dir, "driver");
      writeFileSync(cFile, code);

      execFileSync("gcc", ["-std=c11", "-o", binFile, cFile]);

      const out = execFileSync(binFile, { encoding: "utf-8" }).trim();

      // Same real sequence as the C++/Python cases above, but with 0 in
      // place of null at every void-call slot (push, pop) — the
      // documented consequence of C having no void-detection mechanism.
      expect(JSON.parse(out)).toEqual([0, 0, 0, -3, 0, 0, -2]);
    },
    15_000
  );

  // Node is always available in this environment (unlike g++/python3,
  // which degrade gracefully above) — this is the strongest proof
  // available that the typescript branch added this session actually
  // works end-to-end, not just that it produces text matching the
  // javascript branch's text (the structural test above already proves
  // that; this proves the RESULT of actually running it is correct too).
  it("typescript (via generateJsDriver reuse): a correct MinStack implementation produces the real stored expectedOutput", () => {
    const userCode = `class MinStack {
  constructor() { this.s = []; this.mn = []; }
  push(val) { this.s.push(val); if (!this.mn.length || val <= this.mn[this.mn.length - 1]) this.mn.push(val); }
  pop() { if (this.s[this.s.length - 1] === this.mn[this.mn.length - 1]) this.mn.pop(); this.s.pop(); }
  top() { return this.s[this.s.length - 1]; }
  getMin() { return this.mn[this.mn.length - 1]; }
}`;

    const code = generateOperationSequenceDriver("typescript", userCode, minStackShape, "MinStack", "all");
    const dir = mkdtempSync(join(tmpdir(), "opseq-ts-test-"));
    const file = join(dir, "driver.js"); // plain Node execution — no tsc needed, this IS just JS
    writeFileSync(file, code);

    const out = execFileSync("node", [file], { encoding: "utf-8" }).trim();

    // Same real stored expectedOutput as the python/cpp equivalents above
    // (minimum-stack's visible testcase, src/data/problems.js).
    expect(JSON.parse(out)).toEqual([null, null, null, -3, null, 0, -2]);
  });

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