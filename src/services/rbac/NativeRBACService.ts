/**
 * Native RBAC Service Implementation
 *
 * Uses Prisma and existing database models for RBAC operations.
 * This is the default implementation for ClubOS.
 */

import { prisma } from "@/lib/prisma";
import type { RBACService } from "./RBACService";
import type {
  Role,
  Permission,
  RoleAssignment,
  PermissionGrant,
  AccessContext,
  AccessDecision,
  Capability,
  SystemRoleName,
} from "./types";
import { SystemRoles } from "./types";

export class NativeRBACService implements RBACService {
  // ============================================================================
  // Permission Checks
  // ============================================================================

  async hasPermission(
    userId: string,
    permission: string,
    context?: AccessContext
  ): Promise<boolean> {
    const decision = await this.checkAccess(
      userId,
      this.extractResource(permission),
      this.extractAction(permission),
      context
    );
    return decision.allowed;
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const member = await prisma.member.findUnique({
      where: { id: userId },
      select: { isAdmin: true, status: true },
    });

    if (!member) return false;

    // Map system roles to member properties
    switch (role as SystemRoleName) {
      case SystemRoles.ADMIN:
        return member.isAdmin === true;
      case SystemRoles.MEMBER:
        return member.status === "Active";
      case SystemRoles.GUEST:
        return member.status === "Pending" || member.status === "Suspended";
      default:
        // Check for committee-based roles
        return this.hasCommitteeRole(userId, role);
    }
  }

  async checkAccess(
    userId: string,
    resource: string,
    action: string,
    context?: AccessContext
  ): Promise<AccessDecision> {
    const roles = await this.getUserRoles(userId);
    const permissions = await this.getUserPermissions(userId);

    const permissionString = `${resource}:${action}`;
    const matchedPermissions = permissions.filter(
      (p) =>
        p.name === permissionString ||
        p.name === `${resource}:manage` ||
        p.name === "system:manage"
    );

    // Check for scope-based access if context provided
    if (context?.ownerId && context.ownerId === userId) {
      // User can always access their own resources
      const ownPermission = permissions.find(
        (p) => p.name === `${resource}:${action}` && p.scope === "own"
      );
      if (ownPermission) {
        matchedPermissions.push(ownPermission);
      }
    }

    const allowed = matchedPermissions.length > 0;

    return {
      allowed,
      reason: allowed
        ? `Access granted via ${matchedPermissions.map((p) => p.name).join(", ")}`
        : `No permission found for ${permissionString}`,
      matchedPermissions,
      matchedRoles: roles.filter((r) =>
        r.permissions.some((p) => matchedPermissions.includes(p))
      ),
      context,
      evaluatedAt: new Date(),
    };
  }

  // ============================================================================
  // Role Queries
  // ============================================================================

  async getUserRoles(userId: string): Promise<Role[]> {
    const member = await prisma.member.findUnique({
      where: { id: userId },
      select: { isAdmin: true, status: true },
    });

    if (!member) return [];

    const roles: Role[] = [];

    // Add system roles based on member status
    if (member.isAdmin) {
      roles.push(this.createSystemRole(SystemRoles.ADMIN));
    }

    if (member.status === "Active") {
      roles.push(this.createSystemRole(SystemRoles.MEMBER));
    }

    // Add committee-based roles
    const committeeRoles = await this.getCommitteeRoles(userId);
    roles.push(...committeeRoles);

    return roles;
  }

  async getUserRoleAssignments(userId: string): Promise<RoleAssignment[]> {
    const roles = await this.getUserRoles(userId);
    return roles.map((role) => ({
      id: `${userId}-${role.id}`,
      userId,
      roleId: role.id,
      role,
      grantedBy: "system",
      grantedAt: new Date(),
    }));
  }

  async getAllRoles(): Promise<Role[]> {
    return Object.values(SystemRoles).map((roleName) =>
      this.createSystemRole(roleName)
    );
  }

  async getRole(roleIdOrName: string): Promise<Role | null> {
    const systemRoleValues = Object.values(SystemRoles) as string[];
    if (systemRoleValues.includes(roleIdOrName)) {
      return this.createSystemRole(roleIdOrName as SystemRoleName);
    }
    return null;
  }

