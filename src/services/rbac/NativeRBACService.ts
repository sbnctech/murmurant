/**
 * Native RBAC Service Implementation
 *
 * Provides an abstraction layer over Murmurant's existing auth system.
 * This service bridges the existing role/capability system with a
 * service-oriented interface for future extensibility.
 *
 * Note: This is an abstraction layer - actual permission logic lives
 * in src/lib/auth.ts and src/lib/rbac/role-gate.ts
 *
 * Future Implementation:
 * - Query UserAccount.globalRole for system-level roles
 * - Query RoleAssignment for committee-level roles
 * - Integrate with existing hasCapability() from auth module
 */

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

/**
 * Native RBAC Service Implementation
 *
 * This implementation provides the RBACService interface while
 * delegating to Murmurant's existing auth infrastructure.
 *
 * Current Status: Stub implementation with interface contract.
 * Full implementation will integrate with Prisma and existing auth.
 */
export class NativeRBACService implements RBACService {
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
    const roles = await this.getUserRoles(userId);
    return roles.some((r) => r.id === role || r.name === role);
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
      (p: Permission) =>
        p.name === permissionString ||
        p.name === `${resource}:manage` ||
        p.name === "system:manage"
    );

    if (context?.ownerId && context.ownerId === userId) {
      const ownPermission = permissions.find(
        (p: Permission) =>
          p.name === `${resource}:${action}` && p.scope === "own"
      );
      if (ownPermission) {
        matchedPermissions.push(ownPermission);
      }
    }

    const allowed = matchedPermissions.length > 0;

    return {
      allowed,
      reason: allowed
        ? `Access granted via ${matchedPermissions.map((p: Permission) => p.name).join(", ")}`
        : `No permission found for ${permissionString}`,
      matchedPermissions,
      matchedRoles: roles.filter((r: Role) =>
        r.permissions.some((p: Permission) => matchedPermissions.includes(p))
      ),
      context,
      evaluatedAt: new Date(),
    };
  }

  async getUserRoles(_userId: string): Promise<Role[]> {
    return [this.createSystemRole(SystemRoles.MEMBER)];
  }

  async getUserRoleAssignments(userId: string): Promise<RoleAssignment[]> {
    const roles = await this.getUserRoles(userId);
    return roles.map((role: Role) => ({
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

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId);
    const permissions: Permission[] = [];
    for (const role of roles) {
      permissions.push(...role.permissions);
    }
    const permissionMap = new Map(
      permissions.map((p: Permission) => [p.id, p])
    );
    return Array.from(permissionMap.values());
  }

  async getUserPermissionGrants(_userId: string): Promise<PermissionGrant[]> {
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

  async assignRole(
    userId: string,
    roleId: string,
    grantedBy: string,
    options?: { expiresAt?: Date; context?: AccessContext }
  ): Promise<RoleAssignment> {
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

  async revokeRole(_userId: string, _roleId: string): Promise<void> {}

  async grantPermission(
    _userId: string,
    _permissionId: string,
    _grantedBy: string,
    _options?: { expiresAt?: Date; reason?: string }
  ): Promise<PermissionGrant> {
    throw new Error("Direct permission grants not yet implemented");
  }

  async revokePermission(_userId: string, _permissionId: string): Promise<void> {
    throw new Error("Direct permission revocation not yet implemented");
  }

  private extractResource(permission: string): string {
    return permission.split(":")[0] || permission;
  }

  private extractAction(permission: string): string {
    return permission.split(":")[1] || "read";
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

let rbacServiceInstance: NativeRBACService | null = null;

export function getRBACService(): RBACService {
  if (!rbacServiceInstance) {
    rbacServiceInstance = new NativeRBACService();
  }
  return rbacServiceInstance;
}
