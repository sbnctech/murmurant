// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for time-bounded authority (TB-1/TB-2)
// Charter P2: Role assignments have startDate and endDate.

import { describe, it, expect } from "vitest";
import {
  deriveGlobalRoleFromSlug,
  deriveGlobalRoleFromAssignments,
  ActiveRoleAssignment,
} from "@/lib/auth";

describe("Time-Bounded Authority (TB-1/TB-2)", () => {
  describe("deriveGlobalRoleFromSlug", () => {
    it("maps known leadership slugs correctly", () => {
      expect(deriveGlobalRoleFromSlug("president")).toBe("president");
      expect(deriveGlobalRoleFromSlug("past-president")).toBe("past-president");
      expect(deriveGlobalRoleFromSlug("vp-activities")).toBe("vp-activities");
      expect(deriveGlobalRoleFromSlug("vp-communications")).toBe("vp-communications");
      expect(deriveGlobalRoleFromSlug("secretary")).toBe("secretary");
      expect(deriveGlobalRoleFromSlug("parliamentarian")).toBe("parliamentarian");
      expect(deriveGlobalRoleFromSlug("webmaster")).toBe("webmaster");
    });

    it("maps committee chair variants to event-chair", () => {
      expect(deriveGlobalRoleFromSlug("event-chair")).toBe("event-chair");
      expect(deriveGlobalRoleFromSlug("chair")).toBe("event-chair");
      expect(deriveGlobalRoleFromSlug("committee-chair")).toBe("event-chair");
    });

    it("handles case insensitivity", () => {
      expect(deriveGlobalRoleFromSlug("PRESIDENT")).toBe("president");
      expect(deriveGlobalRoleFromSlug("VP-Activities")).toBe("vp-activities");
    });

    it("returns member for unknown slugs (security-first default)", () => {
      expect(deriveGlobalRoleFromSlug("unknown-role")).toBe("member");
      expect(deriveGlobalRoleFromSlug("")).toBe("member");
      expect(deriveGlobalRoleFromSlug("super-admin")).toBe("member");
    });
  });

  describe("deriveGlobalRoleFromAssignments", () => {
    // Helper to create mock assignment
    const createAssignment = (
      slug: string,
      startDate: Date,
      endDate: Date | null = null
    ): ActiveRoleAssignment => ({
      id: `assignment-${slug}`,
      memberId: "member-123",
      committeeId: "committee-456",
      committeeRoleId: `role-${slug}`,
      termId: "term-789",
      startDate,
      endDate,
      committeeRole: {
        id: `role-${slug}`,
        slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
      },
    });

    it("returns member when no assignments (fail-safe default)", () => {
      // TB-1/TB-2: No active assignments = no elevated capabilities
      const result = deriveGlobalRoleFromAssignments([]);
      expect(result).toBe("member");
    });

    it("returns correct role for single active assignment", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000); // 1 day ago

      const assignments = [createAssignment("president", pastDate, null)];
      expect(deriveGlobalRoleFromAssignments(assignments)).toBe("president");
    });

    it("returns highest priority role from multiple assignments", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000);

      // Member has both event-chair (priority 1) and vp-activities (priority 4)
      const assignments = [
        createAssignment("event-chair", pastDate, null),
        createAssignment("vp-activities", pastDate, null),
      ];

      // Should return vp-activities as it has higher priority
      expect(deriveGlobalRoleFromAssignments(assignments)).toBe("vp-activities");
    });

    it("returns president over vp roles (president has highest non-admin priority)", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000);

      const assignments = [
        createAssignment("vp-activities", pastDate, null),
        createAssignment("president", pastDate, null),
        createAssignment("vp-communications", pastDate, null),
      ];

      expect(deriveGlobalRoleFromAssignments(assignments)).toBe("president");
    });

    it("handles unknown slugs gracefully (treats as member, does not elevate)", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000);

      // Only has an unknown role which maps to member (priority 0)
      const assignments = [createAssignment("mystery-role", pastDate, null)];

      expect(deriveGlobalRoleFromAssignments(assignments)).toBe("member");
    });

    it("unknown slug with valid role returns the valid role", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000);

      // Has both unknown and valid roles
      const assignments = [
        createAssignment("mystery-role", pastDate, null),
        createAssignment("secretary", pastDate, null),
      ];

      expect(deriveGlobalRoleFromAssignments(assignments)).toBe("secretary");
    });
  });

  // Note: getActiveRoleAssignments requires database mocking.
  // The Prisma query enforces TB-1/TB-2:
  //   - TB-1: startDate <= asOfDate (role must have started)
  //   - TB-2: endDate is null OR endDate > asOfDate (role must not have ended)
  //
  // Integration tests should verify:
  // - Future-dated roles (startDate > now) are NOT returned
  // - Expired roles (endDate <= now) are NOT returned
  // - Active roles (startDate <= now AND (endDate is null OR endDate > now)) ARE returned
});
