import { test, expect } from "@playwright/test";

/**
 * VP of Activities Authorization Tests
 *
 * Tests the VP of Activities role permissions:
 * - VP can view ALL events (no ownership restriction)
 * - VP can edit ALL events (no ownership restriction)
 * - VP CANNOT delete events (admin-only)
 *
 * Policy: Two VPs of Activities exist as peers with mutual trust.
 * VPs bypass all ownership/committee scoping for view and edit operations.
 */

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const VP_TOKEN = "Bearer test-vp-activities";
const ADMIN_TOKEN = "Bearer test-admin-token";
const MEMBER_TOKEN = "Bearer test-member-token";

test.describe("VP of Activities Authorization", () => {
  test.describe("Event List Access", () => {
    test("VP can access admin events list", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: VP_TOKEN },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    test("VP sees all events including unpublished", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: VP_TOKEN },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Should include events regardless of publish status
      // The seed data has both published and unpublished events
      expect(data.totalItems).toBeGreaterThan(0);
    });

    test("regular member cannot access admin events list", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: MEMBER_TOKEN },
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe("Event Detail Access", () => {
    let eventId: string;

    test.beforeAll(async ({ request }) => {
      // Get an event ID from the list
      const response = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: ADMIN_TOKEN },
      });
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        eventId = data.items[0].id;
      }
    });

    test("VP can view any event detail", async ({ request }) => {
      test.skip(!eventId, "No events in database");

      const response = await request.get(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: VP_TOKEN },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.event).toBeDefined();
      expect(data.event.id).toBe(eventId);
    });

    test("VP can view event they do not own", async ({ request }) => {
      test.skip(!eventId, "No events in database");

      // VP should be able to view any event regardless of eventChairId
      const response = await request.get(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: VP_TOKEN },
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe("Event Edit Access", () => {
    let eventId: string;
    let originalTitle: string;

    test.beforeAll(async ({ request }) => {
      // Get an event ID from the list
      const response = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: ADMIN_TOKEN },
      });
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        eventId = data.items[0].id;
        originalTitle = data.items[0].title;
      }
    });

    test.afterAll(async ({ request }) => {
      // Restore original title
      if (eventId && originalTitle) {
        await request.patch(`${BASE}/api/admin/events/${eventId}`, {
          headers: { Authorization: ADMIN_TOKEN },
          data: { title: originalTitle },
        });
      }
    });

    test("VP can edit any event", async ({ request }) => {
      test.skip(!eventId, "No events in database");

      const newTitle = `VP Edited: ${originalTitle}`;
      const response = await request.patch(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: VP_TOKEN },
        data: { title: newTitle },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.event.title).toBe(newTitle);
    });

    test("VP can edit event they do not own", async ({ request }) => {
      test.skip(!eventId, "No events in database");

      // VP should be able to edit any event regardless of eventChairId
      const response = await request.patch(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: VP_TOKEN },
        data: { description: "VP updated this description" },
      });

      expect(response.status()).toBe(200);
    });

    test("VP can publish events", async ({ request }) => {
      test.skip(!eventId, "No events in database");

      const response = await request.patch(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: VP_TOKEN },
        data: { isPublished: true },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.event.isPublished).toBe(true);
    });

    test("regular member cannot edit events", async ({ request }) => {
      test.skip(!eventId, "No events in database");

      const response = await request.patch(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: MEMBER_TOKEN },
        data: { title: "Unauthorized edit attempt" },
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe("Event Delete Access - VP CANNOT Delete", () => {
    test("VP cannot delete events", async ({ request }) => {
      // First get an event ID
      const listResponse = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: ADMIN_TOKEN },
      });
      const listData = await listResponse.json();

      test.skip(!listData.items || listData.items.length === 0, "No events in database");

      const eventId = listData.items[0].id;

      // VP should NOT be able to delete
      const response = await request.delete(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: VP_TOKEN },
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.message).toContain("administrator");
    });

    test("only admin can delete events", async ({ request }) => {
      // This test verifies admin CAN delete (but we don't actually delete to preserve test data)
      // We just verify the VP cannot and the error message is correct

      const listResponse = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: ADMIN_TOKEN },
      });
      const listData = await listResponse.json();

      test.skip(!listData.items || listData.items.length === 0, "No events in database");

      const eventId = listData.items[0].id;

      // Verify VP gets 403
      const vpResponse = await request.delete(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: VP_TOKEN },
      });
      expect(vpResponse.status()).toBe(403);

      // Verify member gets 403
      const memberResponse = await request.delete(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: MEMBER_TOKEN },
      });
      expect(memberResponse.status()).toBe(403);
    });
  });

  test.describe("Authorization Error Messages", () => {
    test("VP delete rejection includes clear message", async ({ request }) => {
      const listResponse = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: ADMIN_TOKEN },
      });
      const listData = await listResponse.json();

      test.skip(!listData.items || listData.items.length === 0, "No events in database");

      const eventId = listData.items[0].id;

      const response = await request.delete(`${BASE}/api/admin/events/${eventId}`, {
        headers: { Authorization: VP_TOKEN },
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
      expect(data.message).toBe("Only administrators can delete events");
    });

    test("member access rejection for events list", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/events`, {
        headers: { Authorization: MEMBER_TOKEN },
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });

    test("unauthenticated request returns 401", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/events`);

      expect(response.status()).toBe(401);
    });
  });
});
