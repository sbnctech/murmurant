/**
 * RBAC Service Interface Types
 */

import type { GlobalRole, Capability } from "@/lib/auth";

export interface Permission {
  capability: Capability;
  granted: boolean;
  reason?: string;
}

export interface PermissionCheck {
  capability: Capability;
  resourceType?: string;
  resourceId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  capability: Capability;
  reason: string;
  checkedAt: Date;
}

export interface RoleDefinition {
  role: GlobalRole;
  label: string;
  description: string;
  capabilities: Capability[];
  isAdminRole: boolean;
}

export interface RoleAssignment {
  id: string;
  memberId: string;
  role: GlobalRole;
  committeeId?: string;
  committeeName?: string;
  startDate: Date;
  endDate?: Date;
  assignedById: string;
  assignedAt: Date;
}

export interface AssignRoleInput {
  memberId: string;
  role: GlobalRole;
  committeeId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RBACContext {
  userId: string;
  memberId: string | null;
  globalRole: GlobalRole;
  committeeRoles: Array<{ committeeId: string; role: string }>;
  effectiveCapabilities: Capability[];
}

export interface RBACService {
  hasCapability(userId: string, capability: Capability): Promise<boolean>;
  hasCapabilityForResource(userId: string, capability: Capability, resourceType: string, resourceId: string): Promise<boolean>;
  checkPermissions(userId: string, checks: PermissionCheck[]): Promise<PermissionResult[]>;
  getCapabilities(userId: string): Promise<Capability[]>;
  getContext(userId: string): Promise<RBACContext | null>;
  getRoleDefinition(role: GlobalRole): RoleDefinition;
  listRoleDefinitions(): RoleDefinition[];
  assignRole(input: AssignRoleInput, assignedById: string): Promise<RoleAssignment>;
  revokeRole(assignmentId: string, revokedById: string): Promise<void>;
  getMemberRoles(memberId: string): Promise<RoleAssignment[]>;
}
