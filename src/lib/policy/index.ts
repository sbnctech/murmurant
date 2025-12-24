/**
 * Policy Access Layer
 *
 * Provides type-safe access to organization-configurable policies.
 *
 * See: Issue #235 (Membership Lifecycle Thresholds Migration)
 * See: Issue #263 (Policy Configuration Layer)
 */

export {
  getPolicy,
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
  OrganizationId,
} from "./types";
