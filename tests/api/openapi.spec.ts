/**
 * OpenAPI Endpoint Tests
 *
 * Tests for the internal API documentation endpoint.
 *
 * Charter Principles:
 * - P1: Identity provable - admin auth required
 * - P2: Default deny - unauthenticated access blocked
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("OpenAPI Endpoint", () => {
  test.describe("GET /api/openapi (unauthenticated)", () => {
    test("returns 401 for unauthenticated requests", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`);

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("returns 401 for member role", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-member-token",
        },
      });

      expect(response.status()).toBe(403);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("returns 403 for non-admin roles", async ({ request }) => {
      // VP Activities doesn't have admin:full capability
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-vp-token",
        },
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe("GET /api/openapi (authenticated admin)", () => {
    test("returns 200 for admin", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      expect(response.status()).toBe(200);
    });

    test("returns valid OpenAPI structure", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Check OpenAPI required fields
      expect(data.openapi).toBeDefined();
      expect(data.openapi).toMatch(/^3\.\d+\.\d+$/);
      expect(data.info).toBeDefined();
      expect(data.info.title).toBeDefined();
      expect(data.info.version).toBeDefined();
      expect(data.paths).toBeDefined();
    });

    test("returns JSON content type", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      const contentType = response.headers()["content-type"];
      expect(contentType).toContain("application/json");
    });

    test("includes required API paths", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      const data = await response.json();
      const paths = Object.keys(data.paths);

      // Check for key endpoints
      expect(paths).toContain("/api/v1/health");
      expect(paths).toContain("/api/v1/me");
      expect(paths).toContain("/api/v1/events");
      expect(paths).toContain("/api/v1/admin/members");
    });

    test("includes tags for organization", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      const data = await response.json();

      expect(data.tags).toBeDefined();
      expect(Array.isArray(data.tags)).toBe(true);
      expect(data.tags.length).toBeGreaterThan(0);

      // Check for key tags
      const tagNames = data.tags.map((t: { name: string }) => t.name);
      expect(tagNames).toContain("Health");
      expect(tagNames).toContain("Auth");
      expect(tagNames).toContain("Events");
    });

    test("includes component schemas", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      const data = await response.json();

      expect(data.components).toBeDefined();
      expect(data.components.schemas).toBeDefined();

      // Check for key schemas
      const schemaNames = Object.keys(data.components.schemas);
      expect(schemaNames.length).toBeGreaterThan(0);
    });

    test("includes security schemes", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      const data = await response.json();

      expect(data.components.securitySchemes).toBeDefined();
      expect(data.components.securitySchemes.cookieAuth).toBeDefined();
    });
  });

  test.describe("Security", () => {
    test("does not expose sensitive information in spec", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      const text = await response.text();

      // Should not contain real tokens or secrets
      expect(text).not.toContain("password");
      expect(text).not.toContain("secret_key");
      expect(text).not.toContain("api_key:");
      expect(text).not.toContain("DATABASE_URL");
    });

    test("spec is cached with private cache-control", async ({ request }) => {
      const response = await request.get(`${BASE}/api/openapi`, {
        headers: {
          Authorization: "Bearer test-admin-token",
        },
      });

      const cacheControl = response.headers()["cache-control"];
      expect(cacheControl).toContain("private");
    });
  });
});
