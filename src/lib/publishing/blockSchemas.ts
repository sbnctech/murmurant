// Copyright (c) Santa Barbara Newcomers Club
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
];

/**
 * Block types that are read-only in the editor (complex/nested data)
 */
export const READONLY_BLOCK_TYPES: BlockType[] = [
  "cards",
  "event-list",
  "gallery",
  "faq",
  "contact",
  "flip-card",
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
  type: "text" | "textarea" | "select" | "url";
  options?: string[];
  label: string;
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
    default:
      return [];
  }
}
