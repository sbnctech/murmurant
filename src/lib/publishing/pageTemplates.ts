// Copyright (c) Santa Barbara Newcomers Club
// Page template types and utilities for member/public view contexts

import type { BlockType } from "./blocks";

// ============================================================================
// View Context Types
// ============================================================================

/**
 * View context determines which layout and blocks are available
 */
export type ViewContext = "public" | "member";

/**
 * Block visibility determines who can see a block
 */
export type BlockVisibility = "inherit" | "public" | "members_only" | "role_restricted";

// ============================================================================
// Template Types
// ============================================================================

/**
 * Template region defines a layout slot where blocks can be placed
 */
export type TemplateRegion = {
  name: string;
  label: string;
  allowedBlockTypes: BlockType[];
  minBlocks?: number;
  maxBlocks?: number | null;
};

/**
 * Template constraints define access rules
 */
export type TemplateConstraints = {
  requiresAuth: boolean;
  allowedRoles?: string[];
  allowedMembershipStatuses?: string[];
};

/**
 * Default block configuration for new pages
 */
export type DefaultBlockConfig = {
  type: BlockType;
  region: string;
  data: Record<string, unknown>;
};

/**
 * Page template definition
 */
export type PageTemplate = {
  id: string;
  name: string;
  slug: string;
  context: ViewContext;
  regions: TemplateRegion[];
  defaultBlocks?: DefaultBlockConfig[];
  constraints: TemplateConstraints;
};

// ============================================================================
// Block Type Sets
// ============================================================================

/**
 * Block types available in public context
 */
export const PUBLIC_BLOCK_TYPES: BlockType[] = [
  "hero",
  "text",
  "image",
  "cards",
  "event-list",
  "gallery",
  "faq",
  "contact",
  "cta",
  "divider",
  "spacer",
];

/**
 * Block types available only in member context
 */
export const MEMBER_ONLY_BLOCK_TYPES: string[] = [
  "member-directory",
  "my-registrations",
  "my-groups",
  "group-roster",
  "officer-widget",
];

/**
 * All block types available in member context
 */
export const MEMBER_BLOCK_TYPES: BlockType[] = [
  ...PUBLIC_BLOCK_TYPES,
  // Note: member-only types would be added here when implemented
];

// ============================================================================
// Standard Templates
// ============================================================================

/**
 * Standard page templates for public and member contexts
 */
export const STANDARD_TEMPLATES: PageTemplate[] = [
  {
    id: "public-landing",
    name: "Public Landing Page",
    slug: "public-landing",
    context: "public",
    regions: [
      {
        name: "header",
        label: "Header",
        allowedBlockTypes: ["hero"],
        maxBlocks: 1,
      },
      {
        name: "main",
        label: "Main Content",
        allowedBlockTypes: PUBLIC_BLOCK_TYPES,
        maxBlocks: null,
      },
      {
        name: "footer",
        label: "Footer",
        allowedBlockTypes: ["text", "cta", "divider"],
        maxBlocks: 3,
      },
    ],
    constraints: {
      requiresAuth: false,
    },
  },
  {
    id: "public-content",
    name: "Public Content Page",
    slug: "public-content",
    context: "public",
    regions: [
      {
        name: "main",
        label: "Main Content",
        allowedBlockTypes: [
          "text",
          "image",
          "cards",
          "faq",
          "contact",
          "cta",
          "divider",
          "spacer",
        ],
        maxBlocks: null,
      },
    ],
    constraints: {
      requiresAuth: false,
    },
  },
  {
    id: "public-events",
    name: "Public Events Page",
    slug: "public-events",
    context: "public",
    regions: [
      {
        name: "header",
        label: "Header",
        allowedBlockTypes: ["hero"],
        maxBlocks: 1,
      },
      {
        name: "main",
        label: "Main Content",
        allowedBlockTypes: ["event-list", "text", "cta"],
        maxBlocks: null,
      },
    ],
    constraints: {
      requiresAuth: false,
    },
  },
  {
    id: "member-dashboard",
    name: "Member Dashboard",
    slug: "member-dashboard",
    context: "member",
    regions: [
      {
        name: "header",
        label: "Header",
        allowedBlockTypes: ["hero", "text"],
        maxBlocks: 1,
      },
      {
        name: "main",
        label: "Main Content",
        allowedBlockTypes: MEMBER_BLOCK_TYPES,
        maxBlocks: null,
      },
      {
        name: "sidebar",
        label: "Sidebar",
        allowedBlockTypes: ["text", "cta", "cards"],
        maxBlocks: 4,
      },
    ],
    constraints: {
      requiresAuth: true,
      allowedMembershipStatuses: ["active", "ACTIVE", "board", "BOARD"],
    },
  },
  {
    id: "member-content",
    name: "Member Content Page",
    slug: "member-content",
    context: "member",
    regions: [
      {
        name: "main",
        label: "Main Content",
        allowedBlockTypes: MEMBER_BLOCK_TYPES,
        maxBlocks: null,
      },
    ],
    constraints: {
      requiresAuth: true,
      allowedMembershipStatuses: ["active", "ACTIVE", "board", "BOARD"],
    },
  },
  {
    id: "member-group",
    name: "Member Group Page",
    slug: "member-group",
    context: "member",
    regions: [
      {
        name: "header",
        label: "Header",
        allowedBlockTypes: ["hero", "text"],
        maxBlocks: 1,
      },
      {
        name: "main",
        label: "Main Content",
        allowedBlockTypes: MEMBER_BLOCK_TYPES,
        maxBlocks: null,
      },
      {
        name: "sidebar",
        label: "Sidebar",
        allowedBlockTypes: ["text", "cta", "cards"],
        maxBlocks: 3,
      },
    ],
    constraints: {
      requiresAuth: true,
      allowedMembershipStatuses: ["active", "ACTIVE", "board", "BOARD"],
    },
  },
];

