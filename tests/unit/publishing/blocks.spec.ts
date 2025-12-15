// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for block content validation

import { describe, it, expect } from "vitest";
import {
  validatePageContent,
  createDefaultPageContent,
  createEmptyBlock,
  BLOCK_METADATA,
  PageContent,
  BlockType,
} from "@/lib/publishing/blocks";

describe("Block Content System", () => {
  describe("validatePageContent", () => {
    it("validates valid page content", () => {
      const content: PageContent = {
        schemaVersion: 1,
        blocks: [
          {
            id: "b1",
            type: "text",
            order: 0,
            data: { content: "Hello world" },
          },
        ],
      };

      const result = validatePageContent(content);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates empty blocks array", () => {
      const content: PageContent = {
        schemaVersion: 1,
        blocks: [],
      };

      const result = validatePageContent(content);

      expect(result.valid).toBe(true);
    });

    it("rejects non-object content", () => {
      const result = validatePageContent("invalid");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Content must be an object");
    });

    it("rejects null content", () => {
      const result = validatePageContent(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Content must be an object");
    });

    it("rejects content without schemaVersion", () => {
      const result = validatePageContent({ blocks: [] });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("schemaVersion must be a number");
    });

    it("rejects content without blocks array", () => {
      const result = validatePageContent({ schemaVersion: 1, blocks: "invalid" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("blocks must be an array");
    });

    it("rejects blocks without id", () => {
      const content = {
        schemaVersion: 1,
        blocks: [
          { type: "text", order: 0, data: { content: "test" } },
        ],
      };

      const result = validatePageContent(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("missing or invalid id"))).toBe(true);
    });

    it("rejects blocks without type", () => {
      const content = {
        schemaVersion: 1,
        blocks: [
          { id: "b1", order: 0, data: { content: "test" } },
        ],
      };

      const result = validatePageContent(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("missing or invalid type"))).toBe(true);
    });

    it("rejects blocks without order", () => {
      const content = {
        schemaVersion: 1,
        blocks: [
          { id: "b1", type: "text", data: { content: "test" } },
        ],
      };

      const result = validatePageContent(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("missing or invalid order"))).toBe(true);
    });

    it("rejects blocks without data", () => {
      const content = {
        schemaVersion: 1,
        blocks: [
          { id: "b1", type: "text", order: 0 },
        ],
      };

      const result = validatePageContent(content);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("missing or invalid data"))).toBe(true);
    });
  });

  describe("createDefaultPageContent", () => {
    it("creates valid content structure", () => {
      const content = createDefaultPageContent();

      expect(content.schemaVersion).toBe(1);
      expect(content.blocks).toBeDefined();
      expect(Array.isArray(content.blocks)).toBe(true);
    });

    it("creates content that passes validation", () => {
      const content = createDefaultPageContent();
      const result = validatePageContent(content);

      expect(result.valid).toBe(true);
    });

    it("includes a hero block", () => {
      const content = createDefaultPageContent();

      expect(content.blocks.some((b) => b.type === "hero")).toBe(true);
    });

    it("includes a text block", () => {
      const content = createDefaultPageContent();

      expect(content.blocks.some((b) => b.type === "text")).toBe(true);
    });
  });

  describe("createEmptyBlock", () => {
    const blockTypes: BlockType[] = [
      "hero",
      "text",
      "image",
      "cards",
      "event-list",
      "gallery",
      "faq",
      "contact",
      "cta",
      "divider",
      "spacer",
    ];

    it.each(blockTypes)("creates valid %s block", (type) => {
      const block = createEmptyBlock(type, 0);

      expect(block.id).toBeDefined();
      expect(block.type).toBe(type);
      expect(block.order).toBe(0);
      expect(block.data).toBeDefined();
    });

    it("creates hero block with required data", () => {
      const block = createEmptyBlock("hero", 0);

      expect(block.type).toBe("hero");
      expect((block as { data: { title: string } }).data.title).toBeDefined();
    });

    it("creates text block with content", () => {
      const block = createEmptyBlock("text", 0);

      expect(block.type).toBe("text");
      expect((block as { data: { content: string } }).data.content).toBeDefined();
    });

    it("creates contact block with fields", () => {
      const block = createEmptyBlock("contact", 0);

      expect(block.type).toBe("contact");
      expect((block as { data: { fields: unknown[] } }).data.fields).toBeDefined();
    });

    it("preserves order parameter", () => {
      const block = createEmptyBlock("text", 5);

      expect(block.order).toBe(5);
    });
  });

  describe("BLOCK_METADATA", () => {
    const blockTypes: BlockType[] = [
      "hero",
      "text",
      "image",
      "cards",
      "event-list",
      "gallery",
      "faq",
      "contact",
      "cta",
      "divider",
      "spacer",
    ];

    it.each(blockTypes)("has metadata for %s", (type) => {
      const metadata = BLOCK_METADATA[type];

      expect(metadata).toBeDefined();
      expect(metadata.label).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.icon).toBeDefined();
      expect(metadata.category).toBeDefined();
    });

    it("categorizes hero as content", () => {
      expect(BLOCK_METADATA.hero.category).toBe("content");
    });

    it("categorizes image as media", () => {
      expect(BLOCK_METADATA.image.category).toBe("media");
    });

    it("categorizes contact as interactive", () => {
      expect(BLOCK_METADATA.contact.category).toBe("interactive");
    });

    it("categorizes divider as layout", () => {
      expect(BLOCK_METADATA.divider.category).toBe("layout");
    });
  });
});
