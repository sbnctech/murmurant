// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for page template types and validation

import { describe, it, expect } from "vitest";
import {
  STANDARD_TEMPLATES,
  PUBLIC_BLOCK_TYPES,
  MEMBER_ONLY_BLOCK_TYPES,
  getTemplateBySlug,
  getTemplatesForContext,
  getDefaultTemplate,
  isBlockAllowedInRegion,
  validateBlocksForTemplate,
  isMemberOnlyBlockType,
  filterBlocksForContext,
} from "@/lib/publishing/pageTemplates";

describe("pageTemplates", () => {
  // ============================================================================
  // Template Definitions
  // ============================================================================

  describe("STANDARD_TEMPLATES", () => {
    it("should have at least 6 standard templates", () => {
      expect(STANDARD_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    });

    it("should have templates for both public and member contexts", () => {
      const publicTemplates = STANDARD_TEMPLATES.filter(
        (t) => t.context === "public"
      );
      const memberTemplates = STANDARD_TEMPLATES.filter(
        (t) => t.context === "member"
      );

      expect(publicTemplates.length).toBeGreaterThan(0);
      expect(memberTemplates.length).toBeGreaterThan(0);
    });

    it("should have unique slugs for each template", () => {
      const slugs = STANDARD_TEMPLATES.map((t) => t.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it("should have at least one region in each template", () => {
      for (const template of STANDARD_TEMPLATES) {
        expect(template.regions.length).toBeGreaterThan(0);
      }
    });
  });

  describe("PUBLIC_BLOCK_TYPES", () => {
    it("should include common block types", () => {
      expect(PUBLIC_BLOCK_TYPES).toContain("hero");
      expect(PUBLIC_BLOCK_TYPES).toContain("text");
      expect(PUBLIC_BLOCK_TYPES).toContain("image");
      expect(PUBLIC_BLOCK_TYPES).toContain("cards");
    });

    it("should not include member-only block types", () => {
      for (const memberType of MEMBER_ONLY_BLOCK_TYPES) {
        expect(PUBLIC_BLOCK_TYPES).not.toContain(memberType);
      }
    });
  });

  describe("MEMBER_ONLY_BLOCK_TYPES", () => {
    it("should include member-specific blocks", () => {
      expect(MEMBER_ONLY_BLOCK_TYPES).toContain("member-directory");
      expect(MEMBER_ONLY_BLOCK_TYPES).toContain("my-registrations");
      expect(MEMBER_ONLY_BLOCK_TYPES).toContain("my-groups");
    });
  });

  // ============================================================================
  // Template Lookup Functions
  // ============================================================================

  describe("getTemplateBySlug", () => {
    it("should return template for valid slug", () => {
      const template = getTemplateBySlug("public-landing");
      expect(template).toBeDefined();
      expect(template?.slug).toBe("public-landing");
      expect(template?.context).toBe("public");
    });

    it("should return undefined for invalid slug", () => {
      const template = getTemplateBySlug("non-existent-template");
      expect(template).toBeUndefined();
    });
  });

  describe("getTemplatesForContext", () => {
    it("should return only public templates for public context", () => {
      const templates = getTemplatesForContext("public");
      expect(templates.length).toBeGreaterThan(0);
      for (const template of templates) {
        expect(template.context).toBe("public");
      }
    });

    it("should return only member templates for member context", () => {
      const templates = getTemplatesForContext("member");
      expect(templates.length).toBeGreaterThan(0);
      for (const template of templates) {
        expect(template.context).toBe("member");
      }
    });
  });

  describe("getDefaultTemplate", () => {
    it("should return public-content for public context", () => {
      const template = getDefaultTemplate("public");
      expect(template.slug).toBe("public-content");
      expect(template.context).toBe("public");
    });

    it("should return member-content for member context", () => {
      const template = getDefaultTemplate("member");
      expect(template.slug).toBe("member-content");
      expect(template.context).toBe("member");
    });
  });

  // ============================================================================
  // Block Type Restrictions
  // ============================================================================

  describe("isBlockAllowedInRegion", () => {
    it("should allow hero in header region of public-landing", () => {
      const template = getTemplateBySlug("public-landing")!;
      expect(isBlockAllowedInRegion(template, "header", "hero")).toBe(true);
    });

    it("should not allow text in header region of public-landing", () => {
      const template = getTemplateBySlug("public-landing")!;
      expect(isBlockAllowedInRegion(template, "header", "text")).toBe(false);
    });

    it("should return false for non-existent region", () => {
      const template = getTemplateBySlug("public-landing")!;
      expect(isBlockAllowedInRegion(template, "non-existent", "hero")).toBe(
        false
      );
    });

    it("should allow all public blocks in main region", () => {
      const template = getTemplateBySlug("public-landing")!;
      for (const blockType of PUBLIC_BLOCK_TYPES) {
        expect(isBlockAllowedInRegion(template, "main", blockType)).toBe(true);
      }
    });
  });

  describe("isMemberOnlyBlockType", () => {
    it("should return true for member-only blocks", () => {
      expect(isMemberOnlyBlockType("member-directory")).toBe(true);
      expect(isMemberOnlyBlockType("my-registrations")).toBe(true);
    });

    it("should return false for public blocks", () => {
      expect(isMemberOnlyBlockType("hero")).toBe(false);
      expect(isMemberOnlyBlockType("text")).toBe(false);
    });
  });

  // ============================================================================
  // Template Validation
  // ============================================================================

  describe("validateBlocksForTemplate", () => {
    it("should validate valid block configuration", () => {
      const template = getTemplateBySlug("public-landing")!;
      const blocks = [
        { type: "hero" as const, region: "header" },
        { type: "text" as const, region: "main" },
        { type: "cards" as const, region: "main" },
      ];

      const result = validateBlocksForTemplate(template, blocks);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject blocks in wrong region", () => {
      const template = getTemplateBySlug("public-landing")!;
      const blocks = [{ type: "text" as const, region: "header" }];

      const result = validateBlocksForTemplate(template, blocks);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("not allowed");
    });

    it("should reject too many blocks in limited region", () => {
      const template = getTemplateBySlug("public-landing")!;
      // Header region has maxBlocks: 1
      const blocks = [
        { type: "hero" as const, region: "header" },
        { type: "hero" as const, region: "header" },
      ];

      const result = validateBlocksForTemplate(template, blocks);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("at most"))).toBe(true);
    });

    it("should reject unknown regions", () => {
      const template = getTemplateBySlug("public-landing")!;
      const blocks = [{ type: "text" as const, region: "unknown-region" }];

      const result = validateBlocksForTemplate(template, blocks);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Unknown region"))).toBe(
        true
      );
    });
  });

  // ============================================================================
  // Block Visibility Filtering
  // ============================================================================

  describe("filterBlocksForContext", () => {
    it("should filter out member-only blocks in public context", () => {
      const blocks = [
        { type: "text" },
        { type: "member-directory" },
        { type: "hero" },
      ];

      const filtered = filterBlocksForContext(blocks, "public", "PUBLIC");
      expect(filtered).toHaveLength(2);
      expect(filtered.map((b) => b.type)).not.toContain("member-directory");
    });

    it("should include all blocks in member context", () => {
      const blocks = [
        { type: "text" },
        { type: "member-directory" },
        { type: "hero" },
      ];

      const filtered = filterBlocksForContext(blocks, "member", "MEMBERS_ONLY");
      expect(filtered).toHaveLength(3);
    });

    it("should respect block-level visibility override", () => {
      const blocks = [
        { type: "text", visibility: "public" as const },
        { type: "text", visibility: "members_only" as const },
      ];

      const publicFiltered = filterBlocksForContext(blocks, "public", "PUBLIC");
      expect(publicFiltered).toHaveLength(1);
      expect(publicFiltered[0].visibility).toBe("public");

      const memberFiltered = filterBlocksForContext(
        blocks,
        "member",
        "MEMBERS_ONLY"
      );
      expect(memberFiltered).toHaveLength(2);
    });

    it("should handle inherit visibility based on page", () => {
      const blocks = [{ type: "text", visibility: "inherit" as const }];

      // Public page in public context - visible
      const publicResult = filterBlocksForContext(blocks, "public", "PUBLIC");
      expect(publicResult).toHaveLength(1);

      // Members-only page in public context - not visible
      const memberPagePublicContext = filterBlocksForContext(
        blocks,
        "public",
        "MEMBERS_ONLY"
      );
      expect(memberPagePublicContext).toHaveLength(0);

      // Members-only page in member context - visible
      const memberPageMemberContext = filterBlocksForContext(
        blocks,
        "member",
        "MEMBERS_ONLY"
      );
      expect(memberPageMemberContext).toHaveLength(1);
    });
  });

  // ============================================================================
  // Template Constraints
  // ============================================================================

  describe("template constraints", () => {
    it("should have requiresAuth: false for public templates", () => {
      const publicTemplates = getTemplatesForContext("public");
      for (const template of publicTemplates) {
        expect(template.constraints.requiresAuth).toBe(false);
      }
    });

    it("should have requiresAuth: true for member templates", () => {
      const memberTemplates = getTemplatesForContext("member");
      for (const template of memberTemplates) {
        expect(template.constraints.requiresAuth).toBe(true);
      }
    });

    it("should have membership status restrictions on member templates", () => {
      const memberTemplates = getTemplatesForContext("member");
      for (const template of memberTemplates) {
        expect(template.constraints.allowedMembershipStatuses).toBeDefined();
        expect(
          template.constraints.allowedMembershipStatuses!.length
        ).toBeGreaterThan(0);
      }
    });
  });
});
