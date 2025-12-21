/**
 * Demo Member List API Tests
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, least privilege, object scope
 *
 * Tests verify:
 * 1. Unauthenticated requests get 401
 * 2. Non-admin roles get 403
 * 3. Admin role can access the endpoint
 * 4. Response includes expected fields
 * 5. Pagination and filtering work
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

// Token fixtures for different roles
const TOKENS = {
  admin: "test-admin-token",
  member: "test-member-token",
} as const;

const makeHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

test.describe("Demo Member List API", () => {
  test.describe("Authorization", () => {
    test("unauthenticated request returns 401", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list`);
      expect(response.status()).toBe(401);
    });

    test("member role returns 403", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list`, {
        headers: makeHeaders(TOKENS.member),
      });
      expect(response.status()).toBe(403);
    });

    test("admin role can access endpoint", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Response Shape", () => {
    test("response includes pagination metadata", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("page");
      expect(body).toHaveProperty("pageSize");
      expect(body).toHaveProperty("totalItems");
      expect(body).toHaveProperty("totalPages");
      expect(body).toHaveProperty("filters");
    });

    test("response includes filter options", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.filters).toHaveProperty("statusOptions");
      expect(body.filters).toHaveProperty("tierOptions");
      expect(Array.isArray(body.filters.statusOptions)).toBe(true);
      expect(Array.isArray(body.filters.tierOptions)).toBe(true);
    });

    test("member items have required fields", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();

      // If there are items, check their shape
      if (body.items.length > 0) {
        const item = body.items[0];
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("email");
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("statusLabel");
        expect(item).toHaveProperty("tier");
        expect(item).toHaveProperty("tierName");
        expect(item).toHaveProperty("joinedAt");
        expect(item).toHaveProperty("lifecycleHint");
      }
    });
  });

  test.describe("Pagination", () => {
    test("respects page parameter", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list?page=2`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.page).toBe(2);
    });

    test("respects pageSize parameter", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list?pageSize=5`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.pageSize).toBe(5);
      expect(body.items.length).toBeLessThanOrEqual(5);
    });

    test("caps pageSize at 100", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list?pageSize=500`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.pageSize).toBeLessThanOrEqual(100);
    });
  });

  test.describe("Filtering", () => {
    test("filters by status parameter", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list?status=active`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      // All items should have active status
      for (const item of body.items) {
        expect(item.status).toBe("active");
      }
    });

    test("filters by tier parameter", async ({ request }) => {
      const response = await request.get(`${BASE}/api/admin/demo/member-list?tier=extended_member`, {
        headers: makeHeaders(TOKENS.admin),
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      // All items should have extended_member tier
      for (const item of body.items) {
        expect(item.tier).toBe("extended_member");
      }
    });

    test("combines status and tier filters", async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/admin/demo/member-list?status=active&tier=member`,
        {
          headers: makeHeaders(TOKENS.admin),
        }
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      // All items should match both filters
      for (const item of body.items) {
        expect(item.status).toBe("active");
        expect(item.tier).toBe("member");
      }
    });
  });
});
