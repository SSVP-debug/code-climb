import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import {
  hasCompletedQuizToday,
  markQuizCompletedToday,
  hasShownOnboardingThisSession,
  markOnboardingShownThisSession,
} from "./dailyQuizStorage";

describe("dailyQuizStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports not completed when nothing has been recorded yet", () => {
    expect(hasCompletedQuizToday()).toBe(false);
  });

  it("reports completed immediately after marking it done today", () => {
    markQuizCompletedToday();
    expect(hasCompletedQuizToday()).toBe(true);
  });

  it("reports not completed again once the calendar day changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T10:00:00Z"));
    markQuizCompletedToday();
    expect(hasCompletedQuizToday()).toBe(true);

    vi.setSystemTime(new Date("2026-08-04T00:05:00Z"));
    expect(hasCompletedQuizToday()).toBe(false);
  });
});

describe("dailyQuizStorage — per-session onboarding tracking", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("reports not shown when nothing has been recorded yet this session", () => {
    expect(hasShownOnboardingThisSession()).toBe(false);
  });

  it("reports shown immediately after marking it for this session", () => {
    markOnboardingShownThisSession();
    expect(hasShownOnboardingThisSession()).toBe(true);
  });

  it("is independent of the quiz's own once-per-day tracking", () => {
    markOnboardingShownThisSession();
    expect(hasCompletedQuizToday()).toBe(false);

    localStorage.clear();
    sessionStorage.clear();
    markQuizCompletedToday();
    expect(hasShownOnboardingThisSession()).toBe(false);
  });
});