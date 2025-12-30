/**
 * Gadget Registry - Maps gadgetIds to components and metadata
 *
 * This module provides the gadget registry, titles, and helper functions
 * that can be used across the gadget system.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { GadgetProps } from "./types";
import type { GlobalRole } from "@/lib/auth";

/**
 * Gadget metadata type
 */
export interface GadgetMetadata {
  title: string;
  implemented: boolean;
  slot?: string;
}

/**
 * GADGET REGISTRY
 *
 * Defines all known gadget IDs and their metadata.
 * Components are loaded dynamically in GadgetHost.
 *
 * null = gadget ID is reserved but not yet implemented
 */
export const GADGET_IDS = {
  // Member gadgets
  UPCOMING_EVENTS: "upcoming-events",
  MY_REGISTRATIONS: "my-registrations",
  ANNOUNCEMENTS: "announcements",
  PRESIDENTS_MESSAGE: "presidents-message",
  RECENT_PHOTOS: "recent-photos",
  TASKS: "tasks",
  QUICK_ACTIONS: "quick-actions",
  // Officer gadgets (role-gated)
  VP_MEMBERSHIP: "vp-membership",
  EVENT_CHAIR: "event-chair",
  PRESIDENT: "president",
  TECH_LEAD: "tech-lead",
} as const;

export type GadgetId = (typeof GADGET_IDS)[keyof typeof GADGET_IDS];

/**
 * GADGET METADATA
 *
 * Provides title and implementation status for each gadget.
 */
export const GADGET_METADATA: Record<string, GadgetMetadata> = {
  // Member gadgets
  [GADGET_IDS.UPCOMING_EVENTS]: {
    title: "Upcoming Events",
    implemented: true,
  },
  [GADGET_IDS.MY_REGISTRATIONS]: {
    title: "My Registrations",
    implemented: true,
  },
  [GADGET_IDS.ANNOUNCEMENTS]: {
    title: "Announcements",
    implemented: false,
  },
  [GADGET_IDS.PRESIDENTS_MESSAGE]: {
    title: "President's Message",
    implemented: false,
  },
  [GADGET_IDS.RECENT_PHOTOS]: {
    title: "Recent Photos",
    implemented: false,
  },
  [GADGET_IDS.TASKS]: {
    title: "My Tasks",
    implemented: false,
  },
  [GADGET_IDS.QUICK_ACTIONS]: {
    title: "Quick Actions",
    implemented: false,
  },
  // Officer gadgets (role-gated)
  [GADGET_IDS.VP_MEMBERSHIP]: {
    title: "VP Membership",
    implemented: true,
  },
  [GADGET_IDS.EVENT_CHAIR]: {
    title: "My Events",
    implemented: true,
  },
  [GADGET_IDS.PRESIDENT]: {
    title: "Governance Summary",
    implemented: true,
  },
  [GADGET_IDS.TECH_LEAD]: {
    title: "System Status",
    implemented: true,
  },
};

/**
 * Get gadget title by ID
 */
export function getGadgetTitle(gadgetId: string): string {
  return GADGET_METADATA[gadgetId]?.title ?? "Unknown Gadget";
}

/**
 * Check if a gadget is implemented
 */
export function isGadgetImplemented(gadgetId: string): boolean {
  return GADGET_METADATA[gadgetId]?.implemented ?? false;
}

/**
 * Check if a gadget ID is known (registered)
 */
export function isGadgetKnown(gadgetId: string): boolean {
  return gadgetId in GADGET_METADATA;
}

/**
 * Get all implemented gadget IDs
 */
export function getImplementedGadgets(): string[] {
  return Object.entries(GADGET_METADATA)
    .filter(([_, meta]) => meta.implemented)
    .map(([id]) => id);
}

/**
 * Get all gadget IDs
 */
export function getAllGadgetIds(): string[] {
  return Object.keys(GADGET_METADATA);
}

/**
 * STATUS_STYLES - Color-coded status badge styles
 * Used by MyRegistrationsGadget and other components
 */
export const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  CONFIRMED: { bg: "#d1fae5", text: "#065f46", label: "Confirmed" },
  PENDING: { bg: "#dbeafe", text: "#1e40af", label: "Pending" },
  PENDING_PAYMENT: { bg: "#fef3c7", text: "#92400e", label: "Payment Pending" },
  WAITLISTED: { bg: "#fef3c7", text: "#92400e", label: "Waitlisted" },
  CANCELLED: { bg: "#fee2e2", text: "#991b1b", label: "Cancelled" },
};

/**
 * Get status style for a registration status
 */
