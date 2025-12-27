// Copyright (c) Santa Barbara Newcomers Club
// View context utilities for determining public vs member rendering

import type { ViewContext } from "./pageTemplates";

// ============================================================================
// Path-Based Context Detection
// ============================================================================

/**
 * Prefixes that indicate member-only context
 */
const MEMBER_PATH_PREFIXES = [
  "/member",
  "/my",
  "/account",
  "/groups",
  "/directory",
];

/**
 * Prefixes that are always public context
 */
const _PUBLIC_PATH_PREFIXES = [
  "/",
  "/about",
  "/join",
  "/contact",
  "/events",
  "/login",
  "/auth",
];

/**
 * Determine view context from URL path
 *
 * @param path - URL path (e.g., "/member/dashboard" or "/about")
 * @returns ViewContext - "public" or "member"
 */
export function getViewContextFromPath(path: string): ViewContext {
  const normalizedPath = path.toLowerCase();

  // Check member prefixes first (more specific)
  for (const prefix of MEMBER_PATH_PREFIXES) {
    if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
      return "member";
    }
  }

  // Default to public
  return "public";
}

/**
 * Check if a path requires authentication
 *
 * @param path - URL path to check
 * @returns boolean - true if path requires auth
 */
export function pathRequiresAuth(path: string): boolean {
  return getViewContextFromPath(path) === "member";
}

// ============================================================================
// View Context Metadata
// ============================================================================

/**
 * Metadata for each view context
 */
export type ViewContextMeta = {
  context: ViewContext;
  label: string;
  description: string;
  defaultLayout: string;
  navigationSlug: string;
};

/**
 * Context metadata definitions
 */
export const VIEW_CONTEXT_META: Record<ViewContext, ViewContextMeta> = {
  public: {
    context: "public",
    label: "Public",
    description: "Pages visible to all visitors including search engines",
    defaultLayout: "public",
    navigationSlug: "public-nav",
  },
  member: {
    context: "member",
    label: "Member",
    description: "Pages visible only to authenticated members",
    defaultLayout: "member",
    navigationSlug: "member-nav",
  },
};

/**
 * Get metadata for a view context
 */
export function getViewContextMeta(context: ViewContext): ViewContextMeta {
  return VIEW_CONTEXT_META[context];
}

// ============================================================================
// Context Resolution
// ============================================================================

/**
 * Result of resolving view context for a request
 */
export type ViewContextResolution = {
  context: ViewContext;
  path: string;
  requiresAuth: boolean;
  redirectUrl?: string;
};

/**
 * Resolve view context for a request path with optional authentication state
 *
 * @param path - URL path
 * @param isAuthenticated - Whether user is authenticated
 * @returns ViewContextResolution with context and any required redirects
 */
export function resolveViewContext(
  path: string,
  isAuthenticated: boolean
): ViewContextResolution {
  const context = getViewContextFromPath(path);
  const requiresAuth = pathRequiresAuth(path);

  // If path requires auth but user is not authenticated, redirect to login
  if (requiresAuth && !isAuthenticated) {
    return {
      context,
      path,
      requiresAuth,
      redirectUrl: `/login?redirect=${encodeURIComponent(path)}`,
    };
  }

  return {
    context,
    path,
    requiresAuth,
  };
}

// ============================================================================
// Page Visibility Mapping
// ============================================================================

/**
 * Map page visibility to allowed view contexts
 */
export function getContextsForVisibility(
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED"
): ViewContext[] {
  switch (visibility) {
    case "PUBLIC":
      return ["public", "member"];
    case "MEMBERS_ONLY":
    case "ROLE_RESTRICTED":
      return ["member"];
    default:
      return ["public", "member"];
  }
}

/**
 * Check if a page with given visibility can be viewed in a context
 */
export function canViewInContext(
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED",
  context: ViewContext
): boolean {
  const allowedContexts = getContextsForVisibility(visibility);
  return allowedContexts.includes(context);
}
