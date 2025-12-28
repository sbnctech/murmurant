import { describe, it, expect, beforeEach } from "vitest";
import { MockEmailService } from "@/services/email/MockEmailService";

describe("Email Services", () => {
  describe("MockEmailService", () => {
    let service: MockEmailService;

    beforeEach(() => {
      service = new MockEmailService();
    });

    it("sends single email", async () => {
      const result = await service.sendEmail({
        to: { email: "test@example.com", name: "Test User" },
        subject: "Test Subject",
        html: "<p>Test body</p>",
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.status).toBe("sent");
    });

    it("tracks sent emails", async () => {
      await service.sendEmail({
        to: { email: "a@example.com" },
        subject: "A",
        text: "A",
      });
      await service.sendEmail({
        to: { email: "b@example.com" },
        subject: "B",
        text: "B",
      });
      const sent = service.getSentEmails();
      expect(sent.length).toBe(2);
    });

    it("sends bulk email", async () => {
      const result = await service.sendBulkEmail([
        { to: { email: "a@example.com" }, subject: "A", text: "A" },
        { to: { email: "b@example.com" }, subject: "B", text: "B" },
        { to: { email: "c@example.com" }, subject: "C", text: "C" },
      ]);
      expect(result.total).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    it("gets email status", async () => {
      const sendResult = await service.sendEmail({
        to: { email: "test@example.com" },
        subject: "Test",
        text: "Test",
      });
      const status = await service.getEmailStatus(sendResult.messageId!);
      expect(status).toBe("sent");
    });

    it("returns failed status for unknown message id", async () => {
      const status = await service.getEmailStatus("unknown-id");
      expect(status).toBe("failed");
    });

    it("clears sent emails", async () => {
      await service.sendEmail({
        to: { email: "test@example.com" },
        subject: "Test",
        text: "Test",
      });
      service.clear();
      expect(service.getSentEmails().length).toBe(0);
    });

    it("gets emails sent to specific address", async () => {
      await service.sendEmail({
        to: { email: "alice@example.com" },
        subject: "To Alice",
        text: "Hi Alice",
      });
      await service.sendEmail({
        to: { email: "bob@example.com" },
        subject: "To Bob",
        text: "Hi Bob",
      });
      await service.sendEmail({
        to: { email: "alice@example.com" },
        subject: "Also to Alice",
        text: "Hi again",
      });

      const aliceEmails = service.getEmailsTo("alice@example.com");
      expect(aliceEmails.length).toBe(2);

      const bobEmails = service.getEmailsTo("bob@example.com");
      expect(bobEmails.length).toBe(1);
    });

    it("sends templated email", async () => {
      const result = await service.sendTemplatedEmail(
        "welcome",
        { email: "newuser@example.com", name: "New User" },
        { firstName: "New", lastName: "User" }
      );
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("simulates failures when configured", async () => {
      service.shouldFail = true;

      const result = await service.sendEmail({
        to: { email: "test@example.com" },
        subject: "Test",
        text: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe("failed");
      expect(result.error).toBeDefined();
    });

    it("creates and manages campaigns", async () => {
      const campaignId = await service.createCampaign({
        name: "Test Campaign",
        subject: "Campaign Subject",
        recipients: [
          { email: "a@example.com" },
          { email: "b@example.com" },
          { email: "c@example.com" },
        ],
        status: "draft",
      });

      expect(campaignId).toBeDefined();

      const stats = await service.getCampaignStats(campaignId);
      expect(stats.campaignId).toBe(campaignId);
      expect(stats.sent).toBe(3);
    });

    it("cancels campaigns", async () => {
      const campaignId = await service.createCampaign({
        name: "Test Campaign",
        subject: "Campaign Subject",
        recipients: [{ email: "a@example.com" }],
        status: "draft",
      });

      const cancelled = await service.cancelCampaign(campaignId);
      expect(cancelled).toBe(true);

      const notFound = await service.cancelCampaign("nonexistent");
      expect(notFound).toBe(false);
    });

    it("tracks sent count", async () => {
      expect(service.getSentCount()).toBe(0);

      await service.sendEmail({
        to: { email: "a@example.com" },
        subject: "A",
        text: "A",
      });
      expect(service.getSentCount()).toBe(1);

      await service.sendEmail({
        to: { email: "b@example.com" },
        subject: "B",
        text: "B",
      });
      expect(service.getSentCount()).toBe(2);
    });

    it("handles multiple recipients", async () => {
      const result = await service.sendEmail({
        to: [
          { email: "a@example.com" },
          { email: "b@example.com" },
        ],
        subject: "Multi-recipient",
        text: "Sent to multiple",
      });

      expect(result.success).toBe(true);

      const sentToA = service.getEmailsTo("a@example.com");
      const sentToB = service.getEmailsTo("b@example.com");
      expect(sentToA.length).toBe(1);
      expect(sentToB.length).toBe(1);
    });
  });
});
