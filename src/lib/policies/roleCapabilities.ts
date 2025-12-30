/**
 * Role Capabilities Policy Layer
 *
 * This module provides policy-backed lookup for role capabilities,
 * enabling future tenant customization while maintaining behavioral
 * compatibility with the static ROLE_CAPABILITIES map.
 *
 * SBNC Policy Coupling Audit Reference:
 * - Issue #262, RD-002: ROLE_CAPABILITIES at src/lib/auth.ts:136-319
 * - This module extracts SBNC-specific role-to-capability mapping
 *   into a policy layer for future configurability.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { GlobalRole, Capability } from "@/lib/auth";

/**
 * Result of a policy-backed capability lookup.
 */
export interface RoleCapabilityPolicyResult {
  /** The role that was looked up */
  role: GlobalRole;
  /** The capabilities granted to this role */
  capabilities: readonly Capability[];
  /** Source of the capability configuration */
  source: "default" | "tenant_override";
}

/**
 * SBNC default role capabilities.
 *
 * This is the baseline configuration extracted from the original
 * ROLE_CAPABILITIES constant. It represents SBNC-specific role
 * definitions that could be customized per-tenant in the future.
 *
 * IMPORTANT: This map must be kept in sync with auth.ts ROLE_CAPABILITIES
 * until direct usage is fully deprecated.
 */
const SBNC_DEFAULT_ROLE_CAPABILITIES: Record<GlobalRole, readonly Capability[]> = {
  admin: [
    "admin:full",
    "publishing:manage",
    "comms:manage",
    "comms:send",
    "members:view",
    "members:history",
    "registrations:view",
    "events:view",
    "events:edit",
    "events:delete",
    "events:approve",
    "events:submit",
    "events:schedule:view",
    "events:enews:edit",
    "exports:access",
    "finance:view",
    "finance:manage",
    "transitions:view",
    "transitions:approve",
    "users:manage",
    "roles:assign",
    "roles:view",
    "files:upload",
    "files:manage",
    "files:view_all",
    // Activity Groups - admin has all capabilities
    "groups:view",
    "groups:propose",
    "groups:approve",
    "groups:join",
    "groups:coordinate",
    "groups:message",
    "groups:events",
  ],
  president: [
    "members:view",
    "members:history",
    "registrations:view",
    "events:view",
    "events:edit",
    "exports:access",
    "finance:view",
    "transitions:view",
    "transitions:approve",
    "roles:assign",
    "roles:view",
    "governance:flags:read",
    "governance:flags:resolve",
    "governance:annotations:read",
    // Activity Groups - President can approve/deactivate groups
    "groups:view",
    "groups:propose",
    "groups:approve",
    "groups:join",
  ],
  "past-president": [
    "members:view",
    "members:history",
    "registrations:view",
    "events:view",
    "transitions:view",
  ],
  "vp-activities": [
    "members:view",
    "members:history",
    "registrations:view",
    "events:view",
    "events:edit",
    "events:approve",
    "events:submit",
    "events:schedule:view",
    "transitions:view",
    "transitions:approve",
    "roles:assign",
    "roles:view",
    // Activity Groups - VP Activities can approve/deactivate groups
    "groups:view",
    "groups:propose",
    "groups:approve",
    "groups:join",
  ],
  "vp-communications": [
    "events:view",
    "events:schedule:view",
    "events:enews:edit",
    "comms:manage",
    "comms:send",
    "roles:assign",
    "roles:view",
  ],
  "event-chair": [
    "members:view",
    "registrations:view",
    "events:view",
    "events:submit",
  ],
  webmaster: [
    "publishing:manage",
    "comms:manage",
  ],
  secretary: [
    "meetings:read",
    "meetings:minutes:draft:create",
    "meetings:minutes:draft:edit",
    "meetings:minutes:draft:submit",
    "meetings:minutes:read_all",
    "governance:docs:read",
    "governance:annotations:read",
    "governance:annotations:write",
    "governance:flags:read",
    "governance:flags:write",
    "governance:flags:create",
    "files:upload",
  ],
  parliamentarian: [
    "meetings:read",
    "meetings:motions:read",
    "meetings:motions:annotate",
    "governance:rules:manage",
    "governance:flags:read",
    "governance:flags:write",
    "governance:flags:create",
    "governance:flags:resolve",
    "governance:annotations:read",
    "governance:annotations:write",
    "governance:annotations:publish",
    "governance:interpretations:create",
    "governance:interpretations:edit",
    "governance:interpretations:publish",
    "governance:policies:annotate",
    "governance:policies:propose_change",
    "governance:docs:read",
    "governance:docs:write",
    "files:upload",
  ],
  member: [
    // Activity Groups - basic member capabilities
    "groups:view",
    "groups:propose",
    "groups:join",
  ],
} as const;

/**
 * Get role capabilities from policy.
 *
 * This function provides an indirection layer for capability lookups,
 * enabling future tenant-specific customization. Currently returns
 * SBNC defaults, but the interface supports policy overrides.
 *
 * @param role - The GlobalRole to look up capabilities for
 * @returns Policy result with capabilities and source
 */
export function getRoleCapabilitiesFromPolicy(
  role: GlobalRole
): RoleCapabilityPolicyResult {
  // Future: Look up tenant-specific policy overrides here
  // const tenantOverride = await getTenantPolicyOverride(tenantId, role);
  // if (tenantOverride) return { role, capabilities: tenantOverride, source: "tenant_override" };

  const capabilities = SBNC_DEFAULT_ROLE_CAPABILITIES[role];
  return {
    role,
    capabilities,
    source: "default",
  };
}

/**
 * Validate that a role capability policy matches expected defaults.
 *
 * This is used in contract tests to ensure the policy layer
 * maintains behavioral compatibility with the original ROLE_CAPABILITIES.
 *
 * @param role - The role to validate
 * @param expectedCapabilities - Expected capabilities from auth.ts
 * @returns true if capabilities match, false otherwise
 */
export function validateRoleCapabilityPolicy(
  role: GlobalRole,
  expectedCapabilities: readonly Capability[]
): boolean {
  const policyResult = getRoleCapabilitiesFromPolicy(role);
  const policySet = new Set(policyResult.capabilities);
  const expectedSet = new Set(expectedCapabilities);

  if (policySet.size !== expectedSet.size) {
    return false;
  }

  for (const cap of expectedSet) {
    if (!policySet.has(cap)) {
      return false;
    }
  }

  return true;
}

/**
 * Get the default SBNC role capabilities.
 * Exposed for testing and validation purposes only.
 */
export function getSBNCDefaultCapabilities(): Record<GlobalRole, readonly Capability[]> {
  return SBNC_DEFAULT_ROLE_CAPABILITIES;
}
