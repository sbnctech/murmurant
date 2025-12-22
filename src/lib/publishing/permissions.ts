// Copyright (c) Santa Barbara Newcomers Club
// Permission checking layer for publishing and communications system

import { prisma } from "@/lib/prisma";
import type { Page } from "@prisma/client";

// User context for permission checks
export type UserContext = {
  memberId: string | null;
  isAuthenticated: boolean;
  membershipStatusCode: string | null;
  roles: string[]; // Committee role slugs
  committeeIds: string[];
};

// Permission action types
export type PermissionAction =
  | "view"
  | "edit"
  | "publish"
  | "delete"
  | "send"
  | "manage";

// Resource types
export type ResourceType =
  | "page"
  | "template"
  | "theme"
  | "navigation"
  | "mailing_list"
  | "message_template"
  | "campaign"
  | "asset";

// Admin role slugs that grant elevated permissions
// NOTE: webmaster is NOT a full admin - they can manage content but cannot:
// - View/manage financial data
// - Change user roles/entitlements
// - Delete published pages (only full admins can)
const FULL_ADMIN_ROLES = ["president", "board-member"];
const CONTENT_ADMIN_ROLES = ["webmaster", "communications-chair"];
const COMMS_ADMIN_ROLES = ["communications-chair", "webmaster"];

/**
 * Build user context from member ID
 */
export async function buildUserContext(memberId: string | null): Promise<UserContext> {
  if (!memberId) {
    return {
      memberId: null,
      isAuthenticated: false,
      membershipStatusCode: null,
      roles: [],
      committeeIds: [],
    };
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      membershipStatus: true,
      roleAssignments: {
        where: {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
        include: {
          committeeRole: true,
          committee: true,
        },
      },
    },
  });

  if (!member) {
    return {
      memberId: null,
      isAuthenticated: false,
      membershipStatusCode: null,
      roles: [],
      committeeIds: [],
    };
  }

  const roles = member.roleAssignments.map((ra: { committeeRole: { slug: string } }) => ra.committeeRole.slug);
  const committeeIds = [...new Set(member.roleAssignments.map((ra: { committeeId: string }) => ra.committeeId))] as string[];

  return {
    memberId: member.id,
    isAuthenticated: true,
    membershipStatusCode: member.membershipStatus.code,
    roles,
    committeeIds,
  };
}

/**
 * Check if user has a full admin role (can delete published pages, view finance, etc.)
 * NOTE: webmaster is NOT a full admin - use isContentAdmin for publishing checks
 */
export function hasAdminRole(user: UserContext): boolean {
  return user.roles.some((role) => FULL_ADMIN_ROLES.includes(role));
}

/**
 * Check if user is a content admin (can manage pages, themes, templates)
 * This includes webmaster and communications-chair
 */
export function isContentAdmin(user: UserContext): boolean {
  if (!user.isAuthenticated) return false;
  return user.roles.some((role) => CONTENT_ADMIN_ROLES.includes(role));
}

/**
 * Check if user is a comms admin (can manage mailing lists, campaigns)
 */
export function isCommsAdmin(user: UserContext): boolean {
  if (!user.isAuthenticated) return false;
  return user.roles.some((role) => COMMS_ADMIN_ROLES.includes(role));
}

/**
 * Check if user can manage themes
 */
export function canManageThemes(user: UserContext): boolean {
  if (!user.isAuthenticated) return false;
  return user.roles.some((role) => CONTENT_ADMIN_ROLES.includes(role));
}

/**
 * Check if user can manage templates
 */
export function canManageTemplates(user: UserContext): boolean {
  if (!user.isAuthenticated) return false;
  return user.roles.some((role) => CONTENT_ADMIN_ROLES.includes(role));
}

/**
 * Check if user can manage mailing lists
 */
export function canManageMailingLists(user: UserContext): boolean {
  if (!user.isAuthenticated) return false;
  return user.roles.some((role) => COMMS_ADMIN_ROLES.includes(role));
}

/**
 * Check if user can send campaigns
 */
export function canSendCampaign(user: UserContext): boolean {
  if (!user.isAuthenticated) return false;
  return user.roles.some((role) => COMMS_ADMIN_ROLES.includes(role));
}

/**
 * Check if user can view a page based on visibility and audience rules
 */
