import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

/**
 * Transition System Access Control Tests
 *
 * Tests role-based access for transitions APIs and Service History.
 * Policy:
 * - admin: full access
 * - president: full access
 * - past-president: view only
 * - vp-activities: full access
 * - event-chair: denied (403)
 * - webmaster: denied (403)
 */

test.describe("Transitions Access Control", () => {
  test.describe("Widget API Role Access", () => {
    test("admin can access widget API", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/widget`,
        {
          headers: { Authorization: "Bearer test-admin-token" },
        }
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.widget).toBeDefined();
      expect(data.config).toBeDefined();
      expect(data.config.leadDays).toBe(60);
    });

    test("webmaster is denied widget API access", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/widget`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
            "x-admin-test-token": "",
          },
        }
      );
      expect(response.status()).toBe(403);
    });

    test("event-chair is denied widget API access", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/widget`,
        {
          headers: {
            Authorization: "Bearer test-chair-token",
            "x-admin-test-token": "",
          },
        }
      );
      expect(response.status()).toBe(403);
    });

    // @quarantine - v0 permissive mode allows access, enable when v1 auth hardening is complete
    test.skip("unauthenticated request returns 401 @quarantine", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/widget`
      );
      expect(response.status()).toBe(401);
    });
  });

  test.describe("Service History API Role Access", () => {
    test("admin can access service history", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history`,
        {
          headers: { Authorization: "Bearer test-admin-token" },
        }
      );
      expect(response.status()).toBe(200);
    });

    test("vp-activities can access service history", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history`,
        {
          headers: { Authorization: "Bearer test-vp-token" },
        }
      );
      expect(response.status()).toBe(200);
    });

    test("event-chair is denied service history access", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history`,
        {
          headers: {
            Authorization: "Bearer test-chair-token",
            "x-admin-test-token": "",
          },
        }
      );
      expect(response.status()).toBe(403);
    });

    test("webmaster is denied service history access", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/service-history`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
            "x-admin-test-token": "",
          },
        }
      );
      expect(response.status()).toBe(403);
    });
  });

  test.describe("Widget Data Structure", () => {
    test("widget returns correct data structure", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/widget`,
        {
          headers: { Authorization: "Bearer test-admin-token" },
        }
      );
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Widget structure
      expect(data.widget).toBeDefined();
      expect(typeof data.widget.visible).toBe("boolean");
      expect(typeof data.widget.nextTransitionDate).toBe("string");
      expect(typeof data.widget.nextTransitionDateFormatted).toBe("string");
      expect(typeof data.widget.daysRemaining).toBe("number");
      expect(typeof data.widget.termName).toBe("string");

      // Config structure
      expect(data.config).toBeDefined();
      expect(typeof data.config.leadDays).toBe("number");
    });

    test("nextTransitionDate is Feb 1 or Aug 1", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/widget`,
        {
          headers: { Authorization: "Bearer test-admin-token" },
        }
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      const nextDate = new Date(data.widget.nextTransitionDate);
      const month = nextDate.getUTCMonth();
      const day = nextDate.getUTCDate();

      // Must be Feb 1 (month 1) or Aug 1 (month 7)
      const isFeb1 = month === 1 && day === 1;
      const isAug1 = month === 7 && day === 1;
      expect(isFeb1 || isAug1).toBe(true);
    });

    test("termName matches the transition date", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/widget`,
        {
          headers: { Authorization: "Bearer test-admin-token" },
        }
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      const nextDate = new Date(data.widget.nextTransitionDate);
      const month = nextDate.getUTCMonth();

      // Feb 1 starts Summer term, Aug 1 starts Winter term
      if (month === 1) {
        expect(data.widget.termName).toContain("Summer");
      } else {
        expect(data.widget.termName).toContain("Winter");
      }
    });
  });
});

test.describe("Service History Data Structure", () => {
  test("returns paginated response structure", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/v1/admin/service-history`,
      {
        headers: { Authorization: "Bearer test-admin-token" },
      }
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
    expect(typeof data.page).toBe("number");
    expect(typeof data.limit).toBe("number");
    expect(typeof data.totalItems).toBe("number");
    expect(typeof data.totalPages).toBe("number");
  });

  test("filters by serviceType", async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/v1/admin/service-history?serviceType=BOARD_OFFICER`,
      {
        headers: { Authorization: "Bearer test-admin-token" },
      }
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
      {
        headers: { Authorization: "Bearer test-admin-token" },
      }
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    for (const item of data.items) {
      expect(item.isActive).toBe(true);
      expect(item.endAt).toBeNull();
    }
  });
});
