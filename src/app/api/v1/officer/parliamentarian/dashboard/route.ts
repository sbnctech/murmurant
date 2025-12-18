/**
 * Parliamentarian Dashboard API
 *
 * GET /api/v1/officer/parliamentarian/dashboard - Get dashboard data for Parliamentarian
 *
 * Returns:
 * - visible: boolean (whether user has parliamentarian capabilities)
 * - openPolicyQuestions: flags with POLICY_REVIEW type in OPEN/IN_PROGRESS status
 * - recentInterpretations: recent annotations (interpretations)
 * - docsNeedingReview: flags with INSURANCE_REVIEW, LEGAL_REVIEW types
 * - overdueFlags: flags past their due date
 * - flagCounts: counts of open flags by type
 * - capabilities: actions the user can perform
 *
 * Charter P1: Identity provable (session-based auth)
 * Charter P2: Default deny (requireCapability check)
 * Charter P7: Audit trail via standard API logging
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability, hasCapability, type AuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewFlagType, ReviewFlagStatus } from "@prisma/client";

export type ParliamentarianDashboardData = {
  visible: boolean;
  openPolicyQuestions: FlagSummary[];
  recentInterpretations: AnnotationSummary[];
  docsNeedingReview: FlagSummary[];
  overdueFlags: FlagSummary[];
  flagCounts: Record<string, number>;
  capabilities: {
    canCreateFlag: boolean;
    canResolveFlag: boolean;
    canCreateAnnotation: boolean;
    canEditAnnotation: boolean;
    canPublishAnnotation: boolean;
    canManageRules: boolean;
  };
};

type FlagSummary = {
  id: string;
  targetType: string;
  targetId: string;
  flagType: ReviewFlagType;
  flagTypeLabel: string;
  title: string;
  notes: string | null;
  status: ReviewFlagStatus;
  statusLabel: string;
  dueDate: string | null;
  dueDateFormatted: string | null;
  isOverdue: boolean;
  createdAt: string;
  createdBy: string | null;
  auditTrailUrl: string;
};

type AnnotationSummary = {
  id: string;
  targetType: string;
  targetId: string;
  anchor: string | null;
  body: string;
  isPublished: boolean;
  createdAt: string;
  createdAtFormatted: string;
  createdBy: string | null;
  auditTrailUrl: string;
};

/**
 * Format date for display (e.g., "Dec 17, 2025")
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get human-readable flag type label
 */
function getFlagTypeLabel(flagType: ReviewFlagType): string {
  const labels: Record<ReviewFlagType, string> = {
    INSURANCE_REVIEW: "Insurance Review",
    LEGAL_REVIEW: "Legal Review",
    POLICY_REVIEW: "Policy Question",
    COMPLIANCE_CHECK: "Compliance Check",
    GENERAL: "General",
  };
  return labels[flagType] || flagType;
}

/**
 * Get human-readable flag status label
 */
function getFlagStatusLabel(status: ReviewFlagStatus): string {
  const labels: Record<ReviewFlagStatus, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    DISMISSED: "Dismissed",
  };
  return labels[status] || status;
}

/**
 * Check if a flag is overdue
 */
function isOverdue(dueDate: Date | null, status: ReviewFlagStatus): boolean {
  if (!dueDate) return false;
  if (status === "RESOLVED" || status === "DISMISSED") return false;
  return dueDate < new Date();
}

/**
 * Transform flag record to summary for dashboard
 */
function toFlagSummary(flag: {
  id: string;
  targetType: string;
  targetId: string;
  flagType: ReviewFlagType;
  title: string;
  notes: string | null;
  status: ReviewFlagStatus;
  dueDate: Date | null;
  createdAt: Date;
  createdBy: { firstName: string; lastName: string } | null;
}): FlagSummary {
  return {
    id: flag.id,
    targetType: flag.targetType,
    targetId: flag.targetId,
    flagType: flag.flagType,
    flagTypeLabel: getFlagTypeLabel(flag.flagType),
    title: flag.title,
    notes: flag.notes,
    status: flag.status,
    statusLabel: getFlagStatusLabel(flag.status),
    dueDate: flag.dueDate?.toISOString() || null,
    dueDateFormatted: flag.dueDate ? formatDate(flag.dueDate) : null,
    isOverdue: isOverdue(flag.dueDate, flag.status),
    createdAt: flag.createdAt.toISOString(),
    createdBy: flag.createdBy
      ? `${flag.createdBy.firstName} ${flag.createdBy.lastName}`
      : null,
    auditTrailUrl: `/admin/audit?objectType=GovernanceReviewFlag&objectId=${flag.id}`,
  };
}

