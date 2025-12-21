// Copyright (c) Santa Barbara Newcomers Club
// Page editor client component - block list with ordering and editing controls

"use client";

import { useState } from "react";
import { Block, BlockType } from "@/lib/publishing/blocks";
import { BLOCK_METADATA } from "@/lib/publishing/blocks";

type Props = {
  pageId: string;
  initialBlocks: Block[];
};

// Block types that have full form editing support
const EDITABLE_BLOCK_TYPES: BlockType[] = ["hero", "text", "image", "cta", "divider", "spacer"];

// Block types that only show read-only view (complex/nested data)
const COMPLEX_BLOCK_TYPES: BlockType[] = ["cards", "event-list", "gallery", "faq", "contact"];

export default function PageEditorClient({ pageId, initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Record<string, unknown> | null>(null);

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

  // Update block data API call
  async function saveBlockData(blockId: string, data: Record<string, unknown>, previousBlocks: Block[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/pages/${pageId}/blocks?action=update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, data }),
      });

      if (!res.ok) {
        // Revert to previous state on failure
        setBlocks(previousBlocks);
        setError("Failed to save block. Please try again.");
        return false;
      }
      return true;
    } catch {
      // Revert on error
      setBlocks(previousBlocks);
      setError("Failed to save block. Please try again.");
      return false;
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

  // Start editing a block
  function handleEdit(block: Block) {
    if (saving) return;
    setEditingBlockId(block.id);
    setEditingData({ ...block.data });
    setError(null);
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingBlockId(null);
    setEditingData(null);
  }

  // Save edited block
  async function handleSaveEdit() {
    if (!editingBlockId || !editingData || saving) return;

    const previousBlocks = blocks;

    // Optimistic update
    // Type assertion needed because Block is a discriminated union
    const newBlocks = blocks.map((b) =>
      b.id === editingBlockId
        ? ({ ...b, data: editingData as typeof b.data } as Block)
        : b
    );
    setBlocks(newBlocks);

    const success = await saveBlockData(editingBlockId, editingData, previousBlocks);
    if (success) {
      setEditingBlockId(null);
      setEditingData(null);
    }
  }

  // Update a field in the editing data
  function updateField(field: string, value: unknown) {
    if (!editingData) return;
    setEditingData({ ...editingData, [field]: value });
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
            const isEditing = editingBlockId === block.id;
            const isEditable = EDITABLE_BLOCK_TYPES.includes(block.type);
            const isComplex = COMPLEX_BLOCK_TYPES.includes(block.type);

            return (
              <li
                key={block.id}
                data-test-id="page-editor-block-item"
                data-block-id={block.id}
                data-block-type={block.type}
                style={{
                  marginBottom: "8px",
                  backgroundColor: "#f9f9f9",
                  border: isEditing ? "2px solid #0066cc" : "1px solid #e0e0e0",
                  borderRadius: "4px",
                }}
              >
                {/* Block header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
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

                  {/* Edit button */}
                  <button
                    type="button"
                    data-test-id="block-edit"
                    onClick={() => (isEditing ? handleCancelEdit() : handleEdit(block))}
                    disabled={saving}
                    style={{
                      padding: "6px 12px",
                      fontSize: "13px",
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.6 : 1,
                      border: "1px solid #0066cc",
                      borderRadius: "4px",
                      backgroundColor: isEditing ? "#0066cc" : "#fff",
                      color: isEditing ? "#fff" : "#0066cc",
                    }}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>

                  {/* Order indicator */}
                  <div
                    data-test-id="block-order-indicator"
                    style={{ fontSize: "12px", color: "#999", minWidth: "40px", textAlign: "right" }}
                  >
                    #{index + 1}
                  </div>
                </div>

                {/* Editor panel */}
                {isEditing && (
                  <div
                    data-test-id="block-editor-panel"
                    style={{
                      padding: "16px",
                      borderTop: "1px solid #e0e0e0",
                      backgroundColor: "#fff",
                    }}
                  >
                    {isComplex ? (
                      <div data-test-id="block-editor-complex" style={{ color: "#666", fontStyle: "italic" }}>
                        Advanced editing for {meta?.label || block.type} blocks coming soon.
                        <pre style={{ marginTop: "8px", fontSize: "11px", overflow: "auto" }}>
                          {JSON.stringify(block.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <BlockEditorForm
                        blockType={block.type}
                        data={editingData || {}}
                        onChange={updateField}
                        disabled={saving}
                      />
                    )}

                    {/* Save/Cancel buttons */}
                    {isEditable && (
                      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          data-test-id="block-editor-save"
                          onClick={handleSaveEdit}
                          disabled={saving}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.6 : 1,
                            border: "none",
                            borderRadius: "4px",
                            backgroundColor: "#0066cc",
                            color: "#fff",
                          }}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          data-test-id="block-editor-cancel"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.6 : 1,
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor: "#fff",
                            color: "#333",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Block editor form for different block types
type BlockEditorFormProps = {
  blockType: BlockType;
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
};

function BlockEditorForm({ blockType, data, onChange, disabled }: BlockEditorFormProps) {
  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "12px",
  };

  const labelTextStyle = {
    fontSize: "13px",
    fontWeight: 500 as const,
    color: "#333",
  };

  switch (blockType) {
    case "hero":
      return (
        <div data-test-id="block-editor-hero">
          <label style={labelStyle}>
            <span style={labelTextStyle}>Title *</span>
            <input
              type="text"
              value={(data.title as string) || ""}
              onChange={(e) => onChange("title", e.target.value)}
              disabled={disabled}
              required
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Subtitle</span>
            <input
              type="text"
              value={(data.subtitle as string) || ""}
              onChange={(e) => onChange("subtitle", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Alignment</span>
            <select
              value={(data.alignment as string) || "center"}
              onChange={(e) => onChange("alignment", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>CTA Text</span>
            <input
              type="text"
              value={(data.ctaText as string) || ""}
              onChange={(e) => onChange("ctaText", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>CTA Link</span>
            <input
              type="text"
              value={(data.ctaLink as string) || ""}
              onChange={(e) => onChange("ctaLink", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>CTA Style</span>
            <select
              value={(data.ctaStyle as string) || "primary"}
              onChange={(e) => onChange("ctaStyle", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </label>
        </div>
      );

    case "text":
      return (
        <div data-test-id="block-editor-text">
          <label style={labelStyle}>
            <span style={labelTextStyle}>Content (HTML)</span>
            <textarea
              value={(data.content as string) || ""}
              onChange={(e) => onChange("content", e.target.value)}
              disabled={disabled}
              rows={6}
              style={{ ...inputStyle, resize: "vertical" as const }}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Alignment</span>
            <select
              value={(data.alignment as string) || "left"}
              onChange={(e) => onChange("alignment", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      );

    case "image":
      return (
        <div data-test-id="block-editor-image">
          <label style={labelStyle}>
            <span style={labelTextStyle}>Image URL *</span>
            <input
              type="text"
              value={(data.src as string) || ""}
              onChange={(e) => onChange("src", e.target.value)}
              disabled={disabled}
              required
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Alt Text *</span>
            <input
              type="text"
              value={(data.alt as string) || ""}
              onChange={(e) => onChange("alt", e.target.value)}
              disabled={disabled}
              required
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Caption</span>
            <input
              type="text"
              value={(data.caption as string) || ""}
              onChange={(e) => onChange("caption", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Alignment</span>
            <select
              value={(data.alignment as string) || "center"}
              onChange={(e) => onChange("alignment", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Link URL</span>
            <input
              type="text"
              value={(data.linkUrl as string) || ""}
              onChange={(e) => onChange("linkUrl", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            />
          </label>
        </div>
      );

    case "cta":
      return (
        <div data-test-id="block-editor-cta">
          <label style={labelStyle}>
            <span style={labelTextStyle}>Button Text *</span>
            <input
              type="text"
              value={(data.text as string) || ""}
              onChange={(e) => onChange("text", e.target.value)}
              disabled={disabled}
              required
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Link *</span>
            <input
              type="text"
              value={(data.link as string) || ""}
              onChange={(e) => onChange("link", e.target.value)}
              disabled={disabled}
              required
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Style</span>
            <select
              value={(data.style as string) || "primary"}
              onChange={(e) => onChange("style", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Size</span>
            <select
              value={(data.size as string) || "medium"}
              onChange={(e) => onChange("size", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Alignment</span>
            <select
              value={(data.alignment as string) || "center"}
              onChange={(e) => onChange("alignment", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      );

    case "divider":
      return (
        <div data-test-id="block-editor-divider">
          <label style={labelStyle}>
            <span style={labelTextStyle}>Style</span>
            <select
              value={(data.style as string) || "solid"}
              onChange={(e) => onChange("style", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Width</span>
            <select
              value={(data.width as string) || "full"}
              onChange={(e) => onChange("width", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="full">Full</option>
              <option value="half">Half</option>
              <option value="quarter">Quarter</option>
            </select>
          </label>
        </div>
      );

    case "spacer":
      return (
        <div data-test-id="block-editor-spacer">
          <label style={labelStyle}>
            <span style={labelTextStyle}>Height</span>
            <select
              value={(data.height as string) || "medium"}
              onChange={(e) => onChange("height", e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
        </div>
      );

    default:
      return (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          No editor available for {blockType} blocks.
        </div>
      );
  }
}
