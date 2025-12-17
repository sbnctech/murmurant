// Copyright (c) Santa Barbara Newcomers Club
// Audience rule evaluation for targeting content and mailing lists

import { prisma } from "@/lib/prisma";
import type { Member, MembershipStatus } from "@prisma/client";

// Audience rule structure stored in JSON
export type AudienceRules = {
  isPublic?: boolean;
  roles?: string[]; // Committee role slugs
  membershipStatuses?: string[]; // Membership status codes
  memberIds?: string[]; // Specific member UUIDs
  committeeIds?: string[]; // Committee UUIDs
  joinedAfterDays?: number; // Members who joined within N days
  joinedBeforeDate?: string; // Members who joined before date
  excludeMemberIds?: string[]; // Members to exclude
};

// Member with relations needed for audience evaluation
export type MemberWithStatus = Member & {
  membershipStatus: MembershipStatus;
  roleAssignments?: {
    committeeId: string;
    committeeRole: { slug: string };
  }[];
};

/**
 * Evaluate if a member matches audience rules
 */
export function evaluateMemberAgainstRules(
  member: MemberWithStatus,
  rules: AudienceRules
): boolean {
  // Public rules match everyone
  if (rules.isPublic) return true;

  // Check exclusions first
  if (rules.excludeMemberIds?.includes(member.id)) {
    return false;
  }

  // Check specific member IDs
  if (rules.memberIds && rules.memberIds.length > 0) {
    if (rules.memberIds.includes(member.id)) {
      return true;
    }
  }

  // Check membership statuses
  if (rules.membershipStatuses && rules.membershipStatuses.length > 0) {
    if (rules.membershipStatuses.includes(member.membershipStatus.code)) {
      // This matches, continue to other checks or return true if no other criteria
      if (!rules.roles && !rules.committeeIds && !rules.joinedAfterDays) {
        return true;
      }
    } else {
      return false; // Status does not match
    }
  }

  // Check roles
  if (rules.roles && rules.roles.length > 0) {
    const memberRoles = member.roleAssignments?.map((ra) => ra.committeeRole.slug) || [];
    if (memberRoles.some((role) => rules.roles!.includes(role))) {
      return true;
    }
  }

  // Check committee membership
  if (rules.committeeIds && rules.committeeIds.length > 0) {
    const memberCommittees = member.roleAssignments?.map((ra) => ra.committeeId) || [];
    if (memberCommittees.some((id) => rules.committeeIds!.includes(id))) {
      return true;
    }
  }

  // Check join date (within N days)
  if (rules.joinedAfterDays !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rules.joinedAfterDays);
    if (member.joinedAt >= cutoffDate) {
      return true;
    }
  }

  // Check join date (before specific date)
  if (rules.joinedBeforeDate) {
    const beforeDate = new Date(rules.joinedBeforeDate);
    if (member.joinedAt < beforeDate) {
      return true;
    }
  }

  // If we have specific criteria but none matched, return false
  const hasPositiveCriteria =
    (rules.memberIds && rules.memberIds.length > 0) ||
    (rules.roles && rules.roles.length > 0) ||
    (rules.committeeIds && rules.committeeIds.length > 0) ||
    rules.joinedAfterDays !== undefined ||
    rules.joinedBeforeDate !== undefined;

  return !hasPositiveCriteria;
}

/**
 * Get all members matching audience rules
 */
