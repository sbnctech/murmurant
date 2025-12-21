// Copyright (c) Santa Barbara Newcomers Club
// Page revision management for undo/redo functionality (A7)
// Charter P7: Full audit trail for privileged actions

import { prisma } from "@/lib/prisma";
import { PageContent } from "./blocks";

// Maximum number of revisions to keep per page
export const MAX_REVISIONS = 20;

// Revision action types
export type RevisionAction =
  | "edit_block"
  | "reorder"
  | "add_block"
  | "remove_block"
  | "edit_metadata";

/**
 * Revision state for a page
 */
export interface RevisionState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  currentPosition: number;
  totalRevisions: number;
}

/**
 * Result of an undo/redo operation
 */
export interface UndoRedoResult {
  success: boolean;
  content: PageContent | null;
  actionSummary: string | null;
  error?: string;
}

/**
 * Create a new revision snapshot before applying a change
 *
 * This should be called BEFORE the change is applied to page.content.
 * The revision stores the current state so it can be restored on undo.
 *
 * When a new revision is created:
 * 1. All redo entries (stackPosition < 0) are deleted
 * 2. The new revision is added at position 0
 * 3. Existing undo entries are shifted (position += 1)
 * 4. Old revisions beyond MAX_REVISIONS are pruned
 */
export async function createRevision(params: {
  pageId: string;
  content: PageContent;
  action: RevisionAction;
  actionSummary: string;
  memberId?: string | null;
}): Promise<void> {
  const { pageId, content, action, actionSummary, memberId } = params;

  // Delete all redo entries (any with stackPosition < 0)
  await prisma.pageRevision.deleteMany({
    where: {
      pageId,
      stackPosition: { lt: 0 },
    },
  });

  // Shift existing undo entries up by 1
  await prisma.pageRevision.updateMany({
    where: {
      pageId,
      stackPosition: { gte: 0 },
    },
    data: {
      stackPosition: { increment: 1 },
    },
  });

  // Create new revision at position 0
  await prisma.pageRevision.create({
    data: {
      pageId,
      content: content as object,
      action,
      actionSummary,
      stackPosition: 0,
      createdById: memberId || null,
    },
  });

  // Prune old revisions beyond MAX_REVISIONS
  await pruneRevisions(pageId);
}

/**
 * Get the current revision state for a page
 */
export async function getRevisionState(pageId: string): Promise<RevisionState> {
  const revisions = await prisma.pageRevision.findMany({
    where: { pageId },
    select: { stackPosition: true },
  });

  const undoCount = revisions.filter((r) => r.stackPosition > 0).length;
  const redoCount = revisions.filter((r) => r.stackPosition < 0).length;

  return {
    canUndo: undoCount > 0,
    canRedo: redoCount > 0,
    undoCount,
    redoCount,
    currentPosition: 0,
    totalRevisions: revisions.length,
  };
}

/**
 * Apply undo - restore previous state
 *
 * 1. Get the revision at stackPosition 1 (the previous state)
 * 2. Move it to stackPosition -1 (redo stack)
 * 3. Return the content from that revision
 */
