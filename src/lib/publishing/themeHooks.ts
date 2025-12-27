// Copyright (c) Santa Barbara Newcomers Club
// Theme hook utilities for public and member view contexts
// Note: React hooks are in src/hooks/useTheme.ts; this file contains utilities

import type { ThemeTokens } from "./theme";
import { DEFAULT_THEME_TOKENS, generateCssVariables, mergeTokensWithDefaults } from "./theme";
import type { ViewContext } from "./pageTemplates";

// ============================================================================
// Theme Context Types
// ============================================================================

/**
 * Theme context provided to components
 */
export type ThemeContext = {
  themeId: string | null;
  tokens: ThemeTokens;
  cssVariables: string;
  context: ViewContext;
  isLoading: boolean;
  error?: Error;
};

/**
 * Theme resolution result from API or cache
 */
export type ThemeResolution = {
  themeId: string | null;
  tokens: ThemeTokens;
  cssText?: string;
  source: "default" | "site" | "page" | "member";
};

// ============================================================================
// Default Theme Context
// ============================================================================

/**
 * Default theme context for SSR and loading states
 */
export const DEFAULT_THEME_CONTEXT: ThemeContext = {
  themeId: null,
  tokens: DEFAULT_THEME_TOKENS,
  cssVariables: generateCssVariables(DEFAULT_THEME_TOKENS),
  context: "public",
  isLoading: false,
};

/**
 * Create loading theme context
 */
export function createLoadingThemeContext(context: ViewContext): ThemeContext {
  return {
    ...DEFAULT_THEME_CONTEXT,
    context,
    isLoading: true,
  };
}

/**
 * Create error theme context
 */
export function createErrorThemeContext(
  context: ViewContext,
  error: Error
): ThemeContext {
  return {
    ...DEFAULT_THEME_CONTEXT,
    context,
    error,
  };
}

// ============================================================================
// Theme Merging
// ============================================================================

/**
 * Merge multiple theme token sources in priority order
 * Later sources override earlier ones
 */
export function mergeThemeTokens(...tokenSources: (ThemeTokens | undefined)[]): ThemeTokens {
  // Start with defaults
  let merged: ThemeTokens = {
    colors: { ...DEFAULT_THEME_TOKENS.colors },
    typography: { ...DEFAULT_THEME_TOKENS.typography },
    spacing: { ...DEFAULT_THEME_TOKENS.spacing },
    borderRadius: { ...DEFAULT_THEME_TOKENS.borderRadius },
    shadows: { ...DEFAULT_THEME_TOKENS.shadows },
  };

  // Apply each source in order, later sources override earlier ones
  for (const tokens of tokenSources) {
    if (tokens) {
      merged = {
        colors: { ...merged.colors, ...tokens.colors },
        typography: { ...merged.typography, ...tokens.typography },
        spacing: { ...merged.spacing, ...tokens.spacing },
        borderRadius: { ...merged.borderRadius, ...tokens.borderRadius },
        shadows: { ...merged.shadows, ...tokens.shadows },
      };
    }
  }

  return merged;
}

/**
 * Build theme context from resolution
 */
export function buildThemeContext(
  resolution: ThemeResolution,
  context: ViewContext
): ThemeContext {
  const tokens = mergeTokensWithDefaults(resolution.tokens);
  let cssVariables = generateCssVariables(tokens);

  // Append custom CSS if present
  if (resolution.cssText) {
    cssVariables += "\n\n/* Custom CSS */\n" + resolution.cssText;
  }

  return {
    themeId: resolution.themeId,
    tokens,
    cssVariables,
    context,
    isLoading: false,
  };
}

// ============================================================================
// Theme Resolution Helpers
// ============================================================================

/**
 * Resolve theme for public context
 * Uses site default theme
 */
export function resolvePublicTheme(
  siteTheme?: { id: string; tokens: ThemeTokens; cssText?: string }
): ThemeResolution {
  if (!siteTheme) {
    return {
      themeId: null,
      tokens: DEFAULT_THEME_TOKENS,
      source: "default",
    };
  }

  return {
    themeId: siteTheme.id,
    tokens: siteTheme.tokens,
    cssText: siteTheme.cssText,
    source: "site",
  };
}

/**
 * Resolve theme for member context
 * Uses member preference if set, otherwise site default
 */
export function resolveMemberTheme(
  siteTheme?: { id: string; tokens: ThemeTokens; cssText?: string },
  memberThemePreference?: { id: string; tokens: ThemeTokens }
): ThemeResolution {
  // Member preference takes precedence
  if (memberThemePreference) {
    return {
      themeId: memberThemePreference.id,
      tokens: memberThemePreference.tokens,
      source: "member",
    };
  }

  // Fall back to site theme
  return resolvePublicTheme(siteTheme);
}

/**
 * Resolve theme for a specific page
 * Page theme overrides site theme
 */
export function resolvePageTheme(
  siteTheme?: { id: string; tokens: ThemeTokens; cssText?: string },
  pageTheme?: { id: string; tokens: ThemeTokens }
): ThemeResolution {
  if (pageTheme) {
    // Merge page tokens with site tokens as base
    const baseTokens = siteTheme?.tokens || DEFAULT_THEME_TOKENS;
    const mergedTokens = mergeThemeTokens(baseTokens, pageTheme.tokens);

    return {
      themeId: pageTheme.id,
      tokens: mergedTokens,
      cssText: siteTheme?.cssText,
      source: "page",
    };
  }

  return resolvePublicTheme(siteTheme);
}

// ============================================================================
// CSS Generation Helpers
// ============================================================================

/**
 * Generate CSS for a theme context
 */
export function generateThemeCss(context: ThemeContext): string {
  return context.cssVariables;
}

/**
 * Generate inline style object from theme tokens
 * Useful for SSR where CSS variables may not be available
 */
export function getInlineStyles(tokens: ThemeTokens): Record<string, string> {
  const styles: Record<string, string> = {};

  if (tokens.colors) {
    for (const [key, value] of Object.entries(tokens.colors)) {
      if (value) {
        styles[`--color-${toKebabCase(key)}`] = value;
      }
    }
  }

  if (tokens.typography) {
    for (const [key, value] of Object.entries(tokens.typography)) {
      if (value) {
        styles[`--${toKebabCase(key)}`] = value;
      }
    }
  }

  if (tokens.spacing) {
    for (const [key, value] of Object.entries(tokens.spacing)) {
      if (value) {
        styles[`--spacing-${key}`] = value;
      }
    }
  }

  return styles;
}

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
