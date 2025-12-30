/**
 * Zod schemas for File Storage system validation
 *
 * Copyright © 2025 Murmurant, Inc.
 *
 * Charter P9: Validation before execution (fail closed)
 */

import { z } from "zod";

// ============================================================================
// File Object Schemas
// ============================================================================

export const createFileSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
});

export const updateFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  isPublic: z.boolean().optional(),
});

// ============================================================================
// File Access Schemas
// ============================================================================

export const principalTypeSchema = z.enum(["USER", "ROLE", "GROUP"]);
export const filePermissionSchema = z.enum(["READ", "WRITE", "ADMIN"]);

export const grantAccessSchema = z.object({
  principalType: principalTypeSchema,
  principalId: z.string().min(1).max(100),
  permission: filePermissionSchema,
  expiresAt: z.string().datetime().optional(),
});

export const revokeAccessSchema = z.object({
  principalType: principalTypeSchema,
  principalId: z.string().min(1).max(100),
  permission: filePermissionSchema.optional(), // If not provided, revoke all permissions
});

// ============================================================================
// File Tag Schemas
// ============================================================================

export const addTagSchema = z.object({
  tag: z.string().min(1).max(50),
});

export const removeTagSchema = z.object({
  tag: z.string().min(1).max(50),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const fileFiltersSchema = z.object({
  tag: z.string().optional(),
  mimeType: z.string().optional(),
  uploadedById: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateFileInput = z.infer<typeof createFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type GrantAccessInput = z.infer<typeof grantAccessSchema>;
export type RevokeAccessInput = z.infer<typeof revokeAccessSchema>;
export type AddTagInput = z.infer<typeof addTagSchema>;
export type FileFilters = z.infer<typeof fileFiltersSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
