/**
 * RBAC Tests for Admin API Endpoints
 *
 * Tests that admin endpoints:
 * - Return 401 without Authorization header
 * - Return 403 with member token (insufficient permissions)
 * - Return 200 with admin token
 *
 * Token configuration:
 *   Set ADMIN_API_TOKEN and MEMBER_API_TOKEN env vars, or use defaults from seed.
 *
 * Default dev tokens (from seed):
 *   Admin: dev-admin-token-alice-12345
 *   Member: dev-member-token-carol-67890
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PW_BASE_URL || "http://localhost:3000";

// Tokens from env or defaults from seed script
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || "dev-admin-token-alice-12345";
const MEMBER_TOKEN = process.env.MEMBER_API_TOKEN || "dev-member-token-carol-67890";

test.describe("Admin RBAC", () => {
  test.describe("GET /api/admin/members", () => {
    test("returns 401 without Authorization header", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/members`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toBeDefined();
    });

    test("returns 403 with member token", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/members`, {
        headers: {
          Authorization: `Bearer ${MEMBER_TOKEN}`,
        },
      });
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe("FORBIDDEN");
      expect(body.error.message).toBe("Admin access required");
    });

    test("returns 200 with admin token", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/members`, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
    });
  });

  test.describe("GET /api/admin/dashboard", () => {
    test("returns 401 without Authorization header", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/dashboard`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    test("returns 403 with member token", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${MEMBER_TOKEN}`,
        },
      });
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe("FORBIDDEN");
    });

    test("returns 200 with admin token", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.summary).toBeDefined();
    });
  });

  test.describe("GET /api/admin/export/members", () => {
    test("returns 401 without Authorization header", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/export/members`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    test("returns 403 with member token", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/export/members`, {
        headers: {
          Authorization: `Bearer ${MEMBER_TOKEN}`,
        },
      });
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe("FORBIDDEN");
    });

    test("returns 200 with admin token", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/export/members`, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });
      expect(response.status()).toBe(200);

      const contentType = response.headers()["content-type"];
      expect(contentType).toContain("text/csv");
    });
  });

  test.describe("Invalid token handling", () => {
    test("returns 401 with invalid token", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/members`, {
        headers: {
          Authorization: "Bearer invalid-token-12345",
        },
      });
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toBe("Invalid token");
    });

    test("returns 401 with malformed Authorization header", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/admin/members`, {
        headers: {
          Authorization: "NotBearer token",
        },
      });
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
