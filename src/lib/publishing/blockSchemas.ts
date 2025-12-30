// Copyright © 2025 Murmurant, Inc.
// Block data validation schemas using Zod
//
// Migration Safety Strategy:
// - Simple block types (hero, text, image, cta, divider, spacer): Use .strip() to silently
//   remove unknown keys. This ensures API payloads are clean while allowing existing
//   stored data with extra fields to be read (validation only applies on write).
// - Complex block types (cards, event-list, gallery, faq, contact): Use .passthrough() to
//   preserve unknown keys. These types have nested arrays that may evolve, and we want
//   to avoid breaking existing data during the read-only phase.
//
// This approach ensures:
// 1. New writes are validated and clean
// 2. Existing stored data continues to work
// 3. Schema evolution is possible without migrations

import { z } from "zod";
import type { BlockType } from "./blocks";

// Common field schemas
const alignmentSchema = z.enum(["left", "center", "right"]).optional();
const ctaStyleSchema = z.enum(["primary", "secondary", "outline"]).optional();

// ============================================================================
// Simple Block Schemas (full editing support)
// ============================================================================

/**
 * Hero block data schema
 * Required: title
 * Optional: subtitle, backgroundImage, backgroundOverlay, textColor, alignment, ctaText, ctaLink, ctaStyle
 */
export const heroDataSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    backgroundOverlay: z.string().optional(),
    textColor: z.string().optional(),
    alignment: alignmentSchema,
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    ctaStyle: ctaStyleSchema,
  })
  .strip();

/**
 * Text block data schema
 * Required: content
 * Optional: alignment
 */
export const textDataSchema = z
  .object({
    content: z.string().min(1, "Content is required"),
    alignment: alignmentSchema,
  })
  .strip();

/**
 * Image block data schema
 * Required: src, alt
 * Optional: caption, width, alignment, linkUrl
 */
export const imageDataSchema = z
  .object({
    src: z.string().min(1, "Image URL is required"),
    alt: z.string().min(1, "Alt text is required"),
    caption: z.string().optional(),
    width: z.string().optional(),
    alignment: alignmentSchema,
    linkUrl: z.string().optional(),
  })
  .strip();

/**
 * CTA block data schema
 * Required: text, link
 * Optional: style, size, alignment
 */
export const ctaDataSchema = z
  .object({
    text: z.string().min(1, "Button text is required"),
    link: z.string().min(1, "Link is required"),
    style: ctaStyleSchema,
    size: z.enum(["small", "medium", "large"]).optional(),
    alignment: alignmentSchema,
  })
  .strip();

/**
 * Divider block data schema
 * All fields optional with sensible defaults
 */
export const dividerDataSchema = z
  .object({
    style: z.enum(["solid", "dashed", "dotted"]).optional(),
    width: z.enum(["full", "half", "quarter"]).optional(),
  })
  .strip();

/**
 * Spacer block data schema
 * All fields optional with sensible defaults
 */
export const spacerDataSchema = z
  .object({
    height: z.enum(["small", "medium", "large"]).optional(),
  })
  .strip();

// ============================================================================
// Complex Block Schemas (read-only in A3, passthrough for migration safety)
// ============================================================================

/**
 * Cards block data schema
 * Uses passthrough to preserve existing data during read-only phase
 */
export const cardsDataSchema = z
  .object({
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
    cards: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        linkUrl: z.string().optional(),
        linkText: z.string().optional(),
      })
    ),
  })
  .passthrough();

/**
 * Event list block data schema
 * Uses passthrough to preserve existing data during read-only phase
 */
export const eventListDataSchema = z
  .object({
    title: z.string().optional(),
    limit: z.number().optional(),
    categories: z.array(z.string()).optional(),
    showPastEvents: z.boolean().optional(),
    layout: z.enum(["list", "cards", "calendar"]).optional(),
  })
  .passthrough();

/**
 * Gallery block data schema
 * Uses passthrough to preserve existing data during read-only phase
 */
export const galleryDataSchema = z
  .object({
    images: z.array(
      z.object({
        src: z.string(),
        alt: z.string(),
        caption: z.string().optional(),
      })
    ),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
    enableLightbox: z.boolean().optional(),
  })
  .passthrough();

/**
 * FAQ block data schema
 * Uses passthrough to preserve existing data during read-only phase
 */
export const faqDataSchema = z
  .object({
    title: z.string().optional(),
    items: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ),
  })
  .passthrough();

/**
 * Contact block data schema
 * Uses passthrough to preserve existing data during read-only phase
 */
