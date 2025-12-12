import { test, expect } from "@playwright/test";

/**
 * Health Endpoint Tests
 *
 * Tests for GET /api/health
 * Contract matches /api/v1/health for consistency.
 */

test("health endpoint returns healthy status", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.status).toBe("healthy");
  expect(typeof data.timestamp).toBe("string");
  expect(data.version).toBeDefined();
});

test("health endpoint includes database status in checks", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  expect(data.checks).toBeDefined();
  expect(data.checks.database).toBeDefined();
  expect(data.checks.database.status).toBe("ok");
});

test("health endpoint returns valid ISO 8601 timestamp", async ({ request }) => {
  const response = await request.get("/api/health");
  const data = await response.json();

  const timestamp = new Date(data.timestamp);
  expect(timestamp.toISOString()).toBe(data.timestamp);
});

test("health endpoint includes env info", async ({ request }) => {
  const response = await request.get("/api/health");
  const data = await response.json();

  expect(data.env).toBeDefined();
  expect(typeof data.env.dbConfigured).toBe("boolean");
});
