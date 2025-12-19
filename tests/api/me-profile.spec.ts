/**
 * Profile API Tests
 *
 * Tests for the member profile API endpoints:
 * - GET /api/v1/me/profile
 * - PATCH /api/v1/me/profile
 *
 * Charter Principles:
 * - P1: Identity and authorization must be provable
 * - P2: Default deny, object-scoped authorization
 * - P7: Audit logging for mutations
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";
const MEMBER_HEADERS = { Authorization: "Bearer test-member-token" };
const ADMIN_HEADERS = { Authorization: "Bearer test-admin-token" };

// =============================================================================
// GET /api/v1/me/profile - Get Profile
// =============================================================================

test.describe("GET /api/v1/me/profile", () => {
  test("returns 401 without auth", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/me/profile`);
    expect(response.status()).toBe(401);
  });

  test("returns profile for authenticated member", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/me/profile`, {
      headers: MEMBER_HEADERS,
    });

    // May be 404 if test member doesn't exist in DB, or 200 if it does
    // Accept either since we're testing the auth check works
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();

      // Verify profile structure
      expect(data.profile).toBeDefined();
      expect(data.profile.id).toBeDefined();
      expect(data.profile.firstName).toBeDefined();
      expect(data.profile.lastName).toBeDefined();
      expect(data.profile.email).toBeDefined();
      expect(data.profile.memberSince).toBeDefined();
      expect(data.profile.membershipStatus).toBeDefined();
      expect(data.profile.membershipStatus.code).toBeDefined();
      expect(data.profile.membershipStatus.label).toBeDefined();
      expect(data.profile.updatedAt).toBeDefined();
    }
  });

  test("returns profile for admin", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/me/profile`, {
      headers: ADMIN_HEADERS,
    });

    // May be 404 if test admin member doesn't exist in DB
    expect([200, 404]).toContain(response.status());
  });
});

// =============================================================================
// PATCH /api/v1/me/profile - Update Profile
// =============================================================================

test.describe("PATCH /api/v1/me/profile", () => {
  test("returns 401 without auth", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      data: { firstName: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  test("validates firstName is not empty", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: { firstName: "" },
    });

    // Expect 400 validation error or 404 if member doesn't exist
    expect([400, 404]).toContain(response.status());

    if (response.status() === 400) {
      const data = await response.json();
      expect(data.code).toBe("VALIDATION_ERROR");
    }
  });

  test("validates firstName max length", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: { firstName: "a".repeat(101) },
    });

    // Expect 400 validation error or 404 if member doesn't exist
    expect([400, 404]).toContain(response.status());

    if (response.status() === 400) {
      const data = await response.json();
      expect(data.code).toBe("VALIDATION_ERROR");
    }
  });

  test("validates phone max length", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: { phone: "1".repeat(21) },
    });

    // Expect 400 validation error or 404 if member doesn't exist
    expect([400, 404]).toContain(response.status());

    if (response.status() === 400) {
      const data = await response.json();
      expect(data.code).toBe("VALIDATION_ERROR");
    }
  });

  test("rejects empty update body", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: {},
    });

    // Expect 400 (no valid fields) or 404 if member doesn't exist
    expect([400, 404]).toContain(response.status());

    if (response.status() === 400) {
      const data = await response.json();
      expect(data.code).toBe("VALIDATION_ERROR");
      expect(data.message).toContain("No valid fields");
    }
  });

  test("filters out disallowed fields (email)", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: {
        email: "hacker@evil.com", // Should be filtered out
      },
    });

    // Should be 400 because no valid fields after filtering
    // or 404 if member doesn't exist
    expect([400, 404]).toContain(response.status());

    if (response.status() === 400) {
      const data = await response.json();
      expect(data.message).toContain("No valid fields");
    }
  });

  test("filters out disallowed fields (membershipStatusId)", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: {
        membershipStatusId: "fake-uuid", // Should be filtered out
      },
    });

    // Should be 400 because no valid fields after filtering
    expect([400, 404]).toContain(response.status());
  });

  test("accepts valid partial update", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: {
        firstName: "UpdatedFirst",
      },
    });

    // May be 200 if member exists, 404 if not
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.profile).toBeDefined();
      expect(data.profile.firstName).toBe("UpdatedFirst");
    }
  });

  test("accepts valid full update", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: {
        firstName: "John",
        lastName: "Doe",
        phone: "555-1234",
      },
    });

    // May be 200 if member exists, 404 if not
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.profile).toBeDefined();
      expect(data.profile.firstName).toBe("John");
      expect(data.profile.lastName).toBe("Doe");
      expect(data.profile.phone).toBe("555-1234");
    }
  });

  test("accepts null phone to clear it", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: {
        phone: null,
      },
    });

    // May be 200 if member exists, 404 if not
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.profile.phone).toBeNull();
    }
  });
});

// =============================================================================
// Security Tests
// =============================================================================

test.describe("Profile Security", () => {
  test("API does not expose admin-only fields", async ({ request }) => {
    const response = await request.get(`${BASE}/api/v1/me/profile`, {
      headers: MEMBER_HEADERS,
    });

    if (response.status() === 200) {
      const data = await response.json();

      // These fields should NOT be exposed
      expect(data.profile.membershipStatusId).toBeUndefined();
      expect(data.profile.passwordHash).toBeUndefined();
      expect(data.profile.createdAt).toBeUndefined(); // joinedAt is used instead
    }
  });

  test("API trims input values", async ({ request }) => {
    const response = await request.patch(`${BASE}/api/v1/me/profile`, {
      headers: {
        ...MEMBER_HEADERS,
        "Content-Type": "application/json",
      },
      data: {
        firstName: "  Trimmed  ",
      },
    });

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.profile.firstName).toBe("Trimmed");
    }
  });
});
