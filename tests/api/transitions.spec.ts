import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };
const WEBMASTER_HEADERS = { Authorization: "Bearer test-webmaster-token" };

// @quarantine - requires dev server running
test.describe("@quarantine Transitions API", () => {
  test.describe("GET /api/v1/admin/transitions", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions`);
      expect(response.status()).toBe(401);
    });

    test("returns 200 and paginated response for admin", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions`, {
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
    });

    test("webmaster can view transitions (members:view)", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions`, {
        headers: WEBMASTER_HEADERS,
      });

      expect(response.status()).toBe(200);
    });

    test("filters by status", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions?status=DRAFT`,
        { headers: ADMIN_HEADERS }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();
      for (const item of data.items) {
        expect(item.status).toBe("DRAFT");
      }
    });
  });

  test.describe("POST /api/v1/admin/transitions", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/admin/transitions`, {
        data: {},
      });
      expect(response.status()).toBe(401);
    });

    test("returns 403 for webmaster (requires users:manage)", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/admin/transitions`, {
        headers: WEBMASTER_HEADERS,
        data: {
          name: "Test Transition",
          targetTermId: "00000000-0000-0000-0000-000000000001",
          effectiveAt: new Date().toISOString(),
        },
      });

      expect(response.status()).toBe(403);
    });

    test("returns 400 for invalid input", async ({ request }) => {
      const response = await request.post(`${BASE}/api/v1/admin/transitions`, {
        headers: ADMIN_HEADERS,
        data: {
          // Missing required fields
          name: "",
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe("GET /api/v1/admin/transitions/:id", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000001`
      );
      expect(response.status()).toBe(401);
    });

    test("returns 404 for non-existent plan", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000099`,
        { headers: ADMIN_HEADERS }
      );
      expect(response.status()).toBe(404);
    });
  });

  test.describe("PATCH /api/v1/admin/transitions/:id", () => {
    test("returns 403 for webmaster", async ({ request }) => {
      const response = await request.patch(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000001`,
        {
          headers: WEBMASTER_HEADERS,
          data: { name: "Updated Name" },
        }
      );
      expect(response.status()).toBe(403);
    });
  });

  test.describe("DELETE /api/v1/admin/transitions/:id", () => {
    test("returns 403 for webmaster", async ({ request }) => {
      const response = await request.delete(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000001`,
        { headers: WEBMASTER_HEADERS }
      );
      expect(response.status()).toBe(403);
    });
  });

  test.describe("POST /api/v1/admin/transitions/:id/assignments", () => {
    test("returns 403 for webmaster", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000001/assignments`,
        {
          headers: WEBMASTER_HEADERS,
          data: {
            memberId: "00000000-0000-0000-0000-000000000001",
            serviceType: "BOARD_OFFICER",
            roleTitle: "Test",
            isOutgoing: false,
          },
        }
      );
      expect(response.status()).toBe(403);
    });
  });

  test.describe("POST /api/v1/admin/transitions/:id/submit", () => {
    test("returns 403 for webmaster", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000001/submit`,
        { headers: WEBMASTER_HEADERS }
      );
      expect(response.status()).toBe(403);
    });
  });

  test.describe("POST /api/v1/admin/transitions/:id/approve", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000001/approve`,
        { data: { role: "president" } }
      );
      expect(response.status()).toBe(401);
    });
  });

  test.describe("POST /api/v1/admin/transitions/:id/apply", () => {
    test("returns 403 for webmaster", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000001/apply`,
        { headers: WEBMASTER_HEADERS }
      );
      expect(response.status()).toBe(403);
    });
  });

  test.describe("POST /api/v1/admin/transitions/:id/cancel", () => {
    test("returns 403 for webmaster", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/v1/admin/transitions/00000000-0000-0000-0000-000000000001/cancel`,
        { headers: WEBMASTER_HEADERS }
      );
      expect(response.status()).toBe(403);
    });
  });
});

// @quarantine - requires dev server running
test.describe("@quarantine Transition Widget API", () => {
  test.describe("GET /api/v1/admin/transitions/widget", () => {
    test("returns 401 without auth", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`);
      expect(response.status()).toBe(401);
    });

    test("returns 403 for webmaster", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: WEBMASTER_HEADERS,
      });

      expect(response.status()).toBe(403);
    });

    test("returns 200 and widget data for admin", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: ADMIN_HEADERS,
      });

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
      expect(data.config.leadDays).toBe(60); // Default value
    });

    test("nextTransitionDate is Feb 1 or Aug 1", async ({ request }) => {
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: ADMIN_HEADERS,
      });

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
      const response = await request.get(`${BASE}/api/v1/admin/transitions/widget`, {
        headers: ADMIN_HEADERS,
      });

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

// @quarantine - requires dev server running
test.describe("@quarantine Cron Transitions API", () => {
  test.describe("GET /api/cron/transitions", () => {
    test("returns health check info", async ({ request }) => {
      const response = await request.get(`${BASE}/api/cron/transitions`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("ok");
      expect(Array.isArray(data.upcomingTransitionDates)).toBe(true);
      expect(typeof data.dueTransitionsCount).toBe("number");
    });
  });

  test.describe("POST /api/cron/transitions", () => {
    test("returns 401 without CRON_SECRET", async ({ request }) => {
      const response = await request.post(`${BASE}/api/cron/transitions`);
      expect(response.status()).toBe(401);
    });
  });
});
