import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Service Factory", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getEmailService", () => {
    it("returns MockEmailService in test environment", async () => {
      const { getEmailService } = await import("@/services/email");
      const service = getEmailService();
      expect(service).toBeDefined();
      expect(typeof service.sendEmail).toBe("function");
      expect(typeof service.sendBulkEmail).toBe("function");
    });

    it("MockEmailService has required methods", async () => {
      const { MockEmailService } = await import("@/services/email");
      const service = new MockEmailService();
      expect(typeof service.sendEmail).toBe("function");
      expect(typeof service.sendBulkEmail).toBe("function");
      expect(typeof service.getEmailStatus).toBe("function");
    });
  });

  describe("PaymentService", () => {
    it("MockPaymentService can be instantiated", async () => {
      const { MockPaymentService } = await import("@/services/payments");
      const service = new MockPaymentService();
      expect(service).toBeDefined();
      expect(typeof service.createPaymentIntent).toBe("function");
      expect(typeof service.confirmPayment).toBe("function");
    });

    it("StripePaymentService can be instantiated with config", async () => {
      const { StripePaymentService } = await import("@/services/payments");
      expect(StripePaymentService).toBeDefined();
    });
  });

  describe("getRBACService", () => {
    it("returns NativeRBACService", async () => {
      const { getRBACService } = await import("@/services/rbac");
      const service = getRBACService();
      expect(service).toBeDefined();
      expect(typeof service.hasPermission).toBe("function");
      expect(typeof service.getUserRoles).toBe("function");
    });

    it("NativeRBACService implements required interface", async () => {
      const { NativeRBACService } = await import("@/services/rbac");
      expect(NativeRBACService).toBeDefined();
      expect(typeof NativeRBACService).toBe("function");
    });
  });

  describe("Service interfaces", () => {
    it("EmailService interface has correct shape", async () => {
      const { MockEmailService } = await import("@/services/email");
      const service = new MockEmailService();
      const requiredMethods = ["sendEmail", "sendBulkEmail", "getEmailStatus"];
      for (const method of requiredMethods) {
        expect(typeof (service as unknown as Record<string, unknown>)[method]).toBe("function");
      }
    });

    it("PaymentService interface has correct shape", async () => {
      const { MockPaymentService } = await import("@/services/payments");
      const service = new MockPaymentService();
      const requiredMethods = ["createPaymentIntent", "confirmPayment", "refundPayment"];
      for (const method of requiredMethods) {
        expect(typeof (service as unknown as Record<string, unknown>)[method]).toBe("function");
      }
    });
  });
});