// ============================================================================
// Template Utilities
// ============================================================================

/**
 * Get template by slug
 */
export function getTemplateBySlug(slug: string): PageTemplate | undefined {
  return STANDARD_TEMPLATES.find((t) => t.slug === slug);
}

/**
 * Get templates for a specific context
 */
export function getTemplatesForContext(context: ViewContext): PageTemplate[] {
  return STANDARD_TEMPLATES.filter((t) => t.context === context);
}

/**
 * Get default template for a context
 */
export function getDefaultTemplate(context: ViewContext): PageTemplate {
  const template = STANDARD_TEMPLATES.find(
    (t) => t.context === context && t.slug === `${context}-content`
  );
  if (!template) {
    throw new Error(`No default template found for context: ${context}`);
  }
  return template;
}

/**
 * Validate that a block type is allowed in a template region
 */
export function isBlockAllowedInRegion(
  template: PageTemplate,
  regionName: string,
  blockType: BlockType
): boolean {
  const region = template.regions.find((r) => r.name === regionName);
  if (!region) {
    return false;
  }
  return region.allowedBlockTypes.includes(blockType);
}

/**
 * Validate blocks against template constraints
 */
export function validateBlocksForTemplate(
  template: PageTemplate,
  blocks: Array<{ type: BlockType; region: string }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Group blocks by region
  const blocksByRegion = new Map<string, Array<{ type: BlockType }>>();
  for (const block of blocks) {
    const regionBlocks = blocksByRegion.get(block.region) || [];
    regionBlocks.push(block);
    blocksByRegion.set(block.region, regionBlocks);
  }

  // Validate each region
  for (const region of template.regions) {
    const regionBlocks = blocksByRegion.get(region.name) || [];

    // Check min blocks
    if (region.minBlocks && regionBlocks.length < region.minBlocks) {
      errors.push(
        `Region "${region.label}" requires at least ${region.minBlocks} block(s), has ${regionBlocks.length}`
      );
    }

    // Check max blocks
    if (region.maxBlocks !== null && regionBlocks.length > (region.maxBlocks || 0)) {
      errors.push(
        `Region "${region.label}" allows at most ${region.maxBlocks} block(s), has ${regionBlocks.length}`
      );
    }

    // Check block types
    for (const block of regionBlocks) {
      if (!region.allowedBlockTypes.includes(block.type)) {
        errors.push(
          `Block type "${block.type}" is not allowed in region "${region.label}"`
        );
      }
    }
  }

  // Check for blocks in non-existent regions
  for (const [regionName] of blocksByRegion) {
    if (!template.regions.find((r) => r.name === regionName)) {
      errors.push(`Unknown region: "${regionName}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a block type is member-only
 */
export function isMemberOnlyBlockType(blockType: string): boolean {
  return MEMBER_ONLY_BLOCK_TYPES.includes(blockType);
}

/**
 * Filter blocks based on view context
 */
export function filterBlocksForContext(
  blocks: Array<{ type: string; visibility?: BlockVisibility }>,
  context: ViewContext,
  pageVisibility: "PUBLIC" | "MEMBERS_ONLY" | "ROLE_RESTRICTED"
): Array<{ type: string; visibility?: BlockVisibility }> {
  return blocks.filter((block) => {
    // Member-only block types are never shown in public context
    if (context === "public" && isMemberOnlyBlockType(block.type)) {
      return false;
    }

    // Resolve visibility
    const visibility = block.visibility || "inherit";

    if (visibility === "inherit") {
      // Inherit from page - public context only shows PUBLIC pages
      return context === "member" || pageVisibility === "PUBLIC";
    }

    if (visibility === "public") {
      return true;
    }

    if (visibility === "members_only") {
      return context === "member";
    }

    // role_restricted would need audience rule evaluation
    // For now, only show in member context
    if (visibility === "role_restricted") {
      return context === "member";
    }

    return true;
  });
}
