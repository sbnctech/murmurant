// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for permission system

import { describe, it, expect } from "vitest";
import {
  hasAdminRole,
  canManageThemes,
  canManageTemplates,
  canManageMailingLists,
  canSendCampaign,
  canEditPage,
  canDeletePage,
  evaluateAudienceRule,
  checkPermission,
  UserContext,
} from "@/lib/publishing/permissions";

describe("Permission System", () => {
  describe("hasAdminRole", () => {
    it("returns true for president role (full admin)", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["president"],
        committeeIds: [],
      };

      expect(hasAdminRole(user)).toBe(true);
    });

    it("returns false for webmaster role (webmaster is NOT a full admin)", () => {
      // IMPORTANT: webmaster is a content admin but NOT a full admin
      // They cannot view finance, change entitlements, or delete published pages
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["webmaster"],
        committeeIds: [],
      };

      expect(hasAdminRole(user)).toBe(false);
    });

    it("returns false for communications-chair role (not a full admin)", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["communications-chair"],
        committeeIds: [],
      };

      expect(hasAdminRole(user)).toBe(false);
    });

    it("returns true for board-member role (full admin)", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["board-member"],
        committeeIds: [],
      };

      expect(hasAdminRole(user)).toBe(true);
    });

    it("returns false for regular member", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["member"],
        committeeIds: [],
      };

      expect(hasAdminRole(user)).toBe(false);
    });

    it("returns false for empty roles", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      expect(hasAdminRole(user)).toBe(false);
    });
  });

  describe("canManageThemes", () => {
    it("returns true for webmaster", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["webmaster"],
        committeeIds: [],
      };

      expect(canManageThemes(user)).toBe(true);
    });

    it("returns true for communications-chair", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["communications-chair"],
        committeeIds: [],
      };

      expect(canManageThemes(user)).toBe(true);
    });

    it("returns false for unauthenticated user", () => {
      const user: UserContext = {
        memberId: null,
        isAuthenticated: false,
        membershipStatusCode: null,
        roles: [],
        committeeIds: [],
      };

      expect(canManageThemes(user)).toBe(false);
    });

    it("returns false for regular member", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["member"],
        committeeIds: [],
      };

      expect(canManageThemes(user)).toBe(false);
    });
  });

  describe("canManageTemplates", () => {
    it("returns true for webmaster", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["webmaster"],
        committeeIds: [],
      };

      expect(canManageTemplates(user)).toBe(true);
    });

    it("returns false for unauthenticated user", () => {
      const user: UserContext = {
        memberId: null,
        isAuthenticated: false,
        membershipStatusCode: null,
        roles: [],
        committeeIds: [],
      };

      expect(canManageTemplates(user)).toBe(false);
    });
  });

  describe("canManageMailingLists", () => {
    it("returns true for communications-chair", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["communications-chair"],
        committeeIds: [],
      };

      expect(canManageMailingLists(user)).toBe(true);
    });

    it("returns true for webmaster", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["webmaster"],
        committeeIds: [],
      };

      expect(canManageMailingLists(user)).toBe(true);
    });

    it("returns false for president without comms role", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["president"],
        committeeIds: [],
      };

      expect(canManageMailingLists(user)).toBe(false);
    });
  });

  describe("canSendCampaign", () => {
    it("returns true for communications-chair", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["communications-chair"],
        committeeIds: [],
      };

      expect(canSendCampaign(user)).toBe(true);
    });

    it("returns false for unauthenticated user", () => {
      const user: UserContext = {
        memberId: null,
        isAuthenticated: false,
        membershipStatusCode: null,
        roles: [],
        committeeIds: [],
      };

      expect(canSendCampaign(user)).toBe(false);
    });
  });

  describe("canEditPage", () => {
    const draftPage = {
      id: "p1",
      slug: "test",
      title: "Test",
      description: null,
      status: "DRAFT" as const,
      visibility: "PUBLIC" as const,
      content: {},
      templateId: null,
      themeId: null,
      audienceRuleId: null,
      seoTitle: null,
      seoDescription: null,
      seoImage: null,
      publishedAt: null,
      publishAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: "123",
      updatedById: "123",
    };

    it("returns true for content admin", () => {
      const user: UserContext = {
        memberId: "456",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["webmaster"],
        committeeIds: [],
      };

      expect(canEditPage(user, draftPage)).toBe(true);
    });

    it("returns true for page creator on draft", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      expect(canEditPage(user, draftPage)).toBe(true);
    });

    it("returns false for unauthenticated user", () => {
      const user: UserContext = {
        memberId: null,
        isAuthenticated: false,
        membershipStatusCode: null,
        roles: [],
        committeeIds: [],
      };

      expect(canEditPage(user, draftPage)).toBe(false);
    });

    it("returns false for non-creator without admin role", () => {
      const user: UserContext = {
        memberId: "999",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      expect(canEditPage(user, draftPage)).toBe(false);
    });
  });

  describe("canDeletePage", () => {
    const publishedPage = {
      id: "p1",
      slug: "test",
      title: "Test",
      description: null,
      status: "PUBLISHED" as const,
      visibility: "PUBLIC" as const,
      content: {},
      templateId: null,
      themeId: null,
      audienceRuleId: null,
      seoTitle: null,
      seoDescription: null,
      seoImage: null,
      publishedAt: new Date(),
      publishAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: "123",
      updatedById: "123",
    };

    const draftPage = {
      ...publishedPage,
      status: "DRAFT" as const,
      publishedAt: null,
      publishAt: null,
    };

    it("returns true for admin on published page", () => {
      const user: UserContext = {
        memberId: "456",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["president"],
        committeeIds: [],
      };

      expect(canDeletePage(user, publishedPage)).toBe(true);
    });

    it("returns false for webmaster on published page (webmaster is NOT full admin)", () => {
      const user: UserContext = {
        memberId: "456",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["webmaster"],
        committeeIds: [],
      };

      // webmaster is NOT in FULL_ADMIN_ROLES - cannot delete published pages
      // This is a key security constraint: webmaster manages content but cannot
      // delete published content or access finance/entitlements
      expect(canDeletePage(user, publishedPage)).toBe(false);
    });

    it("returns false for regular member on published page", () => {
      const user: UserContext = {
        memberId: "456",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["member"],
        committeeIds: [],
      };

      expect(canDeletePage(user, publishedPage)).toBe(false);
    });

    it("returns true for content admin on draft page", () => {
      const user: UserContext = {
        memberId: "456",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["webmaster"],
        committeeIds: [],
      };

      expect(canDeletePage(user, draftPage)).toBe(true);
    });

    it("returns true for creator on own draft", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      expect(canDeletePage(user, draftPage)).toBe(true);
    });

    it("returns false for unauthenticated user", () => {
      const user: UserContext = {
        memberId: null,
        isAuthenticated: false,
        membershipStatusCode: null,
        roles: [],
        committeeIds: [],
      };

      expect(canDeletePage(user, draftPage)).toBe(false);
    });
  });

  describe("evaluateAudienceRule", () => {
    it("returns true for isPublic rule", () => {
      const user: UserContext = {
        memberId: null,
        isAuthenticated: false,
        membershipStatusCode: null,
        roles: [],
        committeeIds: [],
      };

      expect(evaluateAudienceRule(user, { isPublic: true })).toBe(true);
    });

    it("returns false for unauthenticated user on non-public rule", () => {
      const user: UserContext = {
        memberId: null,
        isAuthenticated: false,
        membershipStatusCode: null,
        roles: [],
        committeeIds: [],
      };

      expect(evaluateAudienceRule(user, { roles: ["member"] })).toBe(false);
    });

    it("returns true when user has matching role", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["webmaster", "member"],
        committeeIds: [],
      };

      expect(evaluateAudienceRule(user, { roles: ["webmaster"] })).toBe(true);
    });

    it("returns false when user lacks matching role", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: ["member"],
        committeeIds: [],
      };

      expect(evaluateAudienceRule(user, { roles: ["webmaster"] })).toBe(false);
    });

    it("returns true when user is in memberIds list", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      expect(evaluateAudienceRule(user, { memberIds: ["123", "456"] })).toBe(true);
    });

    it("returns true when user has matching membership status", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      expect(evaluateAudienceRule(user, { membershipStatuses: ["active", "board"] })).toBe(true);
    });

    it("returns false when user lacks matching membership status", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "pending",
        roles: [],
        committeeIds: [],
      };

      expect(evaluateAudienceRule(user, { membershipStatuses: ["active"] })).toBe(false);
    });

    it("returns true when user is in matching committee", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: ["c1", "c2"],
      };

      expect(evaluateAudienceRule(user, { committeeIds: ["c2", "c3"] })).toBe(true);
    });

    it("returns false for invalid rules", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      expect(evaluateAudienceRule(user, null)).toBe(false);
      expect(evaluateAudienceRule(user, "invalid")).toBe(false);
    });
  });

  describe("checkPermission", () => {
    it("returns allowed result when permission granted", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      const result = checkPermission(true, user, "edit");

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("returns unauthorized for unauthenticated user", () => {
      const user: UserContext = {
        memberId: null,
        isAuthenticated: false,
        membershipStatusCode: null,
        roles: [],
        committeeIds: [],
      };

      const result = checkPermission(false, user, "edit");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("unauthorized");
      expect(result.message).toBe("Authentication required");
    });

    it("returns forbidden for authenticated user without permission", () => {
      const user: UserContext = {
        memberId: "123",
        isAuthenticated: true,
        membershipStatusCode: "active",
        roles: [],
        committeeIds: [],
      };

      const result = checkPermission(false, user, "delete");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("forbidden");
      expect(result.message).toContain("delete");
    });
  });
});
