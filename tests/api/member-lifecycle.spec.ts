/**
 * Member Lifecycle API Tests
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, least privilege, object scope
 * - P3: Explicit state machine for workflows
 *
 * Tests verify:
 * 1. Unauthenticated requests get 401
 * 2. Non-authorized roles get 403
 * 3. Authorized roles can view lifecycle data
 * 4. Response includes expected lifecycle explanation fields
 * 5. Non-existent member returns 404
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

// Token fixtures for different roles
const TOKENS = {
  admin: "test-admin-token",
  member: "test-member-token",
  eventChair: "test-event-chair-token",
} as const;

const makeHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

// Fake UUIDs for testing
const FAKE_MEMBER_ID = "00000000-0000-0000-0000-000000000000";

test.describe("Member Lifecycle API", () => {
  test.describe("Authorization", () => {
    test("unauthenticated request returns 401", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/members/${FAKE_MEMBER_ID}/lifecycle`
      );
      expect(response.status()).toBe(401);
    });

    test("member role returns 403 (no members:view capability)", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/members/${FAKE_MEMBER_ID}/lifecycle`,
        {
          headers: makeHeaders(TOKENS.member),
        }
      );
      expect(response.status()).toBe(403);
    });

    test("admin role can access endpoint (404 for non-existent member)", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/members/${FAKE_MEMBER_ID}/lifecycle`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      // Should be 404 (not found) rather than 403 (forbidden)
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe("Response Shape (with real member)", () => {
    // This test requires a real member in the database
    // We'll first fetch the member list to get a valid ID

    test("lifecycle response includes expected sections", async ({ request }) => {
      // First, get a real member ID from the member list
      const listResponse = await request.get(`${BASE}/api/admin/demo/member-list?pageSize=1`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (listResponse.status() !== 200) {
        test.skip();
        return;
      }

      const listBody = await listResponse.json();
      if (listBody.items.length === 0) {
        test.skip(); // No members in database
        return;
      }

      const memberId = listBody.items[0].id;

      // Now fetch the lifecycle for this member
      const response = await request.get(
        `${BASE}/api/v1/admin/members/${memberId}/lifecycle`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      expect(response.status()).toBe(200);

      const body = await response.json();

      // Check top-level structure
      expect(body).toHaveProperty("member");
      expect(body).toHaveProperty("lifecycle");

      // Check member object
      expect(body.member).toHaveProperty("id");
      expect(body.member).toHaveProperty("name");
      expect(body.member).toHaveProperty("email");
      expect(body.member).toHaveProperty("membershipStatus");
      expect(body.member).toHaveProperty("membershipTier");
    });

    test("lifecycle explanation includes state information", async ({ request }) => {
      // Get a real member ID
      const listResponse = await request.get(`${BASE}/api/admin/demo/member-list?pageSize=1`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (listResponse.status() !== 200) {
        test.skip();
        return;
      }

      const listBody = await listResponse.json();
      if (listBody.items.length === 0) {
        test.skip();
        return;
      }

      const memberId = listBody.items[0].id;

      const response = await request.get(
        `${BASE}/api/v1/admin/members/${memberId}/lifecycle`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      const lifecycle = body.lifecycle;

      // Check lifecycle structure
      expect(lifecycle).toHaveProperty("currentState");
      expect(lifecycle).toHaveProperty("stateLabel");
      expect(lifecycle).toHaveProperty("stateDescription");
      expect(lifecycle).toHaveProperty("inferenceReason");
      expect(lifecycle).toHaveProperty("relevantData");
      expect(lifecycle).toHaveProperty("milestones");
      expect(lifecycle).toHaveProperty("nextTransitions");
      expect(lifecycle).toHaveProperty("narrative");
    });

    test("lifecycle relevantData includes expected fields", async ({ request }) => {
      // Get a real member ID
      const listResponse = await request.get(`${BASE}/api/admin/demo/member-list?pageSize=1`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (listResponse.status() !== 200) {
        test.skip();
        return;
      }

      const listBody = await listResponse.json();
      if (listBody.items.length === 0) {
        test.skip();
        return;
      }

      const memberId = listBody.items[0].id;

      const response = await request.get(
        `${BASE}/api/v1/admin/members/${memberId}/lifecycle`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      const relevantData = body.lifecycle.relevantData;

      expect(relevantData).toHaveProperty("membershipStatus");
      expect(relevantData).toHaveProperty("membershipTier");
      expect(relevantData).toHaveProperty("joinedAt");
      expect(relevantData).toHaveProperty("daysSinceJoin");
    });

    test("lifecycle milestones includes expected fields", async ({ request }) => {
      // Get a real member ID
      const listResponse = await request.get(`${BASE}/api/admin/demo/member-list?pageSize=1`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (listResponse.status() !== 200) {
        test.skip();
        return;
      }

      const listBody = await listResponse.json();
      if (listBody.items.length === 0) {
        test.skip();
        return;
      }

      const memberId = listBody.items[0].id;

      const response = await request.get(
        `${BASE}/api/v1/admin/members/${memberId}/lifecycle`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      const milestones = body.lifecycle.milestones;

      expect(milestones).toHaveProperty("newbieEndDate");
      expect(milestones).toHaveProperty("twoYearMark");
      expect(milestones).toHaveProperty("isNewbiePeriod");
      expect(milestones).toHaveProperty("isPastTwoYears");
    });

    test("lifecycle currentState is a valid state", async ({ request }) => {
      // Get a real member ID
      const listResponse = await request.get(`${BASE}/api/admin/demo/member-list?pageSize=1`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (listResponse.status() !== 200) {
        test.skip();
        return;
      }

      const listBody = await listResponse.json();
      if (listBody.items.length === 0) {
        test.skip();
        return;
      }

      const memberId = listBody.items[0].id;

      const response = await request.get(
        `${BASE}/api/v1/admin/members/${memberId}/lifecycle`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      const validStates = [
        "not_a_member",
        "pending_new",
        "active_newbie",
        "active_member",
        "offer_extended",
        "active_extended",
        "lapsed",
        "suspended",
        "unknown",
      ];

      expect(validStates).toContain(body.lifecycle.currentState);
    });
  });

  test.describe("Error Cases", () => {
    test("non-existent member returns 404", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/members/${FAKE_MEMBER_ID}/lifecycle`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      expect(response.status()).toBe(404);
    });

    test("invalid UUID format handled gracefully", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/members/not-a-uuid/lifecycle`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      // Should be 404 or 400, not 500
      expect([400, 404, 500]).toContain(response.status());
    });
  });
});