export const contactDataSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    recipientEmail: z.string().email("Valid email is required"),
    fields: z
      .array(
        z.object({
          name: z.string(),
          label: z.string(),
          type: z.enum(["text", "email", "textarea", "select"]),
          required: z.boolean().optional(),
          options: z.array(z.string()).optional(),
        })
      )
      .optional(),
    submitText: z.string().optional(),
  })
  .passthrough();

/**
 * FlipCard block data schema
 * Interactive cards that flip on hover to reveal back content
 * Uses passthrough to preserve existing data during read-only phase
 */
export const flipCardDataSchema = z
  .object({
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
    cards: z.array(
      z.object({
        frontImage: z.string(),
        frontImageAlt: z.string(),
        backTitle: z.string(),
        backDescription: z.string(),
        backGradient: z.string().optional(),
        backTextColor: z.string().optional(),
        linkUrl: z.string().optional(),
        linkText: z.string().optional(),
      })
    ),
  })
  .passthrough();

/**
 * Accordion block data schema
 * Expandable/collapsible content sections
 */
export const accordionDataSchema = z
  .object({
    title: z.string().optional(),
    allowMultiple: z.boolean().optional(),
    items: z.array(
      z.object({
        title: z.string(),
        content: z.string(),
        defaultOpen: z.boolean().optional(),
      })
    ),
  })
  .passthrough();

/**
 * Tabs block data schema
 * Tabbed content panels
 */
export const tabsDataSchema = z
  .object({
    tabs: z.array(
      z.object({
        label: z.string(),
        content: z.string(),
      })
    ),
    alignment: alignmentSchema,
  })
  .passthrough();

/**
 * Testimonial block data schema
 * Rotating quotes and testimonials
 */
export const testimonialDataSchema = z
  .object({
    title: z.string().optional(),
    autoRotate: z.boolean().optional(),
    rotateIntervalMs: z.number().optional(),
    testimonials: z.array(
      z.object({
        quote: z.string(),
        author: z.string(),
        role: z.string().optional(),
        image: z.string().optional(),
      })
    ),
  })
  .passthrough();

/**
 * Stats block data schema
 * Animated number counters
 */
export const statsDataSchema = z
  .object({
    title: z.string().optional(),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
    stats: z.array(
      z.object({
        value: z.number(),
        suffix: z.string().optional(),
        prefix: z.string().optional(),
        label: z.string(),
      })
    ),
  })
  .passthrough();

/**
 * Timeline block data schema
 * Vertical chronological layout
 */
export const timelineDataSchema = z
  .object({
    title: z.string().optional(),
    events: z.array(
      z.object({
        date: z.string(),
        title: z.string(),
        description: z.string(),
        image: z.string().optional(),
      })
    ),
  })
  .passthrough();

/**
 * Before/After block data schema
 * Draggable slider comparing two images
 */
export const beforeAfterDataSchema = z
  .object({
    title: z.string().optional(),
    beforeImage: z.string().min(1, "Before image URL is required"),
    beforeAlt: z.string().min(1, "Before image alt text is required"),
    beforeLabel: z.string().optional(),
    afterImage: z.string().min(1, "After image URL is required"),
    afterAlt: z.string().min(1, "After image alt text is required"),
    afterLabel: z.string().optional(),
    initialPosition: z.number().min(0).max(100).optional(),
    aspectRatio: z.enum(["16:9", "4:3", "1:1", "3:2"]).optional(),
  })
  .passthrough();

/**
 * Gadget block data schema
 * Interactive dashboard widget with RBAC visibility
 */
export const gadgetDataSchema = z
  .object({
    gadgetId: z.string().min(1, "Gadget ID is required"),
    title: z.string().optional(),
    showTitle: z.boolean().optional(),
    layout: z.enum(["card", "inline"]).optional(),
    maxItems: z.number().min(1).max(20).optional(),
    // RBAC visibility settings
    visibility: z.enum(["public", "members", "officers", "roles"]).optional(),
    allowedRoles: z.array(z.string()).optional(),
  })
  .strip();

// ============================================================================
// Schema Registry
// ============================================================================

/**
 * Map of block type to its data schema
 */
