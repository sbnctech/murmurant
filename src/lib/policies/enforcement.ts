/**
 * Policy Enforcement Helpers
 *
 * Provides utilities for referencing and enforcing policies in code.
 * When a policy is referenced using requirePolicy(), it creates a traceable
 * link between code and the policy registry.
 *
 * Charter Principles:
 * - N5: No hidden rules - policies are visible and documented
 * - P5: Visible state - enforcement is queryable
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import { policyExists, getPolicyById, type Policy } from "./loader";

/**
 * Error thrown when a referenced policy does not exist in the registry
 */
export class PolicyNotFoundError extends Error {
  constructor(public readonly policyId: string) {
    super(
      `Policy "${policyId}" not found in registry. ` +
        `Verify the policy exists in docs/policies/POLICY_REGISTRY.yaml`
    );
    this.name = "PolicyNotFoundError";
  }
}

/**
 * Policy enforcement context returned by requirePolicy
 */
export interface PolicyContext {
  /** The policy ID (e.g., "POL-EVT-001") */
  id: string;

  /** The full policy object */
  policy: Policy;

  /** Log that this policy is being enforced */
  log: (action: string, details?: Record<string, unknown>) => void;
}

/**
 * Reference a policy from code and verify it exists.
 *
 * This function serves two purposes:
 * 1. At runtime, it verifies the policy exists and returns context
 * 2. At CI time, static analysis can find all requirePolicy() calls
 *    and verify the referenced policies exist
 *
 * @example
 * ```typescript
 * // In an event publishing endpoint
 * const ctx = requirePolicy("POL-EVT-001");
 * ctx.log("enforcing", { eventId });
 *
 * // The policy context can be used for logging and documentation
 * console.log(`Enforcing ${ctx.policy.title}`);
 * ```
 *
 * @param policyId - The policy ID to reference (e.g., "POL-EVT-001")
 * @returns Policy context object
 * @throws PolicyNotFoundError if the policy does not exist
 */
export function requirePolicy(policyId: string): PolicyContext {
  if (!policyExists(policyId)) {
    throw new PolicyNotFoundError(policyId);
  }

  const policy = getPolicyById(policyId)!;

  return {
    id: policyId,
    policy,
    log: (action: string, details?: Record<string, unknown>) => {
      // In production, this would integrate with the audit system
      // For now, we log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log(`[Policy:${policyId}] ${action}`, details || "");
      }
    },
  };
}

/**
 * Check if a policy can be enforced (exists and is active).
 *
 * Unlike requirePolicy(), this doesn't throw - useful for conditional logic.
 *
 * @param policyId - The policy ID to check
 * @returns true if the policy exists and is active
 */
export function canEnforcePolicy(policyId: string): boolean {
  const policy = getPolicyById(policyId);
  return policy !== undefined && policy.status === "active";
}

/**
 * Get all enforcement points for a policy.
 *
 * Useful for understanding where a policy is enforced in code.
 *
 * @param policyId - The policy ID
 * @returns Array of file paths where the policy is enforced
 */
export function getEnforcementPoints(policyId: string): string[] {
  const policy = getPolicyById(policyId);
  return policy?.enforcementPoints || [];
}

/**
 * Validate that all policy IDs in a list exist.
 *
 * Useful for batch validation in tests or CI.
 *
 * @param policyIds - Array of policy IDs to validate
 * @returns Object with valid/invalid arrays
 */
export function validatePolicyIds(policyIds: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of policyIds) {
    if (policyExists(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}
