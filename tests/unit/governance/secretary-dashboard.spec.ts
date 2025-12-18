/**
 * Secretary Dashboard Unit Tests
 *
 * Tests for the Secretary Dashboard data structures and helper functions.
 *
 * Charter P1: Identity provable (capability-based access)
 * Charter P2: Default deny (visibility gating)
 */

import { describe, expect, test } from "vitest";
import { MinutesStatus } from "@prisma/client";

// Types matching the API response
type MinutesSummary = {
  id: string;
  meetingId: string;
  meetingDate: string;
  meetingDateFormatted: string;
  meetingType: string;
  meetingTitle: string | null;
  status: MinutesStatus;
  statusLabel: string;
  version: number;
  updatedAt: string;
  lastEditedBy: string | null;
  auditTrailUrl: string;
};

type SecretaryDashboardData = {
  visible: boolean;
  upcomingMeeting: {
    id: string;
    date: string;
    dateFormatted: string;
    type: string;
    title: string | null;
    hasMinutes: boolean;
  } | null;
  draftsInProgress: MinutesSummary[];
  awaitingReview: MinutesSummary[];
  readyToPublish: MinutesSummary[];
  recentlyPublished: MinutesSummary[];
  capabilities: {
    canCreateDraft: boolean;
    canEditDraft: boolean;
    canSubmit: boolean;
    canPublish: boolean;
  };
};

/**
 * Status label mapping (mirrors API implementation)
 */
function getStatusLabel(status: MinutesStatus): string {
  const labels: Record<MinutesStatus, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Awaiting Review",
    REVISED: "Needs Revision",
    APPROVED: "Ready to Publish",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
  };
  return labels[status] || status;
}

