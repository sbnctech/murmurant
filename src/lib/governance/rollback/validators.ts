/**
 * Rollback Request Validators
 *
 * Zod schemas for validating rollback API requests.
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { z } from "zod";

/**
 * Schema for rollback execution request body.
 */
export const RollbackRequestSchema = z.object({
  /** Reason for rollback (required for audit trail) */
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters"),

  /** Confirmation token (required if policy.requiresConfirmation is true) */
  confirmationToken: z.string().optional(),

  /** If true, only preview without executing */
  dryRun: z.boolean().optional().default(false),
});

export type RollbackRequestBody = z.infer<typeof RollbackRequestSchema>;

/**
 * Schema for rollback list query parameters.
 */
export const RollbackListQuerySchema = z.object({
  /** Maximum number of results to return */
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),

  /** Filter by resource type */
  resourceType: z.string().optional(),

  /** Only show actions since this date (ISO 8601) */
  since: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export type RollbackListQuery = z.infer<typeof RollbackListQuerySchema>;

/**
 * Validate a rollback request body.
 */
export function validateRollbackRequest(body: unknown): {
  success: true;
  data: RollbackRequestBody;
} | {
  success: false;
  error: string;
} {
  const result = RollbackRequestSchema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  return { success: false, error: errorMessages };
}

/**
 * Validate rollback list query parameters.
 */
export function validateRollbackListQuery(query: unknown): {
  success: true;
  data: RollbackListQuery;
} | {
  success: false;
  error: string;
} {
  const result = RollbackListQuerySchema.safeParse(query);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  return { success: false, error: errorMessages };
}
