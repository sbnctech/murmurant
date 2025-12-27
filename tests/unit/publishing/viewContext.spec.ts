// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for view context detection and resolution

import { describe, it, expect } from "vitest";
import {
  getViewContextFromPath,
  pathRequiresAuth,
  VIEW_CONTEXT_META,
  getViewContextMeta,
  resolveViewContext,
  getContextsForVisibility,
  canViewInContext,
} from "@/lib/publishing/viewContext";

describe("viewContext", () => {
  // ============================================================================
  // Path-Based Context Detection
  // ============================================================================

  describe("getViewContextFromPath", () => {
    describe("member paths", () => {
      it("should return member for /member", () => {
        expect(getViewContextFromPath("/member")).toBe("member");
      });

      it("should return member for /member/dashboard", () => {
        expect(getViewContextFromPath("/member/dashboard")).toBe("member");
      });

      it("should return member for /my", () => {
        expect(getViewContextFromPath("/my")).toBe("member");
      });

      it("should return member for /my/events", () => {
        expect(getViewContextFromPath("/my/events")).toBe("member");
      });

      it("should return member for /account", () => {
        expect(getViewContextFromPath("/account")).toBe("member");
      });

      it("should return member for /account/settings", () => {
        expect(getViewContextFromPath("/account/settings")).toBe("member");
      });

      it("should return member for /groups", () => {
        expect(getViewContextFromPath("/groups")).toBe("member");
      });

      it("should return member for /directory", () => {
        expect(getViewContextFromPath("/directory")).toBe("member");
      });
    });

    describe("public paths", () => {
      it("should return public for /", () => {
        expect(getViewContextFromPath("/")).toBe("public");
      });

      it("should return public for /about", () => {
        expect(getViewContextFromPath("/about")).toBe("public");
      });

      it("should return public for /about/team", () => {
        expect(getViewContextFromPath("/about/team")).toBe("public");
      });

      it("should return public for /join", () => {
        expect(getViewContextFromPath("/join")).toBe("public");
      });

      it("should return public for /contact", () => {
        expect(getViewContextFromPath("/contact")).toBe("public");
      });

      it("should return public for /events", () => {
        expect(getViewContextFromPath("/events")).toBe("public");
      });

      it("should return public for /login", () => {
        expect(getViewContextFromPath("/login")).toBe("public");
      });
    });

    describe("case insensitivity", () => {
      it("should handle uppercase paths", () => {
        expect(getViewContextFromPath("/MEMBER")).toBe("member");
        expect(getViewContextFromPath("/ABOUT")).toBe("public");
      });

      it("should handle mixed case paths", () => {
        expect(getViewContextFromPath("/Member/Dashboard")).toBe("member");
        expect(getViewContextFromPath("/About")).toBe("public");
      });
    });

    describe("default behavior", () => {
      it("should default to public for unknown paths", () => {
        expect(getViewContextFromPath("/random-page")).toBe("public");
        expect(getViewContextFromPath("/foo/bar/baz")).toBe("public");
      });
    });
  });

  // ============================================================================
  // Authentication Requirements
  // ============================================================================

  describe("pathRequiresAuth", () => {
    it("should return true for member paths", () => {
      expect(pathRequiresAuth("/member")).toBe(true);
      expect(pathRequiresAuth("/my/events")).toBe(true);
      expect(pathRequiresAuth("/account")).toBe(true);
      expect(pathRequiresAuth("/groups")).toBe(true);
      expect(pathRequiresAuth("/directory")).toBe(true);
    });

    it("should return false for public paths", () => {
      expect(pathRequiresAuth("/")).toBe(false);
      expect(pathRequiresAuth("/about")).toBe(false);
      expect(pathRequiresAuth("/join")).toBe(false);
      expect(pathRequiresAuth("/events")).toBe(false);
      expect(pathRequiresAuth("/login")).toBe(false);
    });
  });

  // ============================================================================
  // Context Metadata
  // ============================================================================

  describe("VIEW_CONTEXT_META", () => {
    it("should have metadata for public context", () => {
      expect(VIEW_CONTEXT_META.public).toBeDefined();
      expect(VIEW_CONTEXT_META.public.context).toBe("public");
      expect(VIEW_CONTEXT_META.public.label).toBe("Public");
    });

    it("should have metadata for member context", () => {
      expect(VIEW_CONTEXT_META.member).toBeDefined();
      expect(VIEW_CONTEXT_META.member.context).toBe("member");
      expect(VIEW_CONTEXT_META.member.label).toBe("Member");
    });

    it("should have navigation slugs", () => {
      expect(VIEW_CONTEXT_META.public.navigationSlug).toBeDefined();
      expect(VIEW_CONTEXT_META.member.navigationSlug).toBeDefined();
    });
  });

  describe("getViewContextMeta", () => {
    it("should return metadata for public context", () => {
      const meta = getViewContextMeta("public");
      expect(meta.context).toBe("public");
      expect(meta.label).toBe("Public");
    });

    it("should return metadata for member context", () => {
      const meta = getViewContextMeta("member");
      expect(meta.context).toBe("member");
      expect(meta.label).toBe("Member");
    });
  });

  // ============================================================================
  // Context Resolution
  // ============================================================================

  describe("resolveViewContext", () => {
    it("should resolve public path for unauthenticated user", () => {
      const result = resolveViewContext("/about", false);
      expect(result.context).toBe("public");
      expect(result.requiresAuth).toBe(false);
      expect(result.redirectUrl).toBeUndefined();
    });

    it("should resolve public path for authenticated user", () => {
      const result = resolveViewContext("/about", true);
      expect(result.context).toBe("public");
      expect(result.requiresAuth).toBe(false);
      expect(result.redirectUrl).toBeUndefined();
    });

    it("should redirect unauthenticated user from member path", () => {
      const result = resolveViewContext("/member/dashboard", false);
      expect(result.context).toBe("member");
      expect(result.requiresAuth).toBe(true);
      expect(result.redirectUrl).toBeDefined();
      expect(result.redirectUrl).toContain("/login");
      expect(result.redirectUrl).toContain(
        encodeURIComponent("/member/dashboard")
      );
    });

    it("should allow authenticated user on member path", () => {
      const result = resolveViewContext("/member/dashboard", true);
      expect(result.context).toBe("member");
      expect(result.requiresAuth).toBe(true);
      expect(result.redirectUrl).toBeUndefined();
    });

    it("should include original path in redirect", () => {
      const result = resolveViewContext("/my/events?filter=upcoming", false);
      expect(result.redirectUrl).toContain("/login");
    });
  });

  // ============================================================================
  // Visibility Mapping
  // ============================================================================

  describe("getContextsForVisibility", () => {
    it("should return both contexts for PUBLIC visibility", () => {
      const contexts = getContextsForVisibility("PUBLIC");
      expect(contexts).toContain("public");
      expect(contexts).toContain("member");
    });

    it("should return only member for MEMBERS_ONLY visibility", () => {
      const contexts = getContextsForVisibility("MEMBERS_ONLY");
      expect(contexts).not.toContain("public");
      expect(contexts).toContain("member");
    });

    it("should return only member for ROLE_RESTRICTED visibility", () => {
      const contexts = getContextsForVisibility("ROLE_RESTRICTED");
      expect(contexts).not.toContain("public");
      expect(contexts).toContain("member");
    });
  });

  describe("canViewInContext", () => {
    describe("PUBLIC pages", () => {
      it("should be viewable in public context", () => {
        expect(canViewInContext("PUBLIC", "public")).toBe(true);
      });

      it("should be viewable in member context", () => {
        expect(canViewInContext("PUBLIC", "member")).toBe(true);
      });
    });

    describe("MEMBERS_ONLY pages", () => {
      it("should not be viewable in public context", () => {
        expect(canViewInContext("MEMBERS_ONLY", "public")).toBe(false);
      });

      it("should be viewable in member context", () => {
        expect(canViewInContext("MEMBERS_ONLY", "member")).toBe(true);
      });
    });

    describe("ROLE_RESTRICTED pages", () => {
      it("should not be viewable in public context", () => {
        expect(canViewInContext("ROLE_RESTRICTED", "public")).toBe(false);
      });

      it("should be viewable in member context", () => {
        expect(canViewInContext("ROLE_RESTRICTED", "member")).toBe(true);
      });
    });
  });
});