export async function getMembersMatchingRules(
  rules: AudienceRules
): Promise<MemberWithStatus[]> {
  // Build the base query
  const whereClause: Parameters<typeof prisma.member.findMany>[0] = {
    include: {
      membershipStatus: true,
      roleAssignments: {
        where: {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        include: {
          committeeRole: true,
        },
      },
    },
  };

  // Add membership status filter if specified
  if (rules.membershipStatuses && rules.membershipStatuses.length > 0) {
    whereClause.where = {
      ...whereClause.where,
      membershipStatus: {
        code: { in: rules.membershipStatuses },
      },
    };
  }

  // Add join date filter if specified
  if (rules.joinedAfterDays !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rules.joinedAfterDays);
    whereClause.where = {
      ...whereClause.where,
      joinedAt: { gte: cutoffDate },
    };
  }

  if (rules.joinedBeforeDate) {
    whereClause.where = {
      ...whereClause.where,
      joinedAt: { lt: new Date(rules.joinedBeforeDate) },
    };
  }

  // Add exclusion filter
  if (rules.excludeMemberIds && rules.excludeMemberIds.length > 0) {
    whereClause.where = {
      ...whereClause.where,
      id: { notIn: rules.excludeMemberIds },
    };
  }

  const members = await prisma.member.findMany(whereClause as Parameters<typeof prisma.member.findMany>[0]);

  // Post-filter for complex criteria
  return (members as MemberWithStatus[]).filter((member) =>
    evaluateMemberAgainstRules(member, rules)
  );
}

/**
 * Get recipient count for audience rules (preview)
 */
export async function getAudienceCount(rules: AudienceRules): Promise<number> {
  const members = await getMembersMatchingRules(rules);
  return members.length;
}

/**
 * Get sample recipients for preview
 */
export async function getAudienceSample(
  rules: AudienceRules,
  limit: number = 5
): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> {
  const members = await getMembersMatchingRules(rules);
  return members.slice(0, limit).map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
  }));
}

/**
 * Resolve mailing list recipients
 */
export async function resolveMailingListRecipients(
  mailingListId: string
): Promise<MemberWithStatus[]> {
  const list = await prisma.mailingList.findUnique({
    where: { id: mailingListId },
    include: { audienceRule: true },
  });

  if (!list) return [];

  let recipients: MemberWithStatus[] = [];

  // Get members from audience rule
  if (list.audienceRule) {
    const rules = list.audienceRule.rules as AudienceRules;
    recipients = await getMembersMatchingRules(rules);
  }

  // Add static members
  if (list.staticMembers) {
    const staticIds = list.staticMembers as string[];
    if (staticIds.length > 0) {
      const staticMembers = await prisma.member.findMany({
        where: { id: { in: staticIds } },
        include: {
          membershipStatus: true,
          roleAssignments: {
            where: {
              OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
            },
            include: { committeeRole: true },
          },
        },
      });

      // Merge without duplicates
      const existingIds = new Set(recipients.map((r) => r.id));
      for (const member of staticMembers as MemberWithStatus[]) {
        if (!existingIds.has(member.id)) {
          recipients.push(member);
        }
      }
    }
  }

  return recipients;
}

/**
 * Validate audience rules structure
 */
export function validateAudienceRules(rules: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!rules || typeof rules !== "object") {
    return { valid: false, errors: ["Rules must be an object"] };
  }

  const r = rules as Record<string, unknown>;

  if (r.isPublic !== undefined && typeof r.isPublic !== "boolean") {
    errors.push("isPublic must be a boolean");
  }

  if (r.roles !== undefined && !Array.isArray(r.roles)) {
    errors.push("roles must be an array");
  }

  if (r.membershipStatuses !== undefined && !Array.isArray(r.membershipStatuses)) {
    errors.push("membershipStatuses must be an array");
  }

  if (r.memberIds !== undefined && !Array.isArray(r.memberIds)) {
    errors.push("memberIds must be an array");
  }

  if (r.committeeIds !== undefined && !Array.isArray(r.committeeIds)) {
    errors.push("committeeIds must be an array");
  }

  if (r.joinedAfterDays !== undefined && typeof r.joinedAfterDays !== "number") {
    errors.push("joinedAfterDays must be a number");
  }

  if (r.joinedBeforeDate !== undefined && typeof r.joinedBeforeDate !== "string") {
    errors.push("joinedBeforeDate must be a string date");
  }

  return { valid: errors.length === 0, errors };
}