export function getStatusStyle(status: string): {
  bg: string;
  text: string;
  label: string;
} {
  return (
    STATUS_STYLES[status] ?? { bg: "#f3f4f6", text: "#374151", label: status }
  );
}

/**
 * AVAILABILITY_COLORS - Colors for event availability
 */
export const AVAILABILITY_COLORS = {
  FULL: "#dc2626", // Red
  LOW: "#ea580c", // Orange
  AVAILABLE: "#16a34a", // Green
} as const;

/**
 * Event availability interface
 */
export interface EventAvailability {
  spotsRemaining: number | null;
  isWaitlistOpen: boolean;
}

/**
 * Get availability text for an event
 */
export function getAvailabilityText(event: EventAvailability): string {
  if (event.isWaitlistOpen) return "Waitlist open";
  if (event.spotsRemaining === null) return "Open";
  if (event.spotsRemaining === 0) return "Full";
  return `${event.spotsRemaining} spots`;
}

/**
 * Get availability color for an event
 */
export function getAvailabilityColor(event: EventAvailability): string {
  if (event.isWaitlistOpen || event.spotsRemaining === 0) {
    return AVAILABILITY_COLORS.FULL;
  }
  if (event.spotsRemaining !== null && event.spotsRemaining <= 3) {
    return AVAILABILITY_COLORS.LOW;
  }
  return AVAILABILITY_COLORS.AVAILABLE;
}

// ============================================================================
// GADGET ROLE-GATING (RBAC)
// Officer gadgets are only visible to users with specific roles.
// ============================================================================

/**
 * GADGET_ROLES - Maps officer gadgets to allowed roles
 *
 * If a gadget ID is not in this map, it has no role restrictions (public/member).
 * Admin role can always see all gadgets.
 */
export const GADGET_ROLES: Partial<Record<GadgetId, GlobalRole[]>> = {
  [GADGET_IDS.VP_MEMBERSHIP]: ["vp-activities", "admin"],
  [GADGET_IDS.EVENT_CHAIR]: ["event-chair", "admin"],
  [GADGET_IDS.PRESIDENT]: ["president", "secretary", "parliamentarian", "admin"],
  [GADGET_IDS.TECH_LEAD]: ["admin"],
};

/**
 * Visibility levels for gadgets in the block system
 */
export type GadgetVisibility = "public" | "members" | "officers" | "roles";

/**
 * Check if a user role can view a specific gadget
 *
 * @param gadgetId - The gadget ID to check
 * @param userRole - The user's global role (null for unauthenticated)
 * @param visibility - Optional visibility override from block settings
 * @param allowedRoles - Optional specific roles when visibility="roles"
 * @returns true if the user can view the gadget
 */
export function canViewGadget(
  gadgetId: string,
  userRole: GlobalRole | null,
  visibility?: GadgetVisibility,
  allowedRoles?: string[]
): boolean {
  // Check block-level visibility first
  if (visibility) {
    switch (visibility) {
      case "public":
        // Anyone can see public gadgets
        break;
      case "members":
        // Must be authenticated with any role
        if (!userRole) return false;
        break;
      case "officers":
        // Must be a non-member role
        if (!userRole || userRole === "member") return false;
        break;
      case "roles":
        // Must have one of the specified roles
        if (!userRole) return false;
        if (!allowedRoles || allowedRoles.length === 0) return false;
        if (!allowedRoles.includes(userRole)) return false;
        break;
    }
  }

  // Check gadget-level role restrictions (officer gadgets)
  const requiredRoles = GADGET_ROLES[gadgetId as GadgetId];
  if (!requiredRoles) {
    // No role restriction on this gadget
    return true;
  }

  // Officer gadget - must have a matching role
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Check if a gadget has role restrictions
 */
export function isRoleRestrictedGadget(gadgetId: string): boolean {
  return gadgetId in GADGET_ROLES;
}

/**
 * Get the required roles for a gadget
 */
export function getGadgetRoles(gadgetId: string): GlobalRole[] | null {
  return GADGET_ROLES[gadgetId as GadgetId] ?? null;
}

/**
 * Get all officer gadget IDs
 */
export function getOfficerGadgetIds(): GadgetId[] {
  return Object.keys(GADGET_ROLES) as GadgetId[];
}

/**
 * Get gadgets for a specific role
 */
export function getGadgetsForRole(role: GlobalRole): GadgetId[] {
  return Object.entries(GADGET_ROLES)
    .filter(([_, roles]) => roles.includes(role))
    .map(([id]) => id as GadgetId);
}
