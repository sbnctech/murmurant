/**
 * Admin Demo API Tests
 *
 * Tests for the demo dashboard API endpoints:
 * - GET /api/admin/demo/status
 * - GET /api/admin/demo/work-queue
 * - GET /api/admin/demo/lifecycle-members
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, least privilege
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

// =============================================================================
// GET /api/admin/demo/status - System Status
// =============================================================================

test.describe("GET /api/admin/demo/status", () => {
  test("returns 401 without auth", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/status`);
    expect(response.status()).toBe(401);
  });

  test("returns 403 for member role", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/status`, {
      headers: { Authorization: "Bearer test-member-token" },
    });
    expect(response.status()).toBe(403);
  });

  test("returns system status for admin", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/status`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify structure
    expect(data.timestamp).toBeDefined();
    expect(data.database).toBeDefined();
    expect(data.email).toBeDefined();
    expect(data.environment).toBeDefined();

    // Verify database section
    expect(data.database.status).toBe("connected");
    expect(typeof data.database.latencyMs).toBe("number");
    expect(typeof data.database.memberCount).toBe("number");
    expect(typeof data.database.eventCount).toBe("number");

    // Verify email section
    expect(typeof data.email.enabled).toBe("boolean");
    expect(typeof data.email.provider).toBe("string");

    // Verify environment section
    expect(typeof data.environment.nodeEnv).toBe("string");
    expect(typeof data.environment.isProduction).toBe("boolean");
    expect(typeof data.environment.passkeyConfigured).toBe("boolean");
  });
});

// =============================================================================
// GET /api/admin/demo/work-queue - Work Queue
// =============================================================================

test.describe("GET /api/admin/demo/work-queue", () => {
  test("returns 401 without auth", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/work-queue`);
    expect(response.status()).toBe(401);
  });

  test("returns 403 for member role", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/work-queue`, {
      headers: { Authorization: "Bearer test-member-token" },
    });
    expect(response.status()).toBe(403);
  });

  test("returns work queue for admin", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/work-queue`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify structure
    expect(data.timestamp).toBeDefined();
    expect(Array.isArray(data.upcomingEvents)).toBe(true);
    expect(Array.isArray(data.recentRegistrations)).toBe(true);
    expect(data.pendingGovernance).toBeDefined();

    // Verify pendingGovernance structure
    expect(Array.isArray(data.pendingGovernance.openFlags)).toBe(true);
    expect(Array.isArray(data.pendingGovernance.draftMinutes)).toBe(true);
    expect(Array.isArray(data.pendingGovernance.recentMotions)).toBe(true);
  });

  test("returns properly structured event data", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/work-queue`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // If there are events, verify their structure
    if (data.upcomingEvents.length > 0) {
      const event = data.upcomingEvents[0];
      expect(event.id).toBeDefined();
      expect(event.title).toBeDefined();
      expect(event.category).toBeDefined();
      expect(event.startTime).toBeDefined();
      expect(typeof event.isPublished).toBe("boolean");
      expect(typeof event.registrationCount).toBe("number");
    }
  });

  test("returns properly structured registration data", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/work-queue`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // If there are registrations, verify their structure
    if (data.recentRegistrations.length > 0) {
      const reg = data.recentRegistrations[0];
      expect(reg.id).toBeDefined();
      expect(reg.memberName).toBeDefined();
      expect(reg.eventId).toBeDefined();
      expect(reg.eventTitle).toBeDefined();
      expect(reg.status).toBeDefined();
      expect(reg.registeredAt).toBeDefined();
    }
  });
});

// =============================================================================
// GET /api/admin/demo/lifecycle-members - Lifecycle Demo Members
// =============================================================================

/**
 * Expected demo member emails in order.
 */
const EXPECTED_DEMO_EMAILS = [
  "demo.pending@sbnc.example",
  "demo.newbie@sbnc.example",
  "demo.member@sbnc.example",
  "demo.offer_extended@sbnc.example",
  "demo.extended@sbnc.example",
  "demo.lapsed@sbnc.example",
  "demo.suspended@sbnc.example",
  "demo.unknown@sbnc.example",
];

/**
 * Expected lifecycle states for each demo member.
 */
const EXPECTED_LIFECYCLE_STATES: Record<string, string> = {
  "demo.pending@sbnc.example": "pending_new",
  "demo.newbie@sbnc.example": "active_newbie",
  "demo.member@sbnc.example": "active_member",
  "demo.offer_extended@sbnc.example": "offer_extended",
  "demo.extended@sbnc.example": "active_extended",
  "demo.lapsed@sbnc.example": "lapsed",
  "demo.suspended@sbnc.example": "suspended",
  "demo.unknown@sbnc.example": "unknown",
};

test.describe("GET /api/admin/demo/lifecycle-members", () => {
  test("returns 401 without auth", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`);
    expect(response.status()).toBe(401);
  });

  test("returns 403 for member role", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
      headers: { Authorization: "Bearer test-member-token" },
    });
    expect(response.status()).toBe(403);
  });

  test("returns lifecycle members for admin", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify structure
    expect(data.timestamp).toBeDefined();
    expect(Array.isArray(data.members)).toBe(true);
  });

  test("returns properly structured member data", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // If there are members, verify their structure
    if (data.members.length > 0) {
      const member = data.members[0];
      expect(member.id).toBeDefined();
      expect(member.name).toBeDefined();
      expect(member.email).toBeDefined();
      expect(member.status).toBeDefined();
      expect(member.statusLabel).toBeDefined();
      expect(member.joinedAt).toBeDefined();
      expect(typeof member.daysSinceJoin).toBe("number");
      expect(member.expectedLifecycleState).toBeDefined();
      expect(member.stateLabel).toBeDefined();
      expect(member.description).toBeDefined();
    }
  });

  test("returns demo members in expected order", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Skip if no demo members seeded
    if (data.members.length === 0) {
      test.skip();
      return;
    }

    // Get actual emails in order
    const actualEmails = data.members.map((m: { email: string }) => m.email);

    // Verify order matches expected (only for members that exist)
    const existingExpected = EXPECTED_DEMO_EMAILS.filter((e) => actualEmails.includes(e));
    const matchingActual = actualEmails.filter((e: string) => EXPECTED_DEMO_EMAILS.includes(e));

    expect(matchingActual).toEqual(existingExpected);
  });

  test("lifecycle state matches inference for each fixture", async ({ request }) => {
    const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
      headers: ADMIN_HEADERS,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Skip if no demo members seeded
    if (data.members.length === 0) {
      test.skip();
      return;
    }

    // Verify each member's lifecycle state matches expected
    for (const member of data.members) {
      const expected = EXPECTED_LIFECYCLE_STATES[member.email];
      if (expected) {
        expect(member.expectedLifecycleState).toBe(expected);
      }
    }
  });
});
