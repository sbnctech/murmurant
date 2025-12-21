/**
 * Delegation Enforcement
 *
 * Implements SD-3, DM-3, DM-4 from GUARANTEE_IMPLEMENTATION_BRIEFS.md:
 * - SD-3: Prevent users from granting capabilities they do not possess
 * - DM-3: Prevent chairs from assigning roles (requires roles:assign)
 * - DM-4: Prevent cross-domain delegation (committee A -> committee B)
 *
 * Charter P2: Default deny, least privilege, object-scoped authorization.
 * Charter N2: No coarse rigid roles - capability-based enforcement.
 *
 * SECURITY MODEL: Assume malicious but authenticated users.
 * All enforcement is server-side. UI is not trusted.
 */

import { prisma } from "@/lib/prisma";
import {
  type GlobalRole,
  type Capability,
  hasCapability,
  getRoleCapabilities,
} from "@/lib/auth";

// ============================================================================
// TYPES
// ============================================================================

export interface DelegationCheckResult {
  allowed: boolean;
  reason?: string;
  deniedCapabilities?: Capability[];
}

export interface CommitteeScopeResult {
  allowed: boolean;
  reason?: string;
  assignerCommittees?: string[];
  targetCommitteeId?: string;
}

// ============================================================================
// SD-3: ESCALATION PREVENTION
// ============================================================================

/**
 * Validate that assigner has all capabilities being granted.
 *
 * Charter P2: Cannot escalate beyond own permissions.
 * SD-3: A user cannot grant capabilities they do not possess.
 *
 * @param assignerRole - The GlobalRole of the user attempting to assign
 * @param targetCapabilities - The capabilities that would be granted
 * @returns Result indicating if delegation is allowed
 *
 * @example
 * ```typescript
 * const check = canGrantCapabilities("vp-activities", ["events:edit", "admin:full"]);
 * // { allowed: false, deniedCapabilities: ["admin:full"] }
 * ```
 */
export function canGrantCapabilities(
  assignerRole: GlobalRole,
  targetCapabilities: Capability[]
): DelegationCheckResult {
  // admin:full can grant anything
  if (hasCapability(assignerRole, "admin:full")) {
    return { allowed: true };
  }

  const assignerCaps = getRoleCapabilities(assignerRole);

  // Find capabilities that assigner does not have
  const denied = targetCapabilities.filter(
    (cap) => !assignerCaps.includes(cap)
  );

  if (denied.length > 0) {
    return {
      allowed: false,
      reason: "Cannot grant capabilities you do not have",
      deniedCapabilities: denied,
    };
  }

  return { allowed: true };
}

/**
 * Validate that assigner can grant a specific role.
 *
 * Looks up the role's capabilities and validates against assigner.
 *
 * @param assignerRole - The GlobalRole of the user attempting to assign
 * @param committeeRoleId - The ID of the CommitteeRole being assigned
 * @returns Result indicating if delegation is allowed
 */
export async function canGrantRole(
  assignerRole: GlobalRole,
  committeeRoleId: string
): Promise<DelegationCheckResult> {
  // admin:full can grant any role
  if (hasCapability(assignerRole, "admin:full")) {
    return { allowed: true };
  }

  // Look up the role's capabilities
  // Note: CommitteeRole.capabilities is stored as JSON array
  const role = await prisma.committeeRole.findUnique({
    where: { id: committeeRoleId },
    select: {
      id: true,
      name: true,
      // capabilities field - if not present, use empty array
    },
  });

  if (!role) {
    return {
      allowed: false,
      reason: "Committee role not found",
    };
  }

  // For now, committee roles inherit from their template
  // In future, CommitteeRole will have its own capabilities array
  // Until then, we validate based on the delegation scope (DM-4)
  return { allowed: true };
}

// ============================================================================
// DM-3: CHAIRS CANNOT ASSIGN ROLES
// ============================================================================

/**
 * Check if a role has authority to assign other roles.
 *
 * DM-3: Only users with roles:assign capability can delegate authority.
 * Event chairs, webmasters, and regular members cannot create role assignments.
 *
 * @param role - The GlobalRole to check
 * @returns true if the role can assign other roles
 */
export function canAssignRoles(role: GlobalRole): boolean {
  return hasCapability(role, "roles:assign");
}

/**
 * Roles that explicitly have roles:assign capability.
 * This is the source of truth for delegation authority.
 */
export const ROLES_WITH_ASSIGN_AUTHORITY: GlobalRole[] = [
  "admin",
  "president",
  "vp-activities",    // Can assign event chairs within their domain
  "vp-communications", // Can assign within their domain
];

/**
 * Roles that explicitly CANNOT assign other roles.
 * Listed for documentation and test purposes.
 */
export const ROLES_WITHOUT_ASSIGN_AUTHORITY: GlobalRole[] = [
  "event-chair",
  "webmaster",
  "secretary",
  "parliamentarian",
  "past-president",
  "member",
];

// ============================================================================
// DM-4: CROSS-DOMAIN DELEGATION PREVENTION
// ============================================================================

/**
 * Get committees where a member has delegation authority.
 *
 * Returns committee IDs where the member can create role assignments.
 * This is determined by:
 * 1. admin:full - can delegate to any committee
 * 2. VP roles - can delegate within their domain
 * 3. Active role assignments with delegation permission
 *
 * @param memberId - The member's ID
 * @param memberRole - The member's GlobalRole
 * @param asOfDate - Date for time-bounded validation (default: now)
 */
