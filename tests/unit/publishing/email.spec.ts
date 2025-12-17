// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for email template system

import { describe, it, expect } from "vitest";
import { replaceTokens, getAvailableTokens, TokenContext } from "@/lib/publishing/email";

describe("Email Template System", () => {
  describe("replaceTokens", () => {
    it("replaces member tokens", () => {
      const template = "Hello {{member.firstName}} {{member.lastName}}!";
      const context: TokenContext = {
        member: {
          id: "123",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      const result = replaceTokens(template, context);

      expect(result).toBe("Hello John Doe!");
    });

    it("replaces member.fullName token", () => {
      const template = "Hello {{member.fullName}}!";
      const context: TokenContext = {
        member: {
          id: "123",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      const result = replaceTokens(template, context);

      expect(result).toBe("Hello John Doe!");
    });

    it("replaces member.email token", () => {
      const template = "Your email is {{member.email}}";
      const context: TokenContext = {
        member: {
          id: "123",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      const result = replaceTokens(template, context);

      expect(result).toBe("Your email is john@example.com");
    });

    it("replaces member.phone token with empty string if null", () => {
      const template = "Phone: {{member.phone}}";
      const context: TokenContext = {
        member: {
          id: "123",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: null,
        },
      };

      const result = replaceTokens(template, context);

      expect(result).toBe("Phone: ");
    });

    it("replaces event tokens", () => {
      const startTime = new Date("2025-03-15T14:00:00Z");
      const template = "Event: {{event.title}} at {{event.location}}";
      const context: TokenContext = {
        event: {
          id: "e123",
          title: "Monthly Meeting",
          location: "Community Center",
          startTime,
        },
      };

      const result = replaceTokens(template, context);

      expect(result).toBe("Event: Monthly Meeting at Community Center");
    });

    it("replaces club tokens with defaults", () => {
      const template = "Welcome to {{club.name}}! Visit {{club.website}}";
      const context: TokenContext = {};

      const result = replaceTokens(template, context);

      expect(result).toContain("Santa Barbara Newcomers Club");
      expect(result).toContain("sbnewcomers.org");
    });

    it("replaces club tokens with custom values", () => {
      const template = "Welcome to {{club.name}}!";
      const context: TokenContext = {
        club: {
          name: "Test Club",
          website: "https://test.com",
          email: "test@test.com",
        },
      };

      const result = replaceTokens(template, context);

      expect(result).toBe("Welcome to Test Club!");
    });

    it("replaces custom tokens", () => {
      const template = "Special code: {{custom.code}}";
      const context: TokenContext = {
        custom: {
          code: "ABC123",
        },
      };

      const result = replaceTokens(template, context);

      expect(result).toBe("Special code: ABC123");
    });

    it("replaces currentYear token", () => {
      const template = "Copyright {{currentYear}}";
      const context: TokenContext = {};

      const result = replaceTokens(template, context);

      expect(result).toBe(`Copyright ${new Date().getFullYear()}`);
    });

    it("escapes HTML in token values", () => {
      const template = "Name: {{member.firstName}}";
      const context: TokenContext = {
        member: {
          id: "123",
          firstName: "<script>alert('xss')</script>",
          lastName: "Doe",
          email: "test@example.com",
        },
      };

      const result = replaceTokens(template, context);

      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("handles missing member context gracefully", () => {
      const template = "Hello {{member.firstName}}!";
      const context: TokenContext = {};

      const result = replaceTokens(template, context);

      // Tokens without context remain as-is
      expect(result).toBe("Hello {{member.firstName}}!");
    });

    it("handles multiple occurrences of same token", () => {
      const template = "{{member.firstName}}, welcome {{member.firstName}}!";
      const context: TokenContext = {
        member: {
          id: "123",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      const result = replaceTokens(template, context);

      expect(result).toBe("John, welcome John!");
    });
  });

  describe("getAvailableTokens", () => {
    it("returns token categories", () => {
      const tokens = getAvailableTokens();

      expect(tokens).toHaveLength(4);
      expect(tokens.map((t) => t.category)).toContain("Member");
      expect(tokens.map((t) => t.category)).toContain("Event");
      expect(tokens.map((t) => t.category)).toContain("Club");
      expect(tokens.map((t) => t.category)).toContain("System");
    });

    it("includes member tokens", () => {
      const tokens = getAvailableTokens();
      const memberCategory = tokens.find((t) => t.category === "Member");

      expect(memberCategory?.tokens).toContainEqual({
        token: "{{member.firstName}}",
        description: "Member first name",
      });
    });

    it("includes event tokens", () => {
      const tokens = getAvailableTokens();
      const eventCategory = tokens.find((t) => t.category === "Event");

      expect(eventCategory?.tokens).toContainEqual({
        token: "{{event.title}}",
        description: "Event title",
      });
    });

    it("includes club tokens", () => {
      const tokens = getAvailableTokens();
      const clubCategory = tokens.find((t) => t.category === "Club");

      expect(clubCategory?.tokens).toContainEqual({
        token: "{{club.name}}",
        description: "Club name",
      });
    });

    it("includes system tokens", () => {
      const tokens = getAvailableTokens();
      const systemCategory = tokens.find((t) => t.category === "System");

      expect(systemCategory?.tokens).toContainEqual({
        token: "{{currentYear}}",
        description: "Current year",
      });
    });
  });
});
