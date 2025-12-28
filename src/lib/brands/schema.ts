/**
 * Brand Validation Schema
 *
 * Zod schemas for validating brand configurations.
 *
 * Charter: P6 (human-first UI), P8 (stable contracts)
 */

import { z } from "zod";

// ============================================================================
// Logo and Visual Identity Schemas
// ============================================================================

export const brandLogoSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  width: z.number().positive("Width must be positive"),
  height: z.number().positive("Height must be positive"),
  alt: z.string().min(1, "Alt text is required"),
});

export const brandBugSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  size: z.number().positive("Size must be positive"),
});

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const hexColor = z.string().regex(hexColorRegex, "Must be a valid hex color");

export const brandColorsSchema = z.object({
  primary: hexColor,
  primaryHover: hexColor,
  secondary: hexColor,
  accent: hexColor,
});

export const brandFontsSchema = z.object({
  heading: z.string().min(1, "Heading font is required"),
  body: z.string().min(1, "Body font is required"),
});

export const brandIdentitySchema = z.object({
  logo: brandLogoSchema,
  bug: brandBugSchema,
  colors: brandColorsSchema,
  fonts: brandFontsSchema,
});

// ============================================================================
// Voice and Terminology Schemas
// ============================================================================

export const voiceToneSchema = z.enum([
  "formal",
  "friendly",
  "casual",
  "professional",
]);

export const brandTerminologySchema = z.object({
  member: z.string().min(1, "Member term is required"),
  event: z.string().min(1, "Event term is required"),
  dues: z.string().min(1, "Dues term is required"),
});

export const brandVoiceSchema = z.object({
  tone: voiceToneSchema,
  terminology: brandTerminologySchema,
  greeting: z.string().min(1, "Greeting is required"),
});

// ============================================================================
// Chatbot Schema
// ============================================================================

export const brandChatbotSchema = z.object({
  name: z.string().min(1, "Chatbot name is required"),
  personality: z.string().min(1, "Personality description is required"),
  suggestedPrompts: z
    .array(z.string().min(1))
    .min(1, "At least one prompt required")
    .max(10, "Maximum 10 prompts allowed"),
});

// ============================================================================
// Communication Schema
// ============================================================================

export const brandCommunicationSchema = z.object({
  emailFromName: z.string().min(1, "Email from name is required"),
  emailReplyTo: z.string().email("Must be a valid email address"),
  socialLinks: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
    })
    .optional(),
});

// ============================================================================
// Complete Club Brand Schema
// ============================================================================

export const themeIdSchema = z.enum(["modern", "classic", "minimal"]);

export const clubBrandSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      "ID must be lowercase alphanumeric with hyphens"
    ),
  clubId: z.string().min(1, "Club ID is required"),
  name: z.string().min(1).max(100, "Name must be 100 characters or less"),
  themeId: themeIdSchema,
  identity: brandIdentitySchema,
  voice: brandVoiceSchema,
  chatbot: brandChatbotSchema,
  communication: brandCommunicationSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
  approvedBy: z.array(z.string()).optional(),
});

// ============================================================================
// Partial Brand Schema (for updates)
// ============================================================================

export const partialClubBrandSchema = clubBrandSchema.partial().extend({
  id: z.string().min(1),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type ValidatedClubBrand = z.infer<typeof clubBrandSchema>;
export type ValidatedPartialBrand = z.infer<typeof partialClubBrandSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

export function validateBrand(brand: unknown): ValidatedClubBrand {
  return clubBrandSchema.parse(brand);
}

export function validatePartialBrand(brand: unknown): ValidatedPartialBrand {
  return partialClubBrandSchema.parse(brand);
}

export function isValidBrand(brand: unknown): brand is ValidatedClubBrand {
  return clubBrandSchema.safeParse(brand).success;
}

export function isValidHexColor(color: string): boolean {
  return hexColorRegex.test(color);
}