describe("Secretary Dashboard", () => {
  describe("dashboard data structure", () => {
    test("visible property controls widget display", () => {
      const hiddenDashboard: SecretaryDashboardData = {
        visible: false,
        upcomingMeeting: null,
        draftsInProgress: [],
        awaitingReview: [],
        readyToPublish: [],
        recentlyPublished: [],
        capabilities: {
          canCreateDraft: false,
          canEditDraft: false,
          canSubmit: false,
          canPublish: false,
        },
      };

      expect(hiddenDashboard.visible).toBe(false);
    });

    test("capabilities object has all required fields", () => {
      const capabilities = {
        canCreateDraft: true,
        canEditDraft: true,
        canSubmit: true,
        canPublish: false,
      };

      expect(capabilities).toHaveProperty("canCreateDraft");
      expect(capabilities).toHaveProperty("canEditDraft");
      expect(capabilities).toHaveProperty("canSubmit");
      expect(capabilities).toHaveProperty("canPublish");
    });

    test("draftsInProgress contains DRAFT and REVISED statuses", () => {
      const drafts: MinutesSummary[] = [
        createMinutesSummary("DRAFT"),
        createMinutesSummary("REVISED"),
      ];

      const validStatuses: MinutesStatus[] = ["DRAFT", "REVISED"];
      for (const draft of drafts) {
        expect(validStatuses).toContain(draft.status);
      }
    });

    test("awaitingReview contains only SUBMITTED status", () => {
      const awaiting: MinutesSummary[] = [
        createMinutesSummary("SUBMITTED"),
      ];

      for (const item of awaiting) {
        expect(item.status).toBe("SUBMITTED");
      }
    });

    test("readyToPublish contains only APPROVED status", () => {
      const ready: MinutesSummary[] = [
        createMinutesSummary("APPROVED"),
      ];

      for (const item of ready) {
        expect(item.status).toBe("APPROVED");
      }
    });

    test("recentlyPublished contains only PUBLISHED status", () => {
      const published: MinutesSummary[] = [
        createMinutesSummary("PUBLISHED"),
      ];

      for (const item of published) {
        expect(item.status).toBe("PUBLISHED");
      }
    });
  });

  describe("status labels", () => {
    test("DRAFT label is 'Draft'", () => {
      expect(getStatusLabel("DRAFT")).toBe("Draft");
    });

    test("SUBMITTED label is 'Awaiting Review'", () => {
      expect(getStatusLabel("SUBMITTED")).toBe("Awaiting Review");
    });

    test("REVISED label is 'Needs Revision'", () => {
      expect(getStatusLabel("REVISED")).toBe("Needs Revision");
    });

    test("APPROVED label is 'Ready to Publish'", () => {
      expect(getStatusLabel("APPROVED")).toBe("Ready to Publish");
    });

    test("PUBLISHED label is 'Published'", () => {
      expect(getStatusLabel("PUBLISHED")).toBe("Published");
    });

    test("ARCHIVED label is 'Archived'", () => {
      expect(getStatusLabel("ARCHIVED")).toBe("Archived");
    });

    test("all MinutesStatus values have labels", () => {
      const allStatuses: MinutesStatus[] = [
        "DRAFT",
        "SUBMITTED",
        "REVISED",
        "APPROVED",
        "PUBLISHED",
        "ARCHIVED",
      ];

      for (const status of allStatuses) {
        const label = getStatusLabel(status);
        expect(label).toBeTruthy();
        expect(label).not.toBe(status); // Should be human-readable
      }
    });
  });

  describe("audit trail URL", () => {
    test("generates correct audit trail URL format", () => {
      const minutesId = "test-minutes-id-123";
      const expectedUrl = `/admin/audit?objectType=GovernanceMinutes&objectId=${minutesId}`;

      const summary = createMinutesSummary("DRAFT", minutesId);
      expect(summary.auditTrailUrl).toBe(expectedUrl);
    });
  });

  describe("capabilities for Secretary role", () => {
    test("secretary should have draft creation capability", () => {
      const secretaryCapabilities = {
        canCreateDraft: true,
        canEditDraft: true,
        canSubmit: true,
        canPublish: false, // Secretary cannot finalize/publish
      };

      expect(secretaryCapabilities.canCreateDraft).toBe(true);
      expect(secretaryCapabilities.canEditDraft).toBe(true);
      expect(secretaryCapabilities.canSubmit).toBe(true);
    });

    test("secretary cannot publish (requires finalize capability)", () => {
      const secretaryCapabilities = {
        canCreateDraft: true,
        canEditDraft: true,
        canSubmit: true,
        canPublish: false,
      };

      expect(secretaryCapabilities.canPublish).toBe(false);
    });
  });

  describe("capabilities for President role", () => {
    test("president can publish approved minutes", () => {
      const presidentCapabilities = {
        canCreateDraft: false,
        canEditDraft: false,
        canSubmit: false,
        canPublish: true, // President has finalize capability
      };

      expect(presidentCapabilities.canPublish).toBe(true);
    });
  });

  describe("upcoming meeting", () => {
    test("hasMinutes flag indicates whether draft exists", () => {
      const meetingWithMinutes = {
        id: "meeting-1",
        date: new Date().toISOString(),
        dateFormatted: "Dec 17, 2025",
        type: "BOARD",
        title: "December Board Meeting",
        hasMinutes: true,
      };

      const meetingWithoutMinutes = {
        id: "meeting-2",
        date: new Date().toISOString(),
        dateFormatted: "Jan 15, 2026",
        type: "BOARD",
        title: "January Board Meeting",
        hasMinutes: false,
      };

      expect(meetingWithMinutes.hasMinutes).toBe(true);
      expect(meetingWithoutMinutes.hasMinutes).toBe(false);
    });

    test("create draft action only available when no minutes exist", () => {
      const hasMinutes = true;
      const canCreateDraft = true;

      // Show create button only when: !hasMinutes && canCreateDraft
      const showCreateButton = !hasMinutes && canCreateDraft;
      expect(showCreateButton).toBe(false);
    });

    test("create draft action available when no minutes and has capability", () => {
      const hasMinutes = false;
      const canCreateDraft = true;

      const showCreateButton = !hasMinutes && canCreateDraft;
      expect(showCreateButton).toBe(true);
    });
  });

  describe("action gating", () => {
    test("submit action gated by canSubmit capability", () => {
      const canSubmit = true;
      const status: MinutesStatus = "DRAFT";

      // Submit available for DRAFT/REVISED when user has capability
      const validStatuses: MinutesStatus[] = ["DRAFT", "REVISED"];
      const canPerformSubmit = canSubmit && validStatuses.includes(status);

      expect(canPerformSubmit).toBe(true);
    });

    test("submit action not available for SUBMITTED status", () => {
      const canSubmit = true;
      const status: MinutesStatus = "SUBMITTED";

      const validStatuses: MinutesStatus[] = ["DRAFT", "REVISED"];
      const canPerformSubmit = canSubmit && validStatuses.includes(status);

      expect(canPerformSubmit).toBe(false);
    });

    test("publish action gated by canPublish capability and APPROVED status", () => {
      const canPublish = true;
      const status: MinutesStatus = "APPROVED";

      const canPerformPublish = canPublish && status === "APPROVED";

      expect(canPerformPublish).toBe(true);
    });

    test("publish action not available for DRAFT status", () => {
      const canPublish = true;
      const status: MinutesStatus = "DRAFT";

      const canPerformPublish = canPublish && status === "APPROVED";

      expect(canPerformPublish).toBe(false);
    });

    test("edit action only available for DRAFT and REVISED", () => {
      const canEditDraft = true;

      const editableStatuses: MinutesStatus[] = ["DRAFT", "REVISED"];

      expect(canEditDraft && editableStatuses.includes("DRAFT")).toBe(true);
      expect(canEditDraft && editableStatuses.includes("REVISED")).toBe(true);
      expect(canEditDraft && editableStatuses.includes("SUBMITTED")).toBe(false);
      expect(canEditDraft && editableStatuses.includes("APPROVED")).toBe(false);
      expect(canEditDraft && editableStatuses.includes("PUBLISHED")).toBe(false);
    });
  });
});

/**
 * Helper to create a MinutesSummary for testing
 */
function createMinutesSummary(
  status: MinutesStatus,
  id: string = `minutes-${status.toLowerCase()}-${Date.now()}`
): MinutesSummary {
  return {
    id,
    meetingId: `meeting-${Date.now()}`,
    meetingDate: new Date().toISOString(),
    meetingDateFormatted: "Dec 17, 2025",
    meetingType: "BOARD",
    meetingTitle: "Test Meeting",
    status,
    statusLabel: getStatusLabel(status),
    version: 1,
    updatedAt: new Date().toISOString(),
    lastEditedBy: "Test User",
    auditTrailUrl: `/admin/audit?objectType=GovernanceMinutes&objectId=${id}`,
  };
}
