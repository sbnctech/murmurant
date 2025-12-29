/**
 * Theme System Tests
 *
 * Comprehensive tests for theme types, defaults, and schema validation.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, it, expect } from "vitest";
import { defaultTheme } from "@/lib/themes/defaults";
import {
  clubThemeSchema,
  partialClubThemeSchema,
  validateTheme,
  isValidTheme,
  isValidHexColor,
  colorPaletteSchema,
  logoConfigSchema,
  bugConfigSchema,
  typographyConfigSchema,
  shapeConfigSchema,
  voiceConfigSchema,
  chatbotConfigSchema,
} from "@/lib/themes/schema";

describe("Theme System", () => {
  describe("Default Theme", () => {
    it("has required id and name", () => {
      expect(defaultTheme.id).toBe("murmurant-default");
      expect(defaultTheme.name).toBe("Murmurant Default");
    });

    it("has logo configuration", () => {
      expect(defaultTheme.logo.url).toBeDefined();
      expect(defaultTheme.logo.width).toBeGreaterThan(0);
      expect(defaultTheme.logo.height).toBeGreaterThan(0);
      expect(defaultTheme.logo.alt).toBeDefined();
    });

    it("has bug configuration", () => {
      expect(defaultTheme.bug.url).toBeDefined();
      expect(defaultTheme.bug.size).toBeGreaterThan(0);
    });

    it("has complete color palette", () => {
      const colors = defaultTheme.colors;
      expect(colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.primaryHover).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.surface).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.textPrimary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.textSecondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.textMuted).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.border).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.success).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.warning).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.error).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has typography configuration", () => {
      expect(defaultTheme.typography.fontHeading).toBeDefined();
      expect(defaultTheme.typography.fontBody).toBeDefined();
      expect(defaultTheme.typography.fontMono).toBeDefined();
      expect(defaultTheme.typography.baseFontSize).toBeGreaterThan(0);
      expect(defaultTheme.typography.lineHeight).toBeGreaterThan(0);
    });

    it("has shape configuration", () => {
      expect(["none", "sm", "md", "lg", "full"]).toContain(defaultTheme.shape.borderRadius);
      expect(["square", "rounded", "pill"]).toContain(defaultTheme.shape.buttonStyle);
      expect(["flat", "raised", "outlined"]).toContain(defaultTheme.shape.cardStyle);
    });

    it("has voice configuration", () => {
      expect(["formal", "friendly", "casual", "professional"]).toContain(defaultTheme.voice.tone);
      expect(defaultTheme.voice.terminology.member).toBeDefined();
      expect(defaultTheme.voice.terminology.event).toBeDefined();
      expect(defaultTheme.voice.terminology.dues).toBeDefined();
      expect(defaultTheme.voice.greeting).toBeDefined();
    });

    it("has chatbot configuration", () => {
      expect(defaultTheme.chatbot.name).toBeDefined();
      expect(defaultTheme.chatbot.personality).toBeDefined();
      expect(defaultTheme.chatbot.suggestedPrompts.length).toBeGreaterThan(0);
    });

    it("passes schema validation", () => {
      const result = clubThemeSchema.safeParse(defaultTheme);
      expect(result.success).toBe(true);
    });
  });

  describe("Schema Validation", () => {
    describe("Logo Config Schema", () => {
      it("validates correct logo config", () => {
        const result = logoConfigSchema.safeParse({
          url: "/logo.svg",
          width: 200,
          height: 60,
          alt: "Logo",
        });
        expect(result.success).toBe(true);
      });

      it("rejects empty url", () => {
        const result = logoConfigSchema.safeParse({
          url: "",
          width: 200,
          height: 60,
          alt: "Logo",
        });
        expect(result.success).toBe(false);
      });

      it("rejects negative dimensions", () => {
        const result = logoConfigSchema.safeParse({
          url: "/logo.svg",
          width: -100,
          height: 60,
          alt: "Logo",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Bug Config Schema", () => {
      it("validates correct bug config", () => {
        const result = bugConfigSchema.safeParse({
          url: "/bug.svg",
          size: 32,
        });
        expect(result.success).toBe(true);
      });

      it("rejects zero size", () => {
        const result = bugConfigSchema.safeParse({
          url: "/bug.svg",
          size: 0,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Color Palette Schema", () => {
      it("validates correct color palette", () => {
        const result = colorPaletteSchema.safeParse(defaultTheme.colors);
        expect(result.success).toBe(true);
      });

      it("accepts 3-character hex colors", () => {
        const result = colorPaletteSchema.safeParse({
          ...defaultTheme.colors,
          primary: "#fff",
        });
        expect(result.success).toBe(true);
      });

      it("rejects invalid hex color", () => {
        const result = colorPaletteSchema.safeParse({
          ...defaultTheme.colors,
          primary: "not-a-color",
        });
        expect(result.success).toBe(false);
      });

      it("rejects rgb format", () => {
        const result = colorPaletteSchema.safeParse({
          ...defaultTheme.colors,
          primary: "rgb(255, 0, 0)",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Typography Config Schema", () => {
      it("validates correct typography config", () => {
        const result = typographyConfigSchema.safeParse(defaultTheme.typography);
        expect(result.success).toBe(true);
      });

      it("rejects excessive font size", () => {
        const result = typographyConfigSchema.safeParse({
          ...defaultTheme.typography,
          baseFontSize: 100,
        });
        expect(result.success).toBe(false);
      });

      it("rejects excessive line height", () => {
        const result = typographyConfigSchema.safeParse({
          ...defaultTheme.typography,
          lineHeight: 5,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Shape Config Schema", () => {
      it("validates correct shape config", () => {
        const result = shapeConfigSchema.safeParse(defaultTheme.shape);
        expect(result.success).toBe(true);
      });

      it("rejects invalid border radius", () => {
        const result = shapeConfigSchema.safeParse({
          ...defaultTheme.shape,
          borderRadius: "invalid",
        });
        expect(result.success).toBe(false);
      });

      it("rejects invalid button style", () => {
        const result = shapeConfigSchema.safeParse({
          ...defaultTheme.shape,
          buttonStyle: "invalid",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Voice Config Schema", () => {
      it("validates correct voice config", () => {
        const result = voiceConfigSchema.safeParse(defaultTheme.voice);
        expect(result.success).toBe(true);
      });

      it("rejects invalid tone", () => {
        const result = voiceConfigSchema.safeParse({
          ...defaultTheme.voice,
          tone: "aggressive",
        });
        expect(result.success).toBe(false);
      });

      it("rejects empty greeting", () => {
        const result = voiceConfigSchema.safeParse({
          ...defaultTheme.voice,
          greeting: "",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Chatbot Config Schema", () => {
      it("validates correct chatbot config", () => {
        const result = chatbotConfigSchema.safeParse(defaultTheme.chatbot);
        expect(result.success).toBe(true);
      });

      it("rejects empty prompts array", () => {
        const result = chatbotConfigSchema.safeParse({
          ...defaultTheme.chatbot,
          suggestedPrompts: [],
        });
        expect(result.success).toBe(false);
      });

      it("rejects too many prompts", () => {
        const result = chatbotConfigSchema.safeParse({
          ...defaultTheme.chatbot,
          suggestedPrompts: Array(15).fill("prompt"),
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Club Theme Schema", () => {
      it("validates complete theme", () => {
        const result = clubThemeSchema.safeParse(defaultTheme);
        expect(result.success).toBe(true);
      });

      it("rejects invalid theme id format", () => {
        const result = clubThemeSchema.safeParse({
          ...defaultTheme,
          id: "Invalid ID With Spaces",
        });
        expect(result.success).toBe(false);
      });

      it("accepts lowercase hyphenated id", () => {
        const result = clubThemeSchema.safeParse({
          ...defaultTheme,
          id: "my-custom-theme-123",
        });
        expect(result.success).toBe(true);
      });

      it("rejects theme name exceeding 100 characters", () => {
        const result = clubThemeSchema.safeParse({
          ...defaultTheme,
          name: "x".repeat(101),
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Partial Theme Schema", () => {
      it("validates partial theme with just id", () => {
        const result = partialClubThemeSchema.safeParse({
          id: "partial-theme",
        });
        expect(result.success).toBe(true);
      });

      it("validates partial theme with some fields", () => {
        const result = partialClubThemeSchema.safeParse({
          id: "partial-theme",
          name: "Partial Theme",
          colors: defaultTheme.colors,
        });
        expect(result.success).toBe(true);
      });

      it("rejects partial theme without id", () => {
        const result = partialClubThemeSchema.safeParse({
          name: "No ID Theme",
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Validation Functions", () => {
    describe("validateTheme", () => {
      it("returns validated theme for valid input", () => {
        const result = validateTheme(defaultTheme);
        expect(result.id).toBe(defaultTheme.id);
      });

      it("throws for invalid input", () => {
        expect(() => validateTheme({ id: "invalid" })).toThrow();
      });
    });

    describe("isValidTheme", () => {
      it("returns true for valid theme", () => {
        expect(isValidTheme(defaultTheme)).toBe(true);
      });

      it("returns false for invalid theme", () => {
        expect(isValidTheme({ id: "incomplete" })).toBe(false);
      });

      it("returns false for null", () => {
        expect(isValidTheme(null)).toBe(false);
      });

      it("returns false for undefined", () => {
        expect(isValidTheme(undefined)).toBe(false);
      });
    });

    describe("isValidHexColor", () => {
      it("validates 6-character hex", () => {
        expect(isValidHexColor("#ff0000")).toBe(true);
        expect(isValidHexColor("#FF0000")).toBe(true);
        expect(isValidHexColor("#2563eb")).toBe(true);
      });

      it("validates 3-character hex", () => {
        expect(isValidHexColor("#fff")).toBe(true);
        expect(isValidHexColor("#000")).toBe(true);
      });

      it("rejects invalid formats", () => {
        expect(isValidHexColor("ff0000")).toBe(false);
        expect(isValidHexColor("#gggggg")).toBe(false);
        expect(isValidHexColor("rgb(255,0,0)")).toBe(false);
        expect(isValidHexColor("#ff00")).toBe(false);
        expect(isValidHexColor("")).toBe(false);
      });
    });
  });
});