export async function applyUndo(
  pageId: string,
  currentContent: PageContent
): Promise<UndoRedoResult> {
  // Get the most recent undo entry (position 1)
  const undoRevision = await prisma.pageRevision.findFirst({
    where: {
      pageId,
      stackPosition: 1,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!undoRevision) {
    return {
      success: false,
      content: null,
      actionSummary: null,
      error: "Nothing to undo",
    };
  }

  // Create a revision for the current state at redo position
  // First, shift all redo entries down by 1
  await prisma.pageRevision.updateMany({
    where: {
      pageId,
      stackPosition: { lt: 0 },
    },
    data: {
      stackPosition: { decrement: 1 },
    },
  });

  // Create revision for current state at position -1 (redo)
  await prisma.pageRevision.create({
    data: {
      pageId,
      content: currentContent as object,
      action: "edit_block", // Generic action for undo state
      actionSummary: "Before undo",
      stackPosition: -1,
      createdById: undoRevision.createdById,
    },
  });

  // Shift all undo entries down by 1
  await prisma.pageRevision.updateMany({
    where: {
      pageId,
      stackPosition: { gt: 0 },
    },
    data: {
      stackPosition: { decrement: 1 },
    },
  });

  // Delete the revision we're restoring (it's now in the page)
  await prisma.pageRevision.delete({
    where: { id: undoRevision.id },
  });

  return {
    success: true,
    content: undoRevision.content as PageContent,
    actionSummary: undoRevision.actionSummary,
  };
}

/**
 * Apply redo - restore next state
 *
 * 1. Get the revision at stackPosition -1 (the redo state)
 * 2. Move it to stackPosition 1 (undo stack)
 * 3. Return the content from that revision
 */
export async function applyRedo(
  pageId: string,
  currentContent: PageContent
): Promise<UndoRedoResult> {
  // Get the most recent redo entry (position -1)
  const redoRevision = await prisma.pageRevision.findFirst({
    where: {
      pageId,
      stackPosition: -1,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!redoRevision) {
    return {
      success: false,
      content: null,
      actionSummary: null,
      error: "Nothing to redo",
    };
  }

  // Create a revision for the current state at undo position
  // First, shift all undo entries up by 1
  await prisma.pageRevision.updateMany({
    where: {
      pageId,
      stackPosition: { gt: 0 },
    },
    data: {
      stackPosition: { increment: 1 },
    },
  });

  // Create revision for current state at position 1 (undo)
  await prisma.pageRevision.create({
    data: {
      pageId,
      content: currentContent as object,
      action: "edit_block", // Generic action for redo state
      actionSummary: "Before redo",
      stackPosition: 1,
      createdById: redoRevision.createdById,
    },
  });

  // Shift all redo entries up by 1
  await prisma.pageRevision.updateMany({
    where: {
      pageId,
      stackPosition: { lt: 0 },
    },
    data: {
      stackPosition: { increment: 1 },
    },
  });

  // Delete the revision we're restoring (it's now in the page)
  await prisma.pageRevision.delete({
    where: { id: redoRevision.id },
  });

  return {
    success: true,
    content: redoRevision.content as PageContent,
    actionSummary: redoRevision.actionSummary,
  };
}

/**
 * Clear all revisions for a page
 *
 * This should be called on:
 * - Publish (content becomes publishedContent)
 * - Discard Draft (content restored from publishedContent)
 */
export async function clearRevisions(pageId: string): Promise<number> {
  const result = await prisma.pageRevision.deleteMany({
    where: { pageId },
  });
  return result.count;
}

/**
 * Prune old revisions beyond MAX_REVISIONS
 *
 * Keeps the most recent MAX_REVISIONS entries.
 * This is called automatically after creating a new revision.
 */
async function pruneRevisions(pageId: string): Promise<number> {
  // Count total revisions
  const count = await prisma.pageRevision.count({
    where: { pageId },
  });

  if (count <= MAX_REVISIONS) {
    return 0;
  }

  // Get IDs of revisions to keep (most recent by position)
  const revisionsToKeep = await prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: [
      { stackPosition: "asc" }, // Redo (negative) first, then undo (positive)
      { createdAt: "desc" },
    ],
    take: MAX_REVISIONS,
    select: { id: true },
  });

  const keepIds = revisionsToKeep.map((r) => r.id);

  // Delete all others
  const deleted = await prisma.pageRevision.deleteMany({
    where: {
      pageId,
      id: { notIn: keepIds },
    },
  });

  return deleted.count;
}

/**
 * Get revision history for a page (for debugging/admin)
 */
export async function getRevisionHistory(pageId: string, limit = 10) {
  return prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: [
      { stackPosition: "asc" },
      { createdAt: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      action: true,
      actionSummary: true,
      stackPosition: true,
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Determine the action summary for a change
 */
export function getActionSummary(
  action: RevisionAction,
  blockType?: string,
  blockLabel?: string
): string {
  const label = blockLabel || blockType || "block";

  switch (action) {
    case "edit_block":
      return `Edited ${label}`;
    case "reorder":
      return "Reordered blocks";
    case "add_block":
      return `Added ${label}`;
    case "remove_block":
      return `Removed ${label}`;
    case "edit_metadata":
      return "Edited page metadata";
    default:
      return "Made changes";
  }
}
