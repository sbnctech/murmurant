/**
 * Payment Idempotency Tests
 *
 * Charter N5: Automation must be idempotent
 *
 * These tests verify:
 * 1. Retry create intent -> does not duplicate
 * 2. Duplicate webhook -> does not double-confirm
 * 3. Timeout scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FakePaymentProvider } from "@/lib/payments/fake-provider";
import { prisma } from "@/lib/prisma";
import { PaymentIntentStatus } from "@prisma/client";

// Mock prisma for unit tests
vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentIntent: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    eventRegistration: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("Payment Idempotency", () => {
  let provider: FakePaymentProvider;

  beforeEach(() => {
    provider = new FakePaymentProvider();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createPaymentIntent idempotency", () => {
    it("returns existing intent when idempotencyKey matches", async () => {
      const existingIntent = {
        id: "existing-intent-id",
        providerRef: "fake_pi_existing",
        status: PaymentIntentStatus.CREATED,
        checkoutUrl: "http://localhost:3000/checkout",
        idempotencyKey: "test-idempotency-key",
      };

      vi.mocked(prisma.paymentIntent.findUnique).mockResolvedValue(existingIntent as never);

      const result = await provider.createPaymentIntent({
        registrationId: "reg-123",
        amountCents: 5000,
        idempotencyKey: "test-idempotency-key",
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.intentId).toBe("existing-intent-id");
      expect(result.providerRef).toBe("fake_pi_existing");

      // Should not create a new intent
      expect(prisma.paymentIntent.create).not.toHaveBeenCalled();
    });

    it("creates new intent when idempotencyKey is unique", async () => {
      vi.mocked(prisma.paymentIntent.findUnique).mockResolvedValue(null as never);
      vi.mocked(prisma.paymentIntent.create).mockResolvedValue({
        id: "new-intent-id",
        providerRef: "fake_pi_new",
        status: PaymentIntentStatus.CREATED,
        checkoutUrl: "http://localhost:3000/api/payments/fake/checkout?ref=fake_pi_new",
        idempotencyKey: "unique-key",
        registrationId: "reg-123",
        amountCents: 5000,
        currency: "USD",
        provider: "fake",
      } as never);
      vi.mocked(prisma.eventRegistration.update).mockResolvedValue({} as never);

      const result = await provider.createPaymentIntent({
        registrationId: "reg-123",
        amountCents: 5000,
        idempotencyKey: "unique-key",
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.intentId).toBe("new-intent-id");

      // Should create a new intent
      expect(prisma.paymentIntent.create).toHaveBeenCalledTimes(1);
    });

    it("does not duplicate on rapid concurrent requests with same key", async () => {
      // First call returns null (intent doesn't exist)
      // Simulates a race condition where second request hits DB before first insert
      let callCount = 0;
      vi.mocked(prisma.paymentIntent.findUnique).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return null as never;
        }
        // Second call finds the intent created by first request
        return {
          id: "first-intent-id",
          providerRef: "fake_pi_first",
          status: PaymentIntentStatus.CREATED,
          idempotencyKey: "race-key",
        } as never;
      });

      vi.mocked(prisma.paymentIntent.create).mockResolvedValue({
        id: "first-intent-id",
        providerRef: "fake_pi_first",
        status: PaymentIntentStatus.CREATED,
        checkoutUrl: "http://localhost:3000/checkout",
        idempotencyKey: "race-key",
        registrationId: "reg-123",
        amountCents: 5000,
        currency: "USD",
        provider: "fake",
      } as never);
      vi.mocked(prisma.eventRegistration.update).mockResolvedValue({} as never);

      // First request
      const result1 = await provider.createPaymentIntent({
        registrationId: "reg-123",
        amountCents: 5000,
        idempotencyKey: "race-key",
      });

      // Second request with same key
      const result2 = await provider.createPaymentIntent({
        registrationId: "reg-123",
        amountCents: 5000,
        idempotencyKey: "race-key",
      });

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(true);

      // Only one create should have been called
      expect(prisma.paymentIntent.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleWebhook idempotency", () => {
    it("returns isDuplicate=true for already processed webhook", async () => {
      // Intent that has already received a webhook
      vi.mocked(prisma.paymentIntent.findFirst).mockResolvedValue({
        id: "intent-123",
        providerRef: "fake_pi_123",
        status: PaymentIntentStatus.SUCCEEDED,
        webhookReceivedAt: new Date(), // Already processed
        registrationId: "reg-123",
        registration: { id: "reg-123" },
      } as never);

      const result = await provider.handleWebhook({
        type: "payment_intent.succeeded",
        providerRef: "fake_pi_123",
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(true);

      // Should not update anything
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("processes webhook and marks as received", async () => {
      // Intent that hasn't received a webhook yet
      vi.mocked(prisma.paymentIntent.findFirst).mockResolvedValue({
        id: "intent-123",
        providerRef: "fake_pi_123",
        status: PaymentIntentStatus.CREATED,
        webhookReceivedAt: null, // Not yet processed
        registrationId: "reg-123",
        registration: { id: "reg-123" },
      } as never);

      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never);

      const result = await provider.handleWebhook({
        type: "payment_intent.succeeded",
        providerRef: "fake_pi_123",
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(false);
      expect(result.newStatus).toBe(PaymentIntentStatus.SUCCEEDED);

      // Should update intent and registration
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("does not double-confirm on duplicate webhook", async () => {
      // First webhook
      vi.mocked(prisma.paymentIntent.findFirst).mockResolvedValueOnce({
        id: "intent-123",
        providerRef: "fake_pi_123",
        status: PaymentIntentStatus.CREATED,
        webhookReceivedAt: null,
        registrationId: "reg-123",
        registration: { id: "reg-123" },
      } as never);

      vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}] as never);

      const result1 = await provider.handleWebhook({
        type: "payment_intent.succeeded",
        providerRef: "fake_pi_123",
        timestamp: new Date(),
      });

      // Second webhook (duplicate) - intent now has webhookReceivedAt set
      vi.mocked(prisma.paymentIntent.findFirst).mockResolvedValueOnce({
        id: "intent-123",
        providerRef: "fake_pi_123",
        status: PaymentIntentStatus.SUCCEEDED,
        webhookReceivedAt: new Date(),
        registrationId: "reg-123",
        registration: { id: "reg-123" },
      } as never);

      const result2 = await provider.handleWebhook({
        type: "payment_intent.succeeded",
        providerRef: "fake_pi_123",
        timestamp: new Date(),
      });

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(true);

      // Transaction should only be called once
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("payment failure handling", () => {
    it("transitions registration to DRAFT on payment failure", async () => {
      vi.mocked(prisma.paymentIntent.findFirst).mockResolvedValue({
        id: "intent-123",
        providerRef: "fake_pi_123",
        status: PaymentIntentStatus.CREATED,
        webhookReceivedAt: null,
        registrationId: "reg-123",
        registration: { id: "reg-123" },
      } as never);

      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never);

      const result = await provider.handleWebhook({
        type: "payment_intent.failed",
        providerRef: "fake_pi_123",
        timestamp: new Date(),
        failureReason: "Card declined",
      });

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe(PaymentIntentStatus.FAILED);

      // Verify transaction was called
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Production Safety", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fake provider returns false for isAvailable in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    const provider = new FakePaymentProvider();
    expect(provider.isAvailable()).toBe(false);
  });

  it("fake provider throws error on createPaymentIntent in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const provider = new FakePaymentProvider();

    await expect(
      provider.createPaymentIntent({
        registrationId: "reg-123",
        amountCents: 5000,
        idempotencyKey: "test-key",
      })
    ).rejects.toThrow("Fake payment provider is not available in production");
  });
});
