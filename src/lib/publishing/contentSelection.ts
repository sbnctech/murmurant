// Copyright (c) Santa Barbara Newcomers Club
// Content selection logic for page rendering
// A5: Select appropriate content based on context (published vs draft)

import { PageContent } from "./blocks";

/**
 * Content selection mode for page rendering
 */
export type ContentMode = "published" | "draft" | "preview";

/**
 * Result of content selection
 */
export interface ContentSelectionResult {
  content: PageContent | null;
  mode: ContentMode;
  isPreview: boolean;
  hasDraftChanges: boolean;
}

/**
 * Select the appropriate content to render based on mode
 *
 * - "published": Always use publishedContent (public route)
 * - "draft": Use content (working draft) for editing
 * - "preview": Use content if exists, else publishedContent (preview route)
 *
 * @param content - The working draft content
 * @param publishedContent - The frozen published snapshot
 * @param mode - The selection mode
 */
export function selectContent(
  content: PageContent | null,
  publishedContent: PageContent | null,
  mode: ContentMode
): ContentSelectionResult {
  const hasDraftChanges = detectDraftChanges(content, publishedContent);

  switch (mode) {
    case "published":
      // Public route: only show published content
      return {
        content: publishedContent,
        mode: "published",
        isPreview: false,
        hasDraftChanges,
      };

    case "draft":
      // Editor: show working draft
      return {
        content: content,
        mode: "draft",
        isPreview: false,
        hasDraftChanges,
      };

    case "preview":
      // Preview route: prefer draft, fallback to published
      return {
        content: content ?? publishedContent,
        mode: "preview",
        isPreview: true,
        hasDraftChanges,
      };
  }
}

/**
 * Detect if the draft content differs from published content
 *
 * Returns true if:
 * - Both content and publishedContent exist and are different
 *
 * Returns false if:
 * - publishedContent is null (never published)
 * - content equals publishedContent
 */
export function detectDraftChanges(
  content: PageContent | null,
  publishedContent: PageContent | null
): boolean {
  // If no published content, there are no "changes" to compare against
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
 * Get a human-readable label for the content mode
 */
export function getContentModeLabel(mode: ContentMode): string {
  switch (mode) {
    case "published":
      return "Published version";
    case "draft":
      return "Draft (working copy)";
    case "preview":
      return "Preview (unpublished changes)";
  }
}

/**
 * Determine if a page should be visible at a public URL
 *
 * A page is publicly visible if:
 * - Status is PUBLISHED
 * - publishedContent exists
 */
export function isPagePubliclyVisible(
  status: string,
  publishedContent: unknown
): boolean {
  return status === "PUBLISHED" && publishedContent !== null;
}

/**
 * Determine if a page has a previewable draft
 *
 * A page has a previewable draft if:
 * - content exists
 * - (optionally) content differs from publishedContent
 */
export function hasPreviewableDraft(
  content: PageContent | null,
  publishedContent: PageContent | null
): boolean {
  // If there's no content at all, nothing to preview
  if (content === null) {
    return false;
  }

  // If there's content and it's different from published, it's previewable
  // If there's no published content yet, the draft is still previewable
  return true;
}
