// Copyright © 2025 Murmurant, Inc.
// Theme system - CSS variable generation and management

import { prisma } from "@/lib/prisma";

// Theme token structure
export type ThemeTokens = {
  colors?: {
    primary?: string;
    primaryHover?: string;
    secondary?: string;
    background?: string;
    backgroundAlt?: string;
    text?: string;
    textMuted?: string;
    border?: string;
    error?: string;
    success?: string;
    warning?: string;
    link?: string;
    linkHover?: string;
  };
  typography?: {
    fontFamily?: string;
    fontFamilyHeading?: string;
    fontSizeBase?: string;
    fontSizeSmall?: string;
    fontSizeLarge?: string;
    fontSizeH1?: string;
    fontSizeH2?: string;
    fontSizeH3?: string;
    lineHeight?: string;
    headingLineHeight?: string;
  };
  spacing?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    xxl?: string;
  };
  borderRadius?: {
    sm?: string;
    md?: string;
    lg?: string;
    full?: string;
  };
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
};

// Default theme tokens
export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  colors: {
    primary: "#1a5f7a",
    primaryHover: "#134a5e",
    secondary: "#f5a623",
    background: "#ffffff",
    backgroundAlt: "#f8f9fa",
    text: "#333333",
    textMuted: "#666666",
    border: "#e0e0e0",
    error: "#dc3545",
    success: "#28a745",
    warning: "#ffc107",
    link: "#1a5f7a",
    linkHover: "#134a5e",
  },
  typography: {
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyHeading: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSizeBase: "16px",
    fontSizeSmall: "14px",
    fontSizeLarge: "18px",
    fontSizeH1: "32px",
    fontSizeH2: "24px",
    fontSizeH3: "20px",
    lineHeight: "1.6",
    headingLineHeight: "1.3",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "16px",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(0,0,0,0.1)",
    lg: "0 10px 15px rgba(0,0,0,0.1)",
  },
};

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Generate CSS custom properties from theme tokens
 */
export function generateCssVariables(tokens: ThemeTokens): string {
  const lines: string[] = [":root {"];

  // Colors
  if (tokens.colors) {
    for (const [key, value] of Object.entries(tokens.colors)) {
      if (value) {
        lines.push(`  --color-${toKebabCase(key)}: ${value};`);
      }
    }
  }

  // Typography
  if (tokens.typography) {
    for (const [key, value] of Object.entries(tokens.typography)) {
      if (value) {
        lines.push(`  --${toKebabCase(key)}: ${value};`);
      }
    }
  }

  // Spacing
  if (tokens.spacing) {
    for (const [key, value] of Object.entries(tokens.spacing)) {
      if (value) {
        lines.push(`  --spacing-${key}: ${value};`);
      }
    }
  }

  // Border radius
  if (tokens.borderRadius) {
    for (const [key, value] of Object.entries(tokens.borderRadius)) {
      if (value) {
        lines.push(`  --border-radius-${key}: ${value};`);
      }
    }
  }

  // Shadows
  if (tokens.shadows) {
    for (const [key, value] of Object.entries(tokens.shadows)) {
      if (value) {
        lines.push(`  --shadow-${key}: ${value};`);
      }
    }
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * Merge tokens with defaults
 */
export function mergeTokensWithDefaults(tokens: ThemeTokens): ThemeTokens {
  return {
    colors: { ...DEFAULT_THEME_TOKENS.colors, ...tokens.colors },
    typography: { ...DEFAULT_THEME_TOKENS.typography, ...tokens.typography },
    spacing: { ...DEFAULT_THEME_TOKENS.spacing, ...tokens.spacing },
    borderRadius: { ...DEFAULT_THEME_TOKENS.borderRadius, ...tokens.borderRadius },
    shadows: { ...DEFAULT_THEME_TOKENS.shadows, ...tokens.shadows },
  };
}

/**
 * Get the active theme CSS
 */
export async function getActiveThemeCss(): Promise<string> {
  // Find the default active theme
  const theme = await prisma.theme.findFirst({
    where: {
      status: "ACTIVE",
      isDefault: true,
    },
  });

  if (!theme) {
    // Return default CSS if no theme configured
    return generateCssVariables(DEFAULT_THEME_TOKENS);
  }

  const tokens = mergeTokensWithDefaults(theme.tokens as ThemeTokens);
  let css = generateCssVariables(tokens);

  // Append custom CSS if present
  if (theme.cssText) {
    css += "\n\n/* Custom CSS */\n" + sanitizeCss(theme.cssText);
  }

  return css;
}

/**
 * Get theme by ID
 */
export async function getThemeById(id: string): Promise<{
  id: string;
  name: string;
  tokens: ThemeTokens;
  css: string;
} | null> {
  const theme = await prisma.theme.findUnique({ where: { id } });

  if (!theme) return null;

  const tokens = mergeTokensWithDefaults(theme.tokens as ThemeTokens);
  let css = generateCssVariables(tokens);

  if (theme.cssText) {
    css += "\n\n/* Custom CSS */\n" + sanitizeCss(theme.cssText);
  }

  return {
    id: theme.id,
    name: theme.name,
    tokens,
    css,
  };
}

/**
 * Sanitize CSS to prevent script injection
 * Only allows CSS, blocks any JavaScript
 */
export function sanitizeCss(css: string): string {
  // Remove any script tags
  let sanitized = css.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove expression() which can execute JS in old IE
  sanitized = sanitized.replace(/expression\s*\(/gi, "");

  // Remove behavior: property (IE-specific, can load JS)
  sanitized = sanitized.replace(/behavior\s*:/gi, "");

  // Remove -moz-binding (Firefox-specific, can load JS)
  sanitized = sanitized.replace(/-moz-binding\s*:/gi, "");

  // Remove url() with data: that might contain script
  sanitized = sanitized.replace(/url\s*\(\s*["']?\s*data:[^)]*script[^)]*\)/gi, "");

  return sanitized;
}

/**
 * Validate theme tokens structure
 */
export function validateThemeTokens(tokens: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!tokens || typeof tokens !== "object") {
    return { valid: false, errors: ["Tokens must be an object"] };
  }

  const t = tokens as Record<string, unknown>;

  // Validate colors (must be object, not array)
  if (t.colors !== undefined && (typeof t.colors !== "object" || Array.isArray(t.colors))) {
    errors.push("colors must be an object");
  }

  // Validate typography (must be object, not array)
  if (t.typography !== undefined && (typeof t.typography !== "object" || Array.isArray(t.typography))) {
    errors.push("typography must be an object");
  }

  // Validate spacing (must be object, not array)
  if (t.spacing !== undefined && (typeof t.spacing !== "object" || Array.isArray(t.spacing))) {
    errors.push("spacing must be an object");
  }

  // Validate borderRadius (must be object, not array)
  if (t.borderRadius !== undefined && (typeof t.borderRadius !== "object" || Array.isArray(t.borderRadius))) {
    errors.push("borderRadius must be an object");
  }

  // Validate shadows (must be object, not array)
  if (t.shadows !== undefined && (typeof t.shadows !== "object" || Array.isArray(t.shadows))) {
    errors.push("shadows must be an object");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create default theme if none exists
 */
export async function ensureDefaultTheme(): Promise<void> {
  const existing = await prisma.theme.findFirst({
    where: { isDefault: true },
  });

  if (!existing) {
    await prisma.theme.create({
      data: {
        name: "Default",
        slug: "default",
        description: "Default site theme",
        status: "ACTIVE",
        tokens: DEFAULT_THEME_TOKENS as object,
        isDefault: true,
      },
    });
  }
}
