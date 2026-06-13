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
      status: "Accepted 🎉",
      passed: 4,
      total: 4,
    });

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Accepted 🎉");
    expect(res.passed).toBe(4);
    expect(apiFetch).toHaveBeenCalled();
  });

  it("returns Wrong Answer response from API", async () => {
    apiFetch.mockResolvedValue({
      status: "Wrong Answer ❌",
      passed: 0,
      total: 4,
    });

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Wrong Answer ❌");
    expect(res.passed).toBe(0);
  });

  it("returns Compilation Error response from API", async () => {
    apiFetch.mockResolvedValue({
      status: "Compilation Error ❌",
    });

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Compilation Error ❌");
  });

  it("returns Runtime Error response from API", async () => {
    apiFetch.mockResolvedValue({
      status: "Runtime Error ❌",
    });

    const res = await judgeSubmission({
      problem,
      code: "dummy code",
      language: "python",
    });

    expect(res.status).toBe("Runtime Error ❌");
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

    expect(res.status).toBe("Judge Error ❌");
    expect(res.error).toBe("Network error");
    expect(res.passed).toBe(0);
  });
});