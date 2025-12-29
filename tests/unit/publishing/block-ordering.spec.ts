import { describe, expect, test } from "vitest";
import { moveBlockDown, moveBlockUp, reorderBlocks } from "@/lib/publishing/blockOrdering";
import { arrayMove } from "@dnd-kit/sortable";

type B = { id: string; order: number; kind: string };

function mk(ids: string[]): B[] {
  return ids.map((id, i) => ({ id, order: i, kind: "x" }));
}

describe("blockOrdering.reorderBlocks", () => {
  test("no-op: empty", () => {
    const b: B[] = [];
    const out = reorderBlocks(b, 0, 1);
    expect(out).toBe(b);
  });

  test("no-op: single item", () => {
    const b = mk(["a"]);
    const out = reorderBlocks(b, 0, 0);
    expect(out).toBe(b);
  });

  test("no-op: invalid indices", () => {
    const b = mk(["a", "b", "c"]);
    expect(reorderBlocks(b, -1, 1)).toBe(b);
    expect(reorderBlocks(b, 3, 1)).toBe(b);
    expect(reorderBlocks(b, 1, 99)).not.toBe(b); // valid, clamped
  });

  test("move item to new position and renumber orders", () => {
    const b = mk(["a", "b", "c", "d"]);
    const out = reorderBlocks(b, 1, 3);
    expect(out).not.toBe(b);
    expect(out.map((x) => x.id)).toEqual(["a", "c", "d", "b"]);
    expect(out.map((x) => x.order)).toEqual([0, 1, 2, 3]);
    // originals not mutated
    expect(b.map((x) => x.order)).toEqual([0, 1, 2, 3]);
  });

  test("clamps toIndex below 0 and above length", () => {
    const b = mk(["a", "b", "c"]);
    const out1 = reorderBlocks(b, 2, -999);
    expect(out1.map((x) => x.id)).toEqual(["c", "a", "b"]);
    expect(out1.map((x) => x.order)).toEqual([0, 1, 2]);

    const out2 = reorderBlocks(b, 0, 999);
    expect(out2.map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(out2.map((x) => x.order)).toEqual([0, 1, 2]);
  });
});

describe("blockOrdering.moveBlockUp/down", () => {
  test("moveBlockUp no-op at top", () => {
    const b = mk(["a", "b"]);
    const out = moveBlockUp(b, 0);
    expect(out).toBe(b);
  });

  test("moveBlockDown no-op at bottom", () => {
    const b = mk(["a", "b"]);
    const out = moveBlockDown(b, 1);
    expect(out).toBe(b);
  });

  test("moveBlockUp and moveBlockDown reorder correctly", () => {
    const b = mk(["a", "b", "c"]);
    const up = moveBlockUp(b, 2);
    expect(up.map((x) => x.id)).toEqual(["a", "c", "b"]);
    expect(up.map((x) => x.order)).toEqual([0, 1, 2]);

    const down = moveBlockDown(b, 0);
    expect(down.map((x) => x.id)).toEqual(["b", "a", "c"]);
    expect(down.map((x) => x.order)).toEqual([0, 1, 2]);
  });
});

// A2: Tests for DnD integration with @dnd-kit/sortable
describe("@dnd-kit/sortable arrayMove compatibility", () => {
  test("arrayMove produces same ID order as reorderBlocks", () => {
    const b = mk(["a", "b", "c", "d"]);

    // Drag item at index 1 to index 3
    const dndResult = arrayMove(b, 1, 3);
    const reorderResult = reorderBlocks(b, 1, 3);

    expect(dndResult.map((x) => x.id)).toEqual(reorderResult.map((x) => x.id));
  });

  test("arrayMove + order update matches reorderBlocks output", () => {
    const b = mk(["a", "b", "c", "d"]);

    // This is the pattern used in SortableBlockList
    const dndResult = arrayMove(b, 1, 3).map((item, i) => ({
      ...item,
      order: i,
    }));
    const reorderResult = reorderBlocks(b, 1, 3);

    expect(dndResult.map((x) => x.id)).toEqual(reorderResult.map((x) => x.id));
    expect(dndResult.map((x) => x.order)).toEqual(
      reorderResult.map((x) => x.order)
    );
  });

  test("drag first to last matches button-based moveDown sequence", () => {
    const b = mk(["a", "b", "c"]);

    // Drag from first (0) to last (2)
    const dndResult = arrayMove(b, 0, 2).map((item, i) => ({
      ...item,
      order: i,
    }));

    // Equivalent button clicks: moveDown twice
    let buttonResult = moveBlockDown(b, 0);
    buttonResult = moveBlockDown(buttonResult, 1);

    expect(dndResult.map((x) => x.id)).toEqual(
      buttonResult.map((x) => x.id)
    );
  });

  test("drag last to first matches button-based moveUp sequence", () => {
    const b = mk(["a", "b", "c"]);

    // Drag from last (2) to first (0)
    const dndResult = arrayMove(b, 2, 0).map((item, i) => ({
      ...item,
      order: i,
    }));

    // Equivalent button clicks: moveUp twice
    let buttonResult = moveBlockUp(b, 2);
    buttonResult = moveBlockUp(buttonResult, 1);

    expect(dndResult.map((x) => x.id)).toEqual(
      buttonResult.map((x) => x.id)
    );
  });

  test("arrayMove handles edge cases safely", () => {
    const b = mk(["a"]);
    // Single item list - no-op
    const result = arrayMove(b, 0, 0);
    expect(result.map((x) => x.id)).toEqual(["a"]);
  });
});
