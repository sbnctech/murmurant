// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for content selection logic

import { describe, it, expect } from "vitest";
import {
  selectContent,
  detectDraftChanges,
  isPagePubliclyVisible,
  hasPreviewableDraft,
  getContentModeLabel,
} from "@/lib/publishing/contentSelection";
import { PageContent } from "@/lib/publishing/blocks";

describe("Content Selection", () => {
  const draftContent: PageContent = {
    schemaVersion: 1,
    blocks: [
      { id: "b1", type: "text", order: 0, data: { content: "Draft content text" } },
    ],
  };

  const publishedContent: PageContent = {
    schemaVersion: 1,
    blocks: [
      { id: "b1", type: "text", order: 0, data: { content: "Published content text" } },
    ],
  };

  describe("selectContent", () => {
    describe("published mode", () => {
      it("returns publishedContent when available", () => {
        const result = selectContent(draftContent, publishedContent, "published");

        expect(result.content).toEqual(publishedContent);
        expect(result.mode).toBe("published");
        expect(result.isPreview).toBe(false);
      });

      it("returns null when publishedContent is null", () => {
        const result = selectContent(draftContent, null, "published");

        expect(result.content).toBeNull();
        expect(result.mode).toBe("published");
        expect(result.isPreview).toBe(false);
      });

      it("indicates hasDraftChanges when content differs", () => {
        const result = selectContent(draftContent, publishedContent, "published");

        expect(result.hasDraftChanges).toBe(true);
      });

      it("indicates no draft changes when content is identical", () => {
        const result = selectContent(publishedContent, publishedContent, "published");

        expect(result.hasDraftChanges).toBe(false);
      });
    });

    describe("draft mode", () => {
      it("returns draft content", () => {
        const result = selectContent(draftContent, publishedContent, "draft");

        expect(result.content).toEqual(draftContent);
        expect(result.mode).toBe("draft");
        expect(result.isPreview).toBe(false);
      });

      it("returns null when draft content is null", () => {
        const result = selectContent(null, publishedContent, "draft");

        expect(result.content).toBeNull();
        expect(result.mode).toBe("draft");
      });
    });

    describe("preview mode", () => {
      it("prefers draft content over published", () => {
        const result = selectContent(draftContent, publishedContent, "preview");

        expect(result.content).toEqual(draftContent);
        expect(result.mode).toBe("preview");
        expect(result.isPreview).toBe(true);
      });

      it("falls back to publishedContent when draft is null", () => {
        const result = selectContent(null, publishedContent, "preview");

        expect(result.content).toEqual(publishedContent);
        expect(result.mode).toBe("preview");
        expect(result.isPreview).toBe(true);
      });

      it("returns null when both are null", () => {
        const result = selectContent(null, null, "preview");

        expect(result.content).toBeNull();
        expect(result.isPreview).toBe(true);
      });
    });
  });

  describe("detectDraftChanges", () => {
    it("returns false when publishedContent is null (never published)", () => {
      const result = detectDraftChanges(draftContent, null);

      expect(result).toBe(false);
    });

    it("returns true when content is null but publishedContent exists", () => {
      const result = detectDraftChanges(null, publishedContent);

      expect(result).toBe(true);
    });

    it("returns true when content differs from publishedContent", () => {
      const result = detectDraftChanges(draftContent, publishedContent);

      expect(result).toBe(true);
    });

    it("returns false when content equals publishedContent", () => {
      const result = detectDraftChanges(publishedContent, publishedContent);

      expect(result).toBe(false);
    });

    it("uses deep comparison for nested objects", () => {
      const content1: PageContent = {
        schemaVersion: 1,
        blocks: [{ id: "b1", type: "text", order: 0, data: { content: "Same" } }],
      };
      const content2: PageContent = {
        schemaVersion: 1,
        blocks: [{ id: "b1", type: "text", order: 0, data: { content: "Same" } }],
      };

      const result = detectDraftChanges(content1, content2);

      expect(result).toBe(false);
    });

    it("detects changes in nested data", () => {
      const content1: PageContent = {
        schemaVersion: 1,
        blocks: [{ id: "b1", type: "text", order: 0, data: { content: "A", alignment: "left" } }],
      };
      const content2: PageContent = {
        schemaVersion: 1,
        blocks: [{ id: "b1", type: "text", order: 0, data: { content: "A", alignment: "center" } }],
      };

      const result = detectDraftChanges(content1, content2);

      expect(result).toBe(true);
    });
  });

  describe("isPagePubliclyVisible", () => {
    it("returns true for published page with publishedContent", () => {
      const result = isPagePubliclyVisible("PUBLISHED", publishedContent);

      expect(result).toBe(true);
    });

    it("returns false for draft page", () => {
      const result = isPagePubliclyVisible("DRAFT", publishedContent);

      expect(result).toBe(false);
    });

    it("returns false for published page without publishedContent", () => {
      const result = isPagePubliclyVisible("PUBLISHED", null);

      expect(result).toBe(false);
    });

    it("returns false for archived page", () => {
      const result = isPagePubliclyVisible("ARCHIVED", publishedContent);

      expect(result).toBe(false);
    });
  });

  describe("hasPreviewableDraft", () => {
    it("returns true when content exists", () => {
      const result = hasPreviewableDraft(draftContent, publishedContent);

      expect(result).toBe(true);
    });

    it("returns true when content exists but no publishedContent", () => {
      const result = hasPreviewableDraft(draftContent, null);

      expect(result).toBe(true);
    });

    it("returns false when content is null", () => {
      const result = hasPreviewableDraft(null, publishedContent);

      expect(result).toBe(false);
    });

    it("returns false when both are null", () => {
      const result = hasPreviewableDraft(null, null);

      expect(result).toBe(false);
    });
  });

  describe("getContentModeLabel", () => {
    it("returns correct label for published mode", () => {
      expect(getContentModeLabel("published")).toBe("Published version");
    });

    it("returns correct label for draft mode", () => {
      expect(getContentModeLabel("draft")).toBe("Draft (working copy)");
    });

    it("returns correct label for preview mode", () => {
      expect(getContentModeLabel("preview")).toBe("Preview (unpublished changes)");
    });
  });
});
