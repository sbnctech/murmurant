// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for block reorder algorithm

import { describe, it, expect } from "vitest";
import type { Block, TextBlock } from "@/lib/publishing/blocks";

// Reorder function (same logic as in block API)
function reorderBlocks(blocks: Block[], newOrder: string[]): Block[] {
  const blockMap = new Map(blocks.map((b) => [b.id, b]));
  return newOrder.map((id, index) => {
    const block = blockMap.get(id)!;
    return { ...block, order: index };
  });
}

// Helper to create test blocks
function createTestBlocks(count: number): Block[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `block-${i}`,
    type: "text" as const,
    order: i,
    data: { content: `Content ${i}` },
  }));
}

describe("Block Reorder Algorithm", () => {
  describe("Basic reordering", () => {
    it("maintains same order when IDs unchanged", () => {
      const blocks = createTestBlocks(3);
      const newOrder = ["block-0", "block-1", "block-2"];

      const result = reorderBlocks(blocks, newOrder);

      expect(result.map((b) => b.id)).toEqual(newOrder);
      expect(result.map((b) => b.order)).toEqual([0, 1, 2]);
    });

    it("reverses order correctly", () => {
      const blocks = createTestBlocks(3);
      const newOrder = ["block-2", "block-1", "block-0"];

      const result = reorderBlocks(blocks, newOrder);

      expect(result.map((b) => b.id)).toEqual(newOrder);
      expect(result.map((b) => b.order)).toEqual([0, 1, 2]);
    });

    it("moves first to last", () => {
      const blocks = createTestBlocks(3);
      const newOrder = ["block-1", "block-2", "block-0"];

      const result = reorderBlocks(blocks, newOrder);

      expect(result.map((b) => b.id)).toEqual(newOrder);
      expect(result[0].id).toBe("block-1");
      expect(result[0].order).toBe(0);
      expect(result[2].id).toBe("block-0");
      expect(result[2].order).toBe(2);
    });

    it("moves last to first", () => {
      const blocks = createTestBlocks(3);
      const newOrder = ["block-2", "block-0", "block-1"];

      const result = reorderBlocks(blocks, newOrder);

      expect(result.map((b) => b.id)).toEqual(newOrder);
      expect(result[0].id).toBe("block-2");
      expect(result[0].order).toBe(0);
    });

    it("moves middle block", () => {
      const blocks = createTestBlocks(5);
      const newOrder = ["block-0", "block-2", "block-1", "block-3", "block-4"];

      const result = reorderBlocks(blocks, newOrder);

      expect(result.map((b) => b.id)).toEqual(newOrder);
      expect(result[1].id).toBe("block-2");
      expect(result[1].order).toBe(1);
    });
  });

  describe("Order consistency", () => {
    it("produces sequential orders starting from 0", () => {
      const blocks = createTestBlocks(5);
      const newOrder = ["block-4", "block-2", "block-0", "block-3", "block-1"];

      const result = reorderBlocks(blocks, newOrder);

      expect(result.map((b) => b.order)).toEqual([0, 1, 2, 3, 4]);
    });

    it("produces no duplicate orders", () => {
      const blocks = createTestBlocks(10);
      const shuffled = [...blocks].sort(() => Math.random() - 0.5);
      const newOrder = shuffled.map((b) => b.id);

      const result = reorderBlocks(blocks, newOrder);
      const orders = result.map((b) => b.order);
      const uniqueOrders = new Set(orders);

      expect(uniqueOrders.size).toBe(orders.length);
    });

    it("preserves block data during reorder", () => {
      const blocks: TextBlock[] = [
        { id: "a", type: "text", order: 0, data: { content: "First" } },
        { id: "b", type: "text", order: 1, data: { content: "Second" } },
        { id: "c", type: "text", order: 2, data: { content: "Third" } },
      ];

      const result = reorderBlocks(blocks, ["c", "a", "b"]);

      expect((result[0] as TextBlock).data.content).toBe("Third");
      expect((result[1] as TextBlock).data.content).toBe("First");
      expect((result[2] as TextBlock).data.content).toBe("Second");
    });
  });

  describe("Edge cases", () => {
    it("handles single block", () => {
      const blocks = createTestBlocks(1);
      const newOrder = ["block-0"];

      const result = reorderBlocks(blocks, newOrder);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("block-0");
      expect(result[0].order).toBe(0);
    });

    it("handles empty array", () => {
      const blocks: Block[] = [];
      const newOrder: string[] = [];

      const result = reorderBlocks(blocks, newOrder);

      expect(result).toHaveLength(0);
    });

    it("handles two blocks swap", () => {
      const blocks = createTestBlocks(2);
      const newOrder = ["block-1", "block-0"];

      const result = reorderBlocks(blocks, newOrder);

      expect(result[0].id).toBe("block-1");
      expect(result[0].order).toBe(0);
      expect(result[1].id).toBe("block-0");
      expect(result[1].order).toBe(1);
    });

    it("handles large number of blocks", () => {
      const blocks = createTestBlocks(100);
      const newOrder = blocks.map((b) => b.id).reverse();

      const result = reorderBlocks(blocks, newOrder);

      expect(result).toHaveLength(100);
      expect(result[0].id).toBe("block-99");
      expect(result[99].id).toBe("block-0");
      expect(result.map((b) => b.order)).toEqual(Array.from({ length: 100 }, (_, i) => i));
    });
  });

  describe("Block type preservation", () => {
    it("preserves different block types", () => {
      const blocks: Block[] = [
        { id: "hero-1", type: "hero", order: 0, data: { title: "Title" } },
        { id: "text-1", type: "text", order: 1, data: { content: "Content" } },
        { id: "image-1", type: "image", order: 2, data: { src: "img.jpg", alt: "Image" } },
      ];

      const result = reorderBlocks(blocks, ["image-1", "hero-1", "text-1"]);

      expect(result[0].type).toBe("image");
      expect(result[1].type).toBe("hero");
      expect(result[2].type).toBe("text");
    });
  });

  describe("Delete and reorder simulation", () => {
    it("correctly handles remaining blocks after delete", () => {
      // Simulate deleting block-1 and reordering remaining
      const blocks = createTestBlocks(3);
      const remaining = blocks.filter((b) => b.id !== "block-1");
      const newOrder = remaining.map((b) => b.id);

      const result = reorderBlocks(remaining, newOrder);

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.order)).toEqual([0, 1]);
    });
  });
});