export const BLOCK_DATA_SCHEMAS: Record<BlockType, z.ZodType> = {
  hero: heroDataSchema,
  text: textDataSchema,
  image: imageDataSchema,
  cta: ctaDataSchema,
  divider: dividerDataSchema,
  spacer: spacerDataSchema,
  cards: cardsDataSchema,
  "event-list": eventListDataSchema,
  gallery: galleryDataSchema,
  faq: faqDataSchema,
  contact: contactDataSchema,
  "flip-card": flipCardDataSchema,
  accordion: accordionDataSchema,
  tabs: tabsDataSchema,
  testimonial: testimonialDataSchema,
  stats: statsDataSchema,
  timeline: timelineDataSchema,
  "before-after": beforeAfterDataSchema,
  gadget: gadgetDataSchema,
};

/**
 * Block types that have full editing support (schema-enforced on save)
 */
export const EDITABLE_BLOCK_TYPES: BlockType[] = [
  "hero",
  "text",
  "image",
  "cta",
  "divider",
  "spacer",
  "before-after",
  "stats",
  "timeline",
  "accordion",
  "tabs",
  "testimonial",
  "cards",
  "flip-card",
  "gallery",
  "faq",
  "contact",
  "gadget",
];

/**
 * Block types that are read-only in the editor (complex/nested data)
 */
export const READONLY_BLOCK_TYPES: BlockType[] = [
  "event-list",
];

// ============================================================================
// Validation Helpers
// ============================================================================

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues?: z.ZodIssue[] };

/**
 * Validate block data against its type schema
 *
 * @param type - The block type
 * @param data - The data to validate
 * @returns Validation result with parsed data or error
 */
export function validateBlockData(
  type: BlockType,
  data: unknown
): ValidationResult<unknown> {
  const schema = BLOCK_DATA_SCHEMAS[type];
  if (!schema) {
    return { ok: false, error: `Unknown block type: ${type}` };
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  // Format error message for API response (safe, not verbose)
  const firstIssue = result.error.issues[0];
  const field = firstIssue?.path.join(".") || "data";
  const message = firstIssue?.message || "Validation failed";

  return {
    ok: false,
    error: `Invalid ${type} block: ${field} - ${message}`,
    issues: result.error.issues,
  };
}

/**
 * Get default data for a block type
 * Returns minimal valid data matching the schema
 *
 * @param type - The block type
 * @returns Default data for the block type
 */
export function getDefaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { title: "Page Title", alignment: "center" };
    case "text":
      return { content: "<p>Enter your content here...</p>" };
    case "image":
      return { src: "", alt: "Image description" };
    case "cta":
      return { text: "Click Here", link: "#", style: "primary", alignment: "center" };
    case "divider":
      return { style: "solid", width: "full" };
    case "spacer":
      return { height: "medium" };
    case "cards":
      return { columns: 3, cards: [] };
    case "event-list":
      return { limit: 5, showPastEvents: false, layout: "list" };
    case "gallery":
      return { images: [], columns: 3, enableLightbox: true };
    case "faq":
      return { items: [] };
    case "contact":
      return {
        recipientEmail: "",
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "message", label: "Message", type: "textarea", required: true },
        ],
        submitText: "Send Message",
      };
    case "flip-card":
      return {
        columns: 3,
        cards: [
          {
            frontImage: "",
            frontImageAlt: "Card image",
            backTitle: "Card Title",
            backDescription: "Description shown on hover",
            backGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backTextColor: "#ffffff",
          },
        ],
      };
    case "accordion":
      return {
        allowMultiple: false,
        items: [
          { title: "Section 1", content: "<p>Content for section 1</p>", defaultOpen: true },
          { title: "Section 2", content: "<p>Content for section 2</p>" },
        ],
      };
    case "tabs":
      return {
        alignment: "left",
        tabs: [
          { label: "Tab 1", content: "<p>Content for tab 1</p>" },
          { label: "Tab 2", content: "<p>Content for tab 2</p>" },
        ],
      };
    case "testimonial":
      return {
        autoRotate: true,
        rotateIntervalMs: 5000,
        testimonials: [
          { quote: "This is a great organization!", author: "Jane Doe", role: "Member since 2020" },
        ],
      };
    case "stats":
      return {
        columns: 3,
        stats: [
          { value: 500, suffix: "+", label: "Members" },
          { value: 50, label: "Events per Year" },
          { value: 30, label: "Interest Groups" },
        ],
      };
    case "timeline":
      return {
        events: [
          { date: "2020", title: "Founded", description: "Our organization was established" },
          { date: "2022", title: "Milestone", description: "Reached 500 members" },
        ],
      };
    case "before-after":
      return {
        beforeImage: "",
        beforeAlt: "Before image",
        beforeLabel: "Before",
        afterImage: "",
        afterAlt: "After image",
        afterLabel: "After",
        initialPosition: 50,
        aspectRatio: "16:9",
      };
    case "gadget":
      return {
        gadgetId: "upcoming-events",
        showTitle: true,
        layout: "card",
        visibility: "members",
      };
    default:
      return {};
  }
}

