/**
 * Theme Validation Schema
 *
 * Zod schemas for validating theme configurations.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { z } from "zod";

// ============================================================================
// Logo and Branding Schemas
// ============================================================================

export const logoConfigSchema = z.object({
  url: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  alt: z.string().min(1),
});

export const bugConfigSchema = z.object({
  url: z.string().min(1),
  size: z.number().positive(),
});

// ============================================================================
// Color Palette Schema
// ============================================================================

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const hexColor = z.string().regex(hexColorRegex, "Must be a valid hex color");

export const colorPaletteSchema = z.object({
  primary: hexColor,
  primaryHover: hexColor,
  secondary: hexColor,
  accent: hexColor,
  background: hexColor,
  surface: hexColor,
  textPrimary: hexColor,
  textSecondary: hexColor,
  textMuted: hexColor,
  border: hexColor,
  success: hexColor,
  warning: hexColor,
  error: hexColor,
});

// ============================================================================
// Typography Schema
// ============================================================================

export const typographyConfigSchema = z.object({
  fontHeading: z.string().min(1),
  fontBody: z.string().min(1),
  fontMono: z.string().min(1),
  baseFontSize: z.number().positive().max(32),
  lineHeight: z.number().positive().max(3),
});

// ============================================================================
// Shape and Style Schemas
// ============================================================================

export const borderRadiusStyleSchema = z.enum(["none", "sm", "md", "lg", "full"]);
export const buttonStyleSchema = z.enum(["square", "rounded", "pill"]);
export const cardStyleSchema = z.enum(["flat", "raised", "outlined"]);

export const shapeConfigSchema = z.object({
  borderRadius: borderRadiusStyleSchema,
  buttonStyle: buttonStyleSchema,
  cardStyle: cardStyleSchema,
});

// ============================================================================
// Voice and Terminology Schemas
// ============================================================================

export const voiceToneSchema = z.enum(["formal", "friendly", "casual", "professional"]);

export const terminologySchema = z.object({
  member: z.string().min(1),
  event: z.string().min(1),
  dues: z.string().min(1),
});

export const voiceConfigSchema = z.object({
  tone: voiceToneSchema,
  terminology: terminologySchema,
  greeting: z.string().min(1),
});

// ============================================================================
// Chatbot Schema
// ============================================================================

export const chatbotConfigSchema = z.object({
  name: z.string().min(1),
  personality: z.string().min(1),
  suggestedPrompts: z.array(z.string()).min(1).max(10),
});

// ============================================================================
// Complete Club Theme Schema
// ============================================================================

export const clubThemeSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1).max(100),
  logo: logoConfigSchema,
  bug: bugConfigSchema,
  colors: colorPaletteSchema,
  typography: typographyConfigSchema,
  shape: shapeConfigSchema,
  voice: voiceConfigSchema,
  chatbot: chatbotConfigSchema,
});

// ============================================================================
// Partial Theme Schema (for updates)
// ============================================================================

export const partialClubThemeSchema = clubThemeSchema.partial().extend({
  id: z.string().min(1),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type ValidatedClubTheme = z.infer<typeof clubThemeSchema>;
export type ValidatedPartialTheme = z.infer<typeof partialClubThemeSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

export function validateTheme(theme: unknown): ValidatedClubTheme {
  return clubThemeSchema.parse(theme);
}

export function validatePartialTheme(theme: unknown): ValidatedPartialTheme {
  return partialClubThemeSchema.parse(theme);
}

export function isValidTheme(theme: unknown): theme is ValidatedClubTheme {
  return clubThemeSchema.safeParse(theme).success;
}

export function isValidHexColor(color: string): boolean {
  return hexColorRegex.test(color);
}
