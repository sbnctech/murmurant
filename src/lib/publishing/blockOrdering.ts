// ClubOS - Page Editor v1.1
// Block ordering helpers: flat array, explicit reorder, renumber "order" field.
// Requirements:
// - Pure functions (do not mutate inputs)
// - Silent no-op on invalid operations
// - Renumber "order" field after any successful reorder (order == array index)

export type OrderedBlock = { order: number } & Record<string, unknown>;

function clampIndex(i: number, len: number): number {
  if (i < 0) return 0;
  if (i >= len) return len - 1;
  return i;
}

function isInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n);
}

/**
 * Reorder a flat list of blocks by moving the element at fromIndex to toIndex.
 * - Returns the original array reference if the move is invalid or a no-op.
 * - Returns a NEW array with NEW objects (renumbered "order") on success.
 */
export function reorderBlocks<T extends OrderedBlock>(
  blocks: ReadonlyArray<T>,
  fromIndex: number,
  toIndex: number
): ReadonlyArray<T> {
  const len = blocks.length;

  if (len <= 1) return blocks;
  if (!isInt(fromIndex) || !isInt(toIndex)) return blocks;
  if (fromIndex < 0 || fromIndex >= len) return blocks;

  const clampedTo = clampIndex(toIndex, len);
  if (fromIndex === clampedTo) return blocks;

  const next = blocks.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(clampedTo, 0, moved);

  // Renumber order field, returning new objects (do not mutate originals).
  const renumbered = next.map((b, idx) => ({ ...b, order: idx })) as T[];
  return renumbered;
}

export function moveBlockUp<T extends OrderedBlock>(
  blocks: ReadonlyArray<T>,
  index: number
): ReadonlyArray<T> {
  return reorderBlocks(blocks, index, index - 1);
}

export function moveBlockDown<T extends OrderedBlock>(
  blocks: ReadonlyArray<T>,
  index: number
): ReadonlyArray<T> {
  return reorderBlocks(blocks, index, index + 1);
}
