import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose");
  return {
    ...actual,
    default: {
      ...actual.default,
      model: vi.fn(),
    },
  };
});

describe("Counter.nextSequence()", () => {
  let findByIdAndUpdate;

  beforeEach(async () => {
    vi.resetModules();
    findByIdAndUpdate = vi.fn();
    const mongoose = (await import("mongoose")).default;
    mongoose.model.mockReturnValue({ findByIdAndUpdate });
  });

  it("calls findByIdAndUpdate with $inc + upsert (atomic, no read-then-write race)", async () => {
    findByIdAndUpdate.mockResolvedValue({ seq: 1 });
    const { nextSequence } = await import("./Counter.js");

    await nextSequence("opportunity");

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      "opportunity",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
  });

  it("returns the incremented seq value", async () => {
    findByIdAndUpdate.mockResolvedValue({ seq: 42 });
    const { nextSequence } = await import("./Counter.js");

    const result = await nextSequence("opportunity");

    expect(result).toBe(42);
  });
});