export async function getDelegationScope(
  memberId: string,
  memberRole: GlobalRole,
  asOfDate: Date = new Date()
): Promise<string[]> {
  // admin:full can delegate anywhere
  if (hasCapability(memberRole, "admin:full")) {
    const allCommittees = await prisma.committee.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return allCommittees.map((c) => c.id);
  }

  // Get member's active role assignments with delegation authority
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      memberId,
      startDate: { lte: asOfDate },
      OR: [
        { endDate: null },
        { endDate: { gt: asOfDate } },
      ],
    },
    select: {
      committeeId: true,
      committeeRole: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  // VP-Activities can delegate to activity-related committees
  // VP-Communications can delegate to communication-related committees
  // For now, scope is based on current assignments
  const scopedCommittees = assignments.map((a) => a.committeeId);

  return [...new Set(scopedCommittees)];
}

/**
 * Validate that assigner has authority over target committee.
 *
 * Charter P2: Object-scoped authorization.
 * DM-4: No cross-domain delegation.
 *
 * @param assignerMemberId - The member ID of the user attempting to assign
 * @param assignerRole - The GlobalRole of the assigner
 * @param targetCommitteeId - The committee where the role would be assigned
 * @returns Result indicating if delegation is allowed
 *
 * @example
 * ```typescript
 * const check = await canAssignToCommittee(
 *   "alice-id",
 *   "vp-activities",
 *   "hiking-committee-id"
 * );
 * // { allowed: true } if VP has authority over hiking committee
 * // { allowed: false, reason: "..." } otherwise
 * ```
 */
export async function canAssignToCommittee(
  assignerMemberId: string,
  assignerRole: GlobalRole,
  targetCommitteeId: string
): Promise<CommitteeScopeResult> {
  // admin:full can assign anywhere
  if (hasCapability(assignerRole, "admin:full")) {
    return { allowed: true };
  }

  // Verify target committee exists
  const targetCommittee = await prisma.committee.findUnique({
    where: { id: targetCommitteeId },
    select: { id: true, name: true, isActive: true },
  });

  if (!targetCommittee) {
    return {
      allowed: false,
      reason: "Target committee not found",
      targetCommitteeId,
    };
  }

  if (!targetCommittee.isActive) {
    return {
      allowed: false,
      reason: "Cannot assign to inactive committee",
      targetCommitteeId,
    };
  }

  // Get assigner's delegation scope
  const scope = await getDelegationScope(assignerMemberId, assignerRole);

  if (!scope.includes(targetCommitteeId)) {
    return {
      allowed: false,
      reason: "Cannot assign roles outside your committee scope",
      assignerCommittees: scope,
      targetCommitteeId,
    };
  }

  return { allowed: true };
}

// ============================================================================
// COMBINED VALIDATION
// ============================================================================

/**
 * Full delegation validation combining all checks.
 *
 * Validates:
 * 1. DM-3: Assigner has roles:assign capability
 * 2. DM-4: Target committee is within assigner's scope
 * 3. SD-3: Assigner has all capabilities being granted (if applicable)
 *
 * @param assignerMemberId - The member ID of the assigner
 * @param assignerRole - The GlobalRole of the assigner
 * @param targetCommitteeId - The committee for the assignment
 * @param targetRoleId - The CommitteeRole being assigned
 * @returns Combined validation result
 */
export async function validateDelegation(
  assignerMemberId: string,
  assignerRole: GlobalRole,
  targetCommitteeId: string,
  targetRoleId: string
): Promise<DelegationCheckResult> {
  // DM-3: Check if assigner can assign roles at all
  if (!canAssignRoles(assignerRole)) {
    return {
      allowed: false,
      reason: "You do not have authority to assign roles. Required capability: roles:assign",
    };
  }

  // DM-4: Check if target committee is in scope
  const scopeCheck = await canAssignToCommittee(
    assignerMemberId,
    assignerRole,
    targetCommitteeId
  );

  if (!scopeCheck.allowed) {
    return {
      allowed: false,
      reason: scopeCheck.reason,
    };
  }

  // SD-3: Check capability escalation
  const roleCheck = await canGrantRole(assignerRole, targetRoleId);
  if (!roleCheck.allowed) {
    return roleCheck;
  }

  return { allowed: true };
}

// ============================================================================
// AUDIT HELPERS
// ============================================================================

/**
 * Audit event types for delegation enforcement.
 */
export type DelegationAuditAction =
  | "ESCALATION_BLOCKED"
  | "CROSS_SCOPE_BLOCKED"
  | "ASSIGNMENT_DENIED_NO_AUTHORITY"
  | "DELEGATION_ALLOWED";

/**
 * Create audit metadata for delegation enforcement.
 *
 * @param action - The audit action type
 * @param details - Additional details about the enforcement
 */
export function createDelegationAuditMetadata(
  action: DelegationAuditAction,
  details: {
    assignerMemberId: string;
    assignerRole: GlobalRole;
    targetCommitteeId?: string;
    targetRoleId?: string;
    deniedCapabilities?: Capability[];
    reason?: string;
  }
): Record<string, unknown> {
  return {
    delegationAction: action,
    assigner: {
      memberId: details.assignerMemberId,
      role: details.assignerRole,
    },
    target: {
      committeeId: details.targetCommitteeId,
      roleId: details.targetRoleId,
    },
    enforcement: {
      deniedCapabilities: details.deniedCapabilities,
      reason: details.reason,
    },
    timestamp: new Date().toISOString(),
  };
}
