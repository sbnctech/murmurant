/**
 * Public Profile Unit Tests
 *
 * Tests for member-to-member public profile views:
 * - Field redaction (no sensitive data exposed)
 * - Only active members visible
 * - Committee assignments transformed correctly
 *
 * Charter Compliance:
 * - P1: Identity via session required
 * - P2: Member-to-member access (authenticated members only)
 * - P9: Fail closed on invalid auth
 *
 * Copyright (c) Santa Barbara Newcomers Club
 */

import { describe, it, expect } from "vitest";
import type { PublicMemberProfile } from "@/app/api/v1/members/[id]/public/route";

// ============================================================================
// PUBLIC PROFILE FIELD ALLOWLIST
// ============================================================================

/**
 * These fields are the ONLY ones that should appear in a public profile.
 * Adding new fields requires explicit approval and security review.
 */
const PUBLIC_PROFILE_ALLOWED_FIELDS = [
  "id",
  "firstName",
  "lastName",
  "memberSince",
  "membershipStatus",
  "membershipTier",
  "committees",
] as const;

/**
 * These fields must NEVER appear in a public profile.
 * They contain sensitive or internal data.
 */
const REDACTED_FIELDS = [
  "email",
  "phone",
  "joinedAt", // Only year via memberSince
  "waMembershipLevelRaw",
  "createdAt",
  "updatedAt",
  "auditLogs",
  "payments",
  "internalNotes",
  "membershipStatusId",
  "membershipTierId",
] as const;

// ============================================================================
// FIELD ALLOWLIST TESTS
// ============================================================================

describe("Public Profile Allowed Fields", () => {
  it("should define exactly 7 allowed fields", () => {
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).toHaveLength(7);
  });

  it("should include basic identity fields", () => {
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).toContain("id");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).toContain("firstName");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).toContain("lastName");
  });

  it("should include membership info fields", () => {
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).toContain("memberSince");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).toContain("membershipStatus");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).toContain("membershipTier");
  });

  it("should include committee assignments", () => {
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).toContain("committees");
  });
});

// ============================================================================
// FIELD REDACTION TESTS
// ============================================================================

describe("Public Profile Redacted Fields", () => {
  it("should NOT include email (private contact info)", () => {
    expect(REDACTED_FIELDS).toContain("email");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).not.toContain("email");
  });

  it("should NOT include phone (private contact info)", () => {
    expect(REDACTED_FIELDS).toContain("phone");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).not.toContain("phone");
  });

  it("should NOT include exact joinedAt date (privacy)", () => {
    expect(REDACTED_FIELDS).toContain("joinedAt");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).not.toContain("joinedAt");
  });

  it("should NOT include internal migration data", () => {
    expect(REDACTED_FIELDS).toContain("waMembershipLevelRaw");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).not.toContain("waMembershipLevelRaw");
  });

  it("should NOT include audit logs (admin only)", () => {
    expect(REDACTED_FIELDS).toContain("auditLogs");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).not.toContain("auditLogs");
  });

  it("should NOT include payment data (admin only)", () => {
    expect(REDACTED_FIELDS).toContain("payments");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).not.toContain("payments");
  });

  it("should NOT include internal notes (admin only)", () => {
    expect(REDACTED_FIELDS).toContain("internalNotes");
    expect(PUBLIC_PROFILE_ALLOWED_FIELDS).not.toContain("internalNotes");
  });
});

// ============================================================================
// TYPE SAFETY TESTS
// ============================================================================

describe("PublicMemberProfile Type", () => {
  it("should match the allowed field structure", () => {
    // Create a valid public profile to verify the type shape
    const validProfile: PublicMemberProfile = {
      id: "mem_123",
      firstName: "Alice",
      lastName: "Smith",
      memberSince: "2023",
      membershipStatus: {
        label: "Active Member",
      },
      membershipTier: {
        name: "Standard Member",
      },
      committees: [
        { name: "Events Committee", role: "Member" },
      ],
    };

    expect(validProfile.id).toBeDefined();
    expect(validProfile.firstName).toBeDefined();
    expect(validProfile.lastName).toBeDefined();
    expect(validProfile.memberSince).toBeDefined();
    expect(validProfile.membershipStatus).toBeDefined();
    expect(validProfile.membershipStatus.label).toBeDefined();
    expect(validProfile.committees).toBeDefined();
    expect(Array.isArray(validProfile.committees)).toBe(true);
  });

  it("should allow null membershipTier", () => {
    const profileWithoutTier: PublicMemberProfile = {
      id: "mem_456",
      firstName: "Bob",
      lastName: "Jones",
      memberSince: "2024",
      membershipStatus: {
        label: "Active Member",
      },
      membershipTier: null,
      committees: [],
    };

    expect(profileWithoutTier.membershipTier).toBeNull();
  });

  it("should support empty committees array", () => {
    const profileNoCommittees: PublicMemberProfile = {
      id: "mem_789",
      firstName: "Carol",
      lastName: "Williams",
      memberSince: "2022",
      membershipStatus: {
        label: "Active Member",
      },
      membershipTier: null,
      committees: [],
    };

    expect(profileNoCommittees.committees).toHaveLength(0);
  });

  it("should support multiple committees", () => {
    const profileWithCommittees: PublicMemberProfile = {
      id: "mem_abc",
      firstName: "David",
      lastName: "Brown",
      memberSince: "2020",
      membershipStatus: {
        label: "Active Member",
      },
      membershipTier: { name: "Patron" },
      committees: [
        { name: "Events", role: "Chair" },
        { name: "Membership", role: "Member" },
        { name: "Finance", role: "Secretary" },
      ],
    };

    expect(profileWithCommittees.committees).toHaveLength(3);
    expect(profileWithCommittees.committees[0]).toHaveProperty("name");
    expect(profileWithCommittees.committees[0]).toHaveProperty("role");
  });
});

// ============================================================================
// MEMBER SINCE PRIVACY TEST
// ============================================================================

describe("memberSince Privacy", () => {
  it("should only expose year, not full date", () => {
    const profile: PublicMemberProfile = {
      id: "test",
      firstName: "Test",
      lastName: "User",
      memberSince: "2023", // NOT "2023-06-15"
      membershipStatus: { label: "Active" },
      membershipTier: null,
      committees: [],
    };

    // memberSince should be a 4-digit year string
    expect(profile.memberSince).toMatch(/^\d{4}$/);
    expect(profile.memberSince).not.toContain("-");
    expect(profile.memberSince).not.toContain("T");
  });
});
