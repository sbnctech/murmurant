/**
 * Email Templates Tests
 *
 * Tests for themed email template generation.
 */

import { describe, it, expect } from "vitest";
import { defaultTheme } from "@/lib/themes/defaults";
import {
  generateWelcomeEmail,
  generateRenewalReminderEmail,
  generateEventConfirmationEmail,
  generateEventReminderEmail,
  generatePasswordResetEmail,
  generateAnnouncementEmail,
} from "@/lib/themes/templates/emailTemplates";
import type { ClubTheme } from "@/lib/themes/types";

// ============================================================================
// Test Data
// ============================================================================

const mockWelcomeData = {
  memberName: "Jane Doe",
  loginUrl: "https://example.com/login",
  contactEmail: "contact@example.com",
};

const mockRenewalData = {
  memberName: "Jane Doe",
  expirationDate: new Date("2025-02-01"),
  renewalUrl: "https://example.com/renew",
  duesAmount: "$50.00",
};

const mockEventConfirmationData = {
  memberName: "Jane Doe",
  eventName: "Monthly Luncheon",
  eventDate: new Date("2025-01-15"),
  eventLocation: "Community Center",
  calendarUrl: "https://example.com/calendar",
};

const mockEventReminderData = {
  memberName: "Jane Doe",
  eventName: "Monthly Luncheon",
  eventDate: new Date("2025-01-15"),
  eventLocation: "Community Center",
  eventUrl: "https://example.com/event/123",
};

const mockPasswordResetData = {
  memberName: "Jane Doe",
  resetUrl: "https://example.com/reset?token=abc123",
  expirationMinutes: 60,
};

const mockAnnouncementData = {
  memberName: "Jane Doe",
  subject: "Important Club Announcement",
  bodyHtml: "<p>We have exciting news to share!</p>",
  ctaText: "Learn More",
  ctaUrl: "https://example.com/announcement",
};

// ============================================================================
// Welcome Email Tests
// ============================================================================

