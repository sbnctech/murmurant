/**
 * Secretary Dashboard API E2E Tests
 *
 * Golden path tests for the Secretary Dashboard API endpoint.
 *
 * Charter Principles:
 * - P1: Identity provable (session-based auth)
 * - P2: Default deny (visibility gating)
 * - P3: Explicit state machine (minutes workflow)
 * - P7: Audit trail (links in response)
 */

import { test, expect } from "@playwright/test";

test.describe("Secretary Dashboard API", () => {
  test.describe("GET /api/v1/officer/secretary/dashboard", () => {
    test("returns dashboard data structure", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");

      // Should return 200 OK (either visible or not visible)
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Must always have visible property (capability gating)
      expect(data).toHaveProperty("visible");
      expect(typeof data.visible).toBe("boolean");
    });

    test("returns required fields when visible", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      // If not visible, skip further checks
      if (!data.visible) {
        // Hidden dashboard should have minimal structure
        expect(data.visible).toBe(false);
        return;
      }

      // Verify all required sections exist
      expect(data).toHaveProperty("upcomingMeeting");
      expect(data).toHaveProperty("draftsInProgress");
      expect(data).toHaveProperty("awaitingReview");
      expect(data).toHaveProperty("readyToPublish");
      expect(data).toHaveProperty("recentlyPublished");
      expect(data).toHaveProperty("capabilities");

      // Verify arrays
      expect(Array.isArray(data.draftsInProgress)).toBe(true);
      expect(Array.isArray(data.awaitingReview)).toBe(true);
      expect(Array.isArray(data.readyToPublish)).toBe(true);
      expect(Array.isArray(data.recentlyPublished)).toBe(true);
    });

    test("capabilities object has correct structure", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      if (!data.visible) return;

      // Verify capabilities structure
      const { capabilities } = data;
      expect(capabilities).toHaveProperty("canCreateDraft");
      expect(capabilities).toHaveProperty("canEditDraft");
      expect(capabilities).toHaveProperty("canSubmit");
      expect(capabilities).toHaveProperty("canPublish");

      // All should be booleans
      expect(typeof capabilities.canCreateDraft).toBe("boolean");
      expect(typeof capabilities.canEditDraft).toBe("boolean");
      expect(typeof capabilities.canSubmit).toBe("boolean");
      expect(typeof capabilities.canPublish).toBe("boolean");
    });

    test("upcoming meeting has correct structure when present", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      if (!data.visible) return;

      // upcomingMeeting can be null
      if (data.upcomingMeeting === null) {
        expect(data.upcomingMeeting).toBeNull();
        return;
      }

      // Verify structure when present
      const meeting = data.upcomingMeeting;
      expect(meeting).toHaveProperty("id");
      expect(meeting).toHaveProperty("date");
      expect(meeting).toHaveProperty("dateFormatted");
      expect(meeting).toHaveProperty("type");
      expect(meeting).toHaveProperty("hasMinutes");

      expect(typeof meeting.id).toBe("string");
      expect(typeof meeting.date).toBe("string");
      expect(typeof meeting.dateFormatted).toBe("string");
      expect(typeof meeting.type).toBe("string");
      expect(typeof meeting.hasMinutes).toBe("boolean");
    });

    test("minutes items have correct structure", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      if (!data.visible) return;

      // Check draftsInProgress items (if any)
      for (const item of data.draftsInProgress) {
        verifyMinutesSummaryStructure(item);
      }

      // Check awaitingReview items (if any)
      for (const item of data.awaitingReview) {
        verifyMinutesSummaryStructure(item);
      }

      // Check readyToPublish items (if any)
      for (const item of data.readyToPublish) {
        verifyMinutesSummaryStructure(item);
      }

      // Check recentlyPublished items (if any)
      for (const item of data.recentlyPublished) {
        verifyMinutesSummaryStructure(item);
      }
    });

    test("draftsInProgress contains only DRAFT or REVISED status", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      if (!data.visible) return;

      for (const item of data.draftsInProgress) {
        expect(["DRAFT", "REVISED"]).toContain(item.status);
      }
    });

    test("awaitingReview contains only SUBMITTED status", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      if (!data.visible) return;

      for (const item of data.awaitingReview) {
        expect(item.status).toBe("SUBMITTED");
      }
    });

    test("readyToPublish contains only APPROVED status", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      if (!data.visible) return;

      for (const item of data.readyToPublish) {
        expect(item.status).toBe("APPROVED");
      }
    });

    test("recentlyPublished contains only PUBLISHED status", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      if (!data.visible) return;

      for (const item of data.recentlyPublished) {
        expect(item.status).toBe("PUBLISHED");
      }
    });

    test("audit trail URLs have correct format", async ({ request }) => {
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const data = await response.json();

      if (!data.visible) return;

      const allItems = [
        ...data.draftsInProgress,
        ...data.awaitingReview,
        ...data.readyToPublish,
        ...data.recentlyPublished,
      ];

      for (const item of allItems) {
        // Verify audit trail URL format
        expect(item.auditTrailUrl).toMatch(
          /^\/admin\/audit\?objectType=GovernanceMinutes&objectId=.+$/
        );
      }
    });
  });

  test.describe("Dashboard Response Performance", () => {
    test("responds within acceptable time", async ({ request }) => {
      const start = Date.now();
      const response = await request.get("/api/v1/officer/secretary/dashboard");
      const duration = Date.now() - start;

      expect(response.ok()).toBeTruthy();
      // Dashboard should respond in under 1000ms
      expect(duration).toBeLessThan(1000);
    });
  });

  test.describe("Invalid Methods", () => {
    test("POST returns 405 Method Not Allowed", async ({ request }) => {
      const response = await request.post("/api/v1/officer/secretary/dashboard");

      // Should not accept POST
      expect([405, 404].includes(response.status())).toBeTruthy();
    });

    test("PUT returns 405 Method Not Allowed", async ({ request }) => {
      const response = await request.put("/api/v1/officer/secretary/dashboard");

      expect([405, 404].includes(response.status())).toBeTruthy();
    });

    test("DELETE returns 405 Method Not Allowed", async ({ request }) => {
      const response = await request.delete("/api/v1/officer/secretary/dashboard");

      expect([405, 404].includes(response.status())).toBeTruthy();
    });
  });
});

