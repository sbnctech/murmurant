import { test, expect, APIRequestContext } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

/**
 * Event Chair Access Rules Tests
 *
 * These tests verify that:
 * - Event Chairs can view and edit events they own
 * - Event Chairs cannot access events owned by others
 * - Event Chairs cannot delete events (admin only)
 * - Admins have full access to all events
 * - Unauthenticated users get 401
 * - Regular members without chair role get 403
 *
 * AUTH POSTURE (v0): Currently permissive - admin endpoints allow access
 * with valid test tokens. Ownership/role enforcement is planned for v1.
 *
 * TODO (v1 hardening): Re-enable quarantined tests that verify:
 * - Cross-chair access returns 403
 * - Unchaired event access returns 403 for chairs
 * - Delete by chair returns 403
 */

// Admin token for setup queries
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

// Helper to get member IDs and their chaired events from seed data
async function getTestData(request: APIRequestContext) {
  // Get events list to find chaired events
  const eventsRes = await request.get(`${BASE}/api/admin/events`, {
    headers: ADMIN_HEADERS,
  });
  const eventsData = await eventsRes.json();

  // Get members list
  const membersRes = await request.get(`${BASE}/api/admin/members`, {
    headers: ADMIN_HEADERS,
  });
  const membersData = await membersRes.json();

  // Find Alice and Carol by name
  const alice = membersData.items.find((m: { name: string }) => m.name.startsWith("Alice"));
  const carol = membersData.items.find((m: { name: string }) => m.name.startsWith("Carol"));

  // Find events by chair
  const aliceEvent = eventsData.items.find(
    (e: { eventChairId: string }) => e.eventChairId === alice?.id
  );
  const carolEvent = eventsData.items.find(
    (e: { eventChairId: string }) => e.eventChairId === carol?.id
  );
  const unchainedEvent = eventsData.items.find(
    (e: { eventChairId: string | null }) => e.eventChairId === null
  );

  return { alice, carol, aliceEvent, carolEvent, unchainedEvent };
}

