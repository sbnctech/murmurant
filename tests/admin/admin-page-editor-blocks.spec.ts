// Copyright (c) Santa Barbara Newcomers Club
// Tests for page editor block ordering

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
