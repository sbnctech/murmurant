/**
 * Officer Gadget Configuration
 *
 * Maps GlobalRole values to their corresponding officer gadget types.
 * This module provides testable logic for the role-based gadget selection.
 *
 * Copyright © 2025 Murmurant, Inc.
 */

import type { GlobalRole } from "@/lib/auth";

/**
 * Officer gadget types
 */
export const OFFICER_GADGET_TYPES = {
  PRESIDENT: "president",
  VP_MEMBERSHIP: "vp-membership",
  EVENT_CHAIR: "event-chair",
  TECH_LEAD: "tech-lead",
} as const;

export type OfficerGadgetType =
  (typeof OFFICER_GADGET_TYPES)[keyof typeof OFFICER_GADGET_TYPES];

/**
 * Gadget metadata for each officer gadget type
 */
export interface OfficerGadgetMetadata {
  type: OfficerGadgetType;
  title: string;
  subtitle: string;
  testId: string;
  adminLink: string;
}

export const OFFICER_GADGET_METADATA: Record<
  OfficerGadgetType,
  OfficerGadgetMetadata
> = {
  [OFFICER_GADGET_TYPES.PRESIDENT]: {
    type: OFFICER_GADGET_TYPES.PRESIDENT,
    title: "Governance Summary",
    subtitle: "Board oversight",
    testId: "president-gadget",
    adminLink: "/admin/governance",
  },
  [OFFICER_GADGET_TYPES.VP_MEMBERSHIP]: {
    type: OFFICER_GADGET_TYPES.VP_MEMBERSHIP,
    title: "VP Membership",
    subtitle: "Membership oversight",
    testId: "vp-membership-gadget",
    adminLink: "/admin/members",
  },
  [OFFICER_GADGET_TYPES.EVENT_CHAIR]: {
    type: OFFICER_GADGET_TYPES.EVENT_CHAIR,
    title: "My Events",
    subtitle: "Events you manage",
    testId: "event-chair-gadget",
    adminLink: "/admin/events",
  },
  [OFFICER_GADGET_TYPES.TECH_LEAD]: {
    type: OFFICER_GADGET_TYPES.TECH_LEAD,
    title: "System Status",
    subtitle: "Tech lead overview",
    testId: "tech-lead-gadget",
    adminLink: "/admin",
  },
};

/**
 * Role to gadget type mapping
 *
 * Maps each GlobalRole to the appropriate officer gadget type.
 * Null means no officer gadget for that role.
 */
export const ROLE_TO_GADGET: Partial<Record<GlobalRole, OfficerGadgetType>> = {
  president: OFFICER_GADGET_TYPES.PRESIDENT,
  "vp-activities": OFFICER_GADGET_TYPES.VP_MEMBERSHIP,
  "event-chair": OFFICER_GADGET_TYPES.EVENT_CHAIR,
  admin: OFFICER_GADGET_TYPES.TECH_LEAD,
  secretary: OFFICER_GADGET_TYPES.PRESIDENT, // Secretary sees governance summary
  parliamentarian: OFFICER_GADGET_TYPES.PRESIDENT, // Parliamentarian sees governance summary
};

/**
 * Get the officer gadget type for a role
 */
export function getOfficerGadgetType(
  role: GlobalRole
): OfficerGadgetType | null {
  return ROLE_TO_GADGET[role] ?? null;
}

/**
 * Get officer gadget metadata for a role
 */
export function getOfficerGadgetMetadata(
  role: GlobalRole
): OfficerGadgetMetadata | null {
  const gadgetType = getOfficerGadgetType(role);
  if (!gadgetType) return null;
  return OFFICER_GADGET_METADATA[gadgetType];
}

/**
 * Check if a role has an officer gadget
 */
export function hasOfficerGadget(role: GlobalRole): boolean {
  return role in ROLE_TO_GADGET;
}

/**
 * Get all roles that show officer gadgets
 */
export function getRolesWithGadgets(): GlobalRole[] {
  return Object.keys(ROLE_TO_GADGET) as GlobalRole[];
}

/**
 * Get roles that share the same gadget
 */
export function getRolesForGadget(gadgetType: OfficerGadgetType): GlobalRole[] {
  return (Object.entries(ROLE_TO_GADGET) as [GlobalRole, OfficerGadgetType][])
    .filter(([_, type]) => type === gadgetType)
    .map(([role]) => role);
}
