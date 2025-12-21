/**
 * API Tests: Payment Methods
 *
 * Tests for /api/v1/me/payment-methods endpoints
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

// Note: These tests require a valid session cookie for member authentication.
// In a full test setup, you'd use a test helper to create a session.
// For now, these tests verify unauthenticated behavior.

test.describe("GET /api/v1/me/payment-methods", () => {
  test("returns 401 when not authenticated", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/me/payment-methods`);
    expect(response.status()).toBe(401);
  });

  test("returns unauthorized message", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/me/payment-methods`);
    const data = await response.json();
    expect(data.message).toContain("Not authenticated");
  });
});

test.describe("POST /api/v1/me/payment-methods/ach", () => {
  test("returns 401 when not authenticated", async ({ request }) => {
    const response = await request.post(`${BASE}/api/v1/me/payment-methods/ach`, {
      data: {
        nickname: "Test Account",
        last4: "1234",
      },
    });
    expect(response.status()).toBe(401);
  });

  test("returns unauthorized message when not authenticated", async ({ request }) => {
    const response = await request.post(`${BASE}/api/v1/me/payment-methods/ach`, {
      data: {
        nickname: "Test Account",
        last4: "1234",
      },
    });
    const data = await response.json();
    expect(data.message).toContain("Not authenticated");
  });
});

test.describe("DELETE /api/v1/me/payment-methods/[id]", () => {
  test("returns 401 when not authenticated", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request.delete(`${BASE}/api/v1/me/payment-methods/${fakeId}`);
    expect(response.status()).toBe(401);
  });

  test("returns unauthorized message when not authenticated", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request.delete(`${BASE}/api/v1/me/payment-methods/${fakeId}`);
    const data = await response.json();
    expect(data.message).toContain("Not authenticated");
  });
});
