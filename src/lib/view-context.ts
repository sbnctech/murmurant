/**
 * View Context - Demo-safe viewer simulation mechanism
 *
 * Allows tech lead/webmaster to simulate different user roles for testing and support.
 * This is a UI-only simulation - actual authorization remains server-side.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { GlobalRole } from "@/lib/auth";

// ============================================================================
// Types
// ============================================================================

/**
 * Available view modes for the demo.
 * "actual" means use the real authenticated user's context.
 */
// NOTE: Do not import "next/headers" at module top-level.
// Some builds include legacy pages/ routes; top-level next/headers import will fail.
const getNextCookies = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cookies } = require("next/headers");
  return cookies();
};

type CookieStore = {
  get?: (name: string) => string | { value?: string } | undefined;
};

function cookieGet(store: unknown, name: string): string | undefined {
  const typedStore = store as CookieStore;
  const v = typedStore?.get?.(name);
  if (typeof v === "string") return v;
  if (v && typeof v.value === "string") return v.value;
  return undefined;
}



export type ViewMode =
  | "public"
  | "member"
  | "event-chair"
  | "vp-membership"
  | "president"
  | "tech-lead"
  | "actual";

/**
 * View context represents the simulated viewer state.
 */
export interface ViewContext {
  /** Current view mode */
  mode: ViewMode;
  /** Display label for the mode */
  label: string;
  /** Whether this is a simulated view (not the actual user) */
  isSimulated: boolean;
  /** Simulated role for capability checks (UI only) */
  simulatedRole: GlobalRole | null;
  /** Whether the viewer can see member-only content */
  canSeeMemberContent: boolean;
  /** Whether the viewer can see officer gadgets */
  canSeeOfficerGadgets: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const VIEW_AS_COOKIE_NAME = "murmurant_view_as";

/**
 * View mode configurations.
 */
export const VIEW_MODE_CONFIG: Record<
  ViewMode,
  {
    label: string;
    simulatedRole: GlobalRole | null;
    canSeeMemberContent: boolean;
    canSeeOfficerGadgets: boolean;
  }
> = {
  actual: {
    label: "Actual User",
    simulatedRole: null,
    canSeeMemberContent: true, // Determined by actual auth
    canSeeOfficerGadgets: true, // Determined by actual auth
  },
  public: {
    label: "Public Visitor",
    simulatedRole: null,
    canSeeMemberContent: false,
    canSeeOfficerGadgets: false,
  },
  member: {
    label: "Member",
    simulatedRole: "member",
    canSeeMemberContent: true,
    canSeeOfficerGadgets: false,
  },
  "event-chair": {
    label: "Event Chair",
    simulatedRole: "event-chair",
    canSeeMemberContent: true,
    canSeeOfficerGadgets: true,
  },
  "vp-membership": {
    label: "VP Membership",
    simulatedRole: "vp-activities",
    canSeeMemberContent: true,
    canSeeOfficerGadgets: true,
  },
  president: {
    label: "President",
    simulatedRole: "president",
    canSeeMemberContent: true,
    canSeeOfficerGadgets: true,
  },
  "tech-lead": {
    label: "Tech Lead",
    simulatedRole: "admin",
    canSeeMemberContent: true,
    canSeeOfficerGadgets: true,
  },
};

// ============================================================================
// Server-side helpers
// ============================================================================

/**
 * Check if view-as mode is enabled.
 * Controlled by DEMO_VIEW_AS environment variable.
 */
export function isViewAsEnabled(): boolean {
  return process.env.DEMO_VIEW_AS === "1" || process.env.NODE_ENV === "development";
}

/**
 * Get the current view context from cookies (server-side).
 * Returns "actual" if no override is set or view-as is disabled.
 */
export async function getViewContext(): Promise<ViewContext> {
  if (!isViewAsEnabled()) {
    return buildViewContext("actual");
  }

  const cookieStore = await getNextCookies();
  const viewAsCookie = cookieGet(cookieStore, VIEW_AS_COOKIE_NAME);
  const mode = (viewAsCookie as ViewMode) || "actual";

  // Validate mode
  if (!VIEW_MODE_CONFIG[mode]) {
    return buildViewContext("actual");
  }

  return buildViewContext(mode);
}

/**
 * Build a ViewContext object from a mode.
 */
export function buildViewContext(mode: ViewMode): ViewContext {
  const config = VIEW_MODE_CONFIG[mode] || VIEW_MODE_CONFIG.actual;

  return {
    mode,
    label: config.label,
    isSimulated: mode !== "actual",
    simulatedRole: config.simulatedRole,
    canSeeMemberContent: config.canSeeMemberContent,
    canSeeOfficerGadgets: config.canSeeOfficerGadgets,
  };
}

/**
 * Get all available view modes for the picker.
 */
export function getAvailableViewModes(): Array<{ value: ViewMode; label: string }> {
  return [
    { value: "actual", label: "Actual User" },
    { value: "public", label: "Public Visitor" },
    { value: "member", label: "Member" },
    { value: "event-chair", label: "Event Chair" },
    { value: "vp-membership", label: "VP Membership" },
    { value: "president", label: "President" },
    { value: "tech-lead", label: "Tech Lead (Admin)" },
  ];
}
