// Copyright © 2025 Murmurant, Inc.
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
import {
  SortableBlockList,
  DragHandle,
  DragHandleProps,
} from "@/components/publishing/SortableBlockList";
import {
  getAllGadgetIds,
  getGadgetTitle,
  isGadgetImplemented,
  isRoleRestrictedGadget,
} from "@/components/gadgets/gadget-registry";

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

  // A2: Handle drag-and-drop reorder
  function handleDragReorder(newBlocks: Block[]) {
    if (saving) return;

    const previousBlocks = blocks;
    setBlocks(newBlocks);
    saveBlockOrder(newBlocks, previousBlocks);
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

      <SortableBlockList
        blocks={blocks}
        onReorder={handleDragReorder}
        disabled={saving}
        renderBlock={(block, index, dragHandleProps) => (
          <BlockItem
            block={block}
            index={index}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
            isEditing={editingBlockId === block.id}
            saving={saving}
            dragHandleProps={dragHandleProps}
            editingData={editingData}
            validationError={validationError}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onEdit={() => handleEdit(block)}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            updateField={updateField}
          />
        )}
      />

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
              placeholder={field.placeholder}
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
          ) : field.type === "number" ? (
            <input
              type="number"
              value={(data[field.name] as number) ?? ""}
              onChange={(e) => onChange(field.name, e.target.value === "" ? undefined : Number(e.target.value))}
              disabled={disabled}
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              style={inputStyle}
            />
          ) : (
            <input
              type={field.type === "url" ? "url" : "text"}
              value={(data[field.name] as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
              placeholder={field.placeholder}
              style={inputStyle}
            />
          )}
        </label>
      ))}
    </div>
  );
}

// ============================================================================
// Repeater-based block editors (for complex blocks with arrays)
// ============================================================================

type RepeaterItem = Record<string, unknown>;

type RepeaterEditorProps = {
  items: RepeaterItem[];
  onChange: (items: RepeaterItem[]) => void;
  disabled: boolean;
  itemLabel: string;
  renderItemSummary: (item: RepeaterItem, index: number) => string;
  renderItemFields: (
    item: RepeaterItem,
    index: number,
    updateItem: (field: string, value: unknown) => void
  ) => React.ReactNode;
  createNewItem: () => RepeaterItem;
  maxItems?: number;
};