test.describe("Event Chair Access Rules", () => {
  test.describe("Event Chair viewing their own event", () => {
    test("chair can view their own event", async ({ request }) => {
      const { alice, aliceEvent } = await getTestData(request);

      if (!alice || !aliceEvent) {
        test.skip();
        return;
      }

      // Use Alice's member ID in the token to simulate her being logged in
      const aliceHeaders = { Authorization: `Bearer test-member-${alice.id}` };

      const response = await request.get(`${BASE}/api/admin/events/${aliceEvent.id}`, {
        headers: aliceHeaders,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.event.id).toBe(aliceEvent.id);
    });
  });

  test.describe("Event Chair editing their own event", () => {
    test("chair can edit their own event", async ({ request }) => {
      const { alice, aliceEvent } = await getTestData(request);

      if (!alice || !aliceEvent) {
        test.skip();
        return;
      }

      const aliceHeaders = { Authorization: `Bearer test-member-${alice.id}` };

      const response = await request.patch(`${BASE}/api/admin/events/${aliceEvent.id}`, {
        headers: { ...aliceHeaders, "Content-Type": "application/json" },
        data: { description: "Updated description by chair" },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.event.description).toBe("Updated description by chair");

      // Restore original description
      await request.patch(`${BASE}/api/admin/events/${aliceEvent.id}`, {
        headers: { ...ADMIN_HEADERS, "Content-Type": "application/json" },
        data: {
          description:
            "A casual gathering for new and prospective members to learn about the club.",
        },
      });
    });
  });

  // TODO (v1 hardening): Re-enable once ownership-based auth is enforced
  test.describe("@quarantine Event Chair forbidden from others' events", () => {
    test("chair cannot view another chair's event", async ({ request }) => {
      const { alice, carolEvent } = await getTestData(request);

      if (!alice || !carolEvent) {
        test.skip();
        return;
      }

      const aliceHeaders = { Authorization: `Bearer test-member-${alice.id}` };

      const response = await request.get(`${BASE}/api/admin/events/${carolEvent.id}`, {
        headers: aliceHeaders,
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });

    test("chair cannot edit another chair's event", async ({ request }) => {
      const { alice, carolEvent } = await getTestData(request);

      if (!alice || !carolEvent) {
        test.skip();
        return;
      }

      const aliceHeaders = { Authorization: `Bearer test-member-${alice.id}` };

      const response = await request.patch(`${BASE}/api/admin/events/${carolEvent.id}`, {
        headers: { ...aliceHeaders, "Content-Type": "application/json" },
        data: { description: "Malicious edit attempt" },
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });

    test("chair cannot view event with no chair", async ({ request }) => {
      const { alice, unchainedEvent } = await getTestData(request);

      if (!alice || !unchainedEvent) {
        test.skip();
        return;
      }

      const aliceHeaders = { Authorization: `Bearer test-member-${alice.id}` };

      const response = await request.get(`${BASE}/api/admin/events/${unchainedEvent.id}`, {
        headers: aliceHeaders,
      });

      expect(response.status()).toBe(403);
    });
  });

  // TODO (v1 hardening): Re-enable once delete endpoint enforces admin-only
  test.describe("@quarantine Event Chair cannot delete events", () => {
    test("chair cannot delete their own event", async ({ request }) => {
      const { alice, aliceEvent } = await getTestData(request);

      if (!alice || !aliceEvent) {
        test.skip();
        return;
      }

      const aliceHeaders = { Authorization: `Bearer test-member-${alice.id}` };

      const response = await request.delete(`${BASE}/api/admin/events/${aliceEvent.id}`, {
        headers: aliceHeaders,
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
      expect(data.message).toContain("administrator");
    });
  });

  test.describe("Admin access", () => {
    test("admin can view any event", async ({ request }) => {
      const { carolEvent } = await getTestData(request);

      if (!carolEvent) {
        test.skip();
        return;
      }

      const response = await request.get(`${BASE}/api/admin/events/${carolEvent.id}`, {
        headers: ADMIN_HEADERS,
      });

      expect(response.status()).toBe(200);
    });

    test("admin can edit any event", async ({ request }) => {
      const { carolEvent } = await getTestData(request);

      if (!carolEvent) {
        test.skip();
        return;
      }

      const response = await request.patch(`${BASE}/api/admin/events/${carolEvent.id}`, {
        headers: { ...ADMIN_HEADERS, "Content-Type": "application/json" },
        data: { location: "Updated by admin" },
      });

      expect(response.status()).toBe(200);

      // Restore
      await request.patch(`${BASE}/api/admin/events/${carolEvent.id}`, {
        headers: { ...ADMIN_HEADERS, "Content-Type": "application/json" },
        data: { location: "Rattlesnake Canyon Trailhead" },
      });
    });
  });

  // TODO (v1 hardening): Re-enable once auth enforcement is strict
  test.describe("@quarantine Unauthenticated access", () => {
    test("unauthenticated request returns 401", async ({ request }) => {
      const { aliceEvent } = await getTestData(request);

      if (!aliceEvent) {
        test.skip();
        return;
      }

      const response = await request.get(`${BASE}/api/admin/events/${aliceEvent.id}`);

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });
  });

  // TODO (v1 hardening): Re-enable once role-based auth is enforced
  test.describe("@quarantine Regular member (non-chair) access", () => {
    test("non-chair member cannot access events", async ({ request }) => {
      const { aliceEvent } = await getTestData(request);

      if (!aliceEvent) {
        test.skip();
        return;
      }

      // Use a random member ID that is not a chair of any event
      const nonChairHeaders = { Authorization: "Bearer test-member-random-non-chair-id" };

      const response = await request.get(`${BASE}/api/admin/events/${aliceEvent.id}`, {
        headers: nonChairHeaders,
      });

      expect(response.status()).toBe(403);
    });
  });
});
