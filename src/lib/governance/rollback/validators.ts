/**
 * Rollback Request Validators
 *
 * Charter Principles:
 * - P9: Security must fail closed (validation before execution)
 */

import { z } from "zod";

/**
 * Schema for rollback execution request.
 */
export const RollbackRequestSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters"),
  confirmationToken: z.string().optional(),
  dryRun: z.boolean().optional(),
});

/**
 * Schema for rollback list query parameters.
 */
export const RollbackListQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),
  resourceType: z.string().optional(),
  since: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((val) => val === undefined || !isNaN(val.getTime()), {
      message: "Invalid datetime format",
    }),
});

export type RollbackRequestInput = z.infer<typeof RollbackRequestSchema>;
export type RollbackListQueryInput = z.infer<typeof RollbackListQuerySchema>;

/**
 * Validate rollback request body.
 */
export function validateRollbackRequest(data: unknown) {
  return RollbackRequestSchema.safeParse(data);
}

/**
 * Validate rollback list query.
 */
export function validateRollbackListQuery(data: unknown) {
  return RollbackListQuerySchema.safeParse(data);
}
