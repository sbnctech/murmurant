# ClubOS - A3 Block Schemas and Field Editors

Status: Draft (implementation target)
Applies to: Admin editor
Last updated: 2025-12-21
Depends on: A1 Block Ordering, A2 Block Editing UI

## Goal

Make block editing safer and more usable by introducing per-block-type Zod schemas for validation and schema-driven field editors that ensure data consistency.

## Why Schema Validation is Required

1. **Safety**: Prevents garbage data from being stored in block content
2. **Consistency**: Ensures all blocks of a given type have the expected structure
3. **Future Publishing**: Enables reliable rendering without runtime type checking
4. **API Hardening**: Rejects invalid payloads at the API boundary with useful error messages
5. **Client Validation**: Provides immediate feedback in the UI before server round-trip

## Non-goals (explicit)

- Drag-and-drop block ordering
- Publish/preview workflow changes
- Rich text (WYSIWYG) editors
- Image upload/media library integration
- Reliability enablement (guards/kill switches stay inert)

## Block Types and Schema Enforcement

### Fully Editable Block Types (Schema-enforced)

These block types have:
- Complete Zod schema validation on API update
- Schema-driven form editors in the UI
- Client-side validation before save
- Unknown fields stripped on save (migration-safe cleanup)

| Block Type | Required Fields | Optional Fields |
|------------|-----------------|-----------------|
| hero | title | subtitle, alignment, ctaText, ctaLink, ctaStyle, backgroundImage, backgroundOverlay, textColor |
| text | content | alignment |
| image | src, alt | caption, width, alignment, linkUrl |
| cta | text, link | style, size, alignment |
| divider | (none) | style, width |
| spacer | (none) | height |

### Read-only Block Types (Schema-validated, passthrough)

These block types have:
- Schema validation on API update (basic structure)
- Unknown fields preserved (passthrough) for migration safety
- Read-only JSON viewer in the UI with copy-to-clipboard
- "Advanced editing coming soon" message

| Block Type | Reason for Read-only |
|------------|---------------------|
| cards | Nested array of card items |
| event-list | Dynamic data source configuration |
| gallery | Nested array of images |
| faq | Nested array of Q&A items |
| contact | Complex form field configuration |

## Schema Module

Location: `src/lib/publishing/blockSchemas.ts`

### Exports

```typescript
// Individual schemas
export const heroDataSchema: z.ZodObject<...>
export const textDataSchema: z.ZodObject<...>
export const imageDataSchema: z.ZodObject<...>
export const ctaDataSchema: z.ZodObject<...>
export const dividerDataSchema: z.ZodObject<...>
export const spacerDataSchema: z.ZodObject<...>
export const cardsDataSchema: z.ZodObject<...>
export const eventListDataSchema: z.ZodObject<...>
export const galleryDataSchema: z.ZodObject<...>
export const faqDataSchema: z.ZodObject<...>
export const contactDataSchema: z.ZodObject<...>

// Registry
export const BLOCK_DATA_SCHEMAS: Record<BlockType, z.ZodType>
export const EDITABLE_BLOCK_TYPES: BlockType[]
export const READONLY_BLOCK_TYPES: BlockType[]

// Helpers
export function validateBlockData(type, data): ValidationResult
export function getDefaultBlockData(type): Record<string, unknown>
export function isEditableBlockType(type): boolean
export function isReadonlyBlockType(type): boolean
export function getBlockFieldMetadata(type): FieldMetadata[]
```

### Migration Safety Strategy

- **Simple types (.strip())**: Unknown keys are silently removed on save. This cleans up data over time while preserving backward compatibility for reads.

- **Complex types (.passthrough())**: Unknown keys are preserved. This allows existing data with additional fields to continue working while full editing support is developed.

## API Changes

### POST /api/admin/content/pages/[id]/blocks?action=update

The update action now:

1. Fetches the existing block to confirm its type
2. Validates incoming data against the Zod schema for that block type
3. Returns 400 with a useful error message if validation fails
4. Uses validated/cleaned data for the update
5. Preserves id, type, and order fields
6. Creates audit log with before/after data

Error response format:
```json
{
  "error": "Bad Request",
  "message": "Invalid hero block: title - Title is required"
}
```

## UI Changes

### Schema-driven Editor

The `SchemaBlockEditor` component:
- Reads field metadata from `getBlockFieldMetadata(blockType)`
- Renders appropriate input type for each field (text, textarea, select)
- Shows required indicator (*) for required fields
- Uses controlled inputs with onChange handlers

### Read-only JSON Viewer

The `ReadOnlyBlockViewer` component:
- Displays formatted JSON with syntax highlighting (monospace)
- Truncates long content with "Show more" / "Show less" toggle
- Provides "Copy JSON" button for clipboard copying
- Shows informative message about advanced editing

### Validation Error Display

- Client-side validation runs on Save click before API call
- Validation errors display in yellow warning box above form
- Errors clear when user modifies any field
- API errors display in red error box at page level

## Testing

### Unit Tests (tests/unit/publishing/blockSchemas.spec.ts)

- Schema validation for all block types
- Required field enforcement
- Optional field handling
- Unknown field stripping (simple types)
- Unknown field preservation (complex types)
- Default data generation
- Field metadata accuracy

### Integration Tests (tests/admin/admin-page-editor-blocks.spec.ts)

- API rejects invalid block data per type
- API accepts valid block data
- Schema validation logic documentation

## Acceptance Criteria

1. Existing stored blocks continue to render without crashes
2. Update API rejects invalid block data per type with useful error
3. Editor UI produces schema-valid payloads
4. Editor UI shows clear validation errors before save
5. Complex block types show read-only JSON viewer
6. Typecheck passes
7. Unit tests pass

## Related Documents

- [A1 Block Ordering UI Wiring](./A1_BLOCK_ORDERING_UI_WIRING.md)
- [A2 Block Editing UI](./A2_BLOCK_EDITING_UI.md)