export async function canViewPage(
  user: UserContext,
  page: Page & { audienceRule?: { rules: unknown } | null }
): Promise<boolean> {
  // Published public pages are viewable by all
  if (page.status === "PUBLISHED" && page.visibility === "PUBLIC") {
    return true;
  }

  // Draft pages require authentication and edit permission
  if (page.status === "DRAFT") {
    return canEditPage(user, page);
  }

  // Members-only pages require authentication with active membership
  if (page.visibility === "MEMBERS_ONLY") {
    if (!user.isAuthenticated) return false;
    // Check if membership status is active
    const activeStatuses = ["active", "ACTIVE", "board", "BOARD"];
    return activeStatuses.includes(user.membershipStatusCode || "");
  }

  // Role-restricted pages check audience rules
  if (page.visibility === "ROLE_RESTRICTED" && page.audienceRule) {
    return evaluateAudienceRule(user, page.audienceRule.rules);
  }

  // Admins can always view
  if (hasAdminRole(user)) return true;

  return false;
}

/**
 * Check if user can edit a page
 */
export function canEditPage(user: UserContext, page: Page): boolean {
  if (!user.isAuthenticated) return false;

  // Admins and content admins can edit
  if (user.roles.some((role) => CONTENT_ADMIN_ROLES.includes(role))) {
    return true;
  }

  // Creator can edit their own drafts
  if (page.status === "DRAFT" && page.createdById === user.memberId) {
    return true;
  }

  return false;
}

/**
 * Check if user can publish a page
 * Note: The page parameter is included for API consistency but not currently used
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canPublishPage(user: UserContext, page: Page): boolean {
  if (!user.isAuthenticated) return false;

  // Only content admins can publish
  return user.roles.some((role) => CONTENT_ADMIN_ROLES.includes(role));
}

/**
 * Check if user can delete a page
 */
export function canDeletePage(user: UserContext, page: Page): boolean {
  if (!user.isAuthenticated) return false;

  // Only admins can delete published pages
  if (page.status === "PUBLISHED") {
    return hasAdminRole(user);
  }

  // Content admins can delete drafts
  if (user.roles.some((role) => CONTENT_ADMIN_ROLES.includes(role))) {
    return true;
  }

  // Creators can delete their own drafts
  if (page.status === "DRAFT" && page.createdById === user.memberId) {
    return true;
  }

  return false;
}

/**
 * Evaluate audience rules against user context
 */
export function evaluateAudienceRule(
  user: UserContext,
  rules: unknown
): boolean {
  if (!rules || typeof rules !== "object") return false;

  const r = rules as {
    isPublic?: boolean;
    roles?: string[];
    membershipStatuses?: string[];
    memberIds?: string[];
    committeeIds?: string[];
  };

  // Public rule
  if (r.isPublic) return true;

  // Not authenticated but rules require it
  if (!user.isAuthenticated) return false;

  // Check specific member IDs
  if (r.memberIds && r.memberIds.length > 0) {
    if (user.memberId && r.memberIds.includes(user.memberId)) {
      return true;
    }
  }

  // Check roles
  if (r.roles && r.roles.length > 0) {
    if (user.roles.some((role) => r.roles!.includes(role))) {
      return true;
    }
  }

  // Check membership statuses
  if (r.membershipStatuses && r.membershipStatuses.length > 0) {
    if (
      user.membershipStatusCode &&
      r.membershipStatuses.includes(user.membershipStatusCode)
    ) {
      return true;
    }
  }

  // Check committee membership
  if (r.committeeIds && r.committeeIds.length > 0) {
    if (user.committeeIds.some((id) => r.committeeIds!.includes(id))) {
      return true;
    }
  }

  return false;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: {
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "UNPUBLISH" | "SEND" | "ARCHIVE" | "DISCARD_DRAFT" | "UNDO" | "REDO";
  resourceType: string;
  resourceId: string;
  memberId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      memberId: params.memberId || null,
      before: params.before as object || null,
      after: params.after as object || null,
      metadata: params.metadata as object || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    },
  });
}

/**
 * Permission check result
 */
export type PermissionResult = {
  allowed: boolean;
  reason?: "unauthorized" | "forbidden" | "not_found";
  message?: string;
};

/**
 * Check permission and return structured result
 */
export function checkPermission(
  allowed: boolean,
  user: UserContext,
  action: string
): PermissionResult {
  if (allowed) {
    return { allowed: true };
  }

  if (!user.isAuthenticated) {
    return {
      allowed: false,
      reason: "unauthorized",
      message: "Authentication required",
    };
  }

  return {
    allowed: false,
    reason: "forbidden",
    message: `You do not have permission to ${action} this resource`,
  };
}
