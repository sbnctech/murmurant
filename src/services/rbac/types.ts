/**
 * RBAC Type Definitions
 *
 * Core types for Role-Based Access Control system.
 */

// ============================================================================
// Core Entity Types
// ============================================================================

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be modified
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string; // e.g., "events", "members", "committees"
  action: string; // e.g., "read", "write", "delete", "manage"
  scope?: PermissionScope;
}

export type PermissionScope = "own" | "committee" | "all";

export interface Capability {
  permission: Permission;
  granted: boolean;
  source: CapabilitySource;
}

export type CapabilitySource =
  | { type: "role"; roleId: string; roleName: string }
  | { type: "direct"; grantId: string }
  | { type: "inherited"; parentRoleId: string };

// ============================================================================
// Assignment Types
// ============================================================================

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  context?: AssignmentContext;
}

export interface AssignmentContext {
  committeeId?: string;
  eventId?: string;
  resourceType?: string;
  resourceId?: string;
}

export interface PermissionGrant {
  id: string;
  userId: string;
  permissionId: string;
  permission: Permission;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  reason?: string;
}

// ============================================================================
// Access Control Types
// ============================================================================

export interface AccessContext {
  resourceType?: string;
  resourceId?: string;
  committeeId?: string;
  eventId?: string;
  ownerId?: string; // Owner of the resource being accessed
  metadata?: Record<string, unknown>;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedPermissions: Permission[];
  matchedRoles: Role[];
  context?: AccessContext;
  evaluatedAt: Date;
}

// ============================================================================
// Predefined Role Names
// ============================================================================

export const SystemRoles = {
  ADMIN: "admin",
  MEMBER: "member",
  GUEST: "guest",
  COMMITTEE_CHAIR: "committee_chair",
  COMMITTEE_MEMBER: "committee_member",
  EVENT_COORDINATOR: "event_coordinator",
  BOARD_MEMBER: "board_member",
} as const;

export type SystemRoleName = (typeof SystemRoles)[keyof typeof SystemRoles];

// ============================================================================
// Predefined Permission Names
// ============================================================================

export const Permissions = {
  // Member permissions
  MEMBERS_READ: "members:read",
  MEMBERS_WRITE: "members:write",
  MEMBERS_DELETE: "members:delete",
  MEMBERS_MANAGE: "members:manage",

  // Event permissions
  EVENTS_READ: "events:read",
  EVENTS_WRITE: "events:write",
  EVENTS_DELETE: "events:delete",
  EVENTS_MANAGE: "events:manage",

  // Committee permissions
  COMMITTEES_READ: "committees:read",
  COMMITTEES_WRITE: "committees:write",
  COMMITTEES_DELETE: "committees:delete",
  COMMITTEES_MANAGE: "committees:manage",

  // Admin permissions
  ADMIN_ACCESS: "admin:access",
  ADMIN_SETTINGS: "admin:settings",
  ADMIN_AUDIT: "admin:audit",
  ADMIN_REPORTS: "admin:reports",

  // System permissions
  SYSTEM_MANAGE: "system:manage",
} as const;

export type PermissionName = (typeof Permissions)[keyof typeof Permissions];