/**
 * Helper function to verify MinutesSummary structure
 */
function verifyMinutesSummaryStructure(item: Record<string, unknown>) {
  // Required fields
  expect(item).toHaveProperty("id");
  expect(item).toHaveProperty("meetingId");
  expect(item).toHaveProperty("meetingDate");
  expect(item).toHaveProperty("meetingDateFormatted");
  expect(item).toHaveProperty("meetingType");
  expect(item).toHaveProperty("status");
  expect(item).toHaveProperty("statusLabel");
  expect(item).toHaveProperty("version");
  expect(item).toHaveProperty("updatedAt");
  expect(item).toHaveProperty("auditTrailUrl");

  // Type checks
  expect(typeof item.id).toBe("string");
  expect(typeof item.meetingId).toBe("string");
  expect(typeof item.meetingDate).toBe("string");
  expect(typeof item.meetingDateFormatted).toBe("string");
  expect(typeof item.meetingType).toBe("string");
  expect(typeof item.status).toBe("string");
  expect(typeof item.statusLabel).toBe("string");
  expect(typeof item.version).toBe("number");
  expect(typeof item.updatedAt).toBe("string");
  expect(typeof item.auditTrailUrl).toBe("string");

  // meetingTitle and lastEditedBy can be null
  expect(
    item.meetingTitle === null || typeof item.meetingTitle === "string"
  ).toBe(true);
  expect(
    item.lastEditedBy === null || typeof item.lastEditedBy === "string"
  ).toBe(true);

  // Verify status is valid
  const validStatuses = [
    "DRAFT",
    "SUBMITTED",
    "REVISED",
    "APPROVED",
    "PUBLISHED",
    "ARCHIVED",
  ];
  expect(validStatuses).toContain(item.status);
}
