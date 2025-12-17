"use client";

// Copyright (c) Santa Barbara Newcomers Club
// Main page editor component with drag-drop blocks

import { useState, useCallback, useEffect } from "react";
import { Block, BlockType, PageContent, createEmptyBlock, BLOCK_METADATA } from "@/lib/publishing/blocks";
import BlockPalette from "./BlockPalette";
import SortableBlockList from "./SortableBlockList";
import { BlockEditor } from "./BlockEditors";

type PageEditorProps = {
  initialContent: PageContent;
  onChange: (content: PageContent) => void;
  disabled?: boolean;
};

export default function PageEditor({ initialContent, onChange, disabled }: PageEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialContent.blocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Sync changes to parent
  useEffect(() => {
    onChange({
      schemaVersion: initialContent.schemaVersion,
      blocks,
    });
  }, [blocks, initialContent.schemaVersion, onChange]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock = createEmptyBlock(type, blocks.length);
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, [blocks.length]);

  const handleReorder = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
  }, []);

  const handleSelectBlock = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
  }, []);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== blockId);
      // Reorder remaining blocks
      return filtered.map((block, idx) => ({ ...block, order: idx }));
    });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const handleBlockChange = useCallback((updatedBlock: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  }, []);

  return (
    <div data-test-id="page-editor" style={{ display: "flex", gap: "24px" }}>
      {/* Left panel - Block list */}
      <div style={{ flex: "1 1 400px", minWidth: "300px", maxWidth: "500px" }}>
        <BlockPalette onAddBlock={handleAddBlock} disabled={disabled} />
        <SortableBlockList
          blocks={blocks}
          onReorder={handleReorder}
          onSelectBlock={handleSelectBlock}
          onDeleteBlock={handleDeleteBlock}
          selectedBlockId={selectedBlockId}
          disabled={disabled}
        />
      </div>

      {/* Right panel - Block editor */}
      <div style={{ flex: "1 1 500px", minWidth: "400px" }}>
        {selectedBlock ? (
          <div
            data-test-id="block-editor-panel"
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #ddd",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #eee",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                Edit {BLOCK_METADATA[selectedBlock.type].label}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBlockId(null)}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  backgroundColor: "#f5f5f5",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <BlockEditor
              block={selectedBlock}
              onChange={handleBlockChange}
              disabled={disabled}
            />
          </div>
        ) : (
          <div
            data-test-id="no-block-selected"
            style={{
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              padding: "40px 20px",
              textAlign: "center",
              color: "#999",
              border: "2px dashed #ddd",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px" }}>
              {blocks.length === 0
                ? "Add a block from the palette to get started."
                : "Select a block from the list to edit it."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
