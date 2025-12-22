// Copyright (c) Santa Barbara Newcomers Club
// Page lifecycle state machine and validation
// A4: Draft/Published lifecycle management

import { z } from "zod";
import { PageContent } from "./blocks";

// ============================================================================
// Types
// ============================================================================

export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/**
 * Lifecycle action types that can be performed on a page
 */
export type LifecycleAction = "publish" | "unpublish" | "archive" | "discardDraft";

/**
 * Page lifecycle state for UI rendering
 */
export interface PageLifecycleState {
  status: PageStatus;
  publishedAt: Date | null;
  hasDraftChanges: boolean;
  canPublish: boolean;
  canUnpublish: boolean;
  canDiscardDraft: boolean;
  canArchive: boolean;
}

/**
 * Validation result type
 */
export type LifecycleValidationResult =
  | { ok: true }
  | { ok: false; error: string };

// ============================================================================
// State Machine Validation
// ============================================================================

/**
 * Allowed state transitions for page lifecycle
 *
 * State Diagram (ASCII):
 *
 *   +-------+       publish       +-----------+
 *   | DRAFT |-------------------->| PUBLISHED |
 *   +-------+                     +-----------+
 *       ^                              |
 *       |         unpublish            |
 *       +------------------------------+
 *       |                              |
 *       |          archive             v
 *       +------------------------+----------+
 *                                | ARCHIVED |
 *                                +----------+
 *
 * discardDraft: Only valid when PUBLISHED and hasDraftChanges
 */
const ALLOWED_TRANSITIONS: Record<PageStatus, LifecycleAction[]> = {
  DRAFT: ["publish", "archive"],
  PUBLISHED: ["unpublish", "archive", "discardDraft"],
  ARCHIVED: [], // No transitions out of ARCHIVED (restore would require admin action)
};

/**
 * Check if an action is valid for the current page state
 */
export function isValidTransition(
  currentStatus: PageStatus,
  action: LifecycleAction,
  hasDraftChanges: boolean = false
): LifecycleValidationResult {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowed.includes(action)) {
    return {
      ok: false,
      error: `Cannot ${action} a ${currentStatus.toLowerCase()} page`,
    };
  }

  // Special case: discardDraft requires draft changes to exist
  if (action === "discardDraft" && !hasDraftChanges) {
    return {
      ok: false,
      error: "No draft changes to discard",
    };
  }

  return { ok: true };
}

/**
 * Get the new status after performing an action
 */
export function getNextStatus(action: LifecycleAction): PageStatus | null {
  switch (action) {
    case "publish":
      return "PUBLISHED";
    case "unpublish":
      return "DRAFT";
    case "archive":
      return "ARCHIVED";
    case "discardDraft":
      return null; // Status doesn't change
    default:
      return null;
  }
}

// ============================================================================
// Draft Change Detection
// ============================================================================

/**
 * Check if the draft content differs from published content
 * Returns true if there are unsaved changes
 */
export function hasDraftChanges(
  content: PageContent | null,
  publishedContent: PageContent | null
): boolean {
  // If there's no published content, there are no draft changes to compare
  if (publishedContent === null) {
    return false;
  }

  // If content is null but we have published content, that's a change
  if (content === null) {
    return true;
  }

  // Compare JSON representations (deep equality)
  return JSON.stringify(content) !== JSON.stringify(publishedContent);
}

/**
 * Compute the full lifecycle state for UI rendering
 */
export function computeLifecycleState(
  status: PageStatus,
  publishedAt: Date | null,
  content: PageContent | null,
  publishedContent: PageContent | null
): PageLifecycleState {
  const draftChanges = hasDraftChanges(content, publishedContent);

  return {
    status,
    publishedAt,
    hasDraftChanges: draftChanges,
    canPublish: status === "DRAFT" || (status === "PUBLISHED" && draftChanges),
    canUnpublish: status === "PUBLISHED",
    canDiscardDraft: status === "PUBLISHED" && draftChanges,
    canArchive: status === "DRAFT" || status === "PUBLISHED",
  };
}

// ============================================================================
// Zod Schemas for API Validation
// ============================================================================

/**
 * Schema for lifecycle action query parameter
 */
export const lifecycleActionSchema = z.enum([
  "publish",
  "unpublish",
  "archive",
  "discardDraft",
]);

/**
 * Schema for page status
 */
export const pageStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

// ============================================================================
// Helpers for Lifecycle Operations
// ============================================================================

/**
 * Generate audit log data for a lifecycle action
 */
export function getLifecycleAuditData(
  action: LifecycleAction,
  beforeStatus: PageStatus,
  afterStatus: PageStatus | null,
  extra?: Record<string, unknown>
): { action: string; before: Record<string, unknown>; after: Record<string, unknown> } {
  const actionMap: Record<LifecycleAction, string> = {
    publish: "PUBLISH",
    unpublish: "UNPUBLISH",
    archive: "ARCHIVE",
    discardDraft: "DISCARD_DRAFT",
  };

  return {
    action: actionMap[action],
    before: { status: beforeStatus, ...extra },
    after: { status: afterStatus ?? beforeStatus, ...extra },
  };
}

/**
 * Generate user-friendly message for lifecycle action result
 */
export function getLifecycleMessage(action: LifecycleAction): string {
  switch (action) {
    case "publish":
      return "Page published successfully";
    case "unpublish":
      return "Page unpublished";
    case "archive":
      return "Page archived";
    case "discardDraft":
      return "Draft changes discarded";
    default:
      return "Page updated";
  }
}
