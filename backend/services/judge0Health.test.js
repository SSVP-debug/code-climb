import { describe, expect, it, beforeEach, vi } from "vitest";

async function freshHealthModule() {
  vi.resetModules();
  return import("./judge0Health.js");
}

describe("judge0Health", () => {
  it("starts at zero for a fresh module", async () => {
    const { getJudge0Health } = await freshHealthModule();
    const health = getJudge0Health();

    expect(health.requests).toBe(0);
    expect(health.successes).toBe(0);
    expect(health.failures).toBe(0);
    expect(health.circuitOpen).toBe(false);
  });

  it("recordJudge0Success increments requests and successes, and resets consecutiveFailures", async () => {
    const { getJudge0Health, recordJudge0Success, recordJudge0Failure } = await freshHealthModule();

    recordJudge0Failure();
    recordJudge0Failure();
    recordJudge0Success();

    const health = getJudge0Health();
    expect(health.requests).toBe(3);
    expect(health.successes).toBe(1);
    expect(health.failures).toBe(2);
    expect(health.consecutiveFailures).toBe(0);
  });

  it("recordJudge0Failure increments requests and failures", async () => {
    const { getJudge0Health, recordJudge0Failure } = await freshHealthModule();

    recordJudge0Failure();

    const health = getJudge0Health();
    expect(health.requests).toBe(1);
    expect(health.failures).toBe(1);
    expect(health.successes).toBe(0);
  });

  it("sets circuitOpen (informational only) after 5 consecutive failures", async () => {
    const { getJudge0Health, recordJudge0Failure } = await freshHealthModule();

    for (let i = 0; i < 4; i++) recordJudge0Failure();
    expect(getJudge0Health().circuitOpen).toBe(false);

    recordJudge0Failure();
    const health = getJudge0Health();
    expect(health.circuitOpen).toBe(true);
    expect(health.circuitOpenedAt).not.toBeNull();
  });

  it("clears circuitOpen as soon as a success comes in", async () => {
    const { getJudge0Health, recordJudge0Failure, recordJudge0Success } = await freshHealthModule();

    for (let i = 0; i < 5; i++) recordJudge0Failure();
    expect(getJudge0Health().circuitOpen).toBe(true);

    recordJudge0Success();
    const health = getJudge0Health();
    expect(health.circuitOpen).toBe(false);
    expect(health.circuitOpenedAt).toBeNull();
  });

  it("includes uptime and timestamp in the reported snapshot", async () => {
    const { getJudge0Health } = await freshHealthModule();
    const health = getJudge0Health();

    expect(typeof health.uptime).toBe("number");
    expect(typeof health.timestamp).toBe("string");
  });
});
