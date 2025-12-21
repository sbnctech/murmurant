// Copyright (c) Santa Barbara Newcomers Club
// Page editor client component - block list with ordering and editing controls
// A3: Schema-driven validation and improved editors

"use client";

import { useState, useCallback } from "react";
import { Block, BlockType } from "@/lib/publishing/blocks";
import { BLOCK_METADATA } from "@/lib/publishing/blocks";
import {
  validateBlockData,
  getBlockFieldMetadata,
  EDITABLE_BLOCK_TYPES,
  READONLY_BLOCK_TYPES,
} from "@/lib/publishing/blockSchemas";

type Props = {
  pageId: string;
  initialBlocks: Block[];
};

export default function PageEditorClient({ pageId, initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Record<string, unknown> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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
        setBlocks(previousBlocks);
        setError("Failed to save block order. Please try again.");
      }
    } catch {
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
        const errorData = await res.json().catch(() => ({}));
        setBlocks(previousBlocks);
        setError(errorData.message || "Failed to save block. Please try again.");
        return false;
      }
      return true;
    } catch {
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
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    const reordered = newBlocks.map((b, i) => ({ ...b, order: i }));

    setBlocks(reordered);
    saveBlockOrder(reordered, previousBlocks);
  }

  // Move block down (swap with next)
  function handleMoveDown(index: number) {
    if (index >= blocks.length - 1 || saving) return;

    const previousBlocks = blocks;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
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
    setValidationError(null);
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingBlockId(null);
    setEditingData(null);
    setValidationError(null);
  }

  // Save edited block with client-side validation
  async function handleSaveEdit() {
    if (!editingBlockId || !editingData || saving) return;

    // Find the block type
    const block = blocks.find((b) => b.id === editingBlockId);
    if (!block) return;

    // Client-side validation using schema
    const validation = validateBlockData(block.type, editingData);
    if (!validation.ok) {
      setValidationError(validation.error);
      return;
    }

    setValidationError(null);
    const previousBlocks = blocks;

    // Optimistic update with validated data
    const newBlocks = blocks.map((b) =>
      b.id === editingBlockId
        ? ({ ...b, data: validation.data as typeof b.data } as Block)
        : b
    );
    setBlocks(newBlocks);

    const success = await saveBlockData(editingBlockId, validation.data as Record<string, unknown>, previousBlocks);
    if (success) {
      setEditingBlockId(null);
      setEditingData(null);
    }
  }

  // Update a field in the editing data
  const updateField = useCallback((field: string, value: unknown) => {
    setEditingData((prev) => (prev ? { ...prev, [field]: value } : null));
    setValidationError(null); // Clear validation error on change
  }, []);

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
            const isReadonly = READONLY_BLOCK_TYPES.includes(block.type);

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
                      {isReadonly && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "11px",
                            padding: "2px 6px",
                            backgroundColor: "#e0e0e0",
                            borderRadius: "3px",
                            color: "#666",
                          }}
                        >
                          Read-only
                        </span>
                      )}
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
                    {isEditing ? "Cancel" : isReadonly ? "View" : "Edit"}
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
                    {/* Validation error */}
                    {validationError && (
                      <div
                        data-test-id="block-editor-validation-error"
                        style={{
                          padding: "8px 12px",
                          marginBottom: "12px",
                          backgroundColor: "#fff3cd",
                          border: "1px solid #ffc107",
                          borderRadius: "4px",
                          color: "#856404",
                          fontSize: "13px",
                        }}
                      >
                        {validationError}
                      </div>
                    )}

                    {isReadonly ? (
                      <ReadOnlyBlockViewer data={block.data} blockType={block.type} />
                    ) : (
                      <SchemaBlockEditor
                        blockType={block.type}
                        data={editingData || {}}
                        onChange={updateField}
                        disabled={saving}
                      />
                    )}

                    {/* Save/Cancel buttons for editable blocks */}
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

// ============================================================================
// Read-only block viewer for complex types
// ============================================================================

type ReadOnlyBlockViewerProps = {
  data: unknown;
  blockType: BlockType;
};

function ReadOnlyBlockViewer({ data, blockType }: ReadOnlyBlockViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split("\n");
  const isLong = lines.length > 10;
  const displayText = expanded || !isLong ? jsonString : lines.slice(0, 10).join("\n") + "\n...";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div data-test-id="block-editor-readonly">
      <div style={{ marginBottom: "8px", color: "#666", fontSize: "13px" }}>
        This block type ({blockType}) requires advanced editing. Full editing support coming soon.
      </div>
      <div
        style={{
          position: "relative",
          backgroundColor: "#f5f5f5",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          padding: "12px",
        }}
      >
        <pre
          data-test-id="block-editor-json"
          style={{
            margin: 0,
            fontSize: "12px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: expanded ? "none" : "300px",
            overflow: "auto",
          }}
        >
          {displayText}
        </pre>
        <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
          {isLong && (
            <button
              type="button"
              data-test-id="block-editor-toggle-expand"
              onClick={() => setExpanded(!expanded)}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                border: "1px solid #ccc",
                borderRadius: "3px",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
          <button
            type="button"
            data-test-id="block-editor-copy"
            onClick={handleCopy}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              border: "1px solid #ccc",
              borderRadius: "3px",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Schema-driven block editor
// ============================================================================

type SchemaBlockEditorProps = {
  blockType: BlockType;
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
};

function SchemaBlockEditor({ blockType, data, onChange, disabled }: SchemaBlockEditorProps) {
  const fields = getBlockFieldMetadata(blockType);

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

  if (fields.length === 0) {
    return (
      <div style={{ color: "#666", fontStyle: "italic" }}>
        No editor available for {blockType} blocks.
      </div>
    );
  }

  return (
    <div data-test-id={`block-editor-${blockType}`}>
      {fields.map((field) => (
        <label key={field.name} style={labelStyle}>
          <span style={labelTextStyle}>
            {field.label}
            {field.required && " *"}
          </span>
          {field.type === "textarea" ? (
            <textarea
              value={(data[field.name] as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
              rows={6}
              style={{ ...inputStyle, resize: "vertical" as const }}
            />
          ) : field.type === "select" && field.options ? (
            <select
              value={(data[field.name] as string) || field.options[0] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
              style={inputStyle}
            >
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type === "url" ? "url" : "text"}
              value={(data[field.name] as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
              style={inputStyle}
            />
          )}
        </label>
      ))}
    </div>
  );
}