describe("Email Templates", () => {
  describe("Welcome Email", () => {
    it("generates valid HTML structure", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
      expect(html).toContain("<body");
      expect(html).toContain("</body>");
    });

    it("includes member name in greeting", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toContain("Jane");
    });

    it("includes club name", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toContain(defaultTheme.name);
    });

    it("uses theme primary color", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toContain(defaultTheme.colors.primary);
    });

    it("includes login URL", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toContain(mockWelcomeData.loginUrl);
    });

    it("includes contact email when provided", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toContain(mockWelcomeData.contactEmail);
    });
  });

  // ============================================================================
  // Renewal Reminder Tests
  // ============================================================================

  describe("Renewal Reminder Email", () => {
    it("generates valid HTML structure", () => {
      const html = generateRenewalReminderEmail(defaultTheme, mockRenewalData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("mentions renewal or membership", () => {
      const html = generateRenewalReminderEmail(defaultTheme, mockRenewalData);
      expect(html.toLowerCase()).toMatch(/renew|membership/);
    });

    it("includes renewal URL", () => {
      const html = generateRenewalReminderEmail(defaultTheme, mockRenewalData);
      expect(html).toContain(mockRenewalData.renewalUrl);
    });

    it("includes dues amount when provided", () => {
      const html = generateRenewalReminderEmail(defaultTheme, mockRenewalData);
      expect(html).toContain("$50.00");
    });
  });

  // ============================================================================
  // Event Confirmation Tests
  // ============================================================================

  describe("Event Confirmation Email", () => {
    it("generates valid HTML structure", () => {
      const html = generateEventConfirmationEmail(
        defaultTheme,
        mockEventConfirmationData
      );
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("includes event name", () => {
      const html = generateEventConfirmationEmail(
        defaultTheme,
        mockEventConfirmationData
      );
      expect(html).toContain("Monthly Luncheon");
    });

    it("includes event location", () => {
      const html = generateEventConfirmationEmail(
        defaultTheme,
        mockEventConfirmationData
      );
      expect(html).toContain("Community Center");
    });

    it("includes calendar URL when provided", () => {
      const html = generateEventConfirmationEmail(
        defaultTheme,
        mockEventConfirmationData
      );
      expect(html).toContain(mockEventConfirmationData.calendarUrl);
    });
  });

  // ============================================================================
  // Event Reminder Tests
  // ============================================================================

  describe("Event Reminder Email", () => {
    it("generates valid HTML structure", () => {
      const html = generateEventReminderEmail(
        defaultTheme,
        mockEventReminderData
      );
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("includes event name", () => {
      const html = generateEventReminderEmail(
        defaultTheme,
        mockEventReminderData
      );
      expect(html).toContain("Monthly Luncheon");
    });

    it("includes event URL", () => {
      const html = generateEventReminderEmail(
        defaultTheme,
        mockEventReminderData
      );
      expect(html).toContain(mockEventReminderData.eventUrl);
    });
  });

  // ============================================================================
  // Password Reset Tests
  // ============================================================================

  describe("Password Reset Email", () => {
    it("generates valid HTML structure", () => {
      const html = generatePasswordResetEmail(
        defaultTheme,
        mockPasswordResetData
      );
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("includes reset URL", () => {
      const html = generatePasswordResetEmail(
        defaultTheme,
        mockPasswordResetData
      );
      expect(html).toContain(mockPasswordResetData.resetUrl);
    });

    it("mentions expiration time", () => {
      const html = generatePasswordResetEmail(
        defaultTheme,
        mockPasswordResetData
      );
      expect(html).toContain("60 minutes");
    });

    it("includes security notice", () => {
      const html = generatePasswordResetEmail(
        defaultTheme,
        mockPasswordResetData
      );
      expect(html.toLowerCase()).toContain("ignore");
    });
  });

  // ============================================================================
  // Announcement Tests
  // ============================================================================

  describe("Announcement Email", () => {
    it("generates valid HTML structure", () => {
      const html = generateAnnouncementEmail(
        defaultTheme,
        mockAnnouncementData
      );
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("includes body HTML content", () => {
      const html = generateAnnouncementEmail(
        defaultTheme,
        mockAnnouncementData
      );
      expect(html).toContain("exciting news");
    });

    it("includes CTA button when provided", () => {
      const html = generateAnnouncementEmail(
        defaultTheme,
        mockAnnouncementData
      );
      expect(html).toContain("Learn More");
      expect(html).toContain(mockAnnouncementData.ctaUrl);
    });
  });

  // ============================================================================
  // Voice Tone Variation Tests
  // ============================================================================

  describe("Voice Tone Variations", () => {
    it("formal tone uses appropriate greeting", () => {
      const formalTheme: ClubTheme = {
        ...defaultTheme,
        voice: { ...defaultTheme.voice, tone: "formal" },
      };
      const html = generateWelcomeEmail(formalTheme, mockWelcomeData);
      expect(html).toMatch(/Dear/i);
    });

    it("casual tone uses casual greeting", () => {
      const casualTheme: ClubTheme = {
        ...defaultTheme,
        voice: { ...defaultTheme.voice, tone: "casual" },
      };
      const html = generateWelcomeEmail(casualTheme, mockWelcomeData);
      expect(html).toMatch(/Hey/i);
    });

    it("friendly tone uses friendly greeting", () => {
      const friendlyTheme: ClubTheme = {
        ...defaultTheme,
        voice: { ...defaultTheme.voice, tone: "friendly" },
      };
      const html = generateWelcomeEmail(friendlyTheme, mockWelcomeData);
      expect(html).toMatch(/Hi/i);
    });

    it("professional tone uses professional greeting", () => {
      const professionalTheme: ClubTheme = {
        ...defaultTheme,
        voice: { ...defaultTheme.voice, tone: "professional" },
      };
      const html = generateWelcomeEmail(professionalTheme, mockWelcomeData);
      expect(html).toMatch(/Hello/i);
    });
  });

  // ============================================================================
  // Email Accessibility Tests
  // ============================================================================

  describe("Email Accessibility", () => {
    it("includes lang attribute on html element", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toMatch(/<html[^>]*lang="en"/);
    });

    it("uses table role=presentation for layout", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toContain('role="presentation"');
    });

    it("includes meta viewport for mobile", () => {
      const html = generateWelcomeEmail(defaultTheme, mockWelcomeData);
      expect(html).toContain("viewport");
    });
  });

  // ============================================================================
  // Custom Terminology Tests
  // ============================================================================

  describe("Custom Terminology", () => {
    it("uses custom member term", () => {
      const customTheme: ClubTheme = {
        ...defaultTheme,
        voice: {
          ...defaultTheme.voice,
          terminology: {
            ...defaultTheme.voice.terminology,
            member: "Newcomer",
          },
        },
      };
      const html = generateWelcomeEmail(customTheme, mockWelcomeData);
      expect(html).toContain("Newcomer");
    });

    it("uses custom event term", () => {
      const customTheme: ClubTheme = {
        ...defaultTheme,
        voice: {
          ...defaultTheme.voice,
          terminology: {
            ...defaultTheme.voice.terminology,
            event: "Activity",
          },
        },
      };
      const html = generateEventReminderEmail(customTheme, mockEventReminderData);
      expect(html).toContain("Activity");
    });
  });
});
