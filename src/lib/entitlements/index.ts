/**
 * Entitlements Module
 *
 * Plan-based feature gating for ClubOS.
 *
 * @example
 * ```typescript
 * import {
 *   isFeatureEnabled,
 *   getLimit,
 *   isWithinLimit,
 * } from "@/lib/entitlements";
 *
 * // Check boolean feature
 * if (isFeatureEnabled("events.createAllowed", { orgId })) {
 *   // Feature is available
 * }
 *
 * // Check numeric limit
 * const maxPages = getLimit("pages.maxPublished", { orgId });
 *
 * // Check if within limit
 * if (isWithinLimit("admin.maxUsers", currentAdminCount, { orgId })) {
 *   // Can add more admins
 * }
 * ```
 */

export {
  // Core API
  isFeatureEnabled,
  getLimit,
  getLimits,
  getFeatures,
  getPlanInfo,
  isWithinLimit,
  // Constants
  PLANS,
  PLAN_ENTITLEMENTS,
  DEFAULT_PLAN,
} from "./entitlements";

export type {
  // Plan types
  PlanCode,
  PlanDefinition,
  PlanEntitlements,
  PlanLimits,
  PlanFeatures,
  // Feature types
  BooleanFeatureKey,
  LimitKey,
  FeatureKey,
  // Context
  EntitlementContext,
} from "./types";
