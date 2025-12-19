/**
 * Profile Module Unit Tests
 *
 * Tests for profile utilities including:
 * - Field allowlist filtering
 * - Validation schema
 * - Profile transformation
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, it, expect } from "vitest";
import {
  PROFILE_EDITABLE_FIELDS,
  ProfileUpdateSchema,
  filterEditableFields,
  getMemberSinceYear,
  toProfileResponse,
} from "@/lib/profile";

// ============================================================================
// EDITABLE FIELDS ALLOWLIST
// ============================================================================

describe("Profile Editable Fields", () => {
  it("should only allow specific fields to be edited", () => {
    expect(PROFILE_EDITABLE_FIELDS).toEqual(["firstName", "lastName", "phone"]);
  });

  it("should NOT include email in editable fields", () => {
    expect(PROFILE_EDITABLE_FIELDS).not.toContain("email");
  });

  it("should NOT include membershipStatusId in editable fields", () => {
    expect(PROFILE_EDITABLE_FIELDS).not.toContain("membershipStatusId");
  });

  it("should NOT include id in editable fields", () => {
    expect(PROFILE_EDITABLE_FIELDS).not.toContain("id");
  });
});

// ============================================================================
// FILTER EDITABLE FIELDS
// ============================================================================

describe("filterEditableFields", () => {
  it("should pass through allowed fields", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      phone: "555-1234",
    };
    const result = filterEditableFields(input);
    expect(result).toEqual({
      firstName: "John",
      lastName: "Doe",
      phone: "555-1234",
    });
  });

  it("should filter out disallowed fields", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      email: "hacker@evil.com", // NOT allowed
      membershipStatusId: "fake-id", // NOT allowed
      id: "another-fake-id", // NOT allowed
    };
    const result = filterEditableFields(input);
    expect(result).toEqual({
      firstName: "John",
      lastName: "Doe",
    });
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("membershipStatusId");
    expect(result).not.toHaveProperty("id");
  });

  it("should handle partial updates", () => {
    const input = { firstName: "Jane" };
    const result = filterEditableFields(input);
    expect(result).toEqual({ firstName: "Jane" });
  });

  it("should handle empty input", () => {
    const result = filterEditableFields({});
    expect(result).toEqual({});
  });

  it("should handle null phone value", () => {
    const input = { phone: null };
    const result = filterEditableFields(input);
    expect(result).toEqual({ phone: null });
  });
});

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

describe("ProfileUpdateSchema", () => {
  describe("firstName", () => {
    it("should accept valid first name", () => {
      const result = ProfileUpdateSchema.safeParse({ firstName: "John" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("John");
      }
    });

    it("should reject empty first name", () => {
      const result = ProfileUpdateSchema.safeParse({ firstName: "" });
      expect(result.success).toBe(false);
    });

    it("should reject first name over 100 characters", () => {
      const result = ProfileUpdateSchema.safeParse({ firstName: "a".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("should trim whitespace", () => {
      const result = ProfileUpdateSchema.safeParse({ firstName: "  John  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("John");
      }
    });
  });

  describe("lastName", () => {
    it("should accept valid last name", () => {
      const result = ProfileUpdateSchema.safeParse({ lastName: "Doe" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lastName).toBe("Doe");
      }
    });

    it("should reject empty last name", () => {
      const result = ProfileUpdateSchema.safeParse({ lastName: "" });
      expect(result.success).toBe(false);
    });

    it("should reject last name over 100 characters", () => {
      const result = ProfileUpdateSchema.safeParse({ lastName: "a".repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe("phone", () => {
    it("should accept valid phone", () => {
      const result = ProfileUpdateSchema.safeParse({ phone: "555-123-4567" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("555-123-4567");
      }
    });

    it("should accept null phone", () => {
      const result = ProfileUpdateSchema.safeParse({ phone: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBeNull();
      }
    });

    it("should accept empty phone (will be trimmed)", () => {
      const result = ProfileUpdateSchema.safeParse({ phone: "" });
      expect(result.success).toBe(true);
    });

    it("should reject phone over 20 characters", () => {
      const result = ProfileUpdateSchema.safeParse({ phone: "1".repeat(21) });
      expect(result.success).toBe(false);
    });
  });

  describe("combined validation", () => {
    it("should accept all fields together", () => {
      const result = ProfileUpdateSchema.safeParse({
        firstName: "John",
        lastName: "Doe",
        phone: "555-1234",
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial updates", () => {
      const result = ProfileUpdateSchema.safeParse({ firstName: "Jane" });
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = ProfileUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

describe("getMemberSinceYear", () => {
  it("should extract year from date", () => {
    const date = new Date("2022-03-15T00:00:00Z");
    expect(getMemberSinceYear(date)).toBe("2022");
  });

  it("should handle dates from different years", () => {
    // Use explicit UTC times to avoid timezone issues
    expect(getMemberSinceYear(new Date("2020-06-15T12:00:00Z"))).toBe("2020");
    expect(getMemberSinceYear(new Date("2025-06-15T12:00:00Z"))).toBe("2025");
  });
});

describe("toProfileResponse", () => {
  it("should transform member record to profile response", () => {
    const member = {
      id: "test-id",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "555-1234",
      joinedAt: new Date("2022-03-15T00:00:00Z"),
      updatedAt: new Date("2024-01-10T12:00:00Z"),
      membershipStatus: {
        code: "ACTIVE",
        label: "Active Member",
      },
    };

    const result = toProfileResponse(member);

    expect(result).toEqual({
      id: "test-id",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "555-1234",
      joinedAt: "2022-03-15T00:00:00.000Z",
      memberSince: "2022",
      membershipStatus: {
        code: "ACTIVE",
        label: "Active Member",
      },
      updatedAt: "2024-01-10T12:00:00.000Z",
    });
  });

  it("should handle null phone", () => {
    const member = {
      id: "test-id",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: null,
      joinedAt: new Date("2023-06-01T00:00:00Z"),
      updatedAt: new Date("2024-01-10T12:00:00Z"),
      membershipStatus: {
        code: "ACTIVE",
        label: "Active Member",
      },
    };

    const result = toProfileResponse(member);

    expect(result.phone).toBeNull();
    expect(result.memberSince).toBe("2023");
  });
});
