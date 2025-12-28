/**
 * Payment Services Tests
 * Phase 1: Comprehensive tests for payment service implementations
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MockPaymentService } from "@/services/payments/MockPaymentService";
import { StripePaymentService } from "@/services/payments/StripePaymentService";

describe("Payment Services", () => {
  describe("MockPaymentService", () => {
    let service: MockPaymentService;

    beforeEach(() => {
      service = new MockPaymentService();
      service.reset();
    });

    describe("createPaymentIntent", () => {
      it("creates payment intent with correct amount", async () => {
        const intent = await service.createPaymentIntent(5000, "usd");
        expect(intent.amount).toBe(5000);
        expect(intent.currency).toBe("usd");
        expect(intent.status).toBe("pending");
      });

      it("generates unique IDs for each intent", async () => {
        const intent1 = await service.createPaymentIntent(1000, "usd");
        const intent2 = await service.createPaymentIntent(2000, "usd");
        expect(intent1.id).not.toBe(intent2.id);
      });

      it("includes client secret", async () => {
        const intent = await service.createPaymentIntent(5000, "usd");
        expect(intent.clientSecret).toBeDefined();
        expect(intent.clientSecret).toContain("secret_");
      });

      it("accepts optional metadata", async () => {
        const metadata = { orderId: "order_123", memberId: "member_456" };
        const intent = await service.createPaymentIntent(5000, "usd", metadata);
        expect(intent.metadata).toEqual(metadata);
      });

      it("sets createdAt timestamp", async () => {
        const before = new Date();
        const intent = await service.createPaymentIntent(5000, "usd");
        const after = new Date();
        expect(intent.createdAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime()
        );
        expect(intent.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe("confirmPayment", () => {
      it("confirms payment successfully", async () => {
        const intent = await service.createPaymentIntent(5000, "usd");
        const result = await service.confirmPayment(intent.id);
        expect(result.success).toBe(true);
        expect(result.status).toBe("succeeded");
        expect(result.paymentId).toBe(intent.id);
      });

      it("fails for non-existent payment intent", async () => {
        const result = await service.confirmPayment("pi_nonexistent");
        expect(result.success).toBe(false);
        expect(result.status).toBe("failed");
        expect(result.errorCode).toBe("not_found");
        expect(result.errorMessage).toContain("not found");
      });
    });

    describe("refundPayment", () => {
      it("processes full refund", async () => {
        const intent = await service.createPaymentIntent(5000, "usd");
        await service.confirmPayment(intent.id);
        const refund = await service.refundPayment(intent.id);
        expect(refund.success).toBe(true);
        expect(refund.amount).toBe(5000);
        expect(refund.status).toBe("succeeded");
      });

      it("processes partial refund", async () => {
        const intent = await service.createPaymentIntent(5000, "usd");
        await service.confirmPayment(intent.id);
        const refund = await service.refundPayment(intent.id, 2500);
        expect(refund.success).toBe(true);
        expect(refund.amount).toBe(2500);
      });

      it("generates refund ID", async () => {
        const intent = await service.createPaymentIntent(5000, "usd");
        await service.confirmPayment(intent.id);
        const refund = await service.refundPayment(intent.id);
        expect(refund.refundId).toContain("re_mock_");
      });

      it("fails for non-existent payment", async () => {
        const refund = await service.refundPayment("pi_nonexistent", 1000);
        expect(refund.success).toBe(false);
        expect(refund.status).toBe("failed");
        expect(refund.errorMessage).toContain("not found");
      });
    });

    describe("createSubscription", () => {
      it("creates subscription with active status", async () => {
        const sub = await service.createSubscription("cust_123", "price_123");
        expect(sub.id).toBeDefined();
        expect(sub.status).toBe("active");
        expect(sub.customerId).toBe("cust_123");
        expect(sub.priceId).toBe("price_123");
      });

      it("sets billing period dates", async () => {
        const sub = await service.createSubscription("cust_123", "price_123");
        expect(sub.currentPeriodStart).toBeInstanceOf(Date);
        expect(sub.currentPeriodEnd).toBeInstanceOf(Date);
        expect(sub.currentPeriodEnd.getTime()).toBeGreaterThan(
          sub.currentPeriodStart.getTime()
        );
      });

      it("initializes cancelAtPeriodEnd to false", async () => {
        const sub = await service.createSubscription("cust_123", "price_123");
        expect(sub.cancelAtPeriodEnd).toBe(false);
      });
    });

    describe("cancelSubscription", () => {
      it("cancels subscription without throwing", async () => {
        const sub = await service.createSubscription("cust_123", "price_123");
        await expect(
          service.cancelSubscription(sub.id)
        ).resolves.not.toThrow();
      });

      it("handles non-existent subscription gracefully", async () => {
        await expect(
          service.cancelSubscription("sub_nonexistent")
        ).resolves.not.toThrow();
      });
    });

    describe("getPaymentHistory", () => {
      it("returns empty array for new customer", async () => {
        const history = await service.getPaymentHistory("cust_new");
        expect(Array.isArray(history)).toBe(true);
        expect(history).toHaveLength(0);
      });

      it("returns invoices for customer with history", async () => {
        service.addInvoice("cust_123", {
          customerId: "cust_123",
          amount: 5000,
          currency: "usd",
          status: "paid",
          paidAt: new Date(),
        });
        service.addInvoice("cust_123", {
          customerId: "cust_123",
          amount: 3000,
          currency: "usd",
          status: "paid",
          paidAt: new Date(),
        });

        const history = await service.getPaymentHistory("cust_123");
        expect(history).toHaveLength(2);
        expect(history[0].amount).toBe(5000);
        expect(history[1].amount).toBe(3000);
      });
    });

    describe("reset", () => {
      it("clears all stored data", async () => {
        await service.createPaymentIntent(5000, "usd");
        await service.createSubscription("cust_123", "price_123");
        service.addInvoice("cust_123", {
          customerId: "cust_123",
          amount: 5000,
          currency: "usd",
          status: "paid",
          paidAt: new Date(),
        });

        service.reset();

        const history = await service.getPaymentHistory("cust_123");
        expect(history).toHaveLength(0);
      });
    });
  });

  describe("StripePaymentService", () => {
    const originalEnv = process.env.STRIPE_SECRET_KEY;

    afterEach(() => {
      if (originalEnv) {
        process.env.STRIPE_SECRET_KEY = originalEnv;
      } else {
        delete process.env.STRIPE_SECRET_KEY;
      }
    });

    it("throws if STRIPE_SECRET_KEY not set", () => {
      delete process.env.STRIPE_SECRET_KEY;
      expect(() => new StripePaymentService()).toThrow(
        "STRIPE_SECRET_KEY is required"
      );
    });

    it("accepts API key via constructor parameter", () => {
      delete process.env.STRIPE_SECRET_KEY;
      expect(
        () => new StripePaymentService("sk_test_12345")
      ).not.toThrow();
    });

    it("uses environment variable when no parameter provided", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_env_key";
      expect(() => new StripePaymentService()).not.toThrow();
    });
  });
});