function RepeaterEditor({
  items,
  onChange,
  disabled,
  itemLabel,
  renderItemSummary,
  renderItemFields,
  createNewItem,
  maxItems = 20,
}: RepeaterEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(items.length > 0 ? 0 : null);

  const handleAdd = () => {
    if (items.length >= maxItems) return;
    const newItem = createNewItem();
    const newItems = [...items, newItem];
    onChange(newItems);
    setExpandedIndex(newItems.length - 1);
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    if (expandedIndex === index) {
      setExpandedIndex(newItems.length > 0 ? Math.min(index, newItems.length - 1) : null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
    setExpandedIndex(index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
    setExpandedIndex(index + 1);
  };

  const handleUpdateItem = (index: number, field: string, value: unknown) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(newItems);
  };

  return (
    <div data-test-id="repeater-editor">
      {items.length === 0 && (
        <div style={{ color: "#666", fontStyle: "italic", marginBottom: "12px" }}>
          No {itemLabel.toLowerCase()}s yet. Click &ldquo;Add {itemLabel}&rdquo; to create one.
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          data-test-id={`repeater-item-${index}`}
          style={{
            marginBottom: "8px",
            border: expandedIndex === index ? "2px solid #0066cc" : "1px solid #e0e0e0",
            borderRadius: "4px",
            backgroundColor: "#fff",
          }}
        >
          {/* Item header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 12px",
              gap: "8px",
              backgroundColor: "#f5f5f5",
              borderRadius: expandedIndex === index ? "2px 2px 0 0" : "3px",
              cursor: "pointer",
            }}
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <span style={{ fontSize: "12px", color: "#666" }}>
              {expandedIndex === index ? "▼" : "▶"}
            </span>
            <span style={{ flex: 1, fontWeight: 500, fontSize: "14px" }}>
              {itemLabel} {index + 1}: {renderItemSummary(item, index)}
            </span>

            {/* Reorder buttons */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
              disabled={disabled || index === 0}
              title="Move up"
              style={{
                padding: "2px 6px",
                fontSize: "11px",
                border: "1px solid #ccc",
                borderRadius: "3px",
                backgroundColor: "#fff",
                cursor: disabled || index === 0 ? "not-allowed" : "pointer",
                opacity: disabled || index === 0 ? 0.4 : 1,
              }}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
              disabled={disabled || index === items.length - 1}
              title="Move down"
              style={{
                padding: "2px 6px",
                fontSize: "11px",
                border: "1px solid #ccc",
                borderRadius: "3px",
                backgroundColor: "#fff",
                cursor: disabled || index === items.length - 1 ? "not-allowed" : "pointer",
                opacity: disabled || index === items.length - 1 ? 0.4 : 1,
              }}
            >
              ▼
            </button>

            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
              disabled={disabled}
              title={`Remove ${itemLabel.toLowerCase()}`}
              style={{
                padding: "2px 8px",
                fontSize: "11px",
                border: "1px solid #dc3545",
                borderRadius: "3px",
                backgroundColor: "#fff",
                color: "#dc3545",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Item fields (expanded) */}
          {expandedIndex === index && (
            <div style={{ padding: "12px" }}>
              {renderItemFields(item, index, (field, value) => handleUpdateItem(index, field, value))}
            </div>
          )}
        </div>
      ))}

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled || items.length >= maxItems}
        data-test-id="repeater-add-btn"
        style={{
          marginTop: "8px",
          padding: "8px 16px",
          fontSize: "13px",
          border: "1px dashed #0066cc",
          borderRadius: "4px",
          backgroundColor: "#f0f7ff",
          color: "#0066cc",
          cursor: disabled || items.length >= maxItems ? "not-allowed" : "pointer",
          opacity: disabled || items.length >= maxItems ? 0.5 : 1,
          width: "100%",
        }}
      >
        + Add {itemLabel}
      </button>
    </div>
  );
}

// Stats block editor
function StatsBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const stats = (data.stats as Array<{ value: number; suffix?: string; prefix?: string; label: string }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-stats">
      {/* Title field */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Section Title</span>
        <input
          type="text"
          value={(data.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
          disabled={disabled}
          placeholder="Optional heading"
          style={inputStyle}
        />
      </label>

      {/* Columns field */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Columns</span>
        <select
          value={(data.columns as number) || 3}
          onChange={(e) => onChange("columns", Number(e.target.value))}
          disabled={disabled}
          style={inputStyle}
        >
          <option value={2}>2 columns</option>
          <option value={3}>3 columns</option>
          <option value={4}>4 columns</option>
        </select>
      </label>

      {/* Stats repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Stats ({stats.length})
        </span>
        <RepeaterEditor
          items={stats}
          onChange={(newStats) => onChange("stats", newStats)}
          disabled={disabled}
          itemLabel="Stat"
          renderItemSummary={(item) => {
            const s = item as { value?: number; prefix?: string; suffix?: string; label?: string };
            return `${s.prefix || ""}${s.value ?? 0}${s.suffix || ""} - ${s.label || "(no label)"}`;
          }}
          createNewItem={() => ({ value: 0, label: "" })}
          maxItems={12}
          renderItemFields={(item, _index, updateItem) => {
            const s = item as { value?: number; prefix?: string; suffix?: string; label?: string };
            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Value *</span>
                  <input
                    type="number"
                    value={s.value ?? ""}
                    onChange={(e) => updateItem("value", e.target.value === "" ? 0 : Number(e.target.value))}
                    disabled={disabled}
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Label *</span>
                  <input
                    type="text"
                    value={s.label || ""}
                    onChange={(e) => updateItem("label", e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., Members"
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Prefix</span>
                  <input
                    type="text"
                    value={s.prefix || ""}
                    onChange={(e) => updateItem("prefix", e.target.value)}
                    disabled={disabled}
                    placeholder='e.g., $'
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Suffix</span>
                  <input
                    type="text"
                    value={s.suffix || ""}
                    onChange={(e) => updateItem("suffix", e.target.value)}
                    disabled={disabled}
                    placeholder='e.g., +, %, k'
                    style={inputStyle}
                  />
                </label>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Timeline block editor
function TimelineBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const events = (data.events as Array<{ date: string; title: string; description: string; image?: string }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-timeline">
      {/* Title field */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Section Title</span>
        <input
          type="text"
          value={(data.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
          disabled={disabled}
          placeholder="Optional heading"
          style={inputStyle}
        />
      </label>

      {/* Events repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Timeline Events ({events.length})
        </span>
        <RepeaterEditor
          items={events}
          onChange={(newEvents) => onChange("events", newEvents)}
          disabled={disabled}
          itemLabel="Event"
          renderItemSummary={(item) => {
            const e = item as { date?: string; title?: string };
            return `${e.date || "(no date)"} - ${e.title || "(no title)"}`;
          }}
          createNewItem={() => ({ date: "", title: "", description: "" })}
          maxItems={30}
          renderItemFields={(item, _index, updateItem) => {
            const e = item as { date?: string; title?: string; description?: string; image?: string };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Date *</span>
                    <input
                      type="text"
                      value={e.date || ""}
                      onChange={(ev) => updateItem("date", ev.target.value)}
                      disabled={disabled}
                      placeholder="e.g., 2020, January 2023"
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Title *</span>
                    <input
                      type="text"
                      value={e.title || ""}
                      onChange={(ev) => updateItem("title", ev.target.value)}
                      disabled={disabled}
                      placeholder="Event title"
                      style={inputStyle}
                    />
                  </label>
                </div>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Description *</span>
                  <textarea
                    value={e.description || ""}
                    onChange={(ev) => updateItem("description", ev.target.value)}
                    disabled={disabled}
                    rows={3}
                    placeholder="What happened at this point in time"
                    style={{ ...inputStyle, resize: "vertical" as const }}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Image URL (optional)</span>
                  <input
                    type="url"
                    value={e.image || ""}
                    onChange={(ev) => updateItem("image", ev.target.value)}
                    disabled={disabled}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </label>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Accordion block editor
function AccordionBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const items = (data.items as Array<{ title: string; content: string; defaultOpen?: boolean }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-accordion">
      {/* Title field */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Section Title</span>
        <input
          type="text"
          value={(data.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
          disabled={disabled}
          placeholder="Optional heading"
          style={inputStyle}
        />
      </label>

      {/* Allow multiple */}
      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <input
          type="checkbox"
          checked={(data.allowMultiple as boolean) || false}
          onChange={(e) => onChange("allowMultiple", e.target.checked)}
          disabled={disabled}
        />
        <span style={{ fontSize: "13px", color: "#333" }}>Allow multiple panels open at once</span>
      </label>

      {/* Items repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Accordion Panels ({items.length})
        </span>
        <RepeaterEditor
          items={items}
          onChange={(newItems) => onChange("items", newItems)}
          disabled={disabled}
          itemLabel="Panel"
          renderItemSummary={(item) => {
            const i = item as { title?: string };
            return i.title || "(no title)";
          }}
          createNewItem={() => ({ title: "", content: "<p></p>" })}
          maxItems={20}
          renderItemFields={(item, _index, updateItem) => {
            const i = item as { title?: string; content?: string; defaultOpen?: boolean };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Title *</span>
                  <input
                    type="text"
                    value={i.title || ""}
                    onChange={(ev) => updateItem("title", ev.target.value)}
                    disabled={disabled}
                    placeholder="Panel heading"
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Content (HTML) *</span>
                  <textarea
                    value={i.content || ""}
                    onChange={(ev) => updateItem("content", ev.target.value)}
                    disabled={disabled}
                    rows={5}
                    placeholder="<p>Panel content here...</p>"
                    style={{ ...inputStyle, fontFamily: "monospace", fontSize: "13px", resize: "vertical" as const }}
                  />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={i.defaultOpen || false}
                    onChange={(ev) => updateItem("defaultOpen", ev.target.checked)}
                    disabled={disabled}
                  />
                  <span style={{ fontSize: "12px", color: "#666" }}>Open by default</span>
                </label>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Tabs block editor
function TabsBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const tabs = (data.tabs as Array<{ label: string; content: string }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-tabs">
      {/* Alignment */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Tab Alignment</span>
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

      {/* Tabs repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Tabs ({tabs.length})
        </span>
        <RepeaterEditor
          items={tabs}
          onChange={(newTabs) => onChange("tabs", newTabs)}
          disabled={disabled}
          itemLabel="Tab"
          renderItemSummary={(item) => {
            const t = item as { label?: string };
            return t.label || "(no label)";
          }}
          createNewItem={() => ({ label: "", content: "<p></p>" })}
          maxItems={10}
          renderItemFields={(item, _index, updateItem) => {
            const t = item as { label?: string; content?: string };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Tab Label *</span>
                  <input
                    type="text"
                    value={t.label || ""}
                    onChange={(ev) => updateItem("label", ev.target.value)}
                    disabled={disabled}
                    placeholder="Tab name"
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Content (HTML) *</span>
                  <textarea
                    value={t.content || ""}
                    onChange={(ev) => updateItem("content", ev.target.value)}
                    disabled={disabled}
                    rows={6}
                    placeholder="<p>Tab content here...</p>"
                    style={{ ...inputStyle, fontFamily: "monospace", fontSize: "13px", resize: "vertical" as const }}
                  />
                </label>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Testimonial block editor
function TestimonialBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const testimonials = (data.testimonials as Array<{ quote: string; author: string; role?: string; image?: string }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-testimonial">
      {/* Title field */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Section Title</span>
        <input
          type="text"
          value={(data.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
          disabled={disabled}
          placeholder="Optional heading"
          style={inputStyle}
        />
      </label>

      {/* Auto-rotate settings */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={(data.autoRotate as boolean) !== false}
            onChange={(e) => onChange("autoRotate", e.target.checked)}
            disabled={disabled}
          />
          <span style={{ fontSize: "13px", color: "#333" }}>Auto-rotate testimonials</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#333" }}>Interval (ms):</span>
          <input
            type="number"
            value={(data.rotateIntervalMs as number) || 5000}
            onChange={(e) => onChange("rotateIntervalMs", Number(e.target.value))}
            disabled={disabled || (data.autoRotate as boolean) === false}
            min={2000}
            max={15000}
            step={500}
            style={{ ...inputStyle, width: "100px" }}
          />
        </label>
      </div>

      {/* Testimonials repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Testimonials ({testimonials.length})
        </span>
        <RepeaterEditor
          items={testimonials}
          onChange={(newTestimonials) => onChange("testimonials", newTestimonials)}
          disabled={disabled}
          itemLabel="Testimonial"
          renderItemSummary={(item) => {
            const t = item as { author?: string; quote?: string };
            const preview = t.quote?.slice(0, 30) || "";
            return `${t.author || "(anonymous)"} - "${preview}${(t.quote?.length || 0) > 30 ? "..." : ""}"`;
          }}
          createNewItem={() => ({ quote: "", author: "" })}
          maxItems={12}
          renderItemFields={(item, _index, updateItem) => {
            const t = item as { quote?: string; author?: string; role?: string; image?: string };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Quote *</span>
                  <textarea
                    value={t.quote || ""}
                    onChange={(ev) => updateItem("quote", ev.target.value)}
                    disabled={disabled}
                    rows={3}
                    placeholder="The testimonial text..."
                    style={{ ...inputStyle, resize: "vertical" as const }}
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Author *</span>
                    <input
                      type="text"
                      value={t.author || ""}
                      onChange={(ev) => updateItem("author", ev.target.value)}
                      disabled={disabled}
                      placeholder="Jane Doe"
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Role/Title</span>
                    <input
                      type="text"
                      value={t.role || ""}
                      onChange={(ev) => updateItem("role", ev.target.value)}
                      disabled={disabled}
                      placeholder="e.g., Member since 2020"
                      style={inputStyle}
                    />
                  </label>
                </div>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Photo URL</span>
                  <input
                    type="url"
                    value={t.image || ""}
                    onChange={(ev) => updateItem("image", ev.target.value)}
                    disabled={disabled}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </label>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Cards block editor
function CardsBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const cards = (data.cards as Array<{ title: string; description?: string; image?: string; linkUrl?: string; linkText?: string }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-cards">
      {/* Columns */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Columns</span>
        <select
          value={(data.columns as number) || 3}
          onChange={(e) => onChange("columns", Number(e.target.value))}
          disabled={disabled}
          style={inputStyle}
        >
          <option value={2}>2 columns</option>
          <option value={3}>3 columns</option>
          <option value={4}>4 columns</option>
        </select>
      </label>

      {/* Cards repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Cards ({cards.length})
        </span>
        <RepeaterEditor
          items={cards}
          onChange={(newCards) => onChange("cards", newCards)}
          disabled={disabled}
          itemLabel="Card"
          renderItemSummary={(item) => {
            const c = item as { title?: string };
            return c.title || "(no title)";
          }}
          createNewItem={() => ({ title: "", description: "" })}
          maxItems={12}
          renderItemFields={(item, _index, updateItem) => {
            const c = item as { title?: string; description?: string; image?: string; linkUrl?: string; linkText?: string };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Title *</span>
                  <input
                    type="text"
                    value={c.title || ""}
                    onChange={(ev) => updateItem("title", ev.target.value)}
                    disabled={disabled}
                    placeholder="Card title"
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Description</span>
                  <textarea
                    value={c.description || ""}
                    onChange={(ev) => updateItem("description", ev.target.value)}
                    disabled={disabled}
                    rows={3}
                    placeholder="Card description"
                    style={{ ...inputStyle, resize: "vertical" as const }}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Image URL</span>
                  <input
                    type="url"
                    value={c.image || ""}
                    onChange={(ev) => updateItem("image", ev.target.value)}
                    disabled={disabled}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Link URL</span>
                    <input
                      type="url"
                      value={c.linkUrl || ""}
                      onChange={(ev) => updateItem("linkUrl", ev.target.value)}
                      disabled={disabled}
                      placeholder="https://..."
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Link Text</span>
                    <input
                      type="text"
                      value={c.linkText || ""}
                      onChange={(ev) => updateItem("linkText", ev.target.value)}
                      disabled={disabled}
                      placeholder="Learn more"
                      style={inputStyle}
                    />
                  </label>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// FlipCards block editor
function FlipCardsBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const cards = (data.cards as Array<{
    frontImage: string;
    frontImageAlt: string;
    backTitle: string;
    backDescription: string;
    backGradient?: string;
    backTextColor?: string;
    linkUrl?: string;
    linkText?: string;
  }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-flip-card">
      {/* Columns */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Columns</span>
        <select
          value={(data.columns as number) || 3}
          onChange={(e) => onChange("columns", Number(e.target.value))}
          disabled={disabled}
          style={inputStyle}
        >
          <option value={2}>2 columns</option>
          <option value={3}>3 columns</option>
          <option value={4}>4 columns</option>
        </select>
      </label>

      {/* Cards repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Flip Cards ({cards.length})
        </span>
        <RepeaterEditor
          items={cards}
          onChange={(newCards) => onChange("cards", newCards)}
          disabled={disabled}
          itemLabel="Card"
          renderItemSummary={(item) => {
            const c = item as { backTitle?: string };
            return c.backTitle || "(no title)";
          }}
          createNewItem={() => ({
            frontImage: "",
            frontImageAlt: "",
            backTitle: "",
            backDescription: "",
            backGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          })}
          maxItems={12}
          renderItemFields={(item, _index, updateItem) => {
            const c = item as {
              frontImage?: string;
              frontImageAlt?: string;
              backTitle?: string;
              backDescription?: string;
              backGradient?: string;
              linkUrl?: string;
              linkText?: string;
            };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "8px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "#666", marginBottom: "8px" }}>Front Side</div>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Image URL *</span>
                    <input
                      type="url"
                      value={c.frontImage || ""}
                      onChange={(ev) => updateItem("frontImage", ev.target.value)}
                      disabled={disabled}
                      placeholder="https://..."
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Alt Text *</span>
                    <input
                      type="text"
                      value={c.frontImageAlt || ""}
                      onChange={(ev) => updateItem("frontImageAlt", ev.target.value)}
                      disabled={disabled}
                      placeholder="Describe the image"
                      style={inputStyle}
                    />
                  </label>
                </div>
                <div style={{ padding: "8px", backgroundColor: "#f0f7ff", borderRadius: "4px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "#666", marginBottom: "8px" }}>Back Side</div>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Title *</span>
                    <input
                      type="text"
                      value={c.backTitle || ""}
                      onChange={(ev) => updateItem("backTitle", ev.target.value)}
                      disabled={disabled}
                      placeholder="Card title"
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "block", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Description *</span>
                    <textarea
                      value={c.backDescription || ""}
                      onChange={(ev) => updateItem("backDescription", ev.target.value)}
                      disabled={disabled}
                      rows={3}
                      placeholder="Card description"
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Background Gradient</span>
                    <input
                      type="text"
                      value={c.backGradient || ""}
                      onChange={(ev) => updateItem("backGradient", ev.target.value)}
                      disabled={disabled}
                      placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      style={inputStyle}
                    />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Link URL</span>
                    <input
                      type="url"
                      value={c.linkUrl || ""}
                      onChange={(ev) => updateItem("linkUrl", ev.target.value)}
                      disabled={disabled}
                      placeholder="https://..."
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Link Text</span>
                    <input
                      type="text"
                      value={c.linkText || ""}
                      onChange={(ev) => updateItem("linkText", ev.target.value)}
                      disabled={disabled}
                      placeholder="Learn more"
                      style={inputStyle}
                    />
                  </label>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Gallery block editor
function GalleryBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const images = (data.images as Array<{ src: string; alt: string; caption?: string }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-gallery">
      {/* Columns */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Columns</span>
        <select
          value={(data.columns as number) || 3}
          onChange={(e) => onChange("columns", Number(e.target.value))}
          disabled={disabled}
          style={inputStyle}
        >
          <option value={2}>2 columns</option>
          <option value={3}>3 columns</option>
          <option value={4}>4 columns</option>
        </select>
      </label>

      {/* Enable lightbox */}
      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <input
          type="checkbox"
          checked={(data.enableLightbox as boolean) !== false}
          onChange={(e) => onChange("enableLightbox", e.target.checked)}
          disabled={disabled}
        />
        <span style={{ fontSize: "13px", color: "#333" }}>Enable click-to-enlarge (lightbox)</span>
      </label>

      {/* Images repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Images ({images.length})
        </span>
        <RepeaterEditor
          items={images}
          onChange={(newImages) => onChange("images", newImages)}
          disabled={disabled}
          itemLabel="Image"
          renderItemSummary={(item) => {
            const i = item as { alt?: string; src?: string };
            return i.alt || i.src?.split("/").pop() || "(no image)";
          }}
          createNewItem={() => ({ src: "", alt: "" })}
          maxItems={50}
          renderItemFields={(item, _index, updateItem) => {
            const i = item as { src?: string; alt?: string; caption?: string };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Image URL *</span>
                  <input
                    type="url"
                    value={i.src || ""}
                    onChange={(ev) => updateItem("src", ev.target.value)}
                    disabled={disabled}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Alt Text *</span>
                  <input
                    type="text"
                    value={i.alt || ""}
                    onChange={(ev) => updateItem("alt", ev.target.value)}
                    disabled={disabled}
                    placeholder="Describe the image"
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Caption</span>
                  <input
                    type="text"
                    value={i.caption || ""}
                    onChange={(ev) => updateItem("caption", ev.target.value)}
                    disabled={disabled}
                    placeholder="Optional caption"
                    style={inputStyle}
                  />
                </label>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// FAQ block editor
function FaqBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const items = (data.items as Array<{ question: string; answer: string }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-faq">
      {/* Title */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Section Title</span>
        <input
          type="text"
          value={(data.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
          disabled={disabled}
          placeholder="Frequently Asked Questions"
          style={inputStyle}
        />
      </label>

      {/* FAQ items repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Questions ({items.length})
        </span>
        <RepeaterEditor
          items={items}
          onChange={(newItems) => onChange("items", newItems)}
          disabled={disabled}
          itemLabel="Question"
          renderItemSummary={(item) => {
            const q = item as { question?: string };
            const preview = q.question?.slice(0, 40) || "";
            return `${preview}${(q.question?.length || 0) > 40 ? "..." : ""}` || "(no question)";
          }}
          createNewItem={() => ({ question: "", answer: "" })}
          maxItems={30}
          renderItemFields={(item, _index, updateItem) => {
            const q = item as { question?: string; answer?: string };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Question *</span>
                  <input
                    type="text"
                    value={q.question || ""}
                    onChange={(ev) => updateItem("question", ev.target.value)}
                    disabled={disabled}
                    placeholder="How do I...?"
                    style={inputStyle}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Answer *</span>
                  <textarea
                    value={q.answer || ""}
                    onChange={(ev) => updateItem("answer", ev.target.value)}
                    disabled={disabled}
                    rows={4}
                    placeholder="The answer to this question..."
                    style={{ ...inputStyle, resize: "vertical" as const }}
                  />
                </label>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Contact form block editor
function ContactBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const fields = (data.fields as Array<{
    name: string;
    label: string;
    type: "text" | "email" | "textarea" | "select";
    required?: boolean;
    options?: string[];
  }>) || [];

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  return (
    <div data-test-id="block-editor-contact">
      {/* Title */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Form Title</span>
        <input
          type="text"
          value={(data.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
          disabled={disabled}
          placeholder="Get in Touch"
          style={inputStyle}
        />
      </label>

      {/* Description */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Description</span>
        <textarea
          value={(data.description as string) || ""}
          onChange={(e) => onChange("description", e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder="Have questions? We'd love to hear from you."
          style={{ ...inputStyle, resize: "vertical" as const }}
        />
      </label>

      {/* Recipient email */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Recipient Email *</span>
        <input
          type="email"
          value={(data.recipientEmail as string) || ""}
          onChange={(e) => onChange("recipientEmail", e.target.value)}
          disabled={disabled}
          placeholder="info@example.org"
          style={inputStyle}
        />
      </label>

      {/* Submit button text */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Submit Button Text</span>
        <input
          type="text"
          value={(data.submitText as string) || ""}
          onChange={(e) => onChange("submitText", e.target.value)}
          disabled={disabled}
          placeholder="Send Message"
          style={inputStyle}
        />
      </label>

      {/* Form fields repeater */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "8px" }}>
          Form Fields ({fields.length})
        </span>
        <RepeaterEditor
          items={fields}
          onChange={(newFields) => onChange("fields", newFields)}
          disabled={disabled}
          itemLabel="Field"
          renderItemSummary={(item) => {
            const f = item as { label?: string; type?: string; required?: boolean };
            return `${f.label || "(no label)"} (${f.type || "text"})${f.required ? " *" : ""}`;
          }}
          createNewItem={() => ({ name: "", label: "", type: "text" as const, required: false })}
          maxItems={15}
          renderItemFields={(item, _index, updateItem) => {
            const f = item as {
              name?: string;
              label?: string;
              type?: string;
              required?: boolean;
              options?: string[];
            };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Field Name *</span>
                    <input
                      type="text"
                      value={f.name || ""}
                      onChange={(ev) => updateItem("name", ev.target.value.replace(/\s+/g, "_").toLowerCase())}
                      disabled={disabled}
                      placeholder="field_name"
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Label *</span>
                    <input
                      type="text"
                      value={f.label || ""}
                      onChange={(ev) => updateItem("label", ev.target.value)}
                      disabled={disabled}
                      placeholder="Your Name"
                      style={inputStyle}
                    />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Type</span>
                    <select
                      value={f.type || "text"}
                      onChange={(ev) => updateItem("type", ev.target.value)}
                      disabled={disabled}
                      style={inputStyle}
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="textarea">Text Area</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
                    <input
                      type="checkbox"
                      checked={f.required || false}
                      onChange={(ev) => updateItem("required", ev.target.checked)}
                      disabled={disabled}
                    />
                    <span style={{ fontSize: "12px", color: "#666" }}>Required</span>
                  </label>
                </div>
                {f.type === "select" && (
                  <label style={{ display: "block" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>Options (one per line)</span>
                    <textarea
                      value={(f.options || []).join("\n")}
                      onChange={(ev) => updateItem("options", ev.target.value.split("\n").filter((o) => o.trim()))}
                      disabled={disabled}
                      rows={4}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                  </label>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

// Gadget block editor
function GadgetBlockEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  disabled: boolean;
}) {
  const gadgetOptions = getAllGadgetIds();

  const inputStyle = {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "4px",
  };

  const selectedGadgetId = (data.gadgetId as string) || "upcoming-events";
  const isOfficerGadget = isRoleRestrictedGadget(selectedGadgetId);

  return (
    <div data-test-id="block-editor-gadget">
      {/* Gadget selector */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Select Gadget</span>
        <select
          value={selectedGadgetId}
          onChange={(e) => onChange("gadgetId", e.target.value)}
          disabled={disabled}
          style={inputStyle}
        >
          {gadgetOptions.map((id) => {
            const isImplemented = isGadgetImplemented(id);
            const isRestricted = isRoleRestrictedGadget(id);
            return (
              <option key={id} value={id} disabled={!isImplemented}>
                {getGadgetTitle(id)}
                {isRestricted && " 🔒"}
                {!isImplemented && " (Coming Soon)"}
              </option>
            );
          })}
        </select>
      </label>

      {/* Officer gadget warning */}
      {isOfficerGadget && (
        <div
          style={{
            padding: "12px",
            marginBottom: "16px",
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "4px",
            color: "#92400e",
            fontSize: "13px",
          }}
        >
          🔒 <strong>Officer Only:</strong> This gadget will only be visible to users with the required role.
        </div>
      )}

      {/* Title override */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Custom Title</span>
        <input
          type="text"
          value={(data.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
          disabled={disabled}
          placeholder={getGadgetTitle(selectedGadgetId)}
          style={inputStyle}
        />
        <span style={{ fontSize: "12px", color: "#666", marginTop: "4px", display: "block" }}>
          Leave blank to use default title
        </span>
      </label>

      {/* Show title checkbox */}
      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <input
          type="checkbox"
          checked={data.showTitle !== false}
          onChange={(e) => onChange("showTitle", e.target.checked)}
          disabled={disabled}
        />
        <span style={{ fontSize: "13px", color: "#333" }}>Show title</span>
      </label>

      {/* Layout selector */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Layout</span>
        <select
          value={(data.layout as string) || "card"}
          onChange={(e) => onChange("layout", e.target.value)}
          disabled={disabled}
          style={inputStyle}
        >
          <option value="card">Card (with border)</option>
          <option value="inline">Inline (no border)</option>
        </select>
      </label>

      {/* Visibility selector */}
      <label style={{ display: "block", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Visibility</span>
        <select
          value={(data.visibility as string) || "members"}
          onChange={(e) => onChange("visibility", e.target.value)}
          disabled={disabled}
          style={inputStyle}
        >
          <option value="public">Public (everyone)</option>
          <option value="members">Members only</option>
          <option value="officers">Officers only</option>
          <option value="roles">Specific roles</option>
        </select>
      </label>

      {/* Role selector (when visibility is "roles") */}
      {data.visibility === "roles" && (
        <label style={{ display: "block", marginBottom: "16px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>Allowed Roles</span>
          <input
            type="text"
            value={((data.allowedRoles as string[]) || []).join(", ")}
            onChange={(e) => onChange("allowedRoles", e.target.value.split(",").map((r) => r.trim()).filter(Boolean))}
            disabled={disabled}
            placeholder="admin, president, vp-activities"
            style={inputStyle}
          />
          <span style={{ fontSize: "12px", color: "#666", marginTop: "4px", display: "block" }}>
            Comma-separated list of role names
          </span>
        </label>
      )}
    </div>
  );
}

// ============================================================================
// A2: Block Item with drag handle support
// ============================================================================

type BlockItemProps = {
  block: Block;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isEditing: boolean;
  saving: boolean;
  dragHandleProps: DragHandleProps;
  editingData: Record<string, unknown> | null;
  validationError: string | null;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  updateField: (field: string, value: unknown) => void;
};

function BlockItem({
  block,
  index,
  isFirst,
  isLast,
  isEditing,
  saving,
  dragHandleProps,
  editingData,
  validationError,
  onMoveUp,
  onMoveDown,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  updateField,
}: BlockItemProps) {
  const meta = BLOCK_METADATA[block.type];
  const isEditable = EDITABLE_BLOCK_TYPES.includes(block.type);
  const isReadonly = READONLY_BLOCK_TYPES.includes(block.type);

  return (
    <div
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
        {/* A2: Drag handle */}
        <DragHandle
          attributes={dragHandleProps.attributes}
          listeners={dragHandleProps.listeners}
          disabled={saving}
        />

        {/* Order controls (keyboard fallback) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <button
            type="button"
            data-test-id="block-move-up"
            onClick={onMoveUp}
            disabled={isFirst || saving}
            aria-label={`Move ${meta?.label || block.type} up`}
            title="Move up (keyboard shortcut)"
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
            onClick={onMoveDown}
            disabled={isLast || saving}
            aria-label={`Move ${meta?.label || block.type} down`}
            title="Move down (keyboard shortcut)"
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
          onClick={isEditing ? onCancelEdit : onEdit}
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
          ) : block.type === "stats" ? (
            <StatsBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "timeline" ? (
            <TimelineBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "accordion" ? (
            <AccordionBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "tabs" ? (
            <TabsBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "testimonial" ? (
            <TestimonialBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "cards" ? (
            <CardsBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "flip-card" ? (
            <FlipCardsBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "gallery" ? (
            <GalleryBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "faq" ? (
            <FaqBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "contact" ? (
            <ContactBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
          ) : block.type === "gadget" ? (
            <GadgetBlockEditor
              data={editingData || {}}
              onChange={updateField}
              disabled={saving}
            />
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
                onClick={onSaveEdit}
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
                onClick={onCancelEdit}
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
    </div>
  );
}
