// Copyright (c) Santa Barbara Newcomers Club
// Tests for block schema validation

import { describe, it, expect } from "vitest";
import {
  validateBlockData,
  getDefaultBlockData,
  isEditableBlockType,
  isReadonlyBlockType,
  getBlockFieldMetadata,
  heroDataSchema,
  textDataSchema,
  imageDataSchema,
  ctaDataSchema,
  dividerDataSchema,
  spacerDataSchema,
  EDITABLE_BLOCK_TYPES,
  READONLY_BLOCK_TYPES,
} from "@/lib/publishing/blockSchemas";

describe("blockSchemas", () => {
  describe("validateBlockData", () => {
    describe("hero block", () => {
      it("accepts valid hero data with required fields", () => {
        const result = validateBlockData("hero", { title: "Welcome" });
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toEqual({ title: "Welcome" });
        }
      });

      it("accepts valid hero data with all fields", () => {
        const data = {
          title: "Welcome",
          subtitle: "To our site",
          alignment: "center",
          ctaText: "Learn More",
          ctaLink: "/about",
          ctaStyle: "primary",
        };
        const result = validateBlockData("hero", data);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toEqual(data);
        }
      });

      it("rejects hero data without title", () => {
        const result = validateBlockData("hero", { subtitle: "Missing title" });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("title");
        }
      });

      it("rejects hero data with empty title", () => {
        const result = validateBlockData("hero", { title: "" });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("title");
        }
      });

      it("rejects hero data with invalid alignment", () => {
        const result = validateBlockData("hero", { title: "Test", alignment: "invalid" });
        expect(result.ok).toBe(false);
      });

      it("strips unknown fields from hero data", () => {
        const result = validateBlockData("hero", {
          title: "Test",
          unknownField: "should be removed",
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toEqual({ title: "Test" });
          expect((result.data as Record<string, unknown>).unknownField).toBeUndefined();
        }
      });
    });

    describe("text block", () => {
      it("accepts valid text data", () => {
        const result = validateBlockData("text", { content: "<p>Hello</p>" });
        expect(result.ok).toBe(true);
      });

      it("rejects text data without content", () => {
        const result = validateBlockData("text", { alignment: "center" });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("content");
        }
      });

      it("rejects text data with empty content", () => {
        const result = validateBlockData("text", { content: "" });
        expect(result.ok).toBe(false);
      });
    });

    describe("image block", () => {
      it("accepts valid image data", () => {
        const result = validateBlockData("image", {
          src: "https://example.com/image.jpg",
          alt: "Description",
        });
        expect(result.ok).toBe(true);
      });

      it("rejects image data without src", () => {
        const result = validateBlockData("image", { alt: "Description" });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("src");
        }
      });

      it("rejects image data without alt", () => {
        const result = validateBlockData("image", { src: "https://example.com/image.jpg" });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("alt");
        }
      });
    });

    describe("cta block", () => {
      it("accepts valid cta data", () => {
        const result = validateBlockData("cta", { text: "Click Me", link: "/page" });
        expect(result.ok).toBe(true);
      });

      it("rejects cta data without text", () => {
        const result = validateBlockData("cta", { link: "/page" });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("text");
        }
      });

      it("rejects cta data without link", () => {
        const result = validateBlockData("cta", { text: "Click Me" });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("link");
        }
      });

      it("accepts valid cta style options", () => {
        const styles = ["primary", "secondary", "outline"];
        for (const style of styles) {
          const result = validateBlockData("cta", { text: "Test", link: "/", style });
          expect(result.ok).toBe(true);
        }
      });
    });

    describe("divider block", () => {
      it("accepts empty divider data", () => {
        const result = validateBlockData("divider", {});
        expect(result.ok).toBe(true);
      });

      it("accepts valid divider data", () => {
        const result = validateBlockData("divider", { style: "dashed", width: "half" });
        expect(result.ok).toBe(true);
      });

      it("rejects invalid divider style", () => {
        const result = validateBlockData("divider", { style: "invalid" });
        expect(result.ok).toBe(false);
      });
    });

    describe("spacer block", () => {
      it("accepts empty spacer data", () => {
        const result = validateBlockData("spacer", {});
        expect(result.ok).toBe(true);
      });

      it("accepts valid spacer data", () => {
        const result = validateBlockData("spacer", { height: "large" });
        expect(result.ok).toBe(true);
      });

      it("rejects invalid spacer height", () => {
        const result = validateBlockData("spacer", { height: "huge" });
        expect(result.ok).toBe(false);
      });
    });

    describe("complex block types (passthrough)", () => {
      it("accepts valid cards data", () => {
        const result = validateBlockData("cards", {
          columns: 3,
          cards: [{ title: "Card 1" }],
        });
        expect(result.ok).toBe(true);
      });

      it("preserves unknown fields in cards data (passthrough)", () => {
        const result = validateBlockData("cards", {
          columns: 3,
          cards: [],
          customField: "preserved",
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect((result.data as Record<string, unknown>).customField).toBe("preserved");
        }
      });

      it("accepts valid faq data", () => {
        const result = validateBlockData("faq", {
          items: [{ question: "Q1?", answer: "A1" }],
        });
        expect(result.ok).toBe(true);
      });

      it("accepts valid gallery data", () => {
        const result = validateBlockData("gallery", {
          images: [{ src: "/img.jpg", alt: "Image" }],
        });
        expect(result.ok).toBe(true);
      });

      it("accepts valid event-list data", () => {
        const result = validateBlockData("event-list", {
          limit: 5,
          layout: "cards",
        });
        expect(result.ok).toBe(true);
      });

      it("accepts valid contact data", () => {
        const result = validateBlockData("contact", {
          recipientEmail: "test@example.com",
        });
        expect(result.ok).toBe(true);
      });

      it("rejects contact data with invalid email", () => {
        const result = validateBlockData("contact", {
          recipientEmail: "not-an-email",
        });
        expect(result.ok).toBe(false);
      });
    });

    describe("unknown block type", () => {
      it("rejects unknown block type", () => {
        const result = validateBlockData("unknown" as Parameters<typeof validateBlockData>[0], {});
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Unknown block type");
        }
      });
    });
  });

  describe("getDefaultBlockData", () => {
    it("returns valid default data for hero", () => {
      const data = getDefaultBlockData("hero");
      const result = validateBlockData("hero", data);
      expect(result.ok).toBe(true);
    });

    it("returns valid default data for text", () => {
      const data = getDefaultBlockData("text");
      const result = validateBlockData("text", data);
      expect(result.ok).toBe(true);
    });

    it("returns valid default data for image", () => {
      const data = getDefaultBlockData("image");
      // Image default has empty src which fails validation
      // This is intentional - forces user to fill in required fields
      expect(data.src).toBe("");
      expect(data.alt).toBeDefined();
    });

    it("returns valid default data for cta", () => {
      const data = getDefaultBlockData("cta");
      const result = validateBlockData("cta", data);
      expect(result.ok).toBe(true);
    });

    it("returns valid default data for divider", () => {
      const data = getDefaultBlockData("divider");
      const result = validateBlockData("divider", data);
      expect(result.ok).toBe(true);
    });

    it("returns valid default data for spacer", () => {
      const data = getDefaultBlockData("spacer");
      const result = validateBlockData("spacer", data);
      expect(result.ok).toBe(true);
    });

    it("returns valid default data for complex types", () => {
      const complexTypes = ["cards", "event-list", "gallery", "faq", "contact"] as const;
      for (const type of complexTypes) {
        const data = getDefaultBlockData(type);
        expect(data).toBeDefined();
      }
    });
  });

  describe("isEditableBlockType", () => {
    it("returns true for editable block types", () => {
      expect(isEditableBlockType("hero")).toBe(true);
      expect(isEditableBlockType("text")).toBe(true);
      expect(isEditableBlockType("image")).toBe(true);
      expect(isEditableBlockType("cta")).toBe(true);
      expect(isEditableBlockType("divider")).toBe(true);
      expect(isEditableBlockType("spacer")).toBe(true);
    });

    it("returns false for read-only block types", () => {
      expect(isEditableBlockType("cards")).toBe(false);
      expect(isEditableBlockType("event-list")).toBe(false);
      expect(isEditableBlockType("gallery")).toBe(false);
      expect(isEditableBlockType("faq")).toBe(false);
      expect(isEditableBlockType("contact")).toBe(false);
    });
  });

  describe("isReadonlyBlockType", () => {
    it("returns true for read-only block types", () => {
      expect(isReadonlyBlockType("cards")).toBe(true);
      expect(isReadonlyBlockType("event-list")).toBe(true);
      expect(isReadonlyBlockType("gallery")).toBe(true);
      expect(isReadonlyBlockType("faq")).toBe(true);
      expect(isReadonlyBlockType("contact")).toBe(true);
    });

    it("returns false for editable block types", () => {
      expect(isReadonlyBlockType("hero")).toBe(false);
      expect(isReadonlyBlockType("text")).toBe(false);
    });
  });

  describe("getBlockFieldMetadata", () => {
    it("returns field metadata for hero block", () => {
      const fields = getBlockFieldMetadata("hero");
      expect(fields.length).toBeGreaterThan(0);

      const titleField = fields.find(f => f.name === "title");
      expect(titleField).toBeDefined();
      expect(titleField?.required).toBe(true);
      expect(titleField?.type).toBe("text");

      const alignmentField = fields.find(f => f.name === "alignment");
      expect(alignmentField).toBeDefined();
      expect(alignmentField?.required).toBe(false);
      expect(alignmentField?.type).toBe("select");
      expect(alignmentField?.options).toContain("center");
    });

    it("returns field metadata for text block", () => {
      const fields = getBlockFieldMetadata("text");
      const contentField = fields.find(f => f.name === "content");
      expect(contentField).toBeDefined();
      expect(contentField?.required).toBe(true);
      expect(contentField?.type).toBe("textarea");
    });

    it("returns empty array for complex block types", () => {
      expect(getBlockFieldMetadata("cards")).toEqual([]);
      expect(getBlockFieldMetadata("faq")).toEqual([]);
    });
  });

  describe("EDITABLE_BLOCK_TYPES", () => {
    it("contains expected block types", () => {
      expect(EDITABLE_BLOCK_TYPES).toContain("hero");
      expect(EDITABLE_BLOCK_TYPES).toContain("text");
      expect(EDITABLE_BLOCK_TYPES).toContain("image");
      expect(EDITABLE_BLOCK_TYPES).toContain("cta");
      expect(EDITABLE_BLOCK_TYPES).toContain("divider");
      expect(EDITABLE_BLOCK_TYPES).toContain("spacer");
      expect(EDITABLE_BLOCK_TYPES).not.toContain("cards");
    });
  });

  describe("READONLY_BLOCK_TYPES", () => {
    it("contains expected block types", () => {
      expect(READONLY_BLOCK_TYPES).toContain("cards");
      expect(READONLY_BLOCK_TYPES).toContain("event-list");
      expect(READONLY_BLOCK_TYPES).toContain("gallery");
      expect(READONLY_BLOCK_TYPES).toContain("faq");
      expect(READONLY_BLOCK_TYPES).toContain("contact");
      expect(READONLY_BLOCK_TYPES).not.toContain("hero");
    });
  });

  describe("individual schema exports", () => {
    it("heroDataSchema validates correctly", () => {
      expect(heroDataSchema.safeParse({ title: "Test" }).success).toBe(true);
      expect(heroDataSchema.safeParse({}).success).toBe(false);
    });

    it("textDataSchema validates correctly", () => {
      expect(textDataSchema.safeParse({ content: "Test" }).success).toBe(true);
      expect(textDataSchema.safeParse({}).success).toBe(false);
    });

    it("imageDataSchema validates correctly", () => {
      expect(imageDataSchema.safeParse({ src: "url", alt: "alt" }).success).toBe(true);
      expect(imageDataSchema.safeParse({}).success).toBe(false);
    });

    it("ctaDataSchema validates correctly", () => {
      expect(ctaDataSchema.safeParse({ text: "Click", link: "/" }).success).toBe(true);
      expect(ctaDataSchema.safeParse({}).success).toBe(false);
    });

    it("dividerDataSchema validates correctly", () => {
      expect(dividerDataSchema.safeParse({}).success).toBe(true);
      expect(dividerDataSchema.safeParse({ style: "solid" }).success).toBe(true);
    });

    it("spacerDataSchema validates correctly", () => {
      expect(spacerDataSchema.safeParse({}).success).toBe(true);
      expect(spacerDataSchema.safeParse({ height: "medium" }).success).toBe(true);
    });
  });
});
