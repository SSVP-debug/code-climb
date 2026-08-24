import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Counter.js calls `mongoose.model("Counter", counterSchema)` at module
 * load time, so the mock needs `model()` to return a stable object we can
 * assert against. Using vi.hoisted() to define findByIdAndUpdate before
 * the vi.mock factory runs — Vitest hoists vi.mock() calls to the top of
 * the file, so anything the factory closes over must itself be created
 * through vi.hoisted() rather than a plain top-level const.
 *
 * Deliberately NOT using vi.importActual("mongoose") + vi.resetModules()
 * here (an earlier version of this file did): that combination forces a
 * full, real, cold re-import of the entire mongoose package — with all
 * its transitive dependencies (bson, kareem, sift, mquery, ...) — fresh
 * on every single test, since resetModules() bypasses Vitest's module
 * cache. That's slow on any machine, and slow enough on Windows
 * (filesystem/antivirus overhead per required file) to blow past the
 * default 10s hook timeout. A plain synchronous mock factory — the same
 * pattern already used in controllers/adminHealthController.test.js —
 * never touches the real mongoose package at all, so there's nothing
 * expensive to re-import.
 */
const { findByIdAndUpdate } = vi.hoisted(() => ({ findByIdAndUpdate: vi.fn() }));

vi.mock("mongoose", () => ({
  default: {
    Schema: vi.fn(),
    model: vi.fn(() => ({ findByIdAndUpdate })),
  },
}));

import { nextSequence } from "./Counter.js";

describe("Counter.nextSequence()", () => {
  beforeEach(() => {
    findByIdAndUpdate.mockReset();
  });

  it("calls findByIdAndUpdate with $inc + upsert (atomic, no read-then-write race)", async () => {
    findByIdAndUpdate.mockResolvedValue({ seq: 1 });

    await nextSequence("opportunity");

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      "opportunity",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
  });

  it("returns the incremented seq value", async () => {
    findByIdAndUpdate.mockResolvedValue({ seq: 42 });

    const result = await nextSequence("opportunity");

    expect(result).toBe(42);
  });
});
