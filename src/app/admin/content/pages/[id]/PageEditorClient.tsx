// Copyright (c) Santa Barbara Newcomers Club
// Page editor client component - block list with ordering and editing controls
// A3: Schema-driven validation and improved editors
// A4: Lifecycle controls for Draft/Published state management

"use client";

import { useState, useCallback, useEffect } from "react";
import { Block, BlockType } from "@/lib/publishing/blocks";
import { BLOCK_METADATA } from "@/lib/publishing/blocks";
import {
  validateBlockData,
  getBlockFieldMetadata,
  EDITABLE_BLOCK_TYPES,
  READONLY_BLOCK_TYPES,
} from "@/lib/publishing/blockSchemas";
import { PageLifecycleState, LifecycleAction } from "@/lib/publishing/pageLifecycle";
import { formatDateLocale, formatClubDate } from "@/lib/timezone";

// A7: Revision state for undo/redo
type RevisionState = {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  currentPosition: number;
  totalRevisions: number;
};

type Props = {
  pageId: string;
  initialBlocks: Block[];
  lifecycle: PageLifecycleState;
};

export default function PageEditorClient({ pageId, initialBlocks, lifecycle: initialLifecycle }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [lifecycle, _setLifecycle] = useState<PageLifecycleState>(initialLifecycle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Record<string, unknown> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<LifecycleAction | null>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);

  // A7: Undo/redo state
  const [revisionState, setRevisionState] = useState<RevisionState>({
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0,
    currentPosition: 0,
    totalRevisions: 0,
  });
  const [undoRedoLoading, setUndoRedoLoading] = useState(false);

  // A7: Fetch revision state on mount
  useEffect(() => {
    async function fetchRevisionState() {
      try {
        const res = await fetch(`/api/admin/content/pages/${pageId}/revisions`);
        if (res.ok) {
          const data = await res.json();
          setRevisionState(data);
        }
      } catch {
        // Silently fail - undo/redo will just be disabled
      }
    }
    fetchRevisionState();
  }, [pageId]);

  // A7: Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+Z or Ctrl+Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        if (revisionState.canUndo && !undoRedoLoading && !saving) {
          e.preventDefault();
          handleUndo();
        }
      }
      // Cmd+Shift+Z or Ctrl+Shift+Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        if (revisionState.canRedo && !undoRedoLoading && !saving) {
          e.preventDefault();
          handleRedo();
        }
      }
      // Cmd+Y or Ctrl+Y for redo (Windows style)
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        if (revisionState.canRedo && !undoRedoLoading && !saving) {
          e.preventDefault();
          handleRedo();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleUndo and handleRedo are stable callbacks defined below
  }, [revisionState, undoRedoLoading, saving]);

  // A7: Undo API call
  async function handleUndo() {
    if (!revisionState.canUndo || undoRedoLoading || saving) return;
    setUndoRedoLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/pages/${pageId}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || "Failed to undo. Please try again.");
        return;
      }

      const data = await res.json();
      if (data.success && data.content) {
        setBlocks(data.content.blocks || []);
        if (data.revisionState) {
          setRevisionState(data.revisionState);
        }
      }
    } catch {
      setError("Failed to undo. Please try again.");
    } finally {
      setUndoRedoLoading(false);
    }
  }

  // A7: Redo API call
  async function handleRedo() {
    if (!revisionState.canRedo || undoRedoLoading || saving) return;
    setUndoRedoLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/pages/${pageId}/redo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || "Failed to redo. Please try again.");
        return;
      }

      const data = await res.json();
      if (data.success && data.content) {
        setBlocks(data.content.blocks || []);
        if (data.revisionState) {
          setRevisionState(data.revisionState);
        }
      }
    } catch {
      setError("Failed to redo. Please try again.");
    } finally {
      setUndoRedoLoading(false);
    }
  }

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
      } else {
        // A7: Update revision state from response
        const data = await res.json();
        if (data.revisionState) {
          setRevisionState(data.revisionState);
        }
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

      // A7: Update revision state from response
      const responseData = await res.json();
      if (responseData.revisionState) {
        setRevisionState(responseData.revisionState);
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

  // Lifecycle action API call
  async function handleLifecycleAction(action: LifecycleAction) {
    setLifecycleLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/pages/${pageId}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || `Failed to ${action}. Please try again.`);
        return;
      }

      // Reload the page to get fresh data
      window.location.reload();
    } catch {
      setError(`Failed to ${action}. Please try again.`);
    } finally {
      setLifecycleLoading(false);
      setConfirmAction(null);
    }
  }

  // Handle confirm dialog
  function handleConfirmLifecycleAction() {
    if (confirmAction) {
      handleLifecycleAction(confirmAction);
    }
  }

  // Get action confirmation text
  function getConfirmText(action: LifecycleAction): { title: string; message: string } {
    switch (action) {
      case "publish":
        return {
          title: "Publish Page",
          message: "Are you sure you want to publish this page? It will become visible to users.",
        };
      case "unpublish":
        return {
          title: "Unpublish Page",
          message: "Are you sure you want to unpublish this page? It will no longer be visible to users.",
        };
      case "discardDraft":
        return {
          title: "Discard Draft Changes",
          message: "Are you sure you want to discard all draft changes? This will restore the page to its last published state.",
        };
      case "archive":
        return {
          title: "Archive Page",
          message: "Are you sure you want to archive this page?",
        };
    }
  }

  // Format date for display
  function formatDate(date: Date | null): string {
    if (!date) return "";
    return formatDateLocale(date, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div data-test-id="page-editor-blocks">
      {/* Lifecycle Status Banner */}
      <div
        data-test-id="page-lifecycle-banner"
        style={{
          padding: "12px 16px",
          marginBottom: "16px",
          backgroundColor: lifecycle.status === "PUBLISHED" ? "#e8f5e9" : lifecycle.status === "ARCHIVED" ? "#f5f5f5" : "#fff3e0",
          border: `1px solid ${lifecycle.status === "PUBLISHED" ? "#4caf50" : lifecycle.status === "ARCHIVED" ? "#9e9e9e" : "#ff9800"}`,
          borderRadius: "6px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                data-test-id="page-status-badge"
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "4px",
                  backgroundColor: lifecycle.status === "PUBLISHED" ? "#4caf50" : lifecycle.status === "ARCHIVED" ? "#9e9e9e" : "#ff9800",
                  color: "#fff",
                }}
              >
                {lifecycle.status}
              </span>
              {lifecycle.hasDraftChanges && (
                <span
                  data-test-id="draft-changes-indicator"
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 500,
                    borderRadius: "4px",
                    backgroundColor: "#fff3e0",
                    border: "1px solid #ff9800",
                    color: "#e65100",
                  }}
                >
                  Unsaved draft changes
                </span>
              )}
            </div>
            {lifecycle.publishedAt && (
              <div style={{ marginTop: "4px", fontSize: "13px", color: "#666" }}>
                Last published: {formatDate(lifecycle.publishedAt)}
              </div>
            )}
          </div>

          {/* Lifecycle Action Buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {lifecycle.canPublish && (
              <button
                type="button"
                data-test-id="lifecycle-publish-btn"
                onClick={() => setConfirmAction("publish")}
                disabled={lifecycleLoading || saving}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: lifecycleLoading || saving ? "not-allowed" : "pointer",
                  opacity: lifecycleLoading || saving ? 0.6 : 1,
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#4caf50",
                  color: "#fff",
                }}
              >
                {lifecycle.hasDraftChanges ? "Publish Changes" : "Publish"}
              </button>
            )}
            {lifecycle.canDiscardDraft && (
              <button
                type="button"
                data-test-id="lifecycle-discard-btn"
                onClick={() => setConfirmAction("discardDraft")}
                disabled={lifecycleLoading || saving}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: lifecycleLoading || saving ? "not-allowed" : "pointer",
                  opacity: lifecycleLoading || saving ? 0.6 : 1,
                  border: "1px solid #f44336",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  color: "#f44336",
                }}
              >
                Discard Draft
              </button>
            )}
            {lifecycle.canUnpublish && (
              <button
                type="button"
                data-test-id="lifecycle-unpublish-btn"
                onClick={() => setConfirmAction("unpublish")}
                disabled={lifecycleLoading || saving}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: lifecycleLoading || saving ? "not-allowed" : "pointer",
                  opacity: lifecycleLoading || saving ? 0.6 : 1,
                  border: "1px solid #666",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  color: "#666",
                }}
              >
                Unpublish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          data-test-id="lifecycle-confirm-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>
              {getConfirmText(confirmAction).title}
            </h3>
            <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "14px" }}>
              {getConfirmText(confirmAction).message}
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                type="button"
                data-test-id="lifecycle-confirm-cancel"
                onClick={() => setConfirmAction(null)}
                disabled={lifecycleLoading}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: lifecycleLoading ? "not-allowed" : "pointer",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  color: "#333",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-test-id="lifecycle-confirm-ok"
                onClick={handleConfirmLifecycleAction}
                disabled={lifecycleLoading}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: lifecycleLoading ? "not-allowed" : "pointer",
                  opacity: lifecycleLoading ? 0.6 : 1,
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: confirmAction === "discardDraft" ? "#f44336" : "#4caf50",
                  color: "#fff",
                }}
              >
                {lifecycleLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "18px", margin: 0 }}>Blocks ({blocks.length})</h2>

        {/* A7: Undo/Redo controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            data-test-id="undo-redo-controls"
            style={{ display: "flex", gap: "4px", alignItems: "center" }}
          >
            <button
              type="button"
              data-test-id="undo-btn"
              onClick={handleUndo}
              disabled={!revisionState.canUndo || undoRedoLoading || saving}
              title={`Undo (Cmd+Z)${revisionState.canUndo ? "" : " - Nothing to undo"}`}
              aria-label="Undo"
              style={{
                padding: "6px 10px",
                fontSize: "13px",
                cursor: !revisionState.canUndo || undoRedoLoading || saving ? "not-allowed" : "pointer",
                opacity: !revisionState.canUndo || undoRedoLoading || saving ? 0.4 : 1,
                border: "1px solid #ccc",
                borderRadius: "4px 0 0 4px",
                backgroundColor: "#fff",
              }}
            >
              Undo
            </button>
            <button
              type="button"
              data-test-id="redo-btn"
              onClick={handleRedo}
              disabled={!revisionState.canRedo || undoRedoLoading || saving}
              title={`Redo (Cmd+Shift+Z)${revisionState.canRedo ? "" : " - Nothing to redo"}`}
              aria-label="Redo"
              style={{
                padding: "6px 10px",
                fontSize: "13px",
                cursor: !revisionState.canRedo || undoRedoLoading || saving ? "not-allowed" : "pointer",
                opacity: !revisionState.canRedo || undoRedoLoading || saving ? 0.4 : 1,
                border: "1px solid #ccc",
                borderLeft: "none",
                borderRadius: "0 4px 4px 0",
                backgroundColor: "#fff",
              }}
            >
              Redo
            </button>
          </div>

          {/* Revision indicator */}
          {revisionState.totalRevisions > 0 && (
            <span
              data-test-id="revision-indicator"
              style={{ fontSize: "12px", color: "#666" }}
            >
              {revisionState.undoCount} undo{revisionState.undoCount !== 1 ? "s" : ""} available
            </span>
          )}

          {(saving || undoRedoLoading) && (
            <span data-test-id="page-editor-saving" style={{ fontSize: "13px", color: "#666" }}>
              {undoRedoLoading ? (revisionState.canRedo ? "Redoing..." : "Undoing...") : "Saving..."}
            </span>
          )}
        </div>
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

      {/* Audit Log Panel */}
      <AuditLogPanel pageId={pageId} />
    </div>
  );
}

