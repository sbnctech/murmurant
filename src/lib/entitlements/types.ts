/**
 * Entitlements Type Definitions
 *
 * Plan-based feature gating types for Murmurant.
 *
 * Charter: P4 (no hidden rules - all entitlements explicit and queryable)
 */

/**
 * Available plan codes.
 * Plans are ordered by capability level (DEMO has all features).
 */
export type PlanCode = "DEMO" | "STARTER" | "STANDARD" | "PROFESSIONAL";

/**
 * Boolean feature keys - features that are either enabled or disabled.
 */
export type BooleanFeatureKey =
  | "events.createAllowed"
  | "comms.campaignsAllowed"
  | "api.exportAllowed"
  | "publishing.advancedBlocks";

/**
 * Limit keys - features with numeric limits.
 */
export type LimitKey =
  | "pages.maxPublished"
  | "admin.maxUsers"
  | "events.maxPerMonth";

/**
 * Combined feature key type for APIs that accept both.
 */
export type FeatureKey = BooleanFeatureKey | LimitKey;

/**
 * Context required for entitlement checks.
 * orgId is required for future multi-tenant support.
 */
export interface EntitlementContext {
  orgId: string;
  planCode?: PlanCode;
}

/**
 * Features record - maps feature keys to boolean values.
 */
export type PlanFeatures = Record<BooleanFeatureKey, boolean>;

/**
 * Limits record - maps limit keys to numeric values.
 */
export type PlanLimits = Record<LimitKey, number>;

/**
 * Full entitlements for a plan.
 */
export interface PlanEntitlements {
  features: PlanFeatures;
  limits: PlanLimits;
}

/**
 * Plan definition including metadata.
 */
export interface PlanDefinition {
  code: PlanCode;
  name: string;
  description: string;
  entitlements: PlanEntitlements;
}
