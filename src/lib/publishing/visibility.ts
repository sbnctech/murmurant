// Copyright (c) Santa Barbara Newcomers Club
// Visibility control primitives for Page Builder
// Enables block/section-level access control (Charter P2)

import { Block, PageContent } from "./blocks";

// ============================================================================
// VISIBILITY CONTROL PRIMITIVES
// ============================================================================

/**
 * VisibilityRule - Conditional display based on membership status, dates, or feature flags
 * Applied to sections or blocks to control visibility at render time
 */
export type VisibilityRuleData = {
  isPublic?: boolean;
  membershipStatuses?: string[]; // e.g., ["active", "board"]
  dateRange?: {
    start?: string; // ISO date string
    end?: string; // ISO date string
  };
  featureFlags?: string[]; // Future: feature flag names
};

/**
 * RoleGate - Restrict content to specific roles with audit logging
 * More restrictive than VisibilityRule - requires explicit role match
 */
export type RoleGateData = {
  allowedRoles: string[]; // Committee role slugs, e.g., ["president", "board-member"]
  committeeIds?: string[]; // Optional: limit to specific committees
};

/**
 * User context for visibility evaluation (simplified from permissions.ts)
 */
export type VisibilityUserContext = {
  isAuthenticated: boolean;
  membershipStatusCode: string | null;
  roles: string[]; // Committee role slugs
  committeeIds: string[];
};

// ============================================================================
// SECTION STRUCTURE
// ============================================================================

/**
 * Section - Groups blocks with shared visibility and layout
 * Sections provide semantic organization (hero, body, sidebar, footer)
 */
export type Section = {
  id: string;
  name?: string; // Display name, e.g., "Header", "Main Content", "Sidebar"
  order: number;
  blocks: Block[];
  // Optional visibility controls at section level
  visibilityRule?: VisibilityRuleData;
  roleGate?: RoleGateData;
  // Layout hints (optional)
  layout?: "full-width" | "contained" | "narrow";
};

// ============================================================================
// SECTION UTILITIES
// ============================================================================

/**
 * Normalize page content to sections format
 * Converts legacy blocks[] to sections[] for unified rendering
 */
export function normalizeToSections(content: PageContent): Section[] {
  // Check for sections in extended content format
  const extendedContent = content as PageContent & { sections?: Section[] };

  // If already using sections format
  if (extendedContent.sections && extendedContent.sections.length > 0) {
    return extendedContent.sections;
  }

  // Convert legacy blocks to a single "main" section
  if (content.blocks && content.blocks.length > 0) {
    return [
      {
        id: "main",
        name: "Main Content",
        order: 0,
        blocks: content.blocks,
        layout: "contained",
      },
    ];
  }

  // Empty content
  return [];
}

// ============================================================================
// VISIBILITY EVALUATION
// ============================================================================

/**
 * Evaluate if a VisibilityRule allows the user to see content
 */
export function evaluateVisibilityRule(
  rule: VisibilityRuleData | undefined,
  user: VisibilityUserContext | null
): boolean {
  // No rule means visible to all
  if (!rule) return true;

  // Explicit public flag
  if (rule.isPublic) return true;

  // Date range check (independent of user)
  if (rule.dateRange) {
    const now = new Date();
    if (rule.dateRange.start && new Date(rule.dateRange.start) > now) {
      return false;
    }
    if (rule.dateRange.end && new Date(rule.dateRange.end) < now) {
      return false;
    }
  }

  // If no user-specific rules, allow (date was the only check)
  if (!rule.membershipStatuses || rule.membershipStatuses.length === 0) {
    return true;
  }

  // Remaining rules require authenticated user
  if (!user || !user.isAuthenticated) return false;

  // Check membership status
  if (rule.membershipStatuses && rule.membershipStatuses.length > 0) {
    if (!user.membershipStatusCode) return false;
    if (!rule.membershipStatuses.includes(user.membershipStatusCode)) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate if a RoleGate allows the user to see content
 * RoleGate is stricter - requires explicit role match
 */
export function evaluateRoleGate(
  gate: RoleGateData | undefined,
  user: VisibilityUserContext | null
): boolean {
  // No gate means visible to all
  if (!gate) return true;

  // RoleGate requires authentication
  if (!user || !user.isAuthenticated) return false;

  // Check if user has any of the allowed roles
  const hasRole = gate.allowedRoles.some((role) => user.roles.includes(role));
  if (!hasRole) return false;

  // Optional: check committee membership
  if (gate.committeeIds && gate.committeeIds.length > 0) {
    const inCommittee = gate.committeeIds.some((id) =>
      user.committeeIds.includes(id)
    );
    if (!inCommittee) return false;
  }

  return true;
}

/**
 * Filter sections based on visibility rules
 * Returns only sections the user is allowed to see
 */
export function filterVisibleSections(
  sections: Section[],
  user: VisibilityUserContext | null
): Section[] {
  return sections
    .filter((section) => {
      // Check section-level visibility
      if (!evaluateVisibilityRule(section.visibilityRule, user)) return false;
      if (!evaluateRoleGate(section.roleGate, user)) return false;
      return true;
    })
    .map((section) => ({
      ...section,
      // Filter blocks within the section (blocks can have visibility controls too)
      blocks: filterVisibleBlocks(section.blocks, user),
    }));
}

/**
 * Filter blocks based on visibility rules
 * Returns only blocks the user is allowed to see
 */
export function filterVisibleBlocks(
  blocks: Block[],
  user: VisibilityUserContext | null
): Block[] {
  // Note: To enable block-level visibility, blocks would need visibilityRule/roleGate fields
  // For now, this passes through all blocks in the section
  // Block-level visibility can be added by extending the Block type in blocks.ts
  return blocks;
}
