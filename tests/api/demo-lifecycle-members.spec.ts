/**
 * Demo Lifecycle Members API Tests
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, least privilege, object scope
 * - P3: Explicit state machine for workflows
 *
 * Tests verify:
 * 1. Unauthenticated requests get 401
 * 2. Non-authorized roles get 403
 * 3. Authorized admins can view lifecycle demo members
 * 4. Response includes expected fields with correct lifecycle states
 * 5. Lifecycle state computation matches inferLifecycleState()
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

// Valid lifecycle states from the state machine
const VALID_LIFECYCLE_STATES = [
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

// Expected demo member emails and their states
const EXPECTED_DEMO_MEMBERS = [
  { email: "demo.pending@sbnc.example", expectedState: "pending_new" },
  { email: "demo.newbie@sbnc.example", expectedState: "active_newbie" },
  { email: "demo.member@sbnc.example", expectedState: "active_member" },
  { email: "demo.offer_extended@sbnc.example", expectedState: "offer_extended" },
  { email: "demo.extended@sbnc.example", expectedState: "active_extended" },
  { email: "demo.lapsed@sbnc.example", expectedState: "lapsed" },
  { email: "demo.suspended@sbnc.example", expectedState: "suspended" },
  { email: "demo.unknown@sbnc.example", expectedState: "unknown" },
];

test.describe("Demo Lifecycle Members API", () => {
  test.describe("Authorization", () => {
    test("unauthenticated request returns 401", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`);
      expect(response.status()).toBe(401);
    });

    test("member role returns 403 (no admin:full capability)", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.member),
      });
      expect(response.status()).toBe(403);
    });

    test("event chair role returns 403 (no admin:full capability)", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.eventChair),
      });
      expect(response.status()).toBe(403);
    });

    test("admin role can access endpoint", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Response Shape", () => {
    test("response includes members array and timestamp", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("members");
      expect(body).toHaveProperty("timestamp");
      expect(Array.isArray(body.members)).toBe(true);
    });

    test("each member has required fields", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      if (body.members.length === 0) {
        test.skip(); // No demo members seeded
        return;
      }

      const member = body.members[0];

      // Check all required fields
      expect(member).toHaveProperty("id");
      expect(member).toHaveProperty("name");
      expect(member).toHaveProperty("email");
      expect(member).toHaveProperty("status");
      expect(member).toHaveProperty("statusLabel");
      expect(member).toHaveProperty("tier");
      expect(member).toHaveProperty("tierName");
      expect(member).toHaveProperty("joinedAt");
      expect(member).toHaveProperty("daysSinceJoin");
      expect(member).toHaveProperty("expectedLifecycleState");
      expect(member).toHaveProperty("stateLabel");
      expect(member).toHaveProperty("description");
    });

    test("lifecycle states are valid", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      if (body.members.length === 0) {
        test.skip();
        return;
      }

      for (const member of body.members) {
        expect(VALID_LIFECYCLE_STATES).toContain(member.expectedLifecycleState);
      }
    });
  });

  test.describe("Demo Member Lifecycle Verification", () => {
    // These tests verify that seeded demo members have correct lifecycle states
    // They will skip if demo members aren't seeded

    test("demo members return expected lifecycle states", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      if (body.members.length === 0) {
        test.skip(); // Demo members not seeded
        return;
      }

      // Create lookup by email
      const membersByEmail = new Map(body.members.map((m: { email: string }) => [m.email, m]));

      // Check each expected demo member
      for (const expected of EXPECTED_DEMO_MEMBERS) {
        const member = membersByEmail.get(expected.email) as { expectedLifecycleState: string } | undefined;
        if (member) {
          expect(member.expectedLifecycleState).toBe(expected.expectedState);
        }
      }
    });

    test("active_newbie member has daysSinceJoin < 90", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      const newbieMember = body.members.find(
        (m: { email: string }) => m.email === "demo.newbie@sbnc.example"
      ) as { daysSinceJoin: number; expectedLifecycleState: string } | undefined;

      if (!newbieMember) {
        test.skip(); // Demo newbie not seeded
        return;
      }

      // Newbie should have daysSinceJoin < 90 and be active_newbie
      expect(newbieMember.daysSinceJoin).toBeLessThan(90);
      expect(newbieMember.expectedLifecycleState).toBe("active_newbie");
    });

    test("offer_extended member has daysSinceJoin >= 730", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      const offerMember = body.members.find(
        (m: { email: string }) => m.email === "demo.offer_extended@sbnc.example"
      ) as { daysSinceJoin: number; expectedLifecycleState: string } | undefined;

      if (!offerMember) {
        test.skip(); // Demo offer member not seeded
        return;
      }

      // Offer member should have daysSinceJoin >= 730 (2 years)
      expect(offerMember.daysSinceJoin).toBeGreaterThanOrEqual(730);
      expect(offerMember.expectedLifecycleState).toBe("offer_extended");
    });

    test("active_member member has 90 <= daysSinceJoin < 730", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      const regularMember = body.members.find(
        (m: { email: string }) => m.email === "demo.member@sbnc.example"
      ) as { daysSinceJoin: number; expectedLifecycleState: string } | undefined;

      if (!regularMember) {
        test.skip(); // Demo regular member not seeded
        return;
      }

      // Regular member should have 90 <= daysSinceJoin < 730
      expect(regularMember.daysSinceJoin).toBeGreaterThanOrEqual(90);
      expect(regularMember.daysSinceJoin).toBeLessThan(730);
      expect(regularMember.expectedLifecycleState).toBe("active_member");
    });

    test("suspended member has suspended status regardless of time", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      const suspendedMember = body.members.find(
        (m: { email: string }) => m.email === "demo.suspended@sbnc.example"
      ) as { status: string; expectedLifecycleState: string } | undefined;

      if (!suspendedMember) {
        test.skip(); // Demo suspended member not seeded
        return;
      }

      // Suspended member should have suspended status
      expect(suspendedMember.status).toBe("suspended");
      expect(suspendedMember.expectedLifecycleState).toBe("suspended");
    });

    test("lapsed member has lapsed status", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      const lapsedMember = body.members.find(
        (m: { email: string }) => m.email === "demo.lapsed@sbnc.example"
      ) as { status: string; expectedLifecycleState: string } | undefined;

      if (!lapsedMember) {
        test.skip(); // Demo lapsed member not seeded
        return;
      }

      // Lapsed member should have lapsed status
      expect(lapsedMember.status).toBe("lapsed");
      expect(lapsedMember.expectedLifecycleState).toBe("lapsed");
    });
  });

  test.describe("Ordering", () => {
    test("demo members are returned in expected order", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/lifecycle-members`, {
        headers: makeHeaders(TOKENS.admin),
      });

      if (response.status() !== 200) {
        test.skip();
        return;
      }

      const body = await response.json();
      if (body.members.length < 8) {
        test.skip(); // Not all demo members seeded
        return;
      }

      const emails = body.members.map((m: { email: string }) => m.email);
      const expectedOrder = EXPECTED_DEMO_MEMBERS.map((m) => m.email);

      // Check that demo members are in expected order
      let lastFoundIndex = -1;
      for (const expectedEmail of expectedOrder) {
        const currentIndex = emails.indexOf(expectedEmail);
        if (currentIndex !== -1) {
          expect(currentIndex).toBeGreaterThan(lastFoundIndex);
          lastFoundIndex = currentIndex;
        }
      }
    });
  });
});
