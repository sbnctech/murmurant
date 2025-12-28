/**
 * RBAC Service Interface
 *
 * Abstract interface for Role-Based Access Control operations.
 * Implementations can use different backends (Prisma, external auth, etc.)
 */

import type {
  Role,
  Permission,
  RoleAssignment,
  PermissionGrant,
  AccessContext,
  AccessDecision,
  Capability,
} from "./types";

export interface RBACService {
  // ============================================================================
  // Permission Checks
  // ============================================================================

  /**
   * Check if a user has a specific permission.
   * @param userId - The user's ID
   * @param permission - Permission string (e.g., "events:write")
   * @param context - Optional context for scoped permissions
   */
  hasPermission(
    userId: string,
    permission: string,
    context?: AccessContext
  ): Promise<boolean>;

  /**
   * Check if a user has a specific role.
   * @param userId - The user's ID
   * @param role - Role name or ID
   */
  hasRole(userId: string, role: string): Promise<boolean>;

  /**
   * Check if user can access a resource with a specific action.
   * Returns detailed decision with matched permissions/roles.
   */
  checkAccess(
    userId: string,
    resource: string,
    action: string,
    context?: AccessContext
  ): Promise<AccessDecision>;

  // ============================================================================
  // Role Queries
  // ============================================================================

  /**
   * Get all roles assigned to a user.
   */
  getUserRoles(userId: string): Promise<Role[]>;

  /**
   * Get all role assignments for a user (includes metadata).
   */
  getUserRoleAssignments(userId: string): Promise<RoleAssignment[]>;

  /**
   * Get all available roles in the system.
   */
  getAllRoles(): Promise<Role[]>;

  /**
   * Get a role by ID or name.
   */
  getRole(roleIdOrName: string): Promise<Role | null>;

  // ============================================================================
  // Permission Queries
  // ============================================================================

  /**
   * Get all permissions for a user (from all roles + direct grants).
   */
  getUserPermissions(userId: string): Promise<Permission[]>;

  /**
   * Get all direct permission grants for a user.
   */
  getUserPermissionGrants(userId: string): Promise<PermissionGrant[]>;

  /**
   * Get user's full capability set with source information.
   */
  getUserCapabilities(userId: string): Promise<Capability[]>;

  // ============================================================================
  // Role Management
  // ============================================================================

  /**
   * Assign a role to a user.
   */
  assignRole(
    userId: string,
    roleId: string,
    grantedBy: string,
    options?: {
      expiresAt?: Date;
      context?: AccessContext;
    }
  ): Promise<RoleAssignment>;

  /**
   * Revoke a role from a user.
   */
  revokeRole(userId: string, roleId: string): Promise<void>;

  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Grant a permission directly to a user.
   */
  grantPermission(
    userId: string,
    permissionId: string,
    grantedBy: string,
    options?: {
      expiresAt?: Date;
      reason?: string;
    }
  ): Promise<PermissionGrant>;

  /**
   * Revoke a direct permission from a user.
   */
  revokePermission(userId: string, permissionId: string): Promise<void>;
}

/**
 * Factory function type for creating RBAC service instances.
 */
export type RBACServiceFactory = () => RBACService;
