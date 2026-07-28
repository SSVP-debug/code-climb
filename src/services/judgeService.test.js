import { describe, expect, it, vi, beforeEach } from "vitest";
import { judgeSubmission } from "./judgeService";
import { apiFetch } from "./api";

vi.mock("./api", () => ({
  apiFetch: vi.fn(),
}));

describe("judgeSubmission", () => {
  const problem = {
    title: "Two Sum",
    slug: "two-sum",
    functionName: "twoSum",
    testcases: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Accepted response from API", async () => {
    apiFetch.mockResolvedValue({
      status: "Accepted",
      passed: 4,
      total: 4,
    });

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Accepted");
    expect(res.passed).toBe(4);
    expect(apiFetch).toHaveBeenCalled();
  });

  it("returns Wrong Answer response from API", async () => {
    apiFetch.mockResolvedValue({
      status: "Wrong Answer",
      passed: 0,
      total: 4,
    });

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Wrong Answer");
    expect(res.passed).toBe(0);
  });

  it("returns Compilation Error response from API", async () => {
    apiFetch.mockResolvedValue({
      status: "Compilation Error",
    });

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Compilation Error");
  });

  it("returns Runtime Error response from API", async () => {
    apiFetch.mockResolvedValue({
      status: "Runtime Error",
    });

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Runtime Error");
  });

  it("returns Judge Error when API throws", async () => {
    apiFetch.mockRejectedValue(
      new Error("Network error")
    );

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Judge Error");
    expect(res.error).toBe("Network error");
    expect(res.passed).toBe(0);
  });
});

describe("runTestcases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends problemSlug so the backend can resolve the execution contract server-side (audit P1-1)", async () => {
    apiFetch.mockResolvedValue({ results: [], compileFailed: false });

    const { runTestcases } = await import("./judgeService");
    await runTestcases({
      problem: {
        slug: "top-k-frequent-elements",
        functionName: "topKFrequent",
        testcases: [],
        comparisonMode: "unordered",
      },
      code: "dummy code",
      language: "python",
    });

    const sentBody = JSON.parse(apiFetch.mock.calls[0][1].body);
    expect(sentBody.problemSlug).toBe("top-k-frequent-elements");
    // Contract fields are resolved server-side from problemSlug now — the
    // frontend no longer needs to (and doesn't) send them.
    expect(sentBody.comparisonMode).toBeUndefined();
    expect(sentBody.returnType).toBeUndefined();
    expect(sentBody.operationSequence).toBeUndefined();
  });

  it("sends code/language/testcases needed to run the preview", async () => {
    apiFetch.mockResolvedValue({ results: [], compileFailed: false });

    const { runTestcases } = await import("./judgeService");
    await runTestcases({
      problem: { slug: "two-sum", functionName: "twoSum", testcases: [{ input: { nums: [1] }, expectedOutput: 1 }] },
      code: "dummy code",
      language: "python",
    });

    const sentBody = JSON.parse(apiFetch.mock.calls[0][1].body);
    expect(sentBody.code).toBe("dummy code");
    expect(sentBody.language).toBe("python");
    expect(sentBody.testcases).toEqual([{ input: { nums: [1] }, expectedOutput: 1 }]);
  });
});