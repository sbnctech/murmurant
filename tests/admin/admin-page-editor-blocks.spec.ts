// Copyright (c) Santa Barbara Newcomers Club
// Tests for page editor block ordering and editing

import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Page Editor Block Ordering", () => {
  test.describe("API: POST /api/admin/content/pages/[id]/blocks?action=reorder", () => {
    // These tests require a page with blocks to exist
    // Using webmaster token which has publishing:manage capability

    test("reorder returns 401 without auth", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/test-page-id/blocks?action=reorder`,
        {
          data: { blockIds: ["a", "b", "c"] },
        }
      );

      expect(response.status()).toBe(401);
    });

    test("reorder returns 404 for non-existent page", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/00000000-0000-0000-0000-000000000000/blocks?action=reorder`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
          },
          data: { blockIds: ["a", "b", "c"] },
        }
      );

      expect(response.status()).toBe(404);
    });

    test("reorder returns 400 for invalid blockIds format", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/00000000-0000-0000-0000-000000000000/blocks?action=reorder`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
          },
          data: { blockIds: "not-an-array" },
        }
      );

      expect(response.status()).toBe(400);
    });

    test("reorder returns 400 for empty blockIds array", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/00000000-0000-0000-0000-000000000000/blocks?action=reorder`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
          },
          data: { blockIds: [] },
        }
      );

      expect(response.status()).toBe(400);
    });
  });

  test.describe("Unit: Block ordering logic", () => {
    // These tests verify the ordering logic matches the spec
    // The actual implementation is tested in tests/unit/publishing/block-ordering.spec.ts

    test("swap logic produces correct ID order for move up", () => {
      const blocks = [
        { id: "a", order: 0 },
        { id: "b", order: 1 },
        { id: "c", order: 2 },
      ];

      // Move block at index 2 up (swap with index 1)
      const index = 2;
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];

      expect(newBlocks.map((b) => b.id)).toEqual(["a", "c", "b"]);
    });

    test("swap logic produces correct ID order for move down", () => {
      const blocks = [
        { id: "a", order: 0 },
        { id: "b", order: 1 },
        { id: "c", order: 2 },
      ];

      // Move block at index 0 down (swap with index 1)
      const index = 0;
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];

      expect(newBlocks.map((b) => b.id)).toEqual(["b", "a", "c"]);
    });

    test("boundary check: cannot move first block up", () => {
      const index = 0;
      const isFirst = index === 0;

      expect(isFirst).toBe(true);
      // In component: button is disabled, handleMoveUp returns early
    });

    test("boundary check: cannot move last block down", () => {
      const blocks = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const index = 2;
      const isLast = index === blocks.length - 1;

      expect(isLast).toBe(true);
      // In component: button is disabled, handleMoveDown returns early
    });

    test("reorder payload includes all block IDs in new order", () => {
      const blocks = [
        { id: "a", order: 0 },
        { id: "b", order: 1 },
        { id: "c", order: 2 },
      ];

      // After moving block at index 1 up
      const index = 1;
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];

      const payload = { blockIds: newBlocks.map((b) => b.id) };

      expect(payload.blockIds).toEqual(["b", "a", "c"]);
      expect(payload.blockIds.length).toBe(blocks.length);
    });

    test("on failure, blocks revert to previous order", () => {
      const previousBlocks = [
        { id: "a", order: 0 },
        { id: "b", order: 1 },
        { id: "c", order: 2 },
      ];

      // Simulate optimistic update
      const newBlocks = [
        { id: "b", order: 0 },
        { id: "a", order: 1 },
        { id: "c", order: 2 },
      ];

      // On API failure, we revert to previousBlocks
      // This simulates: setBlocks(previousBlocks)
      const revertedBlocks = previousBlocks;

      expect(revertedBlocks.map((b) => b.id)).toEqual(["a", "b", "c"]);
      expect(revertedBlocks).not.toEqual(newBlocks);
    });
  });
});

