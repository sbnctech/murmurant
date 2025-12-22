// Copyright (c) Santa Barbara Newcomers Club
// Tests for page lifecycle state machine
// A4: Draft/Published lifecycle management

import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  getNextStatus,
  hasDraftChanges,
  computeLifecycleState,
  getLifecycleMessage,
  getLifecycleAuditData,
} from "@/lib/publishing/pageLifecycle";
import { PageContent } from "@/lib/publishing/blocks";

describe("pageLifecycle", () => {
  describe("isValidTransition", () => {
    describe("from DRAFT status", () => {
      it("allows publish action", () => {
        const result = isValidTransition("DRAFT", "publish");
        expect(result.ok).toBe(true);
      });

      it("allows archive action", () => {
        const result = isValidTransition("DRAFT", "archive");
        expect(result.ok).toBe(true);
      });

      it("rejects unpublish action", () => {
        const result = isValidTransition("DRAFT", "unpublish");
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Cannot unpublish");
        }
      });

      it("rejects discardDraft action", () => {
        const result = isValidTransition("DRAFT", "discardDraft");
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Cannot discardDraft");
        }
      });
    });

    describe("from PUBLISHED status", () => {
      it("allows unpublish action", () => {
        const result = isValidTransition("PUBLISHED", "unpublish");
        expect(result.ok).toBe(true);
      });

      it("allows archive action", () => {
        const result = isValidTransition("PUBLISHED", "archive");
        expect(result.ok).toBe(true);
      });

      it("allows discardDraft action when has draft changes", () => {
        const result = isValidTransition("PUBLISHED", "discardDraft", true);
        expect(result.ok).toBe(true);
      });

      it("rejects discardDraft action when no draft changes", () => {
        const result = isValidTransition("PUBLISHED", "discardDraft", false);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("No draft changes");
        }
      });

      it("rejects publish action (already published)", () => {
        const result = isValidTransition("PUBLISHED", "publish");
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Cannot publish");
        }
      });
    });

    describe("from ARCHIVED status", () => {
      it("rejects all actions", () => {
        const actions = ["publish", "unpublish", "archive", "discardDraft"] as const;
        for (const action of actions) {
          const result = isValidTransition("ARCHIVED", action);
          expect(result.ok).toBe(false);
        }
      });
    });
  });

  describe("getNextStatus", () => {
    it("returns PUBLISHED for publish action", () => {
      expect(getNextStatus("publish")).toBe("PUBLISHED");
    });

    it("returns DRAFT for unpublish action", () => {
      expect(getNextStatus("unpublish")).toBe("DRAFT");
    });

    it("returns ARCHIVED for archive action", () => {
      expect(getNextStatus("archive")).toBe("ARCHIVED");
    });

    it("returns null for discardDraft action (status unchanged)", () => {
      expect(getNextStatus("discardDraft")).toBeNull();
    });
  });

  describe("hasDraftChanges", () => {
    const baseContent: PageContent = {
      schemaVersion: 1,
      blocks: [
        { id: "1", type: "hero", order: 0, data: { title: "Hello" } },
      ],
    };

    it("returns false when publishedContent is null", () => {
      expect(hasDraftChanges(baseContent, null)).toBe(false);
    });

    it("returns true when content is null but publishedContent exists", () => {
      expect(hasDraftChanges(null, baseContent)).toBe(true);
    });

    it("returns false when content equals publishedContent", () => {
      const copy: PageContent = JSON.parse(JSON.stringify(baseContent));
      expect(hasDraftChanges(baseContent, copy)).toBe(false);
    });

    it("returns true when content differs from publishedContent", () => {
      const modified: PageContent = {
        ...baseContent,
        blocks: [
          { id: "1", type: "hero", order: 0, data: { title: "Changed" } },
        ],
      };
      expect(hasDraftChanges(modified, baseContent)).toBe(true);
    });

    it("returns true when block order changes", () => {
      const original: PageContent = {
        schemaVersion: 1,
        blocks: [
          { id: "1", type: "hero", order: 0, data: { title: "A" } },
          { id: "2", type: "text", order: 1, data: { content: "B" } },
        ],
      };
      const reordered: PageContent = {
        schemaVersion: 1,
        blocks: [
          { id: "2", type: "text", order: 0, data: { content: "B" } },
          { id: "1", type: "hero", order: 1, data: { title: "A" } },
        ],
      };
      expect(hasDraftChanges(reordered, original)).toBe(true);
    });

    it("returns true when block is added", () => {
      const withNewBlock: PageContent = {
        schemaVersion: 1,
        blocks: [
          { id: "1", type: "hero", order: 0, data: { title: "Hello" } },
          { id: "2", type: "text", order: 1, data: { content: "New" } },
        ],
      };
      expect(hasDraftChanges(withNewBlock, baseContent)).toBe(true);
    });

    it("returns true when block is removed", () => {
      const withTwoBlocks: PageContent = {
        schemaVersion: 1,
        blocks: [
          { id: "1", type: "hero", order: 0, data: { title: "Hello" } },
          { id: "2", type: "text", order: 1, data: { content: "Text" } },
        ],
      };
      expect(hasDraftChanges(baseContent, withTwoBlocks)).toBe(true);
    });
  });

  describe("computeLifecycleState", () => {
    const content: PageContent = {
      schemaVersion: 1,
      blocks: [{ id: "1", type: "hero", order: 0, data: { title: "Test" } }],
    };

    it("computes state for DRAFT page without published content", () => {
      const state = computeLifecycleState("DRAFT", null, content, null);

      expect(state.status).toBe("DRAFT");
      expect(state.publishedAt).toBeNull();
      expect(state.hasDraftChanges).toBe(false);
      expect(state.canPublish).toBe(true);
      expect(state.canUnpublish).toBe(false);
      expect(state.canDiscardDraft).toBe(false);
      expect(state.canArchive).toBe(true);
    });

    it("computes state for PUBLISHED page without draft changes", () => {
      const publishedAt = new Date();
      const state = computeLifecycleState("PUBLISHED", publishedAt, content, content);

      expect(state.status).toBe("PUBLISHED");
      expect(state.publishedAt).toBe(publishedAt);
      expect(state.hasDraftChanges).toBe(false);
      expect(state.canPublish).toBe(false); // No changes to publish
      expect(state.canUnpublish).toBe(true);
      expect(state.canDiscardDraft).toBe(false);
      expect(state.canArchive).toBe(true);
    });

    it("computes state for PUBLISHED page with draft changes", () => {
      const publishedAt = new Date();
      const modifiedContent: PageContent = {
        schemaVersion: 1,
        blocks: [{ id: "1", type: "hero", order: 0, data: { title: "Modified" } }],
      };
      const state = computeLifecycleState("PUBLISHED", publishedAt, modifiedContent, content);

      expect(state.status).toBe("PUBLISHED");
      expect(state.hasDraftChanges).toBe(true);
      expect(state.canPublish).toBe(true); // Can publish changes
      expect(state.canUnpublish).toBe(true);
      expect(state.canDiscardDraft).toBe(true);
      expect(state.canArchive).toBe(true);
    });

    it("computes state for ARCHIVED page", () => {
      const state = computeLifecycleState("ARCHIVED", null, content, null);

      expect(state.status).toBe("ARCHIVED");
      expect(state.canPublish).toBe(false);
      expect(state.canUnpublish).toBe(false);
      expect(state.canDiscardDraft).toBe(false);
      expect(state.canArchive).toBe(false);
    });
  });

  describe("getLifecycleMessage", () => {
    it("returns correct message for publish", () => {
      expect(getLifecycleMessage("publish")).toBe("Page published successfully");
    });

    it("returns correct message for unpublish", () => {
      expect(getLifecycleMessage("unpublish")).toBe("Page unpublished");
    });

    it("returns correct message for archive", () => {
      expect(getLifecycleMessage("archive")).toBe("Page archived");
    });

    it("returns correct message for discardDraft", () => {
      expect(getLifecycleMessage("discardDraft")).toBe("Draft changes discarded");
    });
  });

  describe("getLifecycleAuditData", () => {
    it("returns correct audit data for publish", () => {
      const audit = getLifecycleAuditData("publish", "DRAFT", "PUBLISHED");
      expect(audit.action).toBe("PUBLISH");
      expect(audit.before.status).toBe("DRAFT");
      expect(audit.after.status).toBe("PUBLISHED");
    });

    it("returns correct audit data for discardDraft (status unchanged)", () => {
      const audit = getLifecycleAuditData("discardDraft", "PUBLISHED", null);
      expect(audit.action).toBe("DISCARD_DRAFT");
      expect(audit.before.status).toBe("PUBLISHED");
      expect(audit.after.status).toBe("PUBLISHED"); // Status unchanged
    });

    it("includes extra data in audit", () => {
      const audit = getLifecycleAuditData("publish", "DRAFT", "PUBLISHED", { foo: "bar" });
      expect(audit.before.foo).toBe("bar");
      expect(audit.after.foo).toBe("bar");
    });
  });
});
