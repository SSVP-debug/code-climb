import { beforeEach, describe, expect, it } from "vitest";
import {
  getUserLevel,
  getUserRank,
} from "./analyticsUtils";
import { PROGRESS_KEYS } from "../constants/progressKeys";

describe("analyticsUtils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns Beginner rank for few solves", () => {
    localStorage.setItem(
      PROGRESS_KEYS.solved,
      JSON.stringify(["a", "b"])
    );

    expect(getUserRank()).toBe("Beginner");
    expect(getUserLevel()).toBe(2);
  });

  it("returns Expert rank for many solves", () => {
    const slugs = Array.from({ length: 60 }, (_, i) =>
      String(i)
    );

    localStorage.setItem(
      PROGRESS_KEYS.solved,
      JSON.stringify(slugs)
    );

    expect(getUserRank()).toBe("Expert");
    expect(getUserLevel()).toBe(60);
  });
});