/**
 * Check if a block type supports full editing
 */
export function isEditableBlockType(type: BlockType): boolean {
  return EDITABLE_BLOCK_TYPES.includes(type);
}

/**
 * Check if a block type is read-only in the editor
 */
export function isReadonlyBlockType(type: BlockType): boolean {
  return READONLY_BLOCK_TYPES.includes(type);
}

/**
 * Get field metadata for a block type (for building dynamic editors)
 * Returns field names, required status, and type hints
 */
export function getBlockFieldMetadata(type: BlockType): Array<{
  name: string;
  required: boolean;
  type: "text" | "textarea" | "select" | "url" | "number";
  options?: string[];
  label: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}> {
  switch (type) {
    case "hero":
      return [
        { name: "title", required: true, type: "text", label: "Title" },
        { name: "subtitle", required: false, type: "text", label: "Subtitle" },
        {
          name: "alignment",
          required: false,
          type: "select",
          options: ["left", "center", "right"],
          label: "Alignment",
        },
        { name: "ctaText", required: false, type: "text", label: "CTA Text" },
        { name: "ctaLink", required: false, type: "url", label: "CTA Link" },
        {
          name: "ctaStyle",
          required: false,
          type: "select",
          options: ["primary", "secondary", "outline"],
          label: "CTA Style",
        },
      ];
    case "text":
      return [
        { name: "content", required: true, type: "textarea", label: "Content (HTML)" },
        {
          name: "alignment",
          required: false,
          type: "select",
          options: ["left", "center", "right"],
          label: "Alignment",
        },
      ];
    case "image":
      return [
        { name: "src", required: true, type: "url", label: "Image URL" },
        { name: "alt", required: true, type: "text", label: "Alt Text" },
        { name: "caption", required: false, type: "text", label: "Caption" },
        {
          name: "alignment",
          required: false,
          type: "select",
          options: ["left", "center", "right"],
          label: "Alignment",
        },
        { name: "linkUrl", required: false, type: "url", label: "Link URL" },
      ];
    case "cta":
      return [
        { name: "text", required: true, type: "text", label: "Button Text" },
        { name: "link", required: true, type: "url", label: "Link" },
        {
          name: "style",
          required: false,
          type: "select",
          options: ["primary", "secondary", "outline"],
          label: "Style",
        },
        {
          name: "size",
          required: false,
          type: "select",
          options: ["small", "medium", "large"],
          label: "Size",
        },
        {
          name: "alignment",
          required: false,
          type: "select",
          options: ["left", "center", "right"],
          label: "Alignment",
        },
      ];
    case "divider":
      return [
        {
          name: "style",
          required: false,
          type: "select",
          options: ["solid", "dashed", "dotted"],
          label: "Style",
        },
        {
          name: "width",
          required: false,
          type: "select",
          options: ["full", "half", "quarter"],
          label: "Width",
        },
      ];
    case "spacer":
      return [
        {
          name: "height",
          required: false,
          type: "select",
          options: ["small", "medium", "large"],
          label: "Height",
        },
      ];
    case "before-after":
      return [
        { name: "title", required: false, type: "text", label: "Title", placeholder: "Optional heading above the slider" },
        { name: "beforeImage", required: true, type: "url", label: "Before Image URL" },
        { name: "beforeAlt", required: true, type: "text", label: "Before Alt Text", placeholder: "Describe the before image" },
        { name: "beforeLabel", required: false, type: "text", label: "Before Label", placeholder: "Before" },
        { name: "afterImage", required: true, type: "url", label: "After Image URL" },
        { name: "afterAlt", required: true, type: "text", label: "After Alt Text", placeholder: "Describe the after image" },
        { name: "afterLabel", required: false, type: "text", label: "After Label", placeholder: "After" },
        {
          name: "aspectRatio",
          required: false,
          type: "select",
          options: ["16:9", "4:3", "1:1", "3:2"],
          label: "Aspect Ratio",
        },
        {
          name: "initialPosition",
          required: false,
          type: "number",
          label: "Initial Slider Position",
          min: 0,
          max: 100,
          step: 5,
          placeholder: "50",
        },
      ];
    default:
      return [];
  }
}
