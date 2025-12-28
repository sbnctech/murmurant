import { describe, it, expect, beforeEach } from "vitest";
import { MockAuthService } from "@/services/auth/MockAuthService";
import { MockEmailService } from "@/services/email/MockEmailService";
import { MockPaymentService } from "@/services/payments/MockPaymentService";

describe("Mock Services", () => {
  describe("MockAuthService", () => {
    let auth: MockAuthService;

    beforeEach(() => {
      auth = new MockAuthService();
    });

    it("can register a user", async () => {
      const user = await auth.register({
        email: "test@example.com",
        password: "password123",
      });
      expect(user.email).toBe("test@example.com");
      expect(user.id).toBeDefined();
      expect(user.emailVerified).toBe(false);
    });

    it("prevents duplicate email registration", async () => {
      await auth.register({ email: "test@example.com", password: "pass1" });
      await expect(
        auth.register({ email: "test@example.com", password: "pass2" })
      ).rejects.toThrow("Email already registered");
    });

    it("can login with registered user", async () => {
      await auth.register({ email: "test@example.com", password: "password123" });
      const session = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      expect(session.token).toBeDefined();
      expect(session.userId).toBeDefined();
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it("rejects login with wrong password", async () => {
      await auth.register({ email: "test@example.com", password: "password123" });
      await expect(
        auth.login({ email: "test@example.com", password: "wrongpassword" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("rejects login for non-existent user", async () => {
      await expect(
        auth.login({ email: "nobody@example.com", password: "password123" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("can verify a valid session", async () => {
      await auth.register({ email: "test@example.com", password: "password123" });
      const session = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      const verified = await auth.verifySession(session.token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(session.userId);
    });

    it("returns null for invalid session token", async () => {
      const verified = await auth.verifySession("invalid_token");
      expect(verified).toBeNull();
    });

    it("can logout and invalidate session", async () => {
      await auth.register({ email: "test@example.com", password: "password123" });
      const session = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      await auth.logout(session.id);
      const verified = await auth.verifySession(session.token);
      expect(verified).toBeNull();
    });

    it("can refresh a session", async () => {
      await auth.register({ email: "test@example.com", password: "password123" });
      const session = await auth.login({
        email: "test@example.com",
        password: "password123",
      });
      const newSession = await auth.refreshSession(session.token);
      expect(newSession.token).not.toBe(session.token);
      expect(newSession.userId).toBe(session.userId);
    });

    it("can get user by ID", async () => {
      const registered = await auth.register({
        email: "test@example.com",
        password: "password123",
      });
      const user = await auth.getUserById(registered.id);
      expect(user).not.toBeNull();
      expect(user?.email).toBe("test@example.com");
    });

    it("returns null for non-existent user ID", async () => {
      const user = await auth.getUserById("nonexistent");
      expect(user).toBeNull();
    });
  });

  describe("MockEmailService", () => {
    let email: MockEmailService;

    beforeEach(() => {
      email = new MockEmailService();
    });

    it("can send an email", async () => {
      const result = await email.sendEmail({
        to: { email: "test@example.com", name: "Test User" },
        subject: "Test Subject",
        text: "Hello, world!",
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.status).toBe("sent");
    });

    it("tracks sent emails", async () => {
      await email.sendEmail({
        to: { email: "a@example.com" },
        subject: "A",
        text: "A",
      });
      await email.sendEmail({
        to: { email: "b@example.com" },
        subject: "B",
        text: "B",
      });
      const sent = email.getSentEmails();
      expect(sent.length).toBe(2);
    });

    it("can get emails sent to specific address", async () => {
      await email.sendEmail({
        to: { email: "target@example.com" },
        subject: "For target",
        text: "Hello",
      });
      await email.sendEmail({
        to: { email: "other@example.com" },
        subject: "For other",
        text: "Hi",
      });
      const targetEmails = email.getEmailsTo("target@example.com");
      expect(targetEmails.length).toBe(1);
      expect(targetEmails[0].message.subject).toBe("For target");
    });

    it("can send bulk emails", async () => {
      const result = await email.sendBulkEmail([
        { to: { email: "a@example.com" }, subject: "A", text: "A" },
        { to: { email: "b@example.com" }, subject: "B", text: "B" },
        { to: { email: "c@example.com" }, subject: "C", text: "C" },
      ]);
      expect(result.total).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    it("can simulate failures", async () => {
      email.shouldFail = true;
      const result = await email.sendEmail({
        to: { email: "test@example.com" },
        subject: "Test",
        text: "Test",
      });
      expect(result.success).toBe(false);
      expect(result.status).toBe("failed");
    });

    it("can clear sent emails", async () => {
      await email.sendEmail({
        to: { email: "test@example.com" },
        subject: "Test",
        text: "Test",
      });
      expect(email.getSentCount()).toBe(1);
      email.clear();
      expect(email.getSentCount()).toBe(0);
    });

    it("can create and manage campaigns", async () => {
      const campaignId = await email.createCampaign({
        name: "Test Campaign",
        subject: "Campaign Subject",
        recipients: [
          { email: "a@example.com" },
          { email: "b@example.com" },
        ],
        content: { text: "Campaign content" },
      });
      expect(campaignId).toBeDefined();

      const stats = await email.getCampaignStats(campaignId);
      expect(stats.sent).toBe(2);
    });
  });

  describe("MockPaymentService", () => {
    let payments: MockPaymentService;

    beforeEach(() => {
      payments = new MockPaymentService();
    });

    it("can create a payment intent", async () => {
      const intent = await payments.createPaymentIntent(1000, "usd");
      expect(intent.id).toBeDefined();
      expect(intent.amount).toBe(1000);
      expect(intent.currency).toBe("usd");
      expect(intent.status).toBe("pending");
      expect(intent.clientSecret).toBeDefined();
    });

    it("can confirm a payment", async () => {
      const intent = await payments.createPaymentIntent(1000, "usd");
      const result = await payments.confirmPayment(intent.id);
      expect(result.success).toBe(true);
      expect(result.status).toBe("succeeded");
    });

    it("fails to confirm non-existent payment", async () => {
      const result = await payments.confirmPayment("nonexistent_id");
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("not_found");
    });

    it("can refund a payment", async () => {
      const intent = await payments.createPaymentIntent(1000, "usd");
      await payments.confirmPayment(intent.id);
      const refund = await payments.refundPayment(intent.id);
      expect(refund.success).toBe(true);
      expect(refund.amount).toBe(1000);
    });

    it("can partially refund a payment", async () => {
      const intent = await payments.createPaymentIntent(1000, "usd");
      await payments.confirmPayment(intent.id);
      const refund = await payments.refundPayment(intent.id, 500);
      expect(refund.success).toBe(true);
      expect(refund.amount).toBe(500);
    });

    it("can create a subscription", async () => {
      const subscription = await payments.createSubscription(
        "customer_123",
        "price_456"
      );
      expect(subscription.id).toBeDefined();
      expect(subscription.customerId).toBe("customer_123");
      expect(subscription.priceId).toBe("price_456");
      expect(subscription.status).toBe("active");
    });

    it("can cancel a subscription", async () => {
      const subscription = await payments.createSubscription(
        "customer_123",
        "price_456"
      );
      await payments.cancelSubscription(subscription.id);
      // Verify the subscription was cancelled by creating another and checking
      // (since we don't have a getSubscription method exposed)
    });

    it("can get empty payment history", async () => {
      const history = await payments.getPaymentHistory("customer_123");
      expect(history).toEqual([]);
    });

    it("can add and retrieve invoices", async () => {
      payments.addInvoice("customer_123", {
        customerId: "customer_123",
        amount: 1000,
        currency: "usd",
        status: "paid",
        description: "Test invoice",
      });
      const history = await payments.getPaymentHistory("customer_123");
      expect(history.length).toBe(1);
      expect(history[0].amount).toBe(1000);
    });

    it("can reset state", async () => {
      await payments.createPaymentIntent(1000, "usd");
      payments.addInvoice("customer_123", {
        customerId: "customer_123",
        amount: 1000,
        currency: "usd",
        status: "paid",
        description: "Test",
      });
      payments.reset();
      const history = await payments.getPaymentHistory("customer_123");
      expect(history).toEqual([]);
    });
  });
});
