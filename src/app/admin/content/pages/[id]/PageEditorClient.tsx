// Copyright (c) Santa Barbara Newcomers Club
// Page editor client component - block list with ordering controls

"use client";

import { useState } from "react";
import { Block } from "@/lib/publishing/blocks";
import { BLOCK_METADATA } from "@/lib/publishing/blocks";

type Props = {
  pageId: string;
  initialBlocks: Block[];
};

export default function PageEditorClient({ pageId, initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reorder API call
  async function saveBlockOrder(newBlocks: Block[], previousBlocks: Block[]) {
    setSaving(true);
    setError(null);
    try {
      const blockIds = newBlocks.map((b) => b.id);
      const res = await fetch(`/api/admin/content/pages/${pageId}/blocks?action=reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockIds }),
      });

      if (!res.ok) {
        // Revert to previous state on failure
        setBlocks(previousBlocks);
        setError("Failed to save block order. Please try again.");
      }
    } catch {
      // Revert on error
      setBlocks(previousBlocks);
      setError("Failed to save block order. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Move block up (swap with previous)
  function handleMoveUp(index: number) {
    if (index <= 0 || saving) return;

    const previousBlocks = blocks;
    const newBlocks = [...blocks];
    // Swap adjacent blocks
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    // Update order fields
    const reordered = newBlocks.map((b, i) => ({ ...b, order: i }));

    setBlocks(reordered);
    saveBlockOrder(reordered, previousBlocks);
  }

  // Move block down (swap with next)
  function handleMoveDown(index: number) {
    if (index >= blocks.length - 1 || saving) return;

    const previousBlocks = blocks;
    const newBlocks = [...blocks];
    // Swap adjacent blocks
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    // Update order fields
    const reordered = newBlocks.map((b, i) => ({ ...b, order: i }));

    setBlocks(reordered);
    saveBlockOrder(reordered, previousBlocks);
  }

  return (
    <div data-test-id="page-editor-blocks">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "18px", margin: 0 }}>Blocks ({blocks.length})</h2>
        {saving && (
          <span data-test-id="page-editor-saving" style={{ fontSize: "13px", color: "#666" }}>
            Saving...
          </span>
        )}
      </div>

      {error && (
        <div
          data-test-id="page-editor-error"
          style={{
            padding: "8px 12px",
            marginBottom: "12px",
            backgroundColor: "#fee",
            border: "1px solid #c00",
            borderRadius: "4px",
            color: "#900",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {blocks.length === 0 ? (
        <p data-test-id="page-editor-empty" style={{ color: "#666", fontStyle: "italic" }}>
          No blocks yet. Add a block to get started.
        </p>
      ) : (
        <ul
          data-test-id="page-editor-block-list"
          style={{ listStyle: "none", margin: 0, padding: 0 }}
        >
          {blocks.map((block, index) => {
            const meta = BLOCK_METADATA[block.type];
            const isFirst = index === 0;
            const isLast = index === blocks.length - 1;

            return (
              <li
                key={block.id}
                data-test-id="page-editor-block-item"
                data-block-id={block.id}
                data-block-type={block.type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  marginBottom: "8px",
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                }}
              >
                {/* Order controls */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button
                    type="button"
                    data-test-id="block-move-up"
                    onClick={() => handleMoveUp(index)}
                    disabled={isFirst || saving}
                    aria-label={`Move ${meta?.label || block.type} up`}
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      cursor: isFirst || saving ? "not-allowed" : "pointer",
                      opacity: isFirst || saving ? 0.4 : 1,
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      backgroundColor: "#fff",
                    }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    data-test-id="block-move-down"
                    onClick={() => handleMoveDown(index)}
                    disabled={isLast || saving}
                    aria-label={`Move ${meta?.label || block.type} down`}
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      cursor: isLast || saving ? "not-allowed" : "pointer",
                      opacity: isLast || saving ? 0.4 : 1,
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      backgroundColor: "#fff",
                    }}
                  >
                    ▼
                  </button>
                </div>

                {/* Block info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "14px" }}>
                    {meta?.label || block.type}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {meta?.description || `Block type: ${block.type}`}
                  </div>
                </div>

                {/* Order indicator */}
                <div
                  data-test-id="block-order-indicator"
                  style={{ fontSize: "12px", color: "#999", minWidth: "40px", textAlign: "right" }}
                >
                  #{index + 1}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
