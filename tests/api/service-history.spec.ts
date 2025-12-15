import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };
const WEBMASTER_HEADERS = { Authorization: "Bearer test-webmaster-token" };

// @quarantine - requires dev server running
test.describe("@quarantine Service History API", () => {
  test.describe("GET /api/v1/admin/service-history", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/service-history`);
      expect(response.status()).toBe(401);
    });

    test("returns 200 and paginated response for admin", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/service-history`, {
        headers: ADMIN_HEADERS,
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.page).toBe("number");
      expect(typeof data.limit).toBe("number");
      expect(typeof data.totalItems).toBe("number");
      expect(typeof data.totalPages).toBe("number");
      expect(typeof data.hasNext).toBe("boolean");
      expect(typeof data.hasPrev).toBe("boolean");
    });

    test("webmaster can view service history (members:view)", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/service-history`, {
        headers: WEBMASTER_HEADERS,
      });

      expect(response.status()).toBe(200);
    });

    test("respects pagination parameters", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history?page=1&limit=5`,
        { headers: ADMIN_HEADERS }
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
    });

    test("filters by serviceType", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history?serviceType=BOARD_OFFICER`,
        { headers: ADMIN_HEADERS }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      for (const item of data.items) {
        expect(item.serviceType).toBe("BOARD_OFFICER");
      }
    });

    test("filters by activeOnly", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history?activeOnly=true`,
        { headers: ADMIN_HEADERS }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      for (const item of data.items) {
        expect(item.isActive).toBe(true);
        expect(item.endAt).toBeNull();
      }
    });
  });

  test.describe("POST /api/v1/admin/service-history", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/admin/service-history`, {
        data: {},
      });
      expect(response.status()).toBe(401);
    });

    test("returns 403 for webmaster (requires users:manage)", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/admin/service-history`, {
        headers: WEBMASTER_HEADERS,
        data: {
          memberId: "00000000-0000-0000-0000-000000000001",
          serviceType: "BOARD_OFFICER",
          roleTitle: "Test Role",
          startAt: new Date().toISOString(),
        },
      });

      expect(response.status()).toBe(403);
    });

    test("returns 400 for invalid input", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/admin/service-history`, {
        headers: ADMIN_HEADERS,
        data: {
          // Missing required fields
          serviceType: "INVALID_TYPE",
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe("PATCH /api/v1/admin/service-history/:id/close", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.patch(
        `${BASE}/api/v1/admin/service-history/00000000-0000-0000-0000-000000000001/close`,
        { data: { endAt: new Date().toISOString() } }
      );
      expect(response.status()).toBe(401);
    });

    test("returns 403 for webmaster", async ({ request }) => {
      const response = await request.patch(
        `${BASE}/api/v1/admin/service-history/00000000-0000-0000-0000-000000000001/close`,
        {
          headers: WEBMASTER_HEADERS,
          data: { endAt: new Date().toISOString() },
        }
      );
      expect(response.status()).toBe(403);
    });

    test("returns 404 for non-existent record", async ({ request }) => {
      const response = await request.patch(
        `${BASE}/api/v1/admin/service-history/00000000-0000-0000-0000-000000000099/close`,
        {
          headers: ADMIN_HEADERS,
          data: { endAt: new Date().toISOString() },
        }
      );
      expect(response.status()).toBe(404);
    });
  });
});

// @quarantine - requires dev server running
test.describe("@quarantine Member Service History API", () => {
  test.describe("GET /api/v1/admin/members/:id/service-history", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/members/00000000-0000-0000-0000-000000000001/service-history`
      );
      expect(response.status()).toBe(401);
    });

    test("returns 404 for non-existent member", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/members/00000000-0000-0000-0000-000000000099/service-history`,
        { headers: ADMIN_HEADERS }
      );
      expect(response.status()).toBe(404);
    });
  });
});
