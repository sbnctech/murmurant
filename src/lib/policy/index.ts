/**
 * Policy Access Layer
 *
 * This module provides type-safe access to organization-configurable policies.
 *
 * Usage:
 * ```typescript
 * import { getPolicy, getPolicies } from '@/lib/policy';
 *
 * const newbieDays = getPolicy("membership.newbieDays", { orgId });
 * ```
 *
 * See: docs/ARCH/POLICY_KEY_CATALOG.md
 * Related: Issue #263 (Policy Configuration Layer)
 */

export {
  getPolicy,
  getPolicies,
  getAllPolicies,
  getPolicyDefault,
  isValidPolicyKey,
  InvalidPolicyKeyError,
  MissingOrgIdError,
  POLICY_DEFAULTS,
} from "./getPolicy";

export type {
  PolicyKey,
  PolicyValue,
  PolicyValueMap,
  GetPolicyOptions,
  MembershipPolicyKey,
  MembershipTierPolicyKey,
  SchedulingPolicyKey,
  GovernancePolicyKey,
  KpiPolicyKey,
  DisplayPolicyKey,
  OrganizationId,
} from "./types";
