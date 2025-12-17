// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for theme system

import { describe, it, expect } from "vitest";
import {
  generateCssVariables,
  mergeTokensWithDefaults,
  sanitizeCss,
  validateThemeTokens,
  DEFAULT_THEME_TOKENS,
} from "@/lib/publishing/theme";

describe("Theme System", () => {
  describe("generateCssVariables", () => {
    it("generates CSS variables for colors", () => {
      const tokens = {
        colors: {
          primary: "#0066cc",
          secondary: "#ff6600",
        },
      };

      const css = generateCssVariables(tokens);

      expect(css).toContain("--color-primary: #0066cc;");
      expect(css).toContain("--color-secondary: #ff6600;");
      expect(css).toContain(":root {");
      expect(css).toContain("}");
    });

    it("generates CSS variables for typography", () => {
      const tokens = {
        typography: {
          fontFamily: "Arial, sans-serif",
          fontSizeBase: "16px",
        },
      };

      const css = generateCssVariables(tokens);

      expect(css).toContain("--font-family: Arial, sans-serif;");
      expect(css).toContain("--font-size-base: 16px;");
    });

    it("generates CSS variables for spacing", () => {
      const tokens = {
        spacing: {
          sm: "8px",
          md: "16px",
          lg: "24px",
        },
      };

      const css = generateCssVariables(tokens);

      expect(css).toContain("--spacing-sm: 8px;");
      expect(css).toContain("--spacing-md: 16px;");
      expect(css).toContain("--spacing-lg: 24px;");
    });

    it("generates CSS variables for border radius", () => {
      const tokens = {
        borderRadius: {
          sm: "4px",
          full: "9999px",
        },
      };

      const css = generateCssVariables(tokens);

      expect(css).toContain("--border-radius-sm: 4px;");
      expect(css).toContain("--border-radius-full: 9999px;");
    });

    it("generates CSS variables for shadows", () => {
      const tokens = {
        shadows: {
          sm: "0 1px 2px rgba(0,0,0,0.05)",
        },
      };

      const css = generateCssVariables(tokens);

      expect(css).toContain("--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);");
    });

    it("handles empty tokens object", () => {
      const css = generateCssVariables({});

      expect(css).toBe(":root {\n}");
    });
  });

  describe("mergeTokensWithDefaults", () => {
    it("preserves custom values", () => {
      const custom = {
        colors: {
          primary: "#custom",
        },
      };

      const merged = mergeTokensWithDefaults(custom);

      expect(merged.colors?.primary).toBe("#custom");
    });

    it("fills in missing values from defaults", () => {
      const custom = {
        colors: {
          primary: "#custom",
        },
      };

      const merged = mergeTokensWithDefaults(custom);

      expect(merged.colors?.secondary).toBe(DEFAULT_THEME_TOKENS.colors?.secondary);
      expect(merged.typography?.fontSizeBase).toBe(DEFAULT_THEME_TOKENS.typography?.fontSizeBase);
    });

    it("handles empty input", () => {
      const merged = mergeTokensWithDefaults({});

      expect(merged.colors?.primary).toBe(DEFAULT_THEME_TOKENS.colors?.primary);
      expect(merged.typography?.fontFamily).toBe(DEFAULT_THEME_TOKENS.typography?.fontFamily);
    });
  });

  describe("sanitizeCss", () => {
    it("allows valid CSS", () => {
      const css = ".test { color: red; font-size: 16px; }";
      expect(sanitizeCss(css)).toBe(css);
    });

    it("removes script tags", () => {
      const css = ".test { color: red; }<script>alert('xss')</script>";
      expect(sanitizeCss(css)).toBe(".test { color: red; }");
    });

    it("removes javascript: URLs", () => {
      const css = ".test { background: url(javascript:alert('xss')); }";
      expect(sanitizeCss(css)).not.toContain("javascript:");
    });

    it("removes expression()", () => {
      const css = ".test { width: expression(document.body.clientWidth); }";
      expect(sanitizeCss(css)).not.toContain("expression(");
    });

    it("removes behavior: property", () => {
      const css = ".test { behavior: url(malicious.htc); }";
      expect(sanitizeCss(css)).not.toContain("behavior:");
    });

    it("removes -moz-binding", () => {
      const css = ".test { -moz-binding: url('xss.xml'); }";
      expect(sanitizeCss(css)).not.toContain("-moz-binding:");
    });
  });

  describe("validateThemeTokens", () => {
    it("validates valid tokens", () => {
      const tokens = {
        colors: { primary: "#0066cc" },
        typography: { fontSizeBase: "16px" },
      };

      const result = validateThemeTokens(tokens);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects non-object tokens", () => {
      const result = validateThemeTokens("invalid");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tokens must be an object");
    });

    it("rejects null tokens", () => {
      const result = validateThemeTokens(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tokens must be an object");
    });

    it("validates colors is object", () => {
      const result = validateThemeTokens({ colors: "invalid" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("colors must be an object");
    });

    it("validates typography is object", () => {
      const result = validateThemeTokens({ typography: [] });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("typography must be an object");
    });

    it("validates spacing is object", () => {
      const result = validateThemeTokens({ spacing: 123 });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("spacing must be an object");
    });

    it("validates borderRadius is object", () => {
      const result = validateThemeTokens({ borderRadius: true });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("borderRadius must be an object");
    });

    it("validates shadows is object", () => {
      const result = validateThemeTokens({ shadows: false });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("shadows must be an object");
    });
  });
});
