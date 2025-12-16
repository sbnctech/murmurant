/**
 * Admin Summary API Tests
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, least privilege
 */

import { test, expect } from "@playwright/test";
import { SEED_COUNTS } from "../fixtures/seed-data";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

// Charter P1/P2: Auth enforcement tests
test("GET /api/admin/summary returns 401 without auth", async ({ request }) => {
  const response = await request.get(`${BASE}/api/admin/summary`);
  expect(response.status()).toBe(401);
});

test("GET /api/admin/summary returns 403 for member role", async ({ request }) => {
  const response = await request.get(`${BASE}/api/admin/summary`, {
    headers: { Authorization: "Bearer test-member-token" },
  });
  expect(response.status()).toBe(403);
});

test("GET /api/admin/summary returns expected counts", async ({ request }) => {
  const response = await request.get(`${BASE}/api/admin/summary`, {
    headers: ADMIN_HEADERS,
  });

  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.summary).toBeDefined();

  const { summary } = data;

  // Verify all fields are present and are numbers
  expect(typeof summary.totalActiveMembers).toBe("number");
  expect(typeof summary.totalEvents).toBe("number");
  expect(typeof summary.totalRegistrations).toBe("number");
  expect(typeof summary.totalWaitlistedRegistrations).toBe("number");

  // Verify counts match seed data (see tests/fixtures/seed-data.ts)
  // Note: totalEvents returns published events only (not draft events)
  expect(summary.totalActiveMembers).toBe(SEED_COUNTS.members);
  expect(summary.totalEvents).toBe(SEED_COUNTS.publishedEvents);
  expect(summary.totalRegistrations).toBe(SEED_COUNTS.registrations);
  expect(summary.totalWaitlistedRegistrations).toBe(SEED_COUNTS.waitlistedRegistrations);
});
