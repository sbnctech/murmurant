/**
 * RBAC Service Module
 *
 * Role-Based Access Control abstraction for Murmurant.
 */

// Types
export type {
  Role,
  Permission,
  Capability,
  CapabilitySource,
  PermissionScope,
  RoleAssignment,
  AssignmentContext,
  PermissionGrant,
  AccessContext,
  AccessDecision,
  SystemRoleName,
  PermissionName,
} from "./types";

export { SystemRoles, Permissions } from "./types";

// Service interface
export type { RBACService, RBACServiceFactory } from "./RBACService";

// Native implementation
export { NativeRBACService, getRBACService } from "./NativeRBACService";
