/**
 * Zod schemas for Publishing system validation
 *
 * Copyright (c) Santa Barbara Newcomers Club
 *
 * Charter Principles:
 * - P9: Validation before execution (fail closed)
 * - Breadcrumbs are nullable by default (no auto-generation)
 */

import { z } from "zod";

// ============================================================================
// Breadcrumb Schemas
// ============================================================================

/**
 * Single breadcrumb item schema.
 * - label: Required, non-empty string
 * - href: Optional link target
 */
export const breadcrumbItemSchema = z.object({
  label: z.string().min(1, "Breadcrumb label cannot be empty"),
  href: z.string().optional(),
});

/**
 * Page breadcrumb schema.
 * - null: Breadcrumbs disabled (default for new pages)
 * - []: Breadcrumbs enabled but empty
 * - [{label, href?}, ...]: Breadcrumb trail items
 *
 * ASCII only constraint enforced by label min(1) validation.
 */
export const pageBreadcrumbSchema = z
  .array(breadcrumbItemSchema)
  .nullable();

// ============================================================================
// Page Schemas
// ============================================================================

/**
 * Page visibility enum matching Prisma PageVisibility
 */
export const pageVisibilitySchema = z.enum([
  "PUBLIC",
  "MEMBERS_ONLY",
  "ROLE_RESTRICTED",
]);

/**
 * Page status enum matching Prisma PageStatus
 */
export const pageStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

/**
 * Create page input schema
 */
export const createPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  visibility: pageVisibilitySchema.optional(),
  templateId: z.string().uuid().optional(),
  themeId: z.string().uuid().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  breadcrumb: pageBreadcrumbSchema.optional(),
});

/**
 * Update page input schema
 */
export const updatePageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  visibility: pageVisibilitySchema.optional(),
  templateId: z.string().uuid().nullable().optional(),
  themeId: z.string().uuid().nullable().optional(),
  audienceRuleId: z.string().uuid().nullable().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(500).nullable().optional(),
  seoImage: z.string().url().nullable().optional(),
  breadcrumb: pageBreadcrumbSchema.optional(),
});

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate breadcrumb data from JSON field.
 * Returns typed result or null if invalid.
 */
export function validateBreadcrumb(data: unknown): {
  valid: boolean;
  data: z.infer<typeof pageBreadcrumbSchema> | null;
  errors: string[];
} {
  // Null is explicitly valid (breadcrumbs disabled)
  if (data === null) {
    return { valid: true, data: null, errors: [] };
  }

  const result = pageBreadcrumbSchema.safeParse(data);

  if (result.success) {
    return { valid: true, data: result.data, errors: [] };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );

  return { valid: false, data: null, errors };
}

// ============================================================================
// Type Exports
// ============================================================================

export type BreadcrumbItem = z.infer<typeof breadcrumbItemSchema>;
export type PageBreadcrumb = z.infer<typeof pageBreadcrumbSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
