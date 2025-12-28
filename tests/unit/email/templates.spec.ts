import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import { WelcomeEmail } from "@/services/email/templates/WelcomeEmail";
import { PasswordResetEmail } from "@/services/email/templates/PasswordResetEmail";
import { RenewalReminderEmail } from "@/services/email/templates/RenewalReminderEmail";
import { getEmailTemplate } from "@/services/email/templates";

describe("Email Templates", () => {
  describe("WelcomeEmail", () => {
    it("renders without error", async () => {
      const html = await render(WelcomeEmail({ memberName: "John", clubName: "Test Club" }));
      expect(html).toContain("John");
      expect(html).toContain("Test Club");
    });

    it("includes welcome message", async () => {
      const html = await render(WelcomeEmail({ memberName: "Jane", clubName: "Demo Club" }));
      expect(html.toLowerCase()).toContain("welcome");
    });
  });

  describe("PasswordResetEmail", () => {
    it("renders with reset link", async () => {
      const html = await render(PasswordResetEmail({
        memberName: "John",
        resetUrl: "https://example.com/reset/abc123"
      }));
      expect(html).toContain("https://example.com/reset/abc123");
    });

    it("includes expiration warning", async () => {
      const html = await render(PasswordResetEmail({
        memberName: "John",
        resetUrl: "https://example.com/reset/abc123"
      }));
      expect(html.toLowerCase()).toMatch(/expire|hour|valid/);
    });
  });

  describe("RenewalReminderEmail", () => {
    it("renders with expiration date", async () => {
      const html = await render(RenewalReminderEmail({
        memberName: "John",
        expirationDate: "January 15, 2025",
        daysUntilExpiration: 30,
        renewalUrl: "https://example.com/renew"
      }));
      expect(html).toContain("January 15, 2025");
      expect(html).toContain("https://example.com/renew");
    });
  });

  describe("Template Registry", () => {
    it("returns welcome template", () => {
      const template = getEmailTemplate("welcome");
      expect(template).toBeDefined();
    });

    it("returns password-reset template", () => {
      const template = getEmailTemplate("password-reset");
      expect(template).toBeDefined();
    });

    it("returns renewal-reminder template", () => {
      const template = getEmailTemplate("renewal-reminder");
      expect(template).toBeDefined();
    });

    it("returns undefined for unknown template", () => {
      const template = getEmailTemplate("unknown-template");
      expect(template).toBeUndefined();
    });
  });
});
