// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for theme hook utilities

import { describe, it, expect } from "vitest";
import {
  DEFAULT_THEME_CONTEXT,
  createLoadingThemeContext,
  createErrorThemeContext,
  mergeThemeTokens,
  buildThemeContext,
  resolvePublicTheme,
  resolveMemberTheme,
  resolvePageTheme,
  generateThemeCss,
  getInlineStyles,
} from "@/lib/publishing/themeHooks";
import { DEFAULT_THEME_TOKENS } from "@/lib/publishing/theme";
import type { ThemeTokens } from "@/lib/publishing/theme";

describe("themeHooks", () => {
  // ============================================================================
  // Default Context
  // ============================================================================

  describe("DEFAULT_THEME_CONTEXT", () => {
    it("should have null themeId", () => {
      expect(DEFAULT_THEME_CONTEXT.themeId).toBeNull();
    });

    it("should have default tokens", () => {
      expect(DEFAULT_THEME_CONTEXT.tokens).toEqual(DEFAULT_THEME_TOKENS);
    });

    it("should have CSS variables string", () => {
      expect(DEFAULT_THEME_CONTEXT.cssVariables).toBeDefined();
      expect(DEFAULT_THEME_CONTEXT.cssVariables.length).toBeGreaterThan(0);
    });

    it("should have public context by default", () => {
      expect(DEFAULT_THEME_CONTEXT.context).toBe("public");
    });

    it("should not be loading", () => {
      expect(DEFAULT_THEME_CONTEXT.isLoading).toBe(false);
    });
  });

  // ============================================================================
  // Context Factories
  // ============================================================================

  describe("createLoadingThemeContext", () => {
    it("should create loading context for public", () => {
      const ctx = createLoadingThemeContext("public");
      expect(ctx.context).toBe("public");
      expect(ctx.isLoading).toBe(true);
    });

    it("should create loading context for member", () => {
      const ctx = createLoadingThemeContext("member");
      expect(ctx.context).toBe("member");
      expect(ctx.isLoading).toBe(true);
    });

    it("should use default tokens", () => {
      const ctx = createLoadingThemeContext("public");
      expect(ctx.tokens).toEqual(DEFAULT_THEME_TOKENS);
    });
  });

  describe("createErrorThemeContext", () => {
    it("should create error context with error object", () => {
      const error = new Error("Theme fetch failed");
      const ctx = createErrorThemeContext("member", error);
      expect(ctx.context).toBe("member");
      expect(ctx.error).toBe(error);
    });

    it("should use default tokens on error", () => {
      const error = new Error("Theme fetch failed");
      const ctx = createErrorThemeContext("public", error);
      expect(ctx.tokens).toEqual(DEFAULT_THEME_TOKENS);
    });

    it("should not be loading on error", () => {
      const error = new Error("Theme fetch failed");
      const ctx = createErrorThemeContext("public", error);
      expect(ctx.isLoading).toBe(false);
    });
  });

  // ============================================================================
  // Token Merging
  // ============================================================================

  describe("mergeThemeTokens", () => {
    it("should return defaults when no overrides", () => {
      const result = mergeThemeTokens();
      expect(result.colors?.primary).toBe(DEFAULT_THEME_TOKENS.colors?.primary);
    });

    it("should merge single override", () => {
      const override: ThemeTokens = {
        colors: { primary: "#ff0000" },
      };
      const result = mergeThemeTokens(override);
      expect(result.colors?.primary).toBe("#ff0000");
      // Other defaults should be preserved
      expect(result.colors?.secondary).toBe(
        DEFAULT_THEME_TOKENS.colors?.secondary
      );
    });

    it("should merge multiple overrides in order", () => {
      const first: ThemeTokens = {
        colors: { primary: "#ff0000", secondary: "#00ff00" },
      };
      const second: ThemeTokens = {
        colors: { primary: "#0000ff" },
      };
      const result = mergeThemeTokens(first, second);
      expect(result.colors?.primary).toBe("#0000ff"); // Second wins
      expect(result.colors?.secondary).toBe("#00ff00"); // From first
    });

    it("should handle undefined sources", () => {
      const result = mergeThemeTokens(undefined, undefined);
      expect(result.colors?.primary).toBe(DEFAULT_THEME_TOKENS.colors?.primary);
    });

    it("should merge typography tokens", () => {
      const override: ThemeTokens = {
        typography: { fontFamily: "Georgia, serif" },
      };
      const result = mergeThemeTokens(override);
      expect(result.typography?.fontFamily).toBe("Georgia, serif");
      expect(result.typography?.fontSizeBase).toBe(
        DEFAULT_THEME_TOKENS.typography?.fontSizeBase
      );
    });
  });

  // ============================================================================
  // Theme Resolution
  // ============================================================================

  describe("resolvePublicTheme", () => {
    it("should return default when no site theme", () => {
      const result = resolvePublicTheme();
      expect(result.themeId).toBeNull();
      expect(result.source).toBe("default");
      expect(result.tokens).toEqual(DEFAULT_THEME_TOKENS);
    });

    it("should return site theme when provided", () => {
      const siteTheme = {
        id: "site-theme-123",
        tokens: { colors: { primary: "#123456" } },
        cssText: "body { color: red; }",
      };
      const result = resolvePublicTheme(siteTheme);
      expect(result.themeId).toBe("site-theme-123");
      expect(result.source).toBe("site");
      expect(result.tokens.colors?.primary).toBe("#123456");
      expect(result.cssText).toBe("body { color: red; }");
    });
  });

  describe("resolveMemberTheme", () => {
    it("should return member preference when provided", () => {
      const siteTheme = {
        id: "site-theme-123",
        tokens: { colors: { primary: "#123456" } },
      };
      const memberPref = {
        id: "member-pref-456",
        tokens: { colors: { primary: "#654321" } },
      };
      const result = resolveMemberTheme(siteTheme, memberPref);
      expect(result.themeId).toBe("member-pref-456");
      expect(result.source).toBe("member");
      expect(result.tokens.colors?.primary).toBe("#654321");
    });

    it("should fall back to site theme without member preference", () => {
      const siteTheme = {
        id: "site-theme-123",
        tokens: { colors: { primary: "#123456" } },
      };
      const result = resolveMemberTheme(siteTheme);
      expect(result.themeId).toBe("site-theme-123");
      expect(result.source).toBe("site");
    });

    it("should fall back to default without any theme", () => {
      const result = resolveMemberTheme();
      expect(result.themeId).toBeNull();
      expect(result.source).toBe("default");
    });
  });

  describe("resolvePageTheme", () => {
    it("should merge page tokens with site tokens", () => {
      const siteTheme = {
        id: "site-theme-123",
        tokens: { colors: { primary: "#123456", secondary: "#abcdef" } },
        cssText: "body { margin: 0; }",
      };
      const pageTheme = {
        id: "page-theme-789",
        tokens: { colors: { primary: "#999999" } },
      };
      const result = resolvePageTheme(siteTheme, pageTheme);
      expect(result.themeId).toBe("page-theme-789");
      expect(result.source).toBe("page");
      expect(result.tokens.colors?.primary).toBe("#999999");
      // Site CSS should be preserved
      expect(result.cssText).toBe("body { margin: 0; }");
    });

    it("should fall back to site theme without page theme", () => {
      const siteTheme = {
        id: "site-theme-123",
        tokens: { colors: { primary: "#123456" } },
      };
      const result = resolvePageTheme(siteTheme);
      expect(result.themeId).toBe("site-theme-123");
      expect(result.source).toBe("site");
    });
  });

  // ============================================================================
  // Build Theme Context
  // ============================================================================

  describe("buildThemeContext", () => {
    it("should build context from resolution", () => {
      const resolution = {
        themeId: "test-theme",
        tokens: { colors: { primary: "#ff0000" } },
        source: "site" as const,
      };
      const ctx = buildThemeContext(resolution, "public");
      expect(ctx.themeId).toBe("test-theme");
      expect(ctx.context).toBe("public");
      expect(ctx.isLoading).toBe(false);
      expect(ctx.tokens.colors?.primary).toBe("#ff0000");
    });

    it("should include CSS variables", () => {
      const resolution = {
        themeId: "test-theme",
        tokens: { colors: { primary: "#ff0000" } },
        source: "site" as const,
      };
      const ctx = buildThemeContext(resolution, "member");
      expect(ctx.cssVariables).toContain("--color-primary");
      expect(ctx.cssVariables).toContain("#ff0000");
    });

    it("should append custom CSS", () => {
      const resolution = {
        themeId: "test-theme",
        tokens: { colors: { primary: "#ff0000" } },
        cssText: ".custom { display: block; }",
        source: "site" as const,
      };
      const ctx = buildThemeContext(resolution, "public");
      expect(ctx.cssVariables).toContain(".custom { display: block; }");
      expect(ctx.cssVariables).toContain("/* Custom CSS */");
    });
  });

  // ============================================================================
  // CSS Generation
  // ============================================================================

  describe("generateThemeCss", () => {
    it("should return CSS variables from context", () => {
      const ctx = DEFAULT_THEME_CONTEXT;
      const css = generateThemeCss(ctx);
      expect(css).toContain(":root");
      expect(css).toContain("--color-primary");
    });
  });

  describe("getInlineStyles", () => {
    it("should generate inline style object from tokens", () => {
      const tokens: ThemeTokens = {
        colors: {
          primary: "#ff0000",
          secondary: "#00ff00",
        },
        spacing: {
          sm: "8px",
          md: "16px",
        },
      };
      const styles = getInlineStyles(tokens);
      expect(styles["--color-primary"]).toBe("#ff0000");
      expect(styles["--color-secondary"]).toBe("#00ff00");
      expect(styles["--spacing-sm"]).toBe("8px");
      expect(styles["--spacing-md"]).toBe("16px");
    });

    it("should handle empty tokens", () => {
      const styles = getInlineStyles({});
      expect(Object.keys(styles)).toHaveLength(0);
    });

    it("should handle partial tokens", () => {
      const tokens: ThemeTokens = {
        colors: {
          primary: "#ff0000",
        },
      };
      const styles = getInlineStyles(tokens);
      expect(styles["--color-primary"]).toBe("#ff0000");
      expect(styles["--spacing-sm"]).toBeUndefined();
    });
  });
});
