/**
 * Entitlements Service
 *
 * Plan-based feature gating for ClubOS.
 * Config-first approach - no database required for MVP.
 *
 * Charter:
 * - P4: No hidden rules - all entitlements are explicit and queryable
 * - P2: Default deny - features require explicit enablement
 *
 * @example
 * ```typescript
 * // Check if feature is enabled
 * if (isFeatureEnabled("events.createAllowed", { orgId })) {
 *   // Feature is available
 * }
 *
 * // Check if within numeric limit
 * if (isWithinLimit("admin.maxUsers", currentCount, { orgId })) {
 *   // Can add more
 * }
 * ```
 */

import type {
  PlanCode,
  PlanDefinition,
  PlanEntitlements,
  PlanFeatures,
  PlanLimits,
  BooleanFeatureKey,
  LimitKey,
  EntitlementContext,
} from "./types";

// Re-export types for convenience
export type {
  PlanCode,
  PlanDefinition,
  PlanEntitlements,
  PlanFeatures,
  PlanLimits,
  BooleanFeatureKey,
  LimitKey,
  EntitlementContext,
};

/**
 * Default plan for orgs without explicit assignment.
 */
export const DEFAULT_PLAN: PlanCode = "DEMO";

/**
 * Plan definitions with entitlements.
 *
 * DEMO: Full access for demos and development
 * STARTER: Entry tier with limited features
 * STANDARD: Most features, reasonable limits
 * PROFESSIONAL: Full features, high limits
 */
export const PLANS: Record<PlanCode, PlanDefinition> = {
  DEMO: {
    code: "DEMO",
    name: "Demo",
    description: "Full access for demos and development",
    entitlements: {
      features: {
        "events.createAllowed": true,
        "comms.campaignsAllowed": true,
        "api.exportAllowed": true,
        "publishing.advancedBlocks": true,
      },
      limits: {
        "pages.maxPublished": Infinity,
        "admin.maxUsers": Infinity,
        "events.maxPerMonth": Infinity,
      },
    },
  },
  STARTER: {
    code: "STARTER",
    name: "Starter",
    description: "Entry tier for small organizations",
    entitlements: {
      features: {
        "events.createAllowed": true,
        "comms.campaignsAllowed": false,
        "api.exportAllowed": false,
        "publishing.advancedBlocks": false,
      },
      limits: {
        "pages.maxPublished": 5,
        "admin.maxUsers": 2,
        "events.maxPerMonth": 10,
      },
    },
  },
  STANDARD: {
    code: "STANDARD",
    name: "Standard",
    description: "Most features for growing organizations",
    entitlements: {
      features: {
        "events.createAllowed": true,
        "comms.campaignsAllowed": true,
        "api.exportAllowed": false,
        "publishing.advancedBlocks": true,
      },
      limits: {
        "pages.maxPublished": 25,
        "admin.maxUsers": 5,
        "events.maxPerMonth": 50,
      },
    },
  },
  PROFESSIONAL: {
    code: "PROFESSIONAL",
    name: "Professional",
    description: "Full features for large organizations",
    entitlements: {
      features: {
        "events.createAllowed": true,
        "comms.campaignsAllowed": true,
        "api.exportAllowed": true,
        "publishing.advancedBlocks": true,
      },
      limits: {
        "pages.maxPublished": 100,
        "admin.maxUsers": 20,
        "events.maxPerMonth": 200,
      },
    },
  },
};

/**
 * Plan entitlements lookup table.
 */
export const PLAN_ENTITLEMENTS: Record<PlanCode, PlanEntitlements> = {
  DEMO: PLANS.DEMO.entitlements,
  STARTER: PLANS.STARTER.entitlements,
  STANDARD: PLANS.STANDARD.entitlements,
  PROFESSIONAL: PLANS.PROFESSIONAL.entitlements,
};

/**
 * Get the plan for an org.
 * Currently returns planCode from context or default.
 * Future: Look up from database.
 */
function getOrgPlan(context: EntitlementContext): PlanCode {
  return context.planCode ?? DEFAULT_PLAN;
}

/**
 * Check if a boolean feature is enabled for the org's plan.
 *
 * @param featureKey - The feature to check
 * @param context - Entitlement context with orgId
 * @returns true if feature is enabled
 * @throws Error if orgId is missing
 */
export function isFeatureEnabled(
  featureKey: BooleanFeatureKey,
  context: EntitlementContext
): boolean {
  if (!context.orgId) {
    throw new Error("orgId is required for entitlement checks");
  }
  const planCode = getOrgPlan(context);
  const entitlements = PLAN_ENTITLEMENTS[planCode];
  return entitlements.features[featureKey];
}

/**
 * Get a specific limit value for the org's plan.
 *
 * @param limitKey - The limit to get
 * @param context - Entitlement context with orgId
 * @returns The limit value (may be Infinity)
 * @throws Error if orgId is missing
 */
export function getLimit(
  limitKey: LimitKey,
  context: EntitlementContext
): number {
  if (!context.orgId) {
    throw new Error("orgId is required for entitlement checks");
  }
  const planCode = getOrgPlan(context);
  const entitlements = PLAN_ENTITLEMENTS[planCode];
  return entitlements.limits[limitKey];
}

/**
 * Get all limits for the org's plan.
 *
 * @param context - Entitlement context with orgId
 * @returns All limits as a record
 * @throws Error if orgId is missing
 */
export function getLimits(context: EntitlementContext): PlanLimits {
  if (!context.orgId) {
    throw new Error("orgId is required for entitlement checks");
  }
  const planCode = getOrgPlan(context);
  return PLAN_ENTITLEMENTS[planCode].limits;
}

/**
 * Get all features for the org's plan.
 *
 * @param context - Entitlement context with orgId
 * @returns All features as a record
 * @throws Error if orgId is missing
 */
export function getFeatures(context: EntitlementContext): PlanFeatures {
  if (!context.orgId) {
    throw new Error("orgId is required for entitlement checks");
  }
  const planCode = getOrgPlan(context);
  return PLAN_ENTITLEMENTS[planCode].features;
}

/**
 * Get plan info for display purposes.
 *
 * @param context - Entitlement context with orgId
 * @returns Plan definition including name and description
 * @throws Error if orgId is missing
 */
export function getPlanInfo(
  context: EntitlementContext
): Omit<PlanDefinition, "entitlements"> {
  if (!context.orgId) {
    throw new Error("orgId is required for entitlement checks");
  }
  const planCode = getOrgPlan(context);
  const plan = PLANS[planCode];
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description,
  };
}

/**
 * Check if a current value is within the limit for the org's plan.
 *
 * @param limitKey - The limit to check against
 * @param currentValue - The current count/value
 * @param context - Entitlement context with orgId
 * @returns true if currentValue is less than the limit
 * @throws Error if orgId is missing
 */
export function isWithinLimit(
  limitKey: LimitKey,
  currentValue: number,
  context: EntitlementContext
): boolean {
  const limit = getLimit(limitKey, context);
  return currentValue < limit;
}