// ============================================================================
// Audit Log Panel
// ============================================================================

type AuditLogEntry = {
  id: string;
  action: string;
  timestamp: string;
  actor: {
    id: string | null;
    name: string;
  };
  summary: string;
};

function AuditLogPanel({ pageId }: { pageId: string }) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchAuditLog() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/content/pages/${pageId}/audit?limit=10`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
        } else {
          setError("Failed to load audit log");
        }
      } catch {
        setError("Failed to load audit log");
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLog();
  }, [pageId]);

  const getActionColor = (action: string): string => {
    switch (action) {
      case "CREATE":
        return "#28a745";
      case "PUBLISH":
        return "#007bff";
      case "UNPUBLISH":
        return "#6c757d";
      case "ARCHIVE":
        return "#6c757d";
      case "UPDATE":
        return "#17a2b8";
      case "DISCARD_DRAFT":
        return "#dc3545";
      case "DELETE":
        return "#dc3545";
      case "UNDO":
        return "#9c27b0"; // Purple for undo
      case "REDO":
        return "#673ab7"; // Deep purple for redo
      default:
        return "#6c757d";
    }
  };

  return (
    <div
      data-test-id="audit-log-panel"
      style={{
        marginTop: "24px",
        borderTop: "1px solid #e0e0e0",
        paddingTop: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 style={{ fontSize: "16px", margin: 0 }}>
          Activity Log
        </h3>
        <button
          type="button"
          data-test-id="audit-log-toggle"
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: "4px 10px",
            fontSize: "13px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {expanded && (
        <div data-test-id="audit-log-content">
          {loading && (
            <p style={{ color: "#666", fontSize: "13px" }}>Loading...</p>
          )}
          {error && (
            <p style={{ color: "#c00", fontSize: "13px" }}>{error}</p>
          )}
          {!loading && !error && entries.length === 0 && (
            <p style={{ color: "#666", fontSize: "13px", fontStyle: "italic" }}>
              No activity recorded yet.
            </p>
          )}
          {!loading && !error && entries.length > 0 && (
            <ul
              data-test-id="audit-log-list"
              style={{ listStyle: "none", margin: 0, padding: 0 }}
            >
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  data-test-id="audit-log-entry"
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                    fontSize: "13px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    data-test-id="audit-log-action"
                    style={{
                      display: "inline-block",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "11px",
                      fontWeight: 500,
                      backgroundColor: getActionColor(entry.action),
                      color: "#fff",
                      minWidth: "60px",
                      textAlign: "center",
                    }}
                  >
                    {entry.action}
                  </span>
                  <span style={{ flex: 1, color: "#333" }}>
                    {entry.summary}
                  </span>
                  <span style={{ color: "#666", whiteSpace: "nowrap" }}>
                    {entry.actor.name}
                  </span>
                  <span
                    data-test-id="audit-log-timestamp"
                    style={{ color: "#999", whiteSpace: "nowrap" }}
                  >
                    {formatClubDate(new Date(entry.timestamp))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
