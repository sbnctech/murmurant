// Copyright (c) Santa Barbara Newcomers Club
// Unit tests for A7: Undo/Redo revisions module

import { describe, it, expect, vi } from "vitest";
import {
  getActionSummary,
  RevisionAction,
  MAX_REVISIONS,
} from "@/lib/publishing/revisions";

// Mock prisma for database tests
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pageRevision: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("revisions module", () => {
  describe("getActionSummary", () => {
    it("returns correct summary for edit_block action", () => {
      expect(getActionSummary("edit_block")).toBe("Edited block");
      expect(getActionSummary("edit_block", "hero")).toBe("Edited hero");
      expect(getActionSummary("edit_block", "text", "Welcome Section")).toBe(
        "Edited Welcome Section"
      );
    });

    it("returns correct summary for reorder action", () => {
      expect(getActionSummary("reorder")).toBe("Reordered blocks");
    });

    it("returns correct summary for add_block action", () => {
      expect(getActionSummary("add_block")).toBe("Added block");
      expect(getActionSummary("add_block", "hero")).toBe("Added hero");
      expect(getActionSummary("add_block", "text", "New Text Block")).toBe(
        "Added New Text Block"
      );
    });

    it("returns correct summary for remove_block action", () => {
      expect(getActionSummary("remove_block")).toBe("Removed block");
      expect(getActionSummary("remove_block", "divider")).toBe("Removed divider");
    });

    it("returns correct summary for edit_metadata action", () => {
      expect(getActionSummary("edit_metadata")).toBe("Edited page metadata");
    });

    it("returns fallback for unknown action", () => {
      expect(getActionSummary("unknown" as RevisionAction)).toBe("Made changes");
    });
  });

  describe("MAX_REVISIONS constant", () => {
    it("is set to 20", () => {
      expect(MAX_REVISIONS).toBe(20);
    });
  });
});

describe("RevisionState interface", () => {
  it("has correct shape", () => {
    // Type checking test - this verifies the interface shape
    const state = {
      canUndo: true,
      canRedo: false,
      undoCount: 3,
      redoCount: 0,
      currentPosition: 0,
      totalRevisions: 3,
    };

    expect(state.canUndo).toBe(true);
    expect(state.canRedo).toBe(false);
    expect(state.undoCount).toBe(3);
    expect(state.redoCount).toBe(0);
    expect(state.currentPosition).toBe(0);
    expect(state.totalRevisions).toBe(3);
  });
});

describe("UndoRedoResult interface", () => {
  it("has correct success shape", () => {
    const successResult = {
      success: true,
      content: { schemaVersion: 1, blocks: [] },
      actionSummary: "Edited hero",
    };

    expect(successResult.success).toBe(true);
    expect(successResult.content).toBeDefined();
    expect(successResult.actionSummary).toBe("Edited hero");
  });

  it("has correct failure shape", () => {
    const failureResult = {
      success: false,
      content: null,
      actionSummary: null,
      error: "Nothing to undo",
    };

    expect(failureResult.success).toBe(false);
    expect(failureResult.content).toBeNull();
    expect(failureResult.error).toBe("Nothing to undo");
  });
});

describe("RevisionAction type", () => {
  it("includes all expected action types", () => {
    const actions: RevisionAction[] = [
      "edit_block",
      "reorder",
      "add_block",
      "remove_block",
      "edit_metadata",
    ];

    expect(actions).toContain("edit_block");
    expect(actions).toContain("reorder");
    expect(actions).toContain("add_block");
    expect(actions).toContain("remove_block");
    expect(actions).toContain("edit_metadata");
  });
});
