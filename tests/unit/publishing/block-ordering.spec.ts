import { describe, expect, test } from "vitest";
import { moveBlockDown, moveBlockUp, reorderBlocks } from "@/lib/publishing/blockOrdering";

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
