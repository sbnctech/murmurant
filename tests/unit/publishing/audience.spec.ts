// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for audience rule evaluation

import { describe, it, expect } from "vitest";
import {
  evaluateMemberAgainstRules,
  validateAudienceRules,
  filterBreadcrumbsByAudience,
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

  describe("filterBreadcrumbsByAudience", () => {
    type TestBreadcrumb = { label: string; href?: string; audienceRuleId?: string };

    it("returns all items when no audience rules are set", () => {
      const items: TestBreadcrumb[] = [
        { label: "Home", href: "/" },
        { label: "Events", href: "/events" },
        { label: "Current Page" },
      ];
      const audienceRules = new Map<string, AudienceRules>();

      const result = filterBreadcrumbsByAudience(items, audienceRules, null);

      expect(result).toHaveLength(3);
      expect(result).toEqual(items);
    });

    it("returns empty array when all items have unknown audience rules", () => {
      const items: TestBreadcrumb[] = [
        { label: "Home", href: "/", audienceRuleId: "unknown-rule" },
        { label: "Secret", href: "/secret", audienceRuleId: "another-unknown" },
      ];
      const audienceRules = new Map<string, AudienceRules>();

      const result = filterBreadcrumbsByAudience(items, audienceRules, null);

      expect(result).toHaveLength(0);
    });

    it("includes items with public audience rules for anonymous users", () => {
      const items: TestBreadcrumb[] = [
        { label: "Home", href: "/", audienceRuleId: "public-rule" },
        { label: "Members Only", href: "/members", audienceRuleId: "members-rule" },
      ];
      const audienceRules = new Map<string, AudienceRules>([
        ["public-rule", { isPublic: true }],
        ["members-rule", { membershipStatuses: ["active"] }],
      ]);

      const result = filterBreadcrumbsByAudience(items, audienceRules, null);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe("Home");
    });

    it("includes member-restricted items for matching members", () => {
      const member = createMember({ id: "m1" });
      const items: TestBreadcrumb[] = [
        { label: "Home", href: "/" },
        { label: "Members Only", href: "/members", audienceRuleId: "members-rule" },
      ];
      const audienceRules = new Map<string, AudienceRules>([
        ["members-rule", { memberIds: ["m1"] }],
      ]);

      const result = filterBreadcrumbsByAudience(items, audienceRules, member);

      expect(result).toHaveLength(2);
    });

    it("excludes member-restricted items for non-matching members", () => {
      const member = createMember({ id: "m2" });
      const items: TestBreadcrumb[] = [
        { label: "Home", href: "/" },
        { label: "VIP Only", href: "/vip", audienceRuleId: "vip-rule" },
      ];
      const audienceRules = new Map<string, AudienceRules>([
        ["vip-rule", { memberIds: ["m1"] }],
      ]);

      const result = filterBreadcrumbsByAudience(items, audienceRules, member);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe("Home");
    });

    it("filters by membership status", () => {
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
      const items: TestBreadcrumb[] = [
        { label: "Home", href: "/" },
        { label: "Active Members", href: "/active", audienceRuleId: "active-rule" },
        { label: "Board Only", href: "/board", audienceRuleId: "board-rule" },
      ];
      const audienceRules = new Map<string, AudienceRules>([
        ["active-rule", { membershipStatuses: ["active"] }],
        ["board-rule", { membershipStatuses: ["board"] }],
      ]);

      const result = filterBreadcrumbsByAudience(items, audienceRules, member);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.label)).toEqual(["Home", "Active Members"]);
    });

    it("mixes filtered and unfiltered items correctly", () => {
      const items: TestBreadcrumb[] = [
        { label: "Home", href: "/" }, // No audience rule
        { label: "Public Section", href: "/public", audienceRuleId: "public-rule" },
        { label: "Private Section", href: "/private", audienceRuleId: "private-rule" },
        { label: "Current Page" }, // No audience rule
      ];
      const audienceRules = new Map<string, AudienceRules>([
        ["public-rule", { isPublic: true }],
        ["private-rule", { memberIds: ["m99"] }], // Won't match
      ]);

      const result = filterBreadcrumbsByAudience(items, audienceRules, null);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.label)).toEqual(["Home", "Public Section", "Current Page"]);
    });
  });
});