  // ============================================================================
  // Permission Queries
  // ============================================================================

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId);
    const permissions: Permission[] = [];

    for (const role of roles) {
      permissions.push(...role.permissions);
    }

    // Deduplicate
    return [...new Map(permissions.map((p) => [p.id, p])).values()];
  }

  async getUserPermissionGrants(userId: string): Promise<PermissionGrant[]> {
    // Direct permission grants not yet implemented in current schema
    return [];
  }

  async getUserCapabilities(userId: string): Promise<Capability[]> {
    const roles = await this.getUserRoles(userId);
    const capabilities: Capability[] = [];

    for (const role of roles) {
      for (const permission of role.permissions) {
        capabilities.push({
          permission,
          granted: true,
          source: { type: "role", roleId: role.id, roleName: role.name },
        });
      }
    }

    return capabilities;
  }

  // ============================================================================
  // Role Management
  // ============================================================================

  async assignRole(
    userId: string,
    roleId: string,
    grantedBy: string,
    options?: { expiresAt?: Date; context?: AccessContext }
  ): Promise<RoleAssignment> {
    // For now, role assignment is handled via member.isAdmin flag
    // Future: implement proper role assignment table

    if (roleId === SystemRoles.ADMIN) {
      await prisma.member.update({
        where: { id: userId },
        data: { isAdmin: true },
      });
    }

    const role = await this.getRole(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    return {
      id: `${userId}-${roleId}`,
      userId,
      roleId,
      role,
      grantedBy,
      grantedAt: new Date(),
      expiresAt: options?.expiresAt,
      context: options?.context
        ? {
            committeeId: options.context.committeeId,
            eventId: options.context.eventId,
            resourceType: options.context.resourceType,
            resourceId: options.context.resourceId,
          }
        : undefined,
    };
  }

  async revokeRole(userId: string, roleId: string): Promise<void> {
    if (roleId === SystemRoles.ADMIN) {
      await prisma.member.update({
        where: { id: userId },
        data: { isAdmin: false },
      });
    }
    // Future: remove from role assignment table
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  async grantPermission(
    userId: string,
    permissionId: string,
    grantedBy: string,
    options?: { expiresAt?: Date; reason?: string }
  ): Promise<PermissionGrant> {
    // Direct permission grants not yet implemented
    // Future: implement permission grants table
    throw new Error("Direct permission grants not yet implemented");
  }

  async revokePermission(userId: string, permissionId: string): Promise<void> {
    // Direct permission revocation not yet implemented
    throw new Error("Direct permission revocation not yet implemented");
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private extractResource(permission: string): string {
    return permission.split(":")[0] || permission;
  }

  private extractAction(permission: string): string {
    return permission.split(":")[1] || "read";
  }

  private async hasCommitteeRole(
    userId: string,
    role: string
  ): Promise<boolean> {
    if (role === SystemRoles.COMMITTEE_CHAIR) {
      const chairPosition = await prisma.committeeMember.findFirst({
        where: {
          memberId: userId,
          role: "Chair",
        },
      });
      return !!chairPosition;
    }

    if (role === SystemRoles.COMMITTEE_MEMBER) {
      const membership = await prisma.committeeMember.findFirst({
        where: { memberId: userId },
      });
      return !!membership;
    }

    return false;
  }

  private async getCommitteeRoles(userId: string): Promise<Role[]> {
    const roles: Role[] = [];

    const committeeMemberships = await prisma.committeeMember.findMany({
      where: { memberId: userId },
      include: { committee: true },
    });

    for (const membership of committeeMemberships) {
      if (membership.role === "Chair") {
        roles.push(
          this.createCommitteeRole(
            SystemRoles.COMMITTEE_CHAIR,
            membership.committee.id
          )
        );
      }
      roles.push(
        this.createCommitteeRole(
          SystemRoles.COMMITTEE_MEMBER,
          membership.committee.id
        )
      );
    }

    return roles;
  }

  private createSystemRole(roleName: SystemRoleName): Role {
    const permissions = this.getPermissionsForRole(roleName);
    return {
      id: roleName,
      name: roleName,
      description: `System role: ${roleName}`,
      permissions,
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createCommitteeRole(
    roleName: SystemRoleName,
    committeeId: string
  ): Role {
    const permissions = this.getPermissionsForRole(roleName);
    return {
      id: `${roleName}-${committeeId}`,
      name: `${roleName} (${committeeId})`,
      description: `Committee role: ${roleName}`,
      permissions,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private getPermissionsForRole(roleName: SystemRoleName): Permission[] {
    const createPermission = (
      name: string,
      resource: string,
      action: string
    ): Permission => ({
      id: name,
      name,
      resource,
      action,
    });

    switch (roleName) {
      case SystemRoles.ADMIN:
        return [
          createPermission("system:manage", "system", "manage"),
          createPermission("admin:access", "admin", "access"),
          createPermission("admin:settings", "admin", "settings"),
          createPermission("admin:audit", "admin", "audit"),
          createPermission("admin:reports", "admin", "reports"),
          createPermission("members:manage", "members", "manage"),
          createPermission("events:manage", "events", "manage"),
          createPermission("committees:manage", "committees", "manage"),
        ];

      case SystemRoles.MEMBER:
        return [
          createPermission("events:read", "events", "read"),
          createPermission("members:read", "members", "read"),
          createPermission("committees:read", "committees", "read"),
        ];

      case SystemRoles.COMMITTEE_CHAIR:
        return [
          createPermission("committees:write", "committees", "write"),
          createPermission("events:write", "events", "write"),
        ];

      case SystemRoles.COMMITTEE_MEMBER:
        return [createPermission("committees:read", "committees", "read")];

      case SystemRoles.GUEST:
        return [createPermission("events:read", "events", "read")];

      default:
        return [];
    }
  }
}

/**
 * Singleton instance of the RBAC service.
 */
let rbacServiceInstance: NativeRBACService | null = null;

export function getRBACService(): RBACService {
  if (!rbacServiceInstance) {
    rbacServiceInstance = new NativeRBACService();
  }
  return rbacServiceInstance;
}
