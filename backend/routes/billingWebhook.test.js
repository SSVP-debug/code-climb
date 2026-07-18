import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "crypto";

vi.mock("../models/User.js", () => ({
  default: { findById: vi.fn() },
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../services/notificationService.js", () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}));
vi.mock("../config/featureFlags.js", () => ({
  PRICING: {
    pro_monthly: { label: "Pro Monthly", amountPaise: 19900, interval: "monthly", durationDays: 30 },
    lifetime: { label: "Lifetime", amountPaise: 299900, interval: "lifetime", durationDays: null },
  },
}));

import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import { isValidSignature, applyWebhookEvent } from "./billingWebhook.js";

function paymentCapturedPayload({ userId = "user1", planId = "pro_monthly", paymentId = "pay_1" } = {}) {
  return {
    event: "payment.captured",
    payload: { payment: { entity: { id: paymentId, notes: { userId, planId } } } },
  };
}

function refundPayload({ userId = "user1", event = "refund.created", paymentId = "pay_1" } = {}) {
  return {
    event,
    payload: { payment: { entity: { id: paymentId, notes: { userId } } } },
  };
}

function disputePayload({ userId = "user1", paymentId = "pay_1" } = {}) {
  return {
    event: "payment.dispute.created",
    payload: { payment: { entity: { id: paymentId, notes: { userId } } } },
  };
}

function mockUser(overrides = {}) {
  return {
    _id: "user1",
    subscription: { plan: "free", status: "none" },
    save: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("isValidSignature", () => {
  const secret = "test_webhook_secret";
  const body = Buffer.from(JSON.stringify({ event: "payment.captured" }));

  it("accepts a correctly-signed body", () => {
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(isValidSignature(body, signature, secret)).toBe(true);
  });

  it("rejects a tampered body / wrong signature", () => {
    const wrongSignature = crypto.createHmac("sha256", secret).update(Buffer.from("other")).digest("hex");
    expect(isValidSignature(body, wrongSignature, secret)).toBe(false);
  });

  it("rejects when no signature header is present", () => {
    expect(isValidSignature(body, undefined, secret)).toBe(false);
  });

  it("rejects when the webhook secret isn't configured", () => {
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(isValidSignature(body, signature, undefined)).toBe(false);
  });
});

describe("applyWebhookEvent — payment.captured (backup activation path)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("activates the plan for a user who never completed the /verify round trip", async () => {
    const user = mockUser();
    User.findById.mockResolvedValue(user);

    await applyWebhookEvent(paymentCapturedPayload());

    expect(User.findById).toHaveBeenCalledWith("user1");
    expect(user.save).toHaveBeenCalledOnce();
    expect(user.subscription.status).toBe("active");
    expect(user.subscription.plan).toBe("pro_monthly");
    expect(user.subscription.expiresAt).toBeInstanceOf(Date);
  });

  it("is a no-op if /verify already activated the same plan", async () => {
    const user = mockUser({ subscription: { plan: "pro_monthly", status: "active" } });
    User.findById.mockResolvedValue(user);

    await applyWebhookEvent(paymentCapturedPayload());

    expect(user.save).not.toHaveBeenCalled();
  });

  it("skips gracefully when the payment has no userId/planId notes (not our checkout flow)", async () => {
    await applyWebhookEvent({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_x", notes: {} } } },
    });

    expect(User.findById).not.toHaveBeenCalled();
  });

  it("skips gracefully when the referenced user no longer exists", async () => {
    User.findById.mockResolvedValue(null);
    await applyWebhookEvent(paymentCapturedPayload());
    // Should not throw — that's the assertion; nothing further to check.
  });
});

describe("applyWebhookEvent — refund.created / refund.processed", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["refund.created", "refund.processed"])(
    "revokes access immediately (not at natural expiry) on %s",
    async (event) => {
      const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const user = mockUser({ subscription: { plan: "pro_monthly", status: "active", expiresAt: future } });
      User.findById.mockResolvedValue(user);

      await applyWebhookEvent(refundPayload({ event }));

      expect(user.subscription.status).toBe("cancelled");
      expect(user.subscription.expiresAt.getTime()).toBeLessThan(future.getTime());
      expect(user.save).toHaveBeenCalledOnce();
    }
  );

  it("notifies the user that their subscription was refunded", async () => {
    const user = mockUser({ subscription: { plan: "pro_monthly", status: "active" } });
    User.findById.mockResolvedValue(user);

    await applyWebhookEvent(refundPayload());

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user1", type: "subscription_refunded" })
    );
  });

  it("never throws even if the notification call fails", async () => {
    const user = mockUser({ subscription: { plan: "pro_monthly", status: "active" } });
    User.findById.mockResolvedValue(user);
    createNotification.mockRejectedValueOnce(new Error("notification service down"));

    await expect(applyWebhookEvent(refundPayload())).resolves.not.toThrow();
    expect(user.subscription.status).toBe("cancelled");
  });
});

describe("applyWebhookEvent — payment.dispute.created", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revokes access immediately on a chargeback", async () => {
    const user = mockUser({ subscription: { plan: "lifetime", status: "active" } });
    User.findById.mockResolvedValue(user);

    await applyWebhookEvent(disputePayload());

    expect(user.subscription.status).toBe("cancelled");
    expect(user.save).toHaveBeenCalledOnce();
  });
});

describe("applyWebhookEvent — payment.failed and unknown events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("logs payment.failed without touching any user record", async () => {
    await applyWebhookEvent({
      event: "payment.failed",
      payload: { payment: { entity: { id: "pay_9", notes: { userId: "user1", planId: "pro_monthly" } } } },
    });

    expect(User.findById).not.toHaveBeenCalled();
  });

  it("is a safe no-op for event types we don't handle", async () => {
    await expect(
      applyWebhookEvent({ event: "order.paid", payload: {} })
    ).resolves.not.toThrow();
    expect(User.findById).not.toHaveBeenCalled();
  });
});
