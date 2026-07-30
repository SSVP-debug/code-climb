import { describe, expect, it, beforeEach, vi } from "vitest";

// Small, fast values so tests don't need to wait on real 8/20000ms defaults.
process.env.JUDGE0_MAX_CONCURRENCY = "2";
process.env.JUDGE0_ACQUIRE_TIMEOUT_MS = "50";

async function freshQueue() {
  vi.resetModules();
  return import("./directExecutionQueue.js");
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}

describe("directExecutionQueue", () => {
  it("runs a job immediately when under capacity", async () => {
    const { enqueueExecution } = await freshQueue();
    const job = vi.fn().mockResolvedValue("ok");

    const result = await enqueueExecution(job);

    expect(result).toBe("ok");
    expect(job).toHaveBeenCalledOnce();
  });

  it("never lets more than MAX_CONCURRENT jobs run at once", async () => {
    const { enqueueExecution } = await freshQueue();
    let concurrent = 0;
    let maxSeen = 0;

    const makeJob = () => async () => {
      concurrent++;
      maxSeen = Math.max(maxSeen, concurrent);
      await new Promise((r) => setTimeout(r, 10));
      concurrent--;
      return "done";
    };

    await Promise.all([
      enqueueExecution(makeJob()),
      enqueueExecution(makeJob()),
      enqueueExecution(makeJob()),
      enqueueExecution(makeJob()),
    ]);

    expect(maxSeen).toBeLessThanOrEqual(2); // JUDGE0_MAX_CONCURRENCY above
  });

  it("queues a job past capacity and runs it once a slot frees up (FIFO)", async () => {
    const { enqueueExecution } = await freshQueue();
    const order = [];

    const slotA = deferred();
    const slotB = deferred();

    // Occupy both slots with long-running jobs.
    const p1 = enqueueExecution(() => slotA.promise.then(() => { order.push(1); return 1; }));
    const p2 = enqueueExecution(() => slotB.promise.then(() => { order.push(2); return 2; }));

    // These two must queue — capacity is full.
    const p3 = enqueueExecution(async () => { order.push(3); return 3; });
    const p4 = enqueueExecution(async () => { order.push(4); return 4; });

    // Give the event loop a tick to confirm 3/4 haven't run yet.
    await new Promise((r) => setTimeout(r, 5));
    expect(order).toEqual([]);

    slotA.resolve();
    slotB.resolve();

    const results = await Promise.all([p1, p2, p3, p4]);

    expect(results).toEqual([1, 2, 3, 4]);
    // FIFO: whichever slot frees first, the OLDEST waiter (3) goes next.
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(4));
  });

  it("rejects with a clear, actionable error after the acquire timeout when capacity never frees", async () => {
    const { enqueueExecution } = await freshQueue();

    // Occupy both slots forever (never resolved in this test).
    enqueueExecution(() => new Promise(() => {}));
    enqueueExecution(() => new Promise(() => {}));

    const waiter = enqueueExecution(vi.fn());

    await expect(waiter).rejects.toThrow(/at capacity/i);
  });

  it("does not leak a slot to a waiter that already timed out", async () => {
    const { enqueueExecution } = await freshQueue();

    // Fill capacity with jobs that release after the timeout would have
    // already fired for a third waiter.
    const holdA = deferred();
    const holdB = deferred();
    const p1 = enqueueExecution(() => holdA.promise);
    const p2 = enqueueExecution(() => holdB.promise);

    const timedOutWaiter = enqueueExecution(vi.fn());
    await expect(timedOutWaiter).rejects.toThrow(/at capacity/i);

    // Now free both original slots — a well-behaved queue should have
    // nothing left waiting (the timed-out waiter must not still be queued
    // and should not be granted a slot after the fact).
    holdA.resolve();
    holdB.resolve();
    await Promise.all([p1, p2]);

    // A fresh job should get a slot immediately (capacity fully free),
    // proving no phantom waiter/slot was left over from the timeout.
    const job = vi.fn().mockResolvedValue("fresh");
    const start = Date.now();
    const result = await enqueueExecution(job);
    const elapsed = Date.now() - start;

    expect(result).toBe("fresh");
    expect(elapsed).toBeLessThan(30); // ran immediately, didn't queue at all
  });

  it("still releases the slot (and unblocks the next waiter) if the job throws", async () => {
    const { enqueueExecution } = await freshQueue();

    const holdA = deferred();
    const p1 = enqueueExecution(() => holdA.promise);
    const p2 = enqueueExecution(async () => {
      throw new Error("boom");
    });

    await expect(p2).rejects.toThrow("boom");

    // p2's failure must not hold its slot hostage — a job queued behind it
    // should still be able to acquire once p1 (currently holding the other
    // slot) frees up too. Prove no slot was leaked by filling capacity
    // again and confirming it doesn't hang past the timeout.
    holdA.resolve();
    await p1;

    const job = vi.fn().mockResolvedValue("ok");
    await expect(enqueueExecution(job)).resolves.toBe("ok");
  });
});