/**
 * Transform annotation record to summary for dashboard
 */
function toAnnotationSummary(annotation: {
  id: string;
  targetType: string;
  targetId: string;
  anchor: string | null;
  body: string;
  isPublished: boolean;
  createdAt: Date;
  createdBy: { firstName: string; lastName: string } | null;
}): AnnotationSummary {
  return {
    id: annotation.id,
    targetType: annotation.targetType,
    targetId: annotation.targetId,
    anchor: annotation.anchor,
    body: annotation.body,
    isPublished: annotation.isPublished,
    createdAt: annotation.createdAt.toISOString(),
    createdAtFormatted: formatDate(annotation.createdAt),
    createdBy: annotation.createdBy
      ? `${annotation.createdBy.firstName} ${annotation.createdBy.lastName}`
      : null,
    auditTrailUrl: `/admin/audit?objectType=GovernanceAnnotation&objectId=${annotation.id}`,
  };
}

/**
 * Determine user capabilities based on their role
 */
function getUserCapabilities(context: AuthContext): ParliamentarianDashboardData["capabilities"] {
  return {
    canCreateFlag: hasCapability(context.globalRole, "governance:flags:create"),
    canResolveFlag: hasCapability(context.globalRole, "governance:flags:resolve"),
    canCreateAnnotation: hasCapability(context.globalRole, "governance:annotations:write"),
    canEditAnnotation: hasCapability(context.globalRole, "governance:annotations:write"),
    canPublishAnnotation: hasCapability(context.globalRole, "governance:annotations:publish"),
    canManageRules: hasCapability(context.globalRole, "governance:rules:manage"),
  };
}

/**
 * GET /api/v1/officer/parliamentarian/dashboard
 */
export async function GET(req: NextRequest) {
  // Check for governance read capability
  const auth = await requireCapability(req, "governance:flags:read");
  if (!auth.ok) {
    // Return not visible instead of 403 for widget compatibility
    return NextResponse.json({
      visible: false,
    } as ParliamentarianDashboardData);
  }

  try {
    const now = new Date();

    // Fetch data in parallel
    const [policyQuestions, interpretations, docsReview, overdue, flagCountsRaw] = await Promise.all([
      // Open policy questions (POLICY_REVIEW type, OPEN or IN_PROGRESS)
      prisma.governanceReviewFlag.findMany({
        where: {
          flagType: "POLICY_REVIEW",
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 10,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),

      // Recent interpretations (annotations, most recent 10)
      prisma.governanceAnnotation.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),

      // Docs needing review (INSURANCE_REVIEW or LEGAL_REVIEW, OPEN or IN_PROGRESS)
      prisma.governanceReviewFlag.findMany({
        where: {
          flagType: { in: ["INSURANCE_REVIEW", "LEGAL_REVIEW"] },
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 10,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),

      // Overdue flags
      prisma.governanceReviewFlag.findMany({
        where: {
          dueDate: { lt: now },
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),

      // Flag counts by type (for open/in-progress flags)
      prisma.governanceReviewFlag.groupBy({
        by: ["flagType"],
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        _count: { id: true },
      }),
    ]);

    // Transform flag counts to a simple object
    const flagCounts: Record<string, number> = {};
    for (const group of flagCountsRaw) {
      flagCounts[group.flagType] = group._count.id;
    }

    const dashboardData: ParliamentarianDashboardData = {
      visible: true,
      openPolicyQuestions: policyQuestions.map(toFlagSummary),
      recentInterpretations: interpretations.map(toAnnotationSummary),
      docsNeedingReview: docsReview.map(toFlagSummary),
      overdueFlags: overdue.map(toFlagSummary),
      flagCounts,
      capabilities: getUserCapabilities(auth.context),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching parliamentarian dashboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
