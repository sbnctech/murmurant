// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for audience rule evaluation

import { describe, it, expect } from "vitest";
import {
  evaluateMemberAgainstRules,
  validateAudienceRules,
  AudienceRules,
  MemberWithStatus,
} from "@/lib/publishing/audience";

describe("Audience Rule System", () => {
  const createMember = (overrides: Partial<MemberWithStatus> = {}): MemberWithStatus => ({
    id: "m1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "Member",
    phone: null,
    membershipStatusId: "ms1",
    membershipTierId: null,
    waMembershipLevelRaw: null,
    membershipStatus: {
      id: "ms1",
      code: "active",
      label: "Active",
      description: null,
      isActive: true,
      isEligibleForRenewal: false,
      isBoardEligible: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    roleAssignments: [],
    ...overrides,
  });

  describe("evaluateMemberAgainstRules", () => {
    it("returns true for isPublic rule", () => {
      const member = createMember();
      const rules: AudienceRules = { isPublic: true };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });

    it("returns false for excluded member when not public", () => {
      const member = createMember({ id: "m1" });
      const rules: AudienceRules = {
        memberIds: ["m1", "m2"],
        excludeMemberIds: ["m1"],
      };

      // Exclusions take priority over membership inclusion
      expect(evaluateMemberAgainstRules(member, rules)).toBe(false);
    });

    it("returns true for public rule even with exclusions (isPublic takes priority)", () => {
      const member = createMember({ id: "m1" });
      const rules: AudienceRules = {
        isPublic: true,
        excludeMemberIds: ["m1"],
      };

      // Note: isPublic returns true immediately in the implementation
      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });

    it("returns true when member is in memberIds list", () => {
      const member = createMember({ id: "m1" });
      const rules: AudienceRules = {
        memberIds: ["m1", "m2", "m3"],
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });

    it("returns false when member is not in memberIds list", () => {
      const member = createMember({ id: "m4" });
      const rules: AudienceRules = {
        memberIds: ["m1", "m2", "m3"],
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(false);
    });

    it("returns true when member has matching membership status", () => {
      const member = createMember({
        membershipStatus: {
          id: "ms1",
          code: "active",
          label: "Active",
          description: null,
          isActive: true,
          isEligibleForRenewal: false,
          isBoardEligible: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      const rules: AudienceRules = {
        membershipStatuses: ["active", "board"],
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });

    it("returns false when member lacks matching membership status", () => {
      const member = createMember({
        membershipStatus: {
          id: "ms2",
          code: "pending",
          label: "Pending",
          description: null,
          isActive: false,
          isEligibleForRenewal: false,
          isBoardEligible: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      const rules: AudienceRules = {
        membershipStatuses: ["active"],
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(false);
    });

    it("returns true when member has matching role", () => {
      const member = createMember({
        roleAssignments: [
          {
            committeeId: "c1",
            committeeRole: { slug: "chair" },
          },
        ],
      });
      const rules: AudienceRules = {
        roles: ["chair", "secretary"],
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });

    it("returns false when member lacks matching role", () => {
      const member = createMember({
        roleAssignments: [
          {
            committeeId: "c1",
            committeeRole: { slug: "member" },
          },
        ],
      });
      const rules: AudienceRules = {
        roles: ["chair", "secretary"],
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(false);
    });

    it("returns true when member is in matching committee", () => {
      const member = createMember({
        roleAssignments: [
          {
            committeeId: "c1",
            committeeRole: { slug: "member" },
          },
        ],
      });
      const rules: AudienceRules = {
        committeeIds: ["c1", "c2"],
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });

    it("returns false when member is not in matching committee", () => {
      const member = createMember({
        roleAssignments: [
          {
            committeeId: "c3",
            committeeRole: { slug: "member" },
          },
        ],
      });
      const rules: AudienceRules = {
        committeeIds: ["c1", "c2"],
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(false);
    });

    it("returns true when member joined within N days", () => {
      const joinDate = new Date();
      joinDate.setDate(joinDate.getDate() - 15); // Joined 15 days ago
      const member = createMember({ joinedAt: joinDate });
      const rules: AudienceRules = {
        joinedAfterDays: 30, // Members who joined within 30 days
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });

    it("returns false when member joined more than N days ago", () => {
      const joinDate = new Date();
      joinDate.setDate(joinDate.getDate() - 60); // Joined 60 days ago
      const member = createMember({ joinedAt: joinDate });
      const rules: AudienceRules = {
        joinedAfterDays: 30, // Members who joined within 30 days
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(false);
    });

    it("returns true when member joined before specified date", () => {
      const joinDate = new Date("2020-01-01");
      const member = createMember({ joinedAt: joinDate });
      const rules: AudienceRules = {
        joinedBeforeDate: "2021-01-01",
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });

    it("returns false when member joined after specified date", () => {
      const joinDate = new Date("2022-01-01");
      const member = createMember({ joinedAt: joinDate });
      const rules: AudienceRules = {
        joinedBeforeDate: "2021-01-01",
      };

      expect(evaluateMemberAgainstRules(member, rules)).toBe(false);
    });

    it("returns true when no positive criteria specified", () => {
      const member = createMember();
      const rules: AudienceRules = {}; // Empty rules

      expect(evaluateMemberAgainstRules(member, rules)).toBe(true);
    });
  });

  describe("validateAudienceRules", () => {
    it("validates valid rules", () => {
      const rules = {
        isPublic: true,
        roles: ["admin"],
        membershipStatuses: ["active"],
      };

      const result = validateAudienceRules(rules);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects non-object rules", () => {
      const result = validateAudienceRules("invalid");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Rules must be an object");
    });

    it("rejects null rules", () => {
      const result = validateAudienceRules(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Rules must be an object");
    });

    it("validates isPublic is boolean", () => {
      const result = validateAudienceRules({ isPublic: "yes" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("isPublic must be a boolean");
    });

    it("validates roles is array", () => {
      const result = validateAudienceRules({ roles: "admin" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("roles must be an array");
    });

    it("validates membershipStatuses is array", () => {
      const result = validateAudienceRules({ membershipStatuses: { status: "active" } });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("membershipStatuses must be an array");
    });

    it("validates memberIds is array", () => {
      const result = validateAudienceRules({ memberIds: "123" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("memberIds must be an array");
    });

    it("validates committeeIds is array", () => {
      const result = validateAudienceRules({ committeeIds: 123 });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("committeeIds must be an array");
    });

    it("validates joinedAfterDays is number", () => {
      const result = validateAudienceRules({ joinedAfterDays: "30" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("joinedAfterDays must be a number");
    });

    it("validates joinedBeforeDate is string", () => {
      const result = validateAudienceRules({ joinedBeforeDate: new Date() });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("joinedBeforeDate must be a string date");
    });

    it("reports multiple validation errors", () => {
      const result = validateAudienceRules({
        isPublic: "yes",
        roles: "admin",
        joinedAfterDays: "30",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
