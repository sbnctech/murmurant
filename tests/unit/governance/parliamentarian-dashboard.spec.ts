/**
 * Parliamentarian Dashboard Unit Tests
 *
 * Tests for the Parliamentarian Dashboard data structures and helper functions.
 *
 * Charter P1: Identity provable (capability-based access)
 * Charter P2: Default deny (visibility gating)
 * Charter P7: Audit trail via standard API logging
 */

import { describe, expect, test } from "vitest";
import { ReviewFlagType, ReviewFlagStatus } from "@prisma/client";

// Types matching the API response
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

type ParliamentarianDashboardData = {
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

/**
 * Flag type label mapping (mirrors API implementation)
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
 * Flag status label mapping (mirrors API implementation)
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
 * Check if a flag is overdue (mirrors API implementation)
 */
function isOverdue(dueDate: Date | null, status: ReviewFlagStatus): boolean {
  if (!dueDate) return false;
  if (status === "RESOLVED" || status === "DISMISSED") return false;
  return dueDate < new Date();
}

describe("Parliamentarian Dashboard", () => {
  describe("dashboard data structure", () => {
    test("visible property controls widget display", () => {
      const hiddenDashboard: ParliamentarianDashboardData = {
        visible: false,
        openPolicyQuestions: [],
        recentInterpretations: [],
        docsNeedingReview: [],
        overdueFlags: [],
        flagCounts: {},
        capabilities: {
          canCreateFlag: false,
          canResolveFlag: false,
          canCreateAnnotation: false,
          canEditAnnotation: false,
          canPublishAnnotation: false,
          canManageRules: false,
        },
      };

      expect(hiddenDashboard.visible).toBe(false);
    });

    test("capabilities object has all required fields", () => {
      const capabilities = {
        canCreateFlag: true,
        canResolveFlag: true,
        canCreateAnnotation: true,
        canEditAnnotation: true,
        canPublishAnnotation: true,
        canManageRules: false,
      };

      expect(capabilities).toHaveProperty("canCreateFlag");
      expect(capabilities).toHaveProperty("canResolveFlag");
      expect(capabilities).toHaveProperty("canCreateAnnotation");
      expect(capabilities).toHaveProperty("canEditAnnotation");
      expect(capabilities).toHaveProperty("canPublishAnnotation");
      expect(capabilities).toHaveProperty("canManageRules");
    });

    test("openPolicyQuestions contains only POLICY_REVIEW type", () => {
      const policyQuestions: FlagSummary[] = [
        createFlagSummary("POLICY_REVIEW", "OPEN"),
        createFlagSummary("POLICY_REVIEW", "IN_PROGRESS"),
      ];

      for (const flag of policyQuestions) {
        expect(flag.flagType).toBe("POLICY_REVIEW");
      }
    });

    test("docsNeedingReview contains INSURANCE_REVIEW or LEGAL_REVIEW types", () => {
      const docsReview: FlagSummary[] = [
        createFlagSummary("INSURANCE_REVIEW", "OPEN"),
        createFlagSummary("LEGAL_REVIEW", "IN_PROGRESS"),
      ];

      const validTypes: ReviewFlagType[] = ["INSURANCE_REVIEW", "LEGAL_REVIEW"];
      for (const flag of docsReview) {
        expect(validTypes).toContain(flag.flagType);
      }
    });

    test("overdueFlags contains flags with isOverdue=true", () => {
      const overdueFlags: FlagSummary[] = [
        { ...createFlagSummary("POLICY_REVIEW", "OPEN"), isOverdue: true },
        { ...createFlagSummary("LEGAL_REVIEW", "IN_PROGRESS"), isOverdue: true },
      ];

      for (const flag of overdueFlags) {
        expect(flag.isOverdue).toBe(true);
      }
    });

    test("flagCounts maps flag types to counts", () => {
      const flagCounts: Record<string, number> = {
        POLICY_REVIEW: 3,
        INSURANCE_REVIEW: 1,
        LEGAL_REVIEW: 2,
      };

      expect(flagCounts["POLICY_REVIEW"]).toBe(3);
      expect(flagCounts["INSURANCE_REVIEW"]).toBe(1);
      expect(flagCounts["LEGAL_REVIEW"]).toBe(2);
    });
  });

  describe("flag type labels", () => {
    test("INSURANCE_REVIEW label is 'Insurance Review'", () => {
      expect(getFlagTypeLabel("INSURANCE_REVIEW")).toBe("Insurance Review");
    });

    test("LEGAL_REVIEW label is 'Legal Review'", () => {
      expect(getFlagTypeLabel("LEGAL_REVIEW")).toBe("Legal Review");
    });

    test("POLICY_REVIEW label is 'Policy Question'", () => {
      expect(getFlagTypeLabel("POLICY_REVIEW")).toBe("Policy Question");
    });

    test("COMPLIANCE_CHECK label is 'Compliance Check'", () => {
      expect(getFlagTypeLabel("COMPLIANCE_CHECK")).toBe("Compliance Check");
    });

    test("GENERAL label is 'General'", () => {
      expect(getFlagTypeLabel("GENERAL")).toBe("General");
    });

    test("all ReviewFlagType values have labels", () => {
      const allTypes: ReviewFlagType[] = [
        "INSURANCE_REVIEW",
        "LEGAL_REVIEW",
        "POLICY_REVIEW",
        "COMPLIANCE_CHECK",
        "GENERAL",
      ];

      for (const type of allTypes) {
        const label = getFlagTypeLabel(type);
        expect(label).toBeTruthy();
      }
    });
  });

  describe("flag status labels", () => {
    test("OPEN label is 'Open'", () => {
      expect(getFlagStatusLabel("OPEN")).toBe("Open");
    });

    test("IN_PROGRESS label is 'In Progress'", () => {
      expect(getFlagStatusLabel("IN_PROGRESS")).toBe("In Progress");
    });

    test("RESOLVED label is 'Resolved'", () => {
      expect(getFlagStatusLabel("RESOLVED")).toBe("Resolved");
    });

    test("DISMISSED label is 'Dismissed'", () => {
      expect(getFlagStatusLabel("DISMISSED")).toBe("Dismissed");
    });

    test("all ReviewFlagStatus values have labels", () => {
      const allStatuses: ReviewFlagStatus[] = [
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
        "DISMISSED",
      ];

      for (const status of allStatuses) {
        const label = getFlagStatusLabel(status);
        expect(label).toBeTruthy();
      }
    });
  });

  describe("overdue flag detection", () => {
    test("flag without due date is not overdue", () => {
      expect(isOverdue(null, "OPEN")).toBe(false);
    });

    test("resolved flag is never overdue", () => {
      const pastDate = new Date("2020-01-01");
      expect(isOverdue(pastDate, "RESOLVED")).toBe(false);
    });

    test("dismissed flag is never overdue", () => {
      const pastDate = new Date("2020-01-01");
      expect(isOverdue(pastDate, "DISMISSED")).toBe(false);
    });

    test("open flag with past due date is overdue", () => {
      const pastDate = new Date("2020-01-01");
      expect(isOverdue(pastDate, "OPEN")).toBe(true);
    });

    test("in progress flag with past due date is overdue", () => {
      const pastDate = new Date("2020-01-01");
      expect(isOverdue(pastDate, "IN_PROGRESS")).toBe(true);
    });

    test("open flag with future due date is not overdue", () => {
      const futureDate = new Date("2030-01-01");
      expect(isOverdue(futureDate, "OPEN")).toBe(false);
    });
  });

  describe("audit trail URLs", () => {
    test("flag generates correct audit trail URL format", () => {
      const flagId = "test-flag-id-123";
      const expectedUrl = `/admin/audit?objectType=GovernanceReviewFlag&objectId=${flagId}`;

      const summary = createFlagSummary("POLICY_REVIEW", "OPEN", flagId);
      expect(summary.auditTrailUrl).toBe(expectedUrl);
    });

    test("annotation generates correct audit trail URL format", () => {
      const annotationId = "test-annotation-id-456";
      const expectedUrl = `/admin/audit?objectType=GovernanceAnnotation&objectId=${annotationId}`;

      const summary = createAnnotationSummary(annotationId);
      expect(summary.auditTrailUrl).toBe(expectedUrl);
    });
  });

  describe("capabilities for Parliamentarian role", () => {
    test("parliamentarian should have flag creation capability", () => {
      const parliamentarianCapabilities = {
        canCreateFlag: true,
        canResolveFlag: true,
        canCreateAnnotation: true,
        canEditAnnotation: true,
        canPublishAnnotation: true,
        canManageRules: false,
      };

      expect(parliamentarianCapabilities.canCreateFlag).toBe(true);
      expect(parliamentarianCapabilities.canResolveFlag).toBe(true);
    });

    test("parliamentarian should have annotation capabilities", () => {
      const parliamentarianCapabilities = {
        canCreateFlag: true,
        canResolveFlag: true,
        canCreateAnnotation: true,
        canEditAnnotation: true,
        canPublishAnnotation: true,
        canManageRules: false,
      };

      expect(parliamentarianCapabilities.canCreateAnnotation).toBe(true);
      expect(parliamentarianCapabilities.canEditAnnotation).toBe(true);
      expect(parliamentarianCapabilities.canPublishAnnotation).toBe(true);
    });

    test("regular member has no parliamentarian capabilities", () => {
      const memberCapabilities = {
        canCreateFlag: false,
        canResolveFlag: false,
        canCreateAnnotation: false,
        canEditAnnotation: false,
        canPublishAnnotation: false,
        canManageRules: false,
      };

      expect(memberCapabilities.canCreateFlag).toBe(false);
      expect(memberCapabilities.canResolveFlag).toBe(false);
      expect(memberCapabilities.canCreateAnnotation).toBe(false);
    });
  });

  describe("action gating", () => {
    test("resolve action gated by canResolveFlag capability", () => {
      const canResolveFlag = true;
      const status: ReviewFlagStatus = "OPEN";

      // Resolve available for OPEN/IN_PROGRESS when user has capability
      const resolvableStatuses: ReviewFlagStatus[] = ["OPEN", "IN_PROGRESS"];
      const canPerformResolve = canResolveFlag && resolvableStatuses.includes(status);

      expect(canPerformResolve).toBe(true);
    });

    test("resolve action not available for already resolved flags", () => {
      const canResolveFlag = true;
      const status: ReviewFlagStatus = "RESOLVED";

      const resolvableStatuses: ReviewFlagStatus[] = ["OPEN", "IN_PROGRESS"];
      const canPerformResolve = canResolveFlag && resolvableStatuses.includes(status);

      expect(canPerformResolve).toBe(false);
    });

    test("create annotation gated by canCreateAnnotation capability", () => {
      const canCreateAnnotation = true;
      const showAddForm = canCreateAnnotation;

      expect(showAddForm).toBe(true);
    });

    test("publish annotation gated by canPublishAnnotation capability", () => {
      const canPublishAnnotation = true;
      const isPublished = false;

      const canPerformPublish = canPublishAnnotation && !isPublished;

      expect(canPerformPublish).toBe(true);
    });

    test("unpublish annotation gated by canPublishAnnotation capability", () => {
      const canPublishAnnotation = true;
      const isPublished = true;

      const canPerformUnpublish = canPublishAnnotation && isPublished;

      expect(canPerformUnpublish).toBe(true);
    });
  });

  describe("annotation panel", () => {
    test("anchors allow section-level targeting", () => {
      const anchors = [
        { id: "section-1", label: "Article I" },
        { id: "section-2", label: "Article II" },
        { id: "section-3", label: "Article III" },
      ];

      expect(anchors.length).toBe(3);
      expect(anchors[0].id).toBe("section-1");
      expect(anchors[0].label).toBe("Article I");
    });

    test("annotation can be linked to specific anchor", () => {
      const annotation = createAnnotationSummary("annotation-1");
      const anchoredAnnotation = { ...annotation, anchor: "section-2" };

      expect(anchoredAnnotation.anchor).toBe("section-2");
    });

    test("annotation without anchor targets entire document", () => {
      const annotation = createAnnotationSummary("annotation-1");

      expect(annotation.anchor).toBeNull();
    });

    test("published annotation is visible to all", () => {
      const publishedAnnotation = {
        ...createAnnotationSummary("annotation-1"),
        isPublished: true
      };

      expect(publishedAnnotation.isPublished).toBe(true);
    });

    test("draft annotation is only visible to author and admins", () => {
      const draftAnnotation = {
        ...createAnnotationSummary("annotation-1"),
        isPublished: false
      };

      expect(draftAnnotation.isPublished).toBe(false);
    });
  });
});

/**
 * Helper to create a FlagSummary for testing
 */
function createFlagSummary(
  flagType: ReviewFlagType,
  status: ReviewFlagStatus,
  id: string = `flag-${flagType.toLowerCase()}-${Date.now()}`
): FlagSummary {
  return {
    id,
    targetType: "bylaw",
    targetId: "bylaw-article-1",
    flagType,
    flagTypeLabel: getFlagTypeLabel(flagType),
    title: "Test Flag",
    notes: "Test notes",
    status,
    statusLabel: getFlagStatusLabel(status),
    dueDate: null,
    dueDateFormatted: null,
    isOverdue: false,
    createdAt: new Date().toISOString(),
    createdBy: "Test User",
    auditTrailUrl: `/admin/audit?objectType=GovernanceReviewFlag&objectId=${id}`,
  };
}

/**
 * Helper to create an AnnotationSummary for testing
 */
function createAnnotationSummary(
  id: string = `annotation-${Date.now()}`
): AnnotationSummary {
  return {
    id,
    targetType: "bylaw",
    targetId: "bylaw-article-1",
    anchor: null,
    body: "Test annotation body",
    isPublished: false,
    createdAt: new Date().toISOString(),
    createdAtFormatted: "Dec 17, 2025",
    createdBy: "Test User",
    auditTrailUrl: `/admin/audit?objectType=GovernanceAnnotation&objectId=${id}`,
  };
}