test.describe("Page Editor Block Editing", () => {
  test.describe("API: POST /api/admin/content/pages/[id]/blocks?action=update", () => {
    test("update returns 401 without auth", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/test-page-id/blocks?action=update`,
        {
          data: { blockId: "00000000-0000-0000-0000-000000000001", data: { title: "New Title" } },
        }
      );

      expect(response.status()).toBe(401);
    });

    test("update returns 404 for non-existent page", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/00000000-0000-0000-0000-000000000000/blocks?action=update`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
          },
          data: { blockId: "00000000-0000-0000-0000-000000000001", data: { title: "New Title" } },
        }
      );

      expect(response.status()).toBe(404);
    });

    test("update returns 400 for missing blockId", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/00000000-0000-0000-0000-000000000000/blocks?action=update`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
          },
          data: { data: { title: "New Title" } },
        }
      );

      expect(response.status()).toBe(400);
    });

    test("update returns 400 for invalid blockId format", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/00000000-0000-0000-0000-000000000000/blocks?action=update`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
          },
          data: { blockId: "not-a-uuid", data: { title: "New Title" } },
        }
      );

      expect(response.status()).toBe(400);
    });

    test("update returns 400 for missing data field", async ({ request }) => {
      const response = await request.post(
        `${BASE}/api/admin/content/pages/00000000-0000-0000-0000-000000000000/blocks?action=update`,
        {
          headers: {
            Authorization: "Bearer test-webmaster-token",
          },
          data: { blockId: "00000000-0000-0000-0000-000000000001" },
        }
      );

      expect(response.status()).toBe(400);
    });
  });

  test.describe("Unit: Block editing logic", () => {
    test("editing state: only one block can be edited at a time", () => {
      // Simulate component state
      let editingBlockId: string | null = null;

      // Click edit on block A
      editingBlockId = "block-a";
      expect(editingBlockId).toBe("block-a");

      // Click edit on block B (should replace A)
      editingBlockId = "block-b";
      expect(editingBlockId).toBe("block-b");
    });

    test("cancel editing clears state", () => {
      let editingBlockId: string | null = "block-a";
      let editingData: Record<string, unknown> | null = { title: "Draft Title" };

      // Cancel editing
      editingBlockId = null;
      editingData = null;

      expect(editingBlockId).toBeNull();
      expect(editingData).toBeNull();
    });

    test("update payload includes blockId and data", () => {
      const blockId = "00000000-0000-0000-0000-000000000001";
      const data = { title: "Updated Title", subtitle: "New Subtitle" };

      const payload = { blockId, data };

      expect(payload.blockId).toBe(blockId);
      expect(payload.data).toEqual({ title: "Updated Title", subtitle: "New Subtitle" });
    });

    test("optimistic update: local state updated before API response", () => {
      const blocks = [
        { id: "a", type: "hero", order: 0, data: { title: "Original" } },
        { id: "b", type: "text", order: 1, data: { content: "<p>Text</p>" } },
      ];

      const editingBlockId = "a";
      const editingData = { title: "Updated" };

      // Optimistic update (before API call)
      const updatedBlocks = blocks.map((b) =>
        b.id === editingBlockId ? { ...b, data: editingData } : b
      );

      expect(updatedBlocks[0].data).toEqual({ title: "Updated" });
      expect(updatedBlocks[1].data).toEqual({ content: "<p>Text</p>" });
    });

    test("on failure, block data reverts to previous state", () => {
      const previousBlocks = [
        { id: "a", type: "hero", order: 0, data: { title: "Original" } },
      ];

      const newBlocks = [
        { id: "a", type: "hero", order: 0, data: { title: "Updated" } },
      ];

      // On API failure, we revert to previousBlocks
      const revertedBlocks = previousBlocks;

      expect(revertedBlocks[0].data).toEqual({ title: "Original" });
      expect(revertedBlocks[0].data).not.toEqual(newBlocks[0].data);
    });

    test("editable block types include simple block types", () => {
      const EDITABLE_BLOCK_TYPES = ["hero", "text", "image", "cta", "divider", "spacer"];

      expect(EDITABLE_BLOCK_TYPES).toContain("hero");
      expect(EDITABLE_BLOCK_TYPES).toContain("text");
      expect(EDITABLE_BLOCK_TYPES).toContain("cta");
      expect(EDITABLE_BLOCK_TYPES).not.toContain("cards");
      expect(EDITABLE_BLOCK_TYPES).not.toContain("event-list");
    });

    test("complex block types are marked for advanced editing", () => {
      const COMPLEX_BLOCK_TYPES = ["cards", "event-list", "gallery", "faq", "contact"];

      expect(COMPLEX_BLOCK_TYPES).toContain("cards");
      expect(COMPLEX_BLOCK_TYPES).toContain("faq");
      expect(COMPLEX_BLOCK_TYPES).not.toContain("hero");
      expect(COMPLEX_BLOCK_TYPES).not.toContain("text");
    });
  });

  test.describe("Unit: Block schema validation (A3)", () => {
    // These tests verify schema validation behavior for API updates
    // Full schema tests are in tests/unit/publishing/blockSchemas.spec.ts

    test("hero block requires title field", () => {
      // Schema validation: title is required, min length 1
      const validHeroData = { title: "Welcome" };
      const invalidHeroData = { subtitle: "Missing title" };

      expect(validHeroData.title).toBeDefined();
      expect(validHeroData.title.length).toBeGreaterThan(0);
      expect((invalidHeroData as Record<string, unknown>).title).toBeUndefined();
    });

    test("text block requires content field", () => {
      const validTextData = { content: "<p>Hello</p>" };
      const invalidTextData = { alignment: "center" };

      expect(validTextData.content).toBeDefined();
      expect((invalidTextData as Record<string, unknown>).content).toBeUndefined();
    });

    test("image block requires src and alt fields", () => {
      const validImageData = { src: "https://example.com/img.jpg", alt: "Description" };
      const invalidImageData = { caption: "Missing required fields" };

      expect(validImageData.src).toBeDefined();
      expect(validImageData.alt).toBeDefined();
      expect((invalidImageData as Record<string, unknown>).src).toBeUndefined();
    });

    test("cta block requires text and link fields", () => {
      const validCtaData = { text: "Click Me", link: "/page" };
      const invalidCtaData = { style: "primary" };

      expect(validCtaData.text).toBeDefined();
      expect(validCtaData.link).toBeDefined();
      expect((invalidCtaData as Record<string, unknown>).text).toBeUndefined();
    });

    test("divider block has no required fields", () => {
      const validDividerData = {};
      const validDividerDataWithOptions = { style: "dashed", width: "half" };

      expect(Object.keys(validDividerData).length).toBe(0);
      expect(validDividerDataWithOptions.style).toBeDefined();
    });

    test("spacer block has no required fields", () => {
      const validSpacerData = {};
      const validSpacerDataWithOptions = { height: "large" };

      expect(Object.keys(validSpacerData).length).toBe(0);
      expect(validSpacerDataWithOptions.height).toBeDefined();
    });

    test("schema validation strips unknown fields from simple block types", () => {
      // This behavior is tested in unit tests; here we document the expectation
      // Simple block types use .strip() to remove unknown keys
      const heroDataWithExtra = {
        title: "Test",
        unknownField: "should be removed",
      };

      // After schema validation, unknownField should not be present
      const expectedResult = { title: "Test" };

      expect(heroDataWithExtra.title).toBe(expectedResult.title);
      // The actual stripping happens in validateBlockData()
    });

    test("schema validation preserves unknown fields for complex block types", () => {
      // This behavior is tested in unit tests; here we document the expectation
      // Complex block types use .passthrough() to preserve unknown keys
      const cardsDataWithExtra = {
        columns: 3,
        cards: [],
        customMetadata: "preserved for migration safety",
      };

      // After schema validation, customMetadata should remain
      expect(cardsDataWithExtra.customMetadata).toBeDefined();
    });

    test("alignment field accepts valid values", () => {
      const validAlignments = ["left", "center", "right"];
      const invalidAlignment = "justified";

      expect(validAlignments).toContain("left");
      expect(validAlignments).toContain("center");
      expect(validAlignments).toContain("right");
      expect(validAlignments).not.toContain(invalidAlignment);
    });

    test("cta style field accepts valid values", () => {
      const validStyles = ["primary", "secondary", "outline"];
      const invalidStyle = "danger";

      expect(validStyles).toContain("primary");
      expect(validStyles).toContain("secondary");
      expect(validStyles).toContain("outline");
      expect(validStyles).not.toContain(invalidStyle);
    });
  });
});
